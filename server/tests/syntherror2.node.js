require("child_process");

let resetAt = 300;
let global_count = 0;
let reset_count = 0;
let numnotes = 30; // make this number larger for more notes at once (a cluster of notes)
let interval = 200; // how often (in milliseconds) to play each "cluster"



// midi hardward setup:
let midi_hardware_engine = false;
let use_midi_out = true; // whether or not to send midi values through a hardware output, via easymidi
//let midi_out_portname = "UM-ONE";
let midi_out_portname = "FLUID";
const MidiOuts = require('./modules/midiouts.module.js');
midi_hardware_engine = new MidiOuts({db:db, active: use_midi_out});
midi_hardware_engine.init();


let env = "rpi"; // or "rpi" or "mac"

let soundfont = './soundfonts/GeneralUserGS/GeneralUserGS.sf2'
let fluidpath = '/usr/bin/fluidsynth';
let arg_a = "pulseaudio";
let args = ["-a", arg_a];//, "--verbose", "--dump"];
if(env == "mac"){
    fluidpath = '/opt/homebrew/bin/fluidsynth';
    soundfont = '/Users/donundeen/Documents/htdocs/wecanmusicprojects/server/soundfonts/GeneralUserGS/GeneralUserGS.sf2'
    arg_a = "coreaudio";
//    args = ["a "+ arg_a, "m coremidi"];
    args = ["-d"];
}

let synth = require('child_process').spawn(fluidpath, args,{shell:true, detached: true});

synth.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });
  synth.on("message", (data)=>{
    console.log("message:", data);
  });
  synth.on('error', function(err) { console.log('Cannot spawn fluidsynth: ' + err.message); });
  synth.on('exceeded', function(err) { console.log("too much memory"); synth.kill(); });



setInterval(function(){
    play_notes(numnotes);   
}, interval);

resetAttempt();


function play_notes(numnotes){
//    console.log("playnotes");
    let i = 0;
    while(i < numnotes){
        global_count++;
        reset_count++;
        console.log(global_count +":" +reset_count +" ********************************************** " + global_count);
        let note = Math.floor(Math.random() * 127);
        let velocity = Math.floor(Math.random() * 70)+ 50;
        let voice = Math.floor(Math.random() * 100);
        let duration = Math.floor(Math.random() * 2) + 100;
        let channel = Math.floor(Math.random() * 2);
        makenote(channel, voice, note, velocity, duration );

        if(reset_count > resetAt){
            reset_count = 0;
            resetAttempt();
        }

        i++;
    }
}

function resetAttempt(){
    console.log("resetAttempt " + global_count);
   // synth.kill();
    //synth = require('child_process').spawn(fluidpath, args);


    let formatMemoryUsage = (data) => `${Math.round(data / 1024 / 1024 * 100) / 100} MB`;

    let memoryData = process.memoryUsage();
    
    let memoryUsage = {
      rss: `${formatMemoryUsage(memoryData.rss)} -> Resident Set Size - total memory allocated for the process execution`,
      heapTotal: `${formatMemoryUsage(memoryData.heapTotal)} -> total size of the allocated heap`,
      heapUsed: `${formatMemoryUsage(memoryData.heapUsed)} -> actual memory used during the execution`,
      external: `${formatMemoryUsage(memoryData.external)} -> V8 external memory`,
    };
    
    console.log(memoryUsage);    
  //  synth.reset();
}


function makenote(channel, instrument, pitch, velocity, duration){

        // if there's a hardware midi device attached to this instrument
        if(midi_hardware_engine){
            console.log("HARDWARE NOTE");
            midi_hardware_engine.send('program', {
                number: instrument, 
                channel: channel
            });

            midi_hardware_engine.send('noteon', {
                note: pitch,
                velocity: velocity,
                channel: channel
            });
            setTimeout(()=>{
                midi_hardware_engine.send('noteoff', {
                    note: pitch,
                    velocity: 0,
                    channel: channel
                });
            }, duration);
        }else{
            console.log("NNNNNNNNNNNNNNNo hardware engine");
        }

}

function makenote2(channel, instrument, pitch, velocity, duration){
       console.log("playing note "+ channel + ", " + pitch +","+velocity+","+duration);
        let cmd = "noteon "+ channel + " " + " " + pitch + " " +  velocity;
        synth.stdin.write(cmd + '\n');
        setTimeout(function(){
            let cmd = "noteoff "+ channel + " " + " " + pitch + " " +  velocity;
            synth.stdin.write(cmd + '\n');
        }, duration);
   }