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

        this.waitfor = [];
        if(options.waitfor){
            this.waitfor = options.waitfor;
        }

        this.portnames = [];
        this.midi_hardware_engines = [];

        this.midi = require('midi');
        this.easymidi = require('easymidi');
        
    }
    // need a way to pick just some portnames sometimes, or an array of matches.
    init(){
        this.get_midi_portnames();

        console.log(typeof this.matches);
        if(typeof this.matches == "object"){
            console.log("filtering portnames", this.portnames, this.matches);
            this.portnames = this.filter_portnames(this.matches);
            console.log("filtered portnames", this.portnames);
        }

        this.init_midi_hardware_engines();
        this.send("reset");
    }


    send(message){
        for(let engine of this.midi_hardware_engines){
            engine.send(message);
        }
    }

    send (message, options){
        for(let engine of this.midi_hardware_engines){
            engine.send(message, options);
        }        
    }

    get_midi_portnames(){

        let waiting = true;
        while(waiting){
            let midi_outputs = this.easymidi.getOutputs();
            console.log(midi_outputs);
            for(let i = 0; i<midi_outputs.length; i++){
                this.portnames.push(midi_outputs[i]);
            }
            let result = this.waitfor.filter(regex => this.portnames.some(portname => new RegExp(regex).test(portname)));
            console.log("result", result);
            if(result.length == this.waitfor.length){
                waiting = false;
            }
        }
        return this.portnames;
    }

    filter_portnames(regex_array){
        let result = this.portnames.filter(portname => regex_array.some(pattern => new RegExp(pattern).test(portname)));
        return result;
    }

    init_midi_hardware_engines(){
        for(let portname of this.portnames){
            if(this.midi_hardware_engines.filter(engine => engine.name == portname).length == 0){
                this.midi_hardware_engines.push(new this.easymidi.Output(portname));
            }
        }
    }
}   


module.exports = MidiOuts;