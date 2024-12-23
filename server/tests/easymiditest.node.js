// midi hardward setup:
let use_midi_out = true; // whether or not to send midi values through a hardware output, via easymidi
const MidiOuts = require('./modules/midiouts.module.js');
midi_outs = new MidiOuts({db:db, active: use_midi_out});
midi_outs.init();
midiSetBankProgram(midi_channel, 0, 5);


setTimeout(function(){
  //  midiSetBankProgram(1, 0, 32);
    midiSetVolume(midi_channel, 0);
    midiMakeNote(midi_channel, 65, 120, 500);
    midiMakeNote(midi_channel, 69, 120, 500);
    midiMakeNote(midi_channel, 73, 120, 500);
}, 100);


setTimeout(function(){
    //midiSetBankProgram(0, 0, 96);
    midiSetVolume(midi_channel, 50);
    midiMakeNote(midi_channel, 65, 120, 500);
    midiMakeNote(midi_channel, 69, 120, 500);
    midiMakeNote(midi_channel, 73, 120, 500);
}, 600);

setTimeout(function(){
    //midiSetBankProgram(0, 0, 96);
    midiSetVolume(midi_channel, 50);
    midiMakeNote(midi_channel, 65, 120, 500);
    midiMakeNote(midi_channel, 69, 120, 500);
    midiMakeNote(midi_channel, 73, 120, 500);
}, 1000);


function midiSetBankProgram(midi_channel, bank, midi_voice){
    console.log("set channel bank progam", midi_channel, bank, midi_voice);
    if(midi_outs){
        midi_outs.send('cc',{
            controller: 0,
            value: bank, 
            channel: midi_channel
        }); 
        /*
        midi_outs.send('cc',{
            controller: "000",
            value: MSB, 
            channel: midi_channel
        }); 
        midi_outs.send('cc',{
            controller: "032",
            value: LSB, 
            channel: midi_channel
        }); 
        */
        midi_outs.send('program',{
            number: midi_voice, 
            channel: midi_channel
        }); 
    }    
}


function midiSetInstrument(midi_channel, midi_voice){
    if(midi_outs){
        midi_outs.send('program',{
            number: midi_voice, 
            channel: midi_channel
        }); 
    }
}

function midiSetVolume(midi_channel,volume){
    // control change value to set volume.
    console.log("set volume ", midi_channel, volume);
    midi_outs.send('cc',{
        controller: 7,
        value: volume, // the volume, 
        channel: midi_channel
    });         
}


function midiMakeNote(midi_channel, note, velocity, duration){
    // if there's a hardware midi device attached to this instrument
    console.log("midiMakeNote " , midi_channel, note, velocity);
    if(midi_outs){
        console.log("HARDWARE NOTE");
        midi_outs.send('noteon', {
            note: note,
            velocity: velocity,
            channel: midi_channel
        });
        setTimeout(()=>{
            midi_outs.send('noteoff', {
                note: note,
                velocity: 0,
                channel: midi_channel
            });
        }, duration);
    }else{
        console.log("NNNNNNNNNNNNNNNo hardware engine");
    }
}