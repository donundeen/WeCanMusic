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
        this._midi_hardware_engine = false; // easymidi object
        this._bpm = 120;

        this.notelist = [];
        this._soundfont_file = false;
        this._soundfont_voicelist_file = false;
        this._soundfont_voicelist = [];

        this.voicelist_ready = true;

        // instr, pitch, velocity, duration
        this._makenote_callback = false;
    }

    set soundfont_voicelist_file(filename){
        this._soundfont_voicelist_file = filename;
    }

    set soundfont_file(filename){
        this._soundfont_file = filename;
    }

    get_voicelist(callback){
        this.voicelist_ready = false;
        fs.readFile(this._soundfont_voicelist_file, 'utf8', (err, data) => {
            if (err) {
                console.error(err);
                this.voicelist_ready = true;
                return;
            }
            this.soundfont_voicelist = JSON.parse(data);
            if(callback){
                this.voicelist_ready = true;
                callback(this.soundfont_voicelist);
            }
        });
    }

    set makenote_callback(callback){
        this.db.log("set makenote callback")
        this._makenote_callback = callback;
        for (let key in this.localInstruments) {
            this.localInstruments[key].makenote_callback = this._makenote_callback;
        }
        for (let key in this.udpInstruments) {
            this.udpInstruments[key].makenote_callback = this._makenote_callback;
        }
    }

    set bpm(bpm){
        this._bpm = bpm;
        this.all_local_instrument_set_value("bpm", this._bpm);
        this.all_udp_instrument_set_value("bpm", this._bpm);
    }

    get bpm(){
        return this._bpm;
    }

    set synth(synth){
        this._synth = synth;
        this.all_local_instrument_set_value("synth", this._synth);
        this.all_udp_instrument_set_value("synth", this._synth);
    }

    set midi_hardware_engine(engine){
        this._midi_hardware_engine = engine;
        this.all_local_instrument_set_value("midi_hardware_engine", this._midi_hardware_engine);
        this.all_udp_instrument_set_value("midi_hardware_engine", this._midi_hardware_engine);
    }


    // performance data is for the instruments, but managed through the orchestra
    _performanceUpdateCallback = false; // these callbacks cshould be passed to the instruments
    set performanceUpdateCallback(callback){
        this.db.log("orhestra set performanceUpdateCallback");
        this._performanceUpdateCallback = callback;
        this.all_udp_instrument_set_value("performanceUpdateCallback", callback);
    }
    _performancePropUpdateCallback =  false;
    set performancePropUpdateCallback(callback){
        this.db.log("orhestra set performancePropUpdateCallback")
        this._performancePropUpdateCallback = callback;

        this.all_udp_instrument_set_value("performancePropUpdateCallback", callback);
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

    local_instrument(name){
        if(this.localInstruments[name]){
            return this.localInstruments[name];
        }
        return false;
    }

    udp_instrument(name){
        if(this.udpInstruments[name]){
            return this.udpInstruments[name];
        }
        return false;
    }    

    get_local_instrument_names(){
        let names = Object.keys(this.localInstruments);
        return Object.keys(this.localInstruments);
    }

    get_udp_instrument_names(){
        let names = Object.keys(this.udpInstruments);
        return Object.keys(this.udpInstruments);
    }    

    create_local_instrument(name, options){
        if(this.localInstruments[name]){
            return this.localInstruments[name];
        }
        this.db.log("CREATING INSTRUMENT " + name);
        this.localInstruments[name] = new LocalInstrument({db:this.db});
        this.localInstruments[name].db = this.db;
        this.localInstruments[name].device_name = name;
        this.localInstruments[name].midi_channel = this.getChannel();
        this.localInstruments[name].synth = this._synth;
        this.localInstruments[name].midi_hardware_engine = this._midi_hardware_engine;
        this.localInstruments[name].bpm = this._bpm;
        this.localInstruments[name].notelist = this.notelist;
        this.localInstruments[name].start();
        this.localInstruments[name].makenote_callback = this._makenote_callback;       
        return this.localInstruments[name];
    }

    create_udp_instrument(name, options){
        if(this.udpInstruments[name]){
            return this.udpInstruments[name];
        }
        this.db.log("CREATING INSTRUMENT " + name);
        this.udpInstruments[name] = new UDPInstrument({db:this.db});
        this.udpInstruments[name].db = this.db;
        this.udpInstruments[name].device_name = name;
        this.udpInstruments[name].midi_channel = this.getChannel();
        this.udpInstruments[name].synth = this._synth;
        this.udpInstruments[name].midi_hardware_engine = this._midi_hardware_engine;
        this.udpInstruments[name].bpm = this._bpm;
        this.udpInstruments[name].notelist = this.notelist;
        this.udpInstruments[name].makenote_callback = this._makenote_callback;
        this.udpInstruments[name].performanceUpdateCallback = this._performanceUpdateCallback;
        this.udpInstruments[name].performancePropUpdateCallback = this._performancePropUpdateCallback;
        
        // set the device voice number from a list of name=>voice mappings (sort of a hack here)
        if(this.synthDeviceVoices[name]){
            this.udpInstruments[name].midi_bank = this.synthDeviceVoices[name][0];
            this.udpInstruments[name].midi_program = this.synthDeviceVoices[name][1];
        }else{
            this.udpInstruments[name].midi_bank = 0;
            this.udpInstruments[name].midi_program = 1;

        }
        this.db.log("created udp instrument");
        return this.udpInstruments[name];
    }

    destroy_local_instrument(name){
        this.releaseChannel(this.localInstruments[name].midi_channel);
        this.localInstruments[name].stop();
        delete(this.localInstruments[name]);
    }


    destroy_udp_instrument(name){
        this.udpInstruments[name].stop();
        delete(this.udpInstruments[name]);
    }    

    // send a makenote message from some external source (ie webpage, or networked device) to an instrument
    local_makenote(name, pitch, velocity, duration){
        if(this.localInstruments[name]){
            this.localInstruments[name].midiMakeNote(pitch, velocity, duration);
        }
    }

    has_udp_instrument(name){
        if(this.udpInstruments[name]){
            return true;
        }
        return false;
    }

    udp_makenote(name, pitch, velocity, duration){
        if(this.udpInstruments[name]){
            this.udpInstruments[name].midiMakeNote(pitch, velocity, duration);
        }else{
            this.db.log("no instrument " + name);
        }
    }

    all_instrument_set_value(prop, value){
        this.all_local_instrument_set_value(prop, value);
        this.all_udp_instrument_set_value(prop, value);
    }

    // set a value for all instruments
    all_local_instrument_set_value(prop, value){
        this.db.log("setting value for " +prop);
        this.db.log(value);
        if(prop == "notelist"){
            // store it locally for future instruments
            this.db.log("setting notelist");
            this.notelist = value;
        }
        for (let key in this.localInstruments) {
            this.local_instrument_set_value(key, prop, value);
        }
    }

    all_udp_instrument_set_value(prop, value){
        this.db.log("setting value for " +prop);
        this.db.log(value);
        if(prop == "notelist"){
            // store it locally for future instruments
            this.db.log("setting notelist");
            this.notelist = value;
        }
        this.db.log("this.udpInstruments");
        for (let key in this.udpInstruments) {
            this.db.log("setting instr value for ", key);
            this.udp_instrument_set_value(key, prop, value);
        }
    }    

    local_instrument_set_value(name, prop, value){
        this.db.log("setting instr value" , name, prop, value);
        if(this.localInstruments[name]){
            this.localInstruments[name][prop] = value;
        }
    }

    udp_instrument_set_value(name, prop, value){
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

    setNotelist(notelist){
        this.all_local_instrument_set_value("notelist", notelist);
        this.all_udp_instrument_set_value("notelist", notelist);

    }

    resendInstrumentsBankProgramChannel(){
        this.allUDPInstruments(function(instrument){
            instrument.midiSetBankProgram();
        });
    }




}

module.exports = Orchestra