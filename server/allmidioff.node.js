let useMidiOut = true; // whether or not to send midi values through a hardware output, via easymidi
//let midiOutPortname = "UM-ONE";

// use config file to set the waitFor portname

const Config = require('./configs/conductor.config.js');
config = new Config();
const Debugging = require('./modules/debugging.module.js');
// TURN DEBUGGING ON/OFF HERE
db = new Debugging();


const MidiOuts = require('./modules/midi.midiouts.module.js');
midiOuts = new MidiOuts({db:db, active: useMidiOut, matches: "all", waitFor : config.waitForPortname});
midiOuts.init();
midiOuts.send("reset");

db.log("all off");