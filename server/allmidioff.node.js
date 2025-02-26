let useMidiOut = true; // whether or not to send midi values through a hardware output, via easymidi
//let midiOutPortname = "UM-ONE";

const Debugging = require('./modules/debugging.module.js');
// TURN DEBUGGING ON/OFF HERE
db = new Debugging();


const MidiOuts = require('./modules/midiouts.module.js');
midiOuts = new MidiOuts({db:db, active: useMidiOut, matches: "all", waitFor : ["UM-ONE","Port 1"]});
midiOuts.init();
midiOuts.send("reset");

console.log("all off");