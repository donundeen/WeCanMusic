/**
 * FunctionCurve
 *
 * Maps input 0–1 through a piecewise curve. Each segment is [minX, minY, maxX, maxY, curve]
 * where curve: 0=linear, <0=log, >0=exp.
 *
 * Constructor:
 *   - FunctionCurve(curveListArray, options)  — legacy: use provided curve list.
 *   - FunctionCurve(presetOptions, options)  — build from presets (presetOptions has 'dir' or preset keys).
 *
 * Preset options (can be combined):
 *   dir: "up" | "down"   — "up": 0→0, 1→1; "down": 0→1, 1→0
 *   lowerThreshold: 0–1  — input below (up) or above (down) maps to the "zero" output end
 *   upperThreshold: 0–1  — input above (up) or below (down) maps to the "one" output end
 *   logScale: number     — use log curve on ramp (e.g. -0.65); applied as segment curve
 *   expScale: number     — use exp curve on ramp (e.g. 0.65)
 * If both logScale and expScale set, logScale wins.
 */

class FunctionCurve {

  constructor(curveOrOptions, options) {
    this.e = 2.71828;
    this.db = (options && options.db) ? options.db : (!Array.isArray(curveOrOptions) && curveOrOptions && curveOrOptions.db) ? curveOrOptions.db : false;

    this._preset = null;
    this.curveList = [0, 0, 0, 1, 1, 0];

    const isPreset = curveOrOptions && typeof curveOrOptions === "object" && !Array.isArray(curveOrOptions) &&
      (curveOrOptions.dir != null || curveOrOptions.lowerThreshold != null || curveOrOptions.upperThreshold != null ||
       curveOrOptions.logScale != null || curveOrOptions.expScale != null);

    if (isPreset) {
      this._preset = {
        dir: curveOrOptions.dir !== "down" ? "up" : "down",
        lowerThreshold: curveOrOptions.lowerThreshold != null ? Number(curveOrOptions.lowerThreshold) : 0,
        upperThreshold: curveOrOptions.upperThreshold != null ? Number(curveOrOptions.upperThreshold) : 1,
        logScale: curveOrOptions.logScale != null ? Number(curveOrOptions.logScale) : null,
        expScale: curveOrOptions.expScale != null ? Number(curveOrOptions.expScale) : null,
      };
      this._buildCurveList();
    } else if (Array.isArray(curveOrOptions)) {
      this.curveList = curveOrOptions;
    }
  }

  _buildCurveList() {
    if (!this._preset) return;
    const p = this._preset;
    const lowerT = Math.max(0, Math.min(1, p.lowerThreshold));
    const upperT = Math.max(0, Math.min(1, p.upperThreshold));
    const lowIn = Math.min(lowerT, upperT);
    const highIn = Math.max(lowerT, upperT);
    let curve = 0;
    if (p.logScale != null) curve = Number(p.logScale);
    else if (p.expScale != null) curve = Number(p.expScale);

    // Segment format: [minX, minY, _, maxX, maxY, curve] (6 elements; index 2 unused for compatibility)
    if (p.dir === "down") {
      this.curveList = [
        0, 1, 0, lowIn, 1, 0,
        lowIn, 1, lowIn, highIn, 0, curve,
        highIn, 0, highIn, 1, 0, 0,
      ];
    } else {
      this.curveList = [
        0, 0, 0, lowIn, 0, 0,
        lowIn, 0, lowIn, highIn, 1, curve,
        highIn, 1, highIn, 1, 1, 0,
      ];
    }
  }

  get dir() { return this._preset ? this._preset.dir : undefined; }
  set dir(v) {
    if (this._preset && (v === "up" || v === "down")) { this._preset.dir = v; this._buildCurveList(); }
  }

  get lowerThreshold() { return this._preset ? this._preset.lowerThreshold : undefined; }
  set lowerThreshold(v) {
    if (this._preset != null) { this._preset.lowerThreshold = Number(v); this._buildCurveList(); }
  }

  get upperThreshold() { return this._preset ? this._preset.upperThreshold : undefined; }
  set upperThreshold(v) {
    if (this._preset != null) { this._preset.upperThreshold = Number(v); this._buildCurveList(); }
  }

  get logScale() { return this._preset ? this._preset.logScale : undefined; }
  set logScale(v) {
    if (this._preset != null) { this._preset.logScale = v == null ? null : Number(v); this._buildCurveList(); }
  }

  get expScale() { return this._preset ? this._preset.expScale : undefined; }
  set expScale(v) {
    if (this._preset != null) { this._preset.expScale = v == null ? null : Number(v); this._buildCurveList(); }
  }

  mapValue(x) {
    let xIndex = 0;
    while (xIndex < this.curveList.length) {
      let curX = this.curveList[xIndex];
      let nextX = this.curveList[xIndex + 3];
      if (nextX == null) break;
      if (x >= curX && x <= nextX) break;
      xIndex += 6;
    }
    let minX = this.curveList[xIndex];
    let maxX = this.curveList[xIndex + 3];
    let minY = this.curveList[xIndex + 1];
    let maxY = this.curveList[xIndex + 4];
    let curve = this.curveList[xIndex + 5];
    if (x === minX) return minY;
    if (x === maxX) return maxY;
    return this.curveScale(x, minX, maxX, minY, maxY, curve);
  }

  curveScale(x, inMin, inMax, outMin, outMax, curve) {
    let inRange = inMax - inMin;
    if (inRange === 0) return outMin;
    let inScaled = this.floatMap(x, inMin, inMax, 0.0, 1.0);
    let outScaled = inScaled;
    if (curve < 0) {
      outScaled = this.logScale(inScaled, curve);
    } else if (curve > 0) {
      outScaled = this.expScale(inScaled, curve);
    }
    outScaled = this.floatMap(outScaled, 0.0, 1.0, outMin, outMax);
    return outScaled;
  }

  floatMap(inVal, inMin, inMax, outMin, outMax) {
    let inRange = inMax - inMin;
    let outRange = outMax - outMin;
    if (inRange === 0) return outMin;
    let ratio = outRange / inRange;
    let inFlat = inVal - inMin;
    let out = outMin + inFlat * ratio;
    return out;
  }

  logScale(x, curve) {
    let innerPow = (1 / (1 + curve)) - 1;
    let pow1 = Math.pow(this.e, -1 * x * innerPow);
    let pow2 = Math.pow(this.e, -1 * innerPow);
    return (1 - pow1) / (1 - pow2);
  }

  expScale(x, curve) {
    let innerPow = (1 / (1 - curve)) - 1;
    let pow1 = Math.pow(this.e, x * innerPow);
    let pow2 = Math.pow(this.e, innerPow);
    return (1 - pow1) / (1 - pow2);
  }
}

module.exports = FunctionCurve;
