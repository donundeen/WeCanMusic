class MidiOuts {
    constructor(options){
        if(options.db){
            this.db = options.db;
        }   
        this.active = false;
        if(options.active){
            this.active = options.active;
        }

        this.matches = "all";
        if(options.matches){
            this.matches = options.matches;
        }

        this.waitFor = [];
        if(options.waitFor){
            this.waitFor = options.waitFor;
        }

        this.quantizeActive = false;
        this.quantizeTime = null;
        // things like 
        if(options.quantizeTime){
            this.quantizeTime = options.quantizeTime;
        }

        this.portNames = [];
        this.midiHardwareEngines = [];

        this.midi = require('midi');
        this.easyMidi = require('easymidi');

        this.makeNoteQueue = [];
    }
    // need a way to pick just some portnames sometimes, or an array of matches.
    init(){
        this.getMidiPortnames();

        console.log(typeof this.matches);
        if(typeof this.matches == "object"){
            console.log("filtering portnames", this.portNames, this.matches);
            this.portNames = this.filterPortnames(this.matches);
            console.log("filtered portnames", this.portNames);
        }

        this.initMidiHardwareEngines();
        this.send("reset");
    }


    send(message){
        for(let engine of this.midiHardwareEngines){
            engine.send(message);
        }
    }

    send (message, options){
        for(let engine of this.midiHardwareEngines){
            engine.send(message, options);
        }        
    }

    getMidiPortnames(){

        let waiting = true;
        while(waiting){
            let midiOutputs = this.easyMidi.getOutputs();
            console.log("midi_outputs", midiOutputs);
            console.log("midi_inputs", this.easyMidi.getInputs());
            for(let i = 0; i < midiOutputs.length; i++){
                this.portNames.push(midiOutputs[i]);
            }
            if(this.waitFor == "all"){
                waiting = false;
            }else{
                let result = this.waitFor.filter(regex => this.portNames.some(portname => new RegExp(regex).test(portname)));
                console.log("result", result);
                if(result.length == this.waitFor.length){
                    waiting = false;
                }else{
                    this.db.log("waiting for portnames", this.waitFor, "result", result);
                }
            }
        }
        console.log("portnames", this.portNames);
        return this.portNames;
    }


    filterPortnames(regexArray){
        let result = this.portNames.filter(portname => regexArray.some(pattern => new RegExp(pattern).test(portname)));
        return result;
    }

    initMidiHardwareEngines(){
        for(let portname of this.portNames){
            if(this.midiHardwareEngines.filter(engine => engine.name == portname).length == 0){
                this.midiHardwareEngines.push(new this.easyMidi.Output(portname));
            }
        }
    }


    makeNote(channel, note, velocity, duration){
        if(this.quantizeActive && this.quantizeTime){
            this.db.log("quantize makeNote", this.quantizeTime);
            this.makeNoteAddToQueue(channel, note, velocity, duration);
        }else{
            this.db.log("no quantize makeNote");
            this.makeNoteNow(channel, note, velocity, duration);
        }
    }   

    makeNoteNow(channel, note, velocity, duration){
        this.send("noteon", {
            note: note,
            velocity: velocity,
            channel: channel
        });
        setTimeout(()=>{
            this.send('noteoff', {
                note: note,
                velocity: 0,
                channel: channel
            });
        }, duration);
    }

    makeNoteAddToQueue(channel, note, velocity, duration){
        this.makeNoteQueue.push({
            channel: channel,
            note: note,
            velocity: velocity,
            duration: duration
        });
    }


    processMakeNoteQueue(){
        if(!this.processingQueue){
            this.processingQueue = true;
            for(let item of this.makeNoteQueue){
                this.db.log("processing makeNoteQueue item", item);
                this.makeNoteNow(item.channel, item.note, item.velocity, item.duration);
            }
            this.makeNoteQueue = [];
            this.processingQueue = false;
        }
    }
}   


module.exports = MidiOuts;
