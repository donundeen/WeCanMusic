//orchestra.module.js
// managing the collection of (local?) instruments
const LocalInstrument = require("./localinstrument.module");
const UDPInstrument = require("./udpinstrument.module");
const fs = require('node:fs');

class Orchestra{

    constructor(options){
        this.db = false;

        if(options.db){
            this.db = options.db;
        }
    
        this.localInstruments = {};
        this.udpInstruments = {};
        this.allChannels =  [0,1,2,3,4,5,6,7,8,9,10];
        this.channelPool = [0,1,2,3,4,5,6,7,8,9,10];
        this._synth = false; // fluidsynth object
        this._midiHardwareEngine = false; // easymidi object
        this._bpm = 120;

        this.noteList = [];
        this._soundfontFile = false;
        this._soundfontVoiceListFile = false;
        this._soundfontVoiceList = [];

        this.voiceListReady = true;

        // instr, pitch, velocity, duration
        this._makeNoteCallback = false;

        this.persistence = null;


        this.configPropMap = {
            "deviceName": "device_name",
            "type": "type",
            "sensorValue": "sensor_value",
            "noteList": "notelist",
            "wecanmusicServerIp": "wecanmusic_server_ip",
            "wecanmusicPort": "wecanmusic_port",
            "midiVoice": "midi_voice",
            "midiBank": "midi_bank",
            "midiProgram": "midi_program",
            "midiChannel": "midi_channel",
            "midiNlen": "midi_notelength",
            "midiVol": "midi_vol",
            "rootMidi": "rootMidi",
            "midiMin": "midimin",
            "midiMax": "midimax",
            "bpm": "bpm",
        }


    }

    set soundfontVoiceListFile(filename){
        this._soundfontVoiceListFile = filename;
    }

    set soundfontFile(filename){
        this._soundfontFile = filename;
    }

    getVoiceList(callback){
        this.voiceListReady = false;
        fs.readFile(this._soundfontVoiceListFile, 'utf8', (err, data) => {
            if (err) {
                console.error(err);
                this.voiceListReady = true;
                return;
            }
            this.soundfontVoiceList = JSON.parse(data);
            if(callback){
                this.voiceListReady = true;
                callback(this.soundfontVoiceList);
            }
        });
    }

    set makeNoteCallback(callback){
        this.db.log("set makeNote callback")
        this._makeNoteCallback = callback;
        for (let key in this.localInstruments) {
            this.localInstruments[key].makeNoteCallback = this._makeNoteCallback;
        }
        for (let key in this.udpInstruments) {
            this.udpInstruments[key].makeNoteCallback = this._makeNoteCallback;
        }
    }

    set bpm(bpm){
        this._bpm = bpm;
        this.allLocalInstrumentSetValue("bpm", this._bpm);
        this.allUDPInstrumentSetValue("bpm", this._bpm);
    }

    get bpm(){
        return this._bpm;
    }

    set synth(synth){
        this._synth = synth;
        this.allLocalInstrumentSetValue("synth", this._synth);
        this.allUDPInstrumentSetValue("synth", this._synth);
    }

    set midiHardwareEngine(engine){
        this._midiHardwareEngine = engine;
        this.allLocalInstrumentSetValue("midiHardwareEngine", this._midiHardwareEngine);
        this.allUDPInstrumentSetValue("midiHardwareEngine", this._midiHardwareEngine);
    }


    // performance data is for the instruments, but managed through the orchestra
    _performanceUpdateCallback = false; // these callbacks cshould be passed to the instruments
    set performanceUpdateCallback(callback){
        this.db.log("orhestra set performanceUpdateCallback");
        this._performanceUpdateCallback = callback;
        this.allUDPInstrumentSetValue("performanceUpdateCallback", callback);
    }
    _performancePropUpdateCallback =  false;
    set performancePropUpdateCallback(callback){
        this.db.log("orhestra set performancePropUpdateCallback")
        this._performancePropUpdateCallback = callback;
        this.allUDPInstrumentSetValue("performancePropUpdateCallback", callback);
    }

    getPerformanceData(){
        // gather the data in performanceProps and return it
        let perfData = {};
        for (let key in this.udpInstruments) {
            let instrData = this.udpInstruments[key].getPerformanceData();
            perfData[key] = instrData;
        }         

        return perfData;
    }

    loadPerformanceData(perfData){
        // extract performanceProps data, 
        // set internally, 
        // and do any announcing you need to do
        this.db.log("orchestra loading perfData")
        this.db.log(perfData);
        for (let key in perfData) {
            this.db.log(key);
            let instrData = perfData[key];
            this.db.log("instr loading perfData")
            if(this.udpInstruments[key]){
                this.udpInstruments[key].loadPerformanceData(instrData);
            }
        }
    } 


    getChannel(){
        if(this.channelPool.length == 0){
            this.channelPool = this.allChannels;
        }
        return this.channelPool.shift();
    }

    releaseChannel(channel){
        this.channelPool.unshift(channel);
    }

    localInstrument(name){
        if(this.localInstruments[name]){
            return this.localInstruments[name];
        }
        return false;
    }

    udpInstrument(name){
        if(this.udpInstruments[name]){
            return this.udpInstruments[name];
        }
        return false;
    }    

    getLocalInstrumentNames(){
        let names = Object.keys(this.localInstruments);
        return Object.keys(this.localInstruments);
    }

    getUDPInstrumentNames(){
        let names = Object.keys(this.udpInstruments);
        return Object.keys(this.udpInstruments);
    }    

    createLocalInstrument(name, options){
        if(this.localInstruments[name]){
            return this.localInstruments[name];
        }
        this.db.log("CREATING INSTRUMENT " + name);
        this.localInstruments[name] = new LocalInstrument({db:this.db});
        this.localInstruments[name].db = this.db;
        this.localInstruments[name].deviceName = name;
        this.localInstruments[name].midiChannel = this.getChannel();
        this.localInstruments[name].synth = this._synth;
        this.localInstruments[name].midiHardwareEngine = this._midiHardwareEngine;
        this.localInstruments[name].bpm = this._bpm;
        this.localInstruments[name].noteList = this.noteList;
        this.localInstruments[name].start();
        this.localInstruments[name].makeNoteCallback = this._makeNoteCallback; 
        
        let props = this.persistence.getJSON(this.getPersistenceFilename(name));
        if(props){
            this.localInstruments[name].loadPerformanceData(props);
        }

        return this.localInstruments[name];
    }

    createUDPInstrument(name, options){
        if(this.udpInstruments[name]){
            return this.udpInstruments[name];
        }
        this.db.log("CREATING INSTRUMENT " + name);
        this.udpInstruments[name] = new UDPInstrument({db:this.db});
        this.udpInstruments[name].db = this.db;
        this.udpInstruments[name].deviceName = name;
        this.udpInstruments[name].midiChannel = this.getChannel();
        this.udpInstruments[name].synth = this._synth;
        this.udpInstruments[name].midiHardwareEngine = this._midiHardwareEngine;
        this.udpInstruments[name].bpm = this._bpm;
        this.udpInstruments[name].noteList = this.noteList;
        this.udpInstruments[name].makeNoteCallback = this._makeNoteCallback;
        this.udpInstruments[name].performanceUpdateCallback = this._performanceUpdateCallback;
        this.udpInstruments[name].performancePropUpdateCallback = this._performancePropUpdateCallback;
        
        // set the device voice number from a List of name=>voice mappings (sort of a hack here)
        if(this.synthDeviceVoices[name]){
            this.udpInstruments[name].midiBank = this.synthDeviceVoices[name][0];
            this.udpInstruments[name].midiProgram = this.synthDeviceVoices[name][1];
        }else{
            this.udpInstruments[name].midiBank = 0;
            this.udpInstruments[name].midiProgram = 1;

        }
        this.db.log("created udp instrument");
        return this.udpInstruments[name];
    }

    destroyLocalInstrument(name){
        this.releaseChannel(this.localInstruments[name].midiChannel);
        this.localInstruments[name].stop();
        delete(this.localInstruments[name]);
    }


    destroyUDPInstrument(name){
        this.udpInstruments[name].stop();
        delete(this.udpInstruments[name]);
    }    

    // send a makeNote message from some external source (ie webpage, or networked device) to an instrument
    localMakeNote(name, pitch, velocity, duration){
        if(this.localInstruments[name]){
            this.localInstruments[name].midiMakeNote(pitch, velocity, duration);
        }
    }

    hasUDPInstrument(name){
        if(this.udpInstruments[name]){
            return true;
        }
        return false;
    }

    udpMakeNote(name, pitch, velocity, duration){
        if(this.udpInstruments[name]){
            this.udpInstruments[name].midiMakeNote(pitch, velocity, duration);
        }else{
            this.db.log("no instrument " + name);
        }
    }

    allInstrumentSetValue(prop, value){
        this.allLocalInstrumentSetValue(prop, value);
        this.allUDPInstrumentSetValue(prop, value);
    }

    // set a value for all instruments
    allLocalInstrumentSetValue(prop, value){
        this.db.log("setting value for " +prop);
        this.db.log(value);
        if(prop == "noteList"){
            // store it locally for future instruments
            this.db.log("setting noteList");
            this.noteList = value;
        }
        for (let key in this.localInstruments) {
            this.localInstrumentSetValue(key, prop, value);
        }
    }

    allUDPInstrumentSetValue(prop, value){
        this.db.log("setting value for " +prop);
        this.db.log(value);
        if(prop == "noteList"){
            // store it locally for future instruments
            this.db.log("setting noteList");
            this.noteList = value;
        }
        this.db.log("this.udpInstruments");
        for (let key in this.udpInstruments) {
            this.db.log("setting instr value for ", key);
            this.udpInstrumentSetValue(key, prop, value);
        }
    }    


    getLocalInstrument(name){
        if(this.localInstruments[name]){
            return this.localInstruments[name];
        }
        return false;
    }

    getUDPInstrument(name){
        if(this.udpInstruments[name]){
            return this.udpInstruments[name];
        }
        return false;
    }
    
    getPersistenceFilename(name){
        return "localInstrument_"+name+".json";
    }

    // set a value for an instrument
    localInstrumentSetValue(name, prop, value){
        this.db.log("setting instr value" , name, prop, value);
        if(this.localInstruments[name]){
            this.localInstruments[name][prop] = value;
            // save the value to the local instruments persistence file
            const localConfigProps = this.localInstruments[name].getPerformanceData();
            if(this.persistence){
                this.db.log("saving localConfigProps");
                this.db.log(localConfigProps);
                this.persistence.saveJSON(this.getPersistenceFilename(name), localConfigProps);
            }
        }
    }

    udpInstrumentSetValue(name, prop, value){
        this.db.log("setting udp instr value" , name, prop, value);
        this.db.log("value is " + value);
        if(this.udpInstruments[name]){
            this.udpInstruments[name][prop] = value;
        }
    }    


    allInstruments(callback){
        this.allLocalInstruments(callback);
        this.allUDPInstruments(callback);
    }

    // call a callback function on all instruments.
    allLocalInstruments(callback){
        for (let key in this.localInstruments) {
            callback(this.localInstruments[key]);
        }        
    }

    // call a callback function on all instruments.
    allUDPInstruments(callback){
        for (let key in this.udpInstruments) {
            callback(this.udpInstruments[key]);
        }        
    }    

    setNoteList(noteList){
        this.allLocalInstrumentSetValue("noteList", noteList);
        this.allUDPInstrumentSetValue("noteList", noteList);
    }

    resendInstrumentsBankProgramChannel(){
        this.allUDPInstruments(function(instrument){
            instrument.midiSetBankProgram();
        });
    }
}

module.exports = Orchestra