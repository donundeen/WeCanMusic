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
        this.db?.log?.("matches", this.matches);

        this.waitFor = [];
        if(options.waitFor){
            this.waitFor = options.waitFor;
            this.db?.log?.("waitFor", this.waitFor);
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

        this.theoryEngine = false;
        this.correctMidiNotes = false;

        this._alsaFailedAt = 0;
        this._alsaBackoffMs = 15000;
        this._pollMs = 500;
    }

    _sleep(ms){
        const { execSync } = require("child_process");
        try {
            execSync(`sleep ${ms / 1000}`, { stdio: "ignore" });
        } catch (e) {
            // ignore
        }
    }

    _hasWaitFor(){
        return Array.isArray(this.waitFor) && this.waitFor.length > 0 && this.waitFor !== "all";
    }

    _waitForMatches(){
        if (!this._hasWaitFor()) return [];
        return this.waitFor.filter(regex => this.portNames.some(portname => new RegExp(regex).test(portname)));
    }

    _requiredPortsReady(){
        if (!this._hasWaitFor()) return true;
        if (this._waitForMatches().length !== this.waitFor.length) return false;
        return this.waitFor.every(regex =>
            this.midiHardwareEngines.some(engine => new RegExp(regex).test(engine.name))
        );
    }

    // Blocks until specified waitFor ports have appeared and been added.
    init(){
        if (this._hasWaitFor()) {
            this.db?.log?.("init waiting for MIDI ports", this.waitFor);
            while (!this._requiredPortsReady()) {
                this.scanAndAddMidiPorts();
                if (this._requiredPortsReady()) break;
                this.db?.log?.("waiting for portnames", this.waitFor, "have", this.portNames);
                const waitMs = (this._alsaFailedAt && (Date.now() - this._alsaFailedAt) < this._alsaBackoffMs)
                    ? this._alsaBackoffMs
                    : this._pollMs;
                this._sleep(waitMs);
            }
            this.db?.log?.("init found required MIDI ports", this.portNames);
        } else {
            this.scanAndAddMidiPorts();
        }
        this.send("reset");

        setInterval(()=>{
            this.scanAndAddMidiPorts();
        }, 5000);
    }


    scanAndAddMidiPorts(){
        this.getMidiPortnames();

        this.db?.log?.(typeof this.matches);
        if(typeof this.matches == "object"){
            this.db?.log?.("filtering portnames", this.portNames, this.matches);
            this.portNames = this.filterPortnames(this.matches);
            this.db?.log?.("filtered portnames", this.portNames);
        }
        this.initMidiHardwareEngines();
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
        this.portNames = [];
        if (this._alsaFailedAt && (Date.now() - this._alsaFailedAt) < this._alsaBackoffMs) {
            return this.portNames;
        }
        let midiOutputs;
        try {
            midiOutputs = this.easyMidi.getOutputs();
            this._alsaFailedAt = 0;
            this.db?.log?.("midi_outputs", midiOutputs);
        } catch (err) {
            this._alsaFailedAt = Date.now();
            this.db?.log?.("MIDI port enumeration failed (ALSA/RtMidi)", err.message);
            return this.portNames;
        }
        this.db?.log?.("waitFor", this.waitFor);
        for(let i = 0; i < midiOutputs.length; i++){
            this.portNames.push(midiOutputs[i]);
        }
        if(this.waitFor && this.waitFor !== "all" && Array.isArray(this.waitFor) && this.waitFor.length > 0){
            let result = this.waitFor.filter(regex => this.portNames.some(portname => new RegExp(regex).test(portname)));
            this.db?.log?.("result ", result, this.waitFor.length, result.length);
            if(result.length !== this.waitFor.length){
                this.db?.log?.("waiting for portnames", this.waitFor, "result", result);
            }
        }
        this.db?.log?.("portnames", this.portNames, this.midiHardwareEngines.length);
        return this.portNames;
    }


    filterPortnames(regexArray){
        let result = this.portNames.filter(portname => regexArray.some(pattern => new RegExp(pattern).test(portname)));
        return result;
    }

    initMidiHardwareEngines(){
        for(let portname of this.portNames){
            if(this.midiHardwareEngines.filter(engine => engine.name == portname).length == 0){
                try {
                    this.midiHardwareEngines.push(new this.easyMidi.Output(portname));
                } catch (err) {
                    this.db?.log?.("MIDI output open failed", portname, err.message);
                }
            }
        }
    }


    makeNote(channel, note, velocity, duration){
        // if correctMidiNotes is true and the theoryEngine is attached, correct the input note
        // to the closest correct midi note
        if(this.correctMidiNotes && this.theoryEngine){
            note = this.theoryEngine.getClosestCorrectNote(note);
        }
        if(this.quantizeActive && this.quantizeTime){
            this.db?.log?.("quantize makeNote", this.quantizeTime);
            this.makeNoteAddToQueue(channel, note, velocity, duration);
        }else{
            this.db?.log?.("no quantize makeNote");
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
                this.db?.log?.("processing makeNoteQueue item", item);
                this.makeNoteNow(item.channel, item.note, item.velocity, item.duration);
            }
            this.makeNoteQueue = [];
            this.processingQueue = false;
        }
    }
}   


module.exports = MidiOuts;
