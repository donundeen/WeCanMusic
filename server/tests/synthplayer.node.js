/*
const UDPInstrument = require("./modules/udpinstrument.module");

inst1 = new UDPInstrument(1,2);
inst2 = new UDPInstrument(3,4);
*/

var JZZ = require('jzz');
require('jzz-synth-fluid')(JZZ);

let env = "rpi"; // or "mac"


///Users/donundeen/Downloads/MuseScore_General.sf2
//let soundfont = '/Users/donundeen/Documents/htdocs/wecanmusicprojects/server/soundfonts/GeneralUserGS/GeneralUserGS.sf2'
let soundfont = './soundfonts/GeneralUserGS/GeneralUserGS.sf2'
//let fluidpath = '/opt/homebrew/bin/fluidsynth';
let fluidpath = '/usr/bin/fluidsynth';
let arg_a = "pulseaudio";
let args = ["a", arg_a];
if(env == "mac"){
    fluidpath = '/opt/homebrew/bin/fluidsynth';
    soundfont = '/Users/donundeen/Documents/htdocs/wecanmusicprojects/server/soundfonts/GeneralUserGS/GeneralUserGS.sf2'
    arg_a = "cordaudio";
    args = ["a", arg_a];
}


ch1 = 0;
ch2 = 1;

v1 = 22;
v2 = 12;

//let soundfont = "/Users/donundeen/Downloads/MuseScore_General.sf2";
let synth = JZZ.synth.Fluid({ path: fluidpath, 
                sf: soundfont,
                args: args });
      
synth.reset();
synth.allNotesOff(ch1);
synth.allNotesOff(ch2);
synth.resetAllControllers(ch1);
synth.resetAllControllers(ch2);




/*
var osc = require("osc");
var oscPort = new osc.UDPPort({
    localAddress: "0.0.0.0",
    localPort: 8006, // this port for listening
    broadcast: true,
    metadata: true
});

oscPort.on("message", function (oscMsg) {
    console.log("An OSC message just arrived!", oscMsg);
    if(oscMsg.address == "/makenote"){
        makenote_parse(oscMsg.args[0].value);
    }
});

oscPort.open();
*/


console.log("gonna play");
          
synth
    .program(ch1, v1)
    .noteOn(ch1, 'B5', 127)
    .wait(1000).noteOn(ch1, 'D5', 127)
    .wait(1000).noteOn(ch1, 'F5', 127)
    .wait(1000).noteOff(ch1, 'B5').noteOff(ch1, 'D5').noteOff(ch1, 'F5');

synth
    .program(ch2,v2)
    .noteOn(ch2, 'C5', 127)
    .wait(100).noteOn(ch2, 'E5', 127)
    .wait(100).noteOn(ch2, 'G5', 127)
    .wait(100).noteOff(ch2, 'C5').noteOff(ch2, 'E5').noteOff(ch2, 'G5');

console.log("played");
    // .close();


function makenote_parse(stringargs){
    console.log("makenote");
    console.log(stringargs);
    let split = stringargs.split(",");
    console.log(split);
    let channel = split[0];
    let instrument = split[1];
    let pitch = split[2];
    let velocity = split[3];
    let duration = split[4];
    makenote(channel, instrument, pitch, velocity, duration);
}

function makenote(channel, instrument, pitch, velocity, duration){
    console.log("playing note "+ channel + ", " + pitch);

    synth.program(channel, instrument)
    .noteOn(channel, pitch, velocity)
    .wait(duration)
    .noteOff(channel,pitch)
}