let use_midi_out = true; // whether or not to send midi values through a hardware output, via easymidi
//let midi_out_portname = "UM-ONE";

const Debugging = require('./modules/debugging.module.js');
// TURN DEBUGGING ON/OFF HERE
db = new Debugging();


const MidiOuts = require('./modules/midiouts.module.js');
midi_outs = new MidiOuts({db:db, active: use_midi_out, matches: "all", waitfor : ["UM-ONE","Port 1"]});
midi_outs.init();
midi_outs.send("reset");

console.log("all off");