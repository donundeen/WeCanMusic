// midi hardward setup:
let use_midi_out = true; // whether or not to send midi values through a hardware output, via easymidi
let midi_hardware_engine = false;
let midi_out_portname = "FLUID"; // FLUID for on-baord synth, UM-ONE for the midi cable, or other things"; 
let midi_channel = 1;
if(use_midi_out){
    const midi = require('midi');
    const easymidi = require('easymidi');
    while(!midi_hardware_engine){
        let midi_outputs = easymidi.getOutputs();
        console.log(midi_outputs);
        let real_portname = false;
        for(let i = 0; i<midi_outputs.length; i++){
            if(midi_outputs[i].includes(midi_out_portname)){
                real_portname = midi_outputs[i];
            }
        }
        if(real_portname){
            console.log("using port " + real_portname);
            midi_hardware_engine = new easymidi.Output(real_portname);   
            midi_hardware_engine.send('reset'); 
        }
    }
}
midiSetBankProgram(midi_channel, 0, 4);


setTimeout(function(){
  //  midiSetBankProgram(1, 0, 32);
    midiSetVolume(midi_channel, 200);
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
    if(midi_hardware_engine){
        midi_hardware_engine.send('cc',{
            controller: 0,
            value: bank, 
            channel: midi_channel
        }); 
        /*
        midi_hardware_engine.send('cc',{
            controller: "000",
            value: MSB, 
            channel: midi_channel
        }); 
        midi_hardware_engine.send('cc',{
            controller: "032",
            value: LSB, 
            channel: midi_channel
        }); 
        */
        midi_hardware_engine.send('program',{
            number: midi_voice, 
            channel: midi_channel
        }); 
    }    
}


function midiSetInstrument(midi_channel, midi_voice){
    if(midi_hardware_engine){
       midi_hardware_engine.send('program',{
            number: midi_voice, 
            channel: midi_channel
        }); 
    }
}

function midiSetVolume(midi_channel,volume){
    // control change value to set volume.
    console.log("set volume ", midi_channel, volume);
    midi_hardware_engine.send('cc',{
        controller: 7,
        value: volume, // the volume, 
        channel: midi_channel
    });         
}


function midiMakeNote(midi_channel, note, velocity, duration){
    // if there's a hardware midi device attached to this instrument
    console.log("midiMakeNote " , midi_channel, note, velocity);
    if(midi_hardware_engine){
        console.log("HARDWARE NOTE");
        midi_hardware_engine.send('noteon', {
            note: note,
            velocity: velocity,
            channel: midi_channel
        });
        setTimeout(()=>{
            midi_hardware_engine.send('noteoff', {
                note: note,
                velocity: 0,
                channel: midi_channel
            });
        }, duration);
    }else{
        console.log("NNNNNNNNNNNNNNNo hardware engine");
    }
}