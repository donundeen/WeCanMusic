let message = "C m";

const Debugging = require('./modules/debugging.module.js');
// TURN DEBUGGING ON/OFF HERE
db = new Debugging();
db.active = true;
db.trace = false;

// thoeryEngine generates lists of notes from theory terms (eg A MINORPENTATONIC)
const TheoryEngine = require("../modules/theoryengine.module.js");

theory =  new TheoryEngine({db:db});


theory.setMidiListCallback(function(msg){
    console.log("theory output ");
    console.log(msg);
});

theory.runSetter(message, "fromscore");

