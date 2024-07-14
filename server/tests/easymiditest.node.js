// midi hardward setup:
let use_midi_out = true; // whether or not to send midi values through a hardware output, via easymidi
let midi_hardware_engine = false;
let midi_out_portname = "FLUID"; // FLUID for on-baord synth, UM-ONE for the midi cable, or other things"; 
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
            midi_hardware_engine = new easymidi.Output(real_portname);   
            midi_hardware_engine.send('reset'); 
        }
    }
}
midiSetBankProgram(1, 120, 3);


setTimeout(function(){
//    midiSetBankProgram(1, 1, 3);
    midiMakeNote(1, 65, 120, 500);
    midiMakeNote(1, 69, 120, 500);
    midiMakeNote(1, 73, 120, 500);
}, 10);

setTimeout(function(){
 //   midiSetBankProgram(1, 0, 3);
    midiMakeNote(1, 65, 120, 500);
    midiMakeNote(1, 69, 120, 500);
    midiMakeNote(1, 73, 120, 500);
}, 600);



function midiSetBankProgram(midi_channel, MSB, midi_voice){
    if(midi_hardware_engine){
        midi_hardware_engine.send('cc',{
            controller: "000",
            value: MSB, 
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




function midiMakeNote(midi_channel, note, velocity, duration){
    // if there's a hardware midi device attached to this instrument
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