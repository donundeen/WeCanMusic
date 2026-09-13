let useMidiOut = true; // whether or not to send midi values through a hardware output, via easymidi
//let midiOutPortname = "UM-ONE";

// use config file to set the waitFor portname

////////////////////////
// LOAD MAIN CONFIG FILE
const merge = require('deepmerge')
let config = require("./configs/conductor.config.js");
let envConfig = require("./configs/env.config.js");
let env = envConfig.env;
let machineConfig = require("./configs/"+env+".conductor.config.js");
config.env = env;
config = {...config, ...machineConfig, ...envConfig};


// load config variables from the command line -- any arguments that match existing config variables will override the config file
// format is --variable value
process.argv.forEach(arg => {
    if(arg.startsWith("--") && config[arg.slice(2)] !== undefined){
        console.log("overriding config variable", arg.slice(2), "with", process.argv[process.argv.indexOf(arg) + 1]);
        // treat "false" or true as boolean values
        if(process.argv[process.argv.indexOf(arg) + 1] == "false"){
            config[arg.slice(2)] = false;
        }else if(process.argv[process.argv.indexOf(arg) + 1] == "true"){
            config[arg.slice(2)] = true;
        }else{
            config[arg.slice(2)] = process.argv[process.argv.indexOf(arg) + 1];
        }
    }
});

////////////////////////////////
// LOAD DEBUGGING FRAMEWORK
const Debugging = require('./modules/debugging.module.js');
// TURN DEBUGGING ON/OFF HERE
db = new Debugging();
db.active = config["db.active"];
db.trace = false;
//db.log("starting","now",[1,2,3]);
//db.log(config);

// check for a filter in the config: only show messages that match.
if(config["db.filter"]){
    db.filter = config["db.filter"];
}
// check for filter in the command line
// the format is --filter filter_string
db.log("process.argv", process.argv);
if(process.argv.includes("--filter")){
    db.filter = process.argv[process.argv.indexOf("--filter") + 1];
    db.log("filter set to", db.filter);
}



const MidiOuts = require('./modules/midi.midiouts.module.js');
midiOuts = new MidiOuts({db:db, active: useMidiOut, matches: "all", waitFor : config.waitForPortname});
midiOuts.init();
midiOuts.send("reset");

db.log("all off");