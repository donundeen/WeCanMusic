#!/usr/bin/env node
/**
 * Converts a soundfont instruments text file (BBB-PPP Name per line) to
 * FluidSynth voicelist JSON: [ [bank, program, "Name"], ... ].
 *
 * CLI:
 *   node sf_text_to_json.node.js SOMENAME.sf2
 *     → runs fluidsynth to list instruments, writes SOMENAME.sf2.voicelist.json
 *   node sf_text_to_json.node.js <input.txt> <output.json>
 *   node sf_text_to_json.node.js <input.txt>  (stdout)
 *   node sf_text_to_json.node.js  (stdin → stdout)
 *
 * From another script:
 *   const SfTextToJson = require("./sf_text_to_json.node.js");
 *   const c = new SfTextToJson();
 *   const list = c.parse(text);
 *   fs.writeFileSync("out.json", c.toJson(list));
 */

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

/** Line format: "BBB-PPP Name" (3-digit bank, 3-digit program, rest is name). */
const LINE_REGEX = /^(\d{3})-(\d{3})\s+(.+)$/;

class SfTextToJson {
  /**
   * Parse instruments text content into voicelist entries.
   * @param {string} text - Full text (e.g. from fs.readFileSync(..., "utf8"))
   * @returns {Array<[number, number, string]>} - Array of [bank, program, name]
   */
  parse(text) {
    const lines = text.split(/\r?\n/);
    const out = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const m = trimmed.match(LINE_REGEX);
      if (!m) continue;
      const bank = parseInt(m[1], 10);
      const program = parseInt(m[2], 10);
      const name = m[3].trim();
      out.push([bank, program, name]);
    }
    return out;
  }

  /**
   * Convert voicelist array to JSON string (pretty-printed to match existing voicelist files).
   * @param {Array<[number, number, string]>} list - From parse()
   * @returns {string}
   */
  toJson(list) {
    return JSON.stringify(list, null, 4) + "\n";
  }

  /**
   * Read input file, parse, and return voicelist array.
   * @param {string} inputPath
   * @returns {Array<[number, number, string]>}
   */
  convertFile(inputPath) {
    const text = fs.readFileSync(inputPath, "utf8");
    return this.parse(text);
  }

  /**
   * Convert input file to JSON and write to output file.
   * @param {string} inputPath
   * @param {string} outputPath
   * @returns {Array<[number, number, string]>} - The voicelist array
   */
  convertFileToFile(inputPath, outputPath) {
    const list = this.convertFile(inputPath);
    fs.writeFileSync(outputPath, this.toJson(list), "utf8");
    return list;
  }

  /**
   * Run fluidsynth to list instruments from a .sf2 file, parse output, and write voicelist JSON.
   * @param {string} sf2Path - Path to .sf2 file (e.g. WeCanMusicMaster.sf2)
   * @param {string} [commandsPath] - Path to shell commands file (default: shell_commands.txt next to this script)
   * @returns {Promise<{ list: Array<[number, number, string]>, outputPath: string }>}
   */
  async generateVoicelistFromSf2(sf2Path, commandsPath) {
    const scriptDir = __dirname;
    const cmdPath = commandsPath || path.join(scriptDir, "shell_commands.txt");
    const sf2Abs = path.isAbsolute(sf2Path) ? sf2Path : path.resolve(process.cwd(), sf2Path);
    const outPath = sf2Abs + ".voicelist.json";

    const text = await new Promise((resolve, reject) => {
      const proc = spawn("fluidsynth", ["-i", "-f", cmdPath, sf2Abs], {
        cwd: scriptDir,
        stdio: ["ignore", "pipe", "pipe"],
      });
      let out = "";
      proc.stdout.setEncoding("utf8");
      proc.stdout.on("data", (chunk) => { out += chunk; });
      proc.stderr.on("data", (chunk) => { out += chunk; });
      proc.on("error", (err) => reject(err));
      proc.on("close", () => {
        const lines = out.split(/\r?\n/).filter((line) => /^[0-9]{3}/.test(line.trim()));
        resolve(lines.join("\n"));
      });
    });

    const list = this.parse(text);
    fs.writeFileSync(outPath, this.toJson(list), "utf8");
    return { list, outputPath: outPath };
  }
}

module.exports = SfTextToJson;

// ----- CLI -----
async function main() {
  const converter = new SfTextToJson();
  const args = process.argv.slice(2);

  if (args.length >= 2) {
    const [inputPath, outputPath] = args;
    converter.convertFileToFile(inputPath, outputPath);
    console.error("Wrote", outputPath);
    return;
  }

  if (args.length === 1) {
    const inputPath = args[0];
    if (inputPath.toLowerCase().endsWith(".sf2")) {
      const { outputPath } = await converter.generateVoicelistFromSf2(inputPath);
      console.error("Wrote", outputPath);
      return;
    }
    const list = converter.convertFile(inputPath);
    process.stdout.write(converter.toJson(list));
    return;
  }

  // No args: stdin -> stdout
  let chunks = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (chunk) => { chunks += chunk; });
  process.stdin.on("end", () => {
    const list = converter.parse(chunks);
    process.stdout.write(converter.toJson(list));
  });
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
