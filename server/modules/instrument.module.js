dynRescale = require("./dynRescale.module");
functionCurve = require("./functionCurve.module");
NoteNumberCruncher = require("./notenumbercruncher.module");

class Instrument {

    constructor(options) {
        this.db = false;
        if(options.db){
            this.db = options.db;
        }
        this._type = "local";
        this.type = "local";

    // input values
        this._sensor_value = false;;
        this.changerate = false;
        this.prevChangeVal = false;

    // note lists
        this._notelist = [];
        this.workinglist = [];
        this._device_name = "RENAME_ME";

        // networking info
        this._wecanmusic_server_ip = "10.0.0.174";
        this._wecanmusic_port = "7002";

        // midi vars
        this._midi_voice = "0:1"; // in format bank:program, when this is set, parse and set bank and program
        this._midi_bank = 0; // bank and program together select the tone.
        this._midi_program = 1;
        this._midi_channel = 1;
        this._rootMidi = 0;
        this._midimin = 32;
        this._midimax = 100;
        this._midi_vol = 200; //(0-254) // sometimes we use shorter names because of arduino restrictions in OSC routes

        this._reset = false; // if the "reset" value is set, call the reset function 

    // dictionary of note names and their lengths
        this.notelengths = {};
        this.notelength_values = [];

        this.currentnotes = []; // need to keep track of all playing notes to to a panic stop

        // set fluidSynth object
        this.synth = false;

        // set hardware synth out object (easymidi)
        this.midi_hardware_engine = false;

        // velocity curve starts as a straight line
        this._velocitycurve = new functionCurve([0., 0.0, 0., 1.0, 1.0, 0.0], {db:this.db});
        this._changeratecurve = new functionCurve([0., 0.0, 0., 1.0, 1.0, 0.0], {db:this.db});
        // dyn rescaling
        this.input_scale = new dynRescale();
        this.changerate_scale = new dynRescale();
        this.velocity_scale = new dynRescale();

        this.last_note_time = Date.now();

        // timing for different common note values.
        this._bpm = 120;

        this.running = false;

        // instr, pitch, velocity, duration
        this.makenote_callback = false;

        // track the previous note, so we don't play the same note twice in a row
        this._previous_pitch = 0;
        this.skip_duplicate_notes = true;
    
        // vars that might be externally set.
        // we can send this info to a server so it can set up a UI to collect those values
        // maybe array of objects?
        this.configProps = [
            {name:"device_name", type:"s"},
            {name:"type", type:"s"},
            {name:"sensor_value", type:"f"},
            {name:"notelist", type:"ia"},
            {name:"wecanmusic_server_ip", type:"s"},
            {name:"wecanmusic_port", type:"i"},
            {name:"midi_voice", type:"s"},
            {name:"midi_bank", type:"i"},
            {name:"midi_program", type:"i"},
            {name:"midi_channel", type:"i"},
            {name:"midi_nlen", type:"i"},
            {name:"midi_vol", type:"i"},
            {name:"rootMidi", type:"i"},
            {name:"midimin", type:"i"},
            {name:"midimax", type:"i"},
            /* // TBD: saving of the data in these curve objects.
            {name:"velocitycurve", type:"fa"},
            {name:"changeratecurve", type:"fa"},
            */
            {name:"bpm", type:"i"},        
        ];



        this.db.log("CONSTRUCTING");
        this.last_note_time = Date.now();
        this.setNoteLengths();
        this.get_config_props();
        this.numberCruncher = new NoteNumberCruncher(this.db);

    }

    /******************************* */
    /** get/set properties   */
    /******************************* */

    set reset(resetval){
        // don't need to set the reset value, just call the reset function
        this.reset_instrument();
    }

    set velocitycurve(curve){
        this._velocitycurve.curvelist = curve;
    }

    get velocitycurve(){
        return this._velocitycurve;
    }

    set changeratecurve(curve){
        this._changeratecurve.curvelist = curve;
    }
    get changeratecurve(){
        return this._changeratecurve;
    }

    set bpm(bpm){
        this._bpm = bpm;
        this.setNoteLengths();
    }

    get bpm(){
        return this._bpm;
    }

    get midi_voice(){
        return this._midi_voice;
    }

    set midi_voice(voice){
        this.db.log("setting midi_voice ", voice);
        let split = voice.split(":");
        let bank = 0;
        let program = 1;
        if(split.length == 1){
            program = split[0];
        }else{
            bank = split[0];
            program = split[1];
        }
        this.midi_bank = bank;
        this.midi_program = program;
    }

    set midi_program(program){
        this._midi_program = parseInt(program);
        this.midiSetBankProgram();
    }
    get midi_program(){
        return this._midi_program;
    }

    set midi_bank(bank){
        this._midi_bank = parseInt(bank);
        this.midiSetBankProgram(); // program and bank might come in reverse order, better to set it both times; at least the second time you set it the bank and program will be legit.
    }

    get midi_bank(){
        return this._midi_bank;
    }

    // what to do when a new sensor value is received. Need to trigger a note here
    set sensor_value(value){
        // might be a number or an OSC-formatted value message
        if(typeof value == "number"){
            value = value;
        }else if(Array.isArray(value) && value.length > 0 && Object.hasOwn(value[0], "value")){
            value = value[0].value;
        }else{
            this.db.log("!!!!!!!!!!!!!! ");
            this.db.log("don't know what value is " + Array.isArray(value) + " : " + value.length);
        }
        this.db.log(value);
        this.db.log("********************");

        this.numberCruncher.setValue(value);
        this.numberCruncher.crunch();
        this._sensor_value = value;
        this.derive_changerate(this._sensor_value);
        this.note_trigger();
    }

    get sensor_value(){
        return this._sensor_value;
    }

    set midi_channel(channel){
        this.db.log("changing midi channel to " + channel);
        this._midi_channel = channel;
    }
    get midi_channel(){
        return this._midi_channel;
    }

   ////////////////////////
    // MUSIC FUNCTIONS
    set notelist(notelist){
        this._notelist = notelist;
    }
    get notelist(){
        return this._notelist;
    }

    set rootMidi(root){
        this._rootMidi = root;
    }
    get rootMidi(){
        return this._rootMidi;
    }

    set midimax(max){
        this._midimax = max;
    }

    get midimax(){
        return this._midimax;
    }

    set midimin(min){
        this._midimin = min;
    }

    get midimin(){
        return this._midimin;
    }

    /******************************* */
    /** END get/set properties   */
    /******************************* */

    /******************************* */
    /** Configurable properties FUNCTIONS   */
    /******************************* */
    get_config_props(){
        this.populate_config_props();
        return this.configProps;
    }

    populate_config_props(){
        for(let i =0; i< this.configProps.length; i++){
            this.configProps[i]["value"] = this[this.configProps[i]["name"]];
        }
    }

    /******************************* */
    /** END Configurable properties FUNCTIONS   */
    /******************************* */

    /******************************* */
    /** Performance data FUNCTIONS   */
    /******************************* */ 
    performanceUpdateCallback = false; // callback that gets called when a performance data is updated
    performancePropUpdateCallback = false;
    getPerformanceData(){
        // gather the data in configProps and return it
        let perfData = {};
        for(let i = 0; i < this.configProps.length; i++){
            perfData[this.configProps[i].name] = this[this.configProps[i].name];
        }
        return perfData;
    }

    loadPerformanceData(perfData){
        this.db.log("instrument loadPerformanceData");
        // extract configProps data, 
        // set internally, 
        // and do any announcing you need to do
        for(let i = 0; i < this.configProps.length; i++){
            // maybe we don't want ALL of these fields sent over udp as updates.
//            this.db.log("Setting " , this.configProps[i].name,  perfData[this.configProps[i].name]);
            this[this.configProps[i].name] = perfData[this.configProps[i].name];
            if(this.performancePropUpdateCallback){
                this.performancePropUpdateCallback(this, this.configProps[i].name, this.configProps[i].type, this[this.configProps[i].name] )
            }            
        }
        this.db.log("calling insrt performanceUpdateCallback?", this.performanceUpdateCallback);

        if(this.performanceUpdateCallback){
            this.db.log("calling insrt performanceUpdateCallback!")
            this.performanceUpdateCallback(this, perfData);
        }
    } 
    /******************************* */
    /** END Performance data FUNCTIONS   */
    /******************************* */ 

    /******************************* */
    /** START/STOP FUNCTIONS   */
    /******************************* */
    start(){
        // start the instrument running
        this.running = true;
        //this.note_loop();
    }

    stop(){
        // stop the instrument from running
        this.running = false;
    }

    /******************************* */ 
    /** END START/STOP FUNCTIONS   */
    /******************************* */  

    /******************************* */
    /** RESET FUNCTIONS   */
    /******************************* */     

    reset_instrument(){
        this.db.log("RESETTING LOCAL---------------------------------------");
        this.input_scale.reset();
        this.velocity_scale.reset();
        this.changerate_scale.reset();
        this._sensor_value = false;
        this.synth.allNotesOff(this._midi_channel);
        this.synth.resetAllControllers(this._midi_channel);
        this.synth.reset();
        this.numberCruncher.reset();
    }

    /******************************* */
    /** END RESET FUNCTIONS   */
    /******************************* */

    /******************************* */
    /** NOTE LENGTH FUNCTIONS   */
    /******************************* */
    setNoteLengths(){
        // set note constant lengths, depending on bpms
        this.notelength_values = [];
        this.notelengths.QN = this.bpmToMS();
        this.notelengths.WN = this.notelengths.QN * 4;
        this.notelengths.HN = this.notelengths.QN * 2;
        this.notelengths.N8 = this.notelengths.QN / 2;
        this.notelengths.N16 = this.notelengths.QN / 4;
        this.notelengths.QN3 = this.notelengths.HN / 3;
        this.notelengths.HN3 = this.notelengths.WN / 3;
        this.notelengths.N83 = this.notelengths.QN / 3;
        this.notelength_values.push(this.notelengths.QN);
        this.notelength_values.push(this.notelengths.WN);
        this.notelength_values.push(this.notelengths.HN);
        this.notelength_values.push(this.notelengths.N8);
        this.notelength_values.push(this.notelengths.N16);
        this.notelength_values.push(this.notelengths.QN3);
        this.notelength_values.push(this.notelengths.HN3);
        this.notelength_values.push(this.notelengths.N83);
        this.notelength_values.sort(function(a, b){return a - b});        
    }   

    bpmToMS(){
        // how many ms is a quarter note?
        return 60000 / this.bpm;
    }

    /******************************* */
    /** END NOTE LENGTH FUNCTIONS   */
    /******************************* */
 
    /*******************************     */
    /** FUNCTIONS FOR INTERNAL NOTE CREATION  */
    /******************************* */
    // not using this function, 
    // which constantly produces notes even if there's no sensor value coming in.
    // calling note_trigger when a new sensor value comes in instead.
    note_loop(){
        // process the input and send a note
        if(this.sensor_value === false){
            setTimeout((function(){
                this.note_loop();
            }).bind(this), 500);            
            return false;
        }
        if(this.running === false){
            setTimeout((function(){
                this.note_loop();
            }).bind(this), 500);              
            return false;
        }
        this.note_trigger();
        
        setTimeout((function(){
            this.note_loop()
        }).bind(this), mididuration);
    }

    note_trigger(){
        if(this.sensor_value === false){         
            return false;
        }
        if(this.running === false){            
            return false;
        }
        this.db.log("sensor value " + this.sensor_value);
        let value        = this.input_scale.scale(this.sensor_value,0,1);
        this.db.log("scaled value is " + value);
        let midipitch    = this.derive_pitch(value);
        let midivelocity = this.derive_velocity();
        let mididuration = this.derive_duration();
        this.midiMakeNote(midipitch, midivelocity, mididuration);
       
    }

    sensor_loop(){
        // process the recieved sensor_value
    }

    derive_changerate(val){
        // derive the changerate

        this.changerate = this.numberCruncher.changerate;
        return this.changerate;

/*
        this.db.log("getting changerate");
        if(this.prevChangeVal === false){
            this.prevChangeVal = val;
            return 0;
        }
        let ochange = val - this.prevChangeVal;
        ochange = Math.abs(ochange);
        this.changerate = this.changerate_scale.scale(ochange, 0, 1.0);
        this.prevChangeVal = val;
        this.db.log("changerate " + this.changerate);
        return this.changerate;       
        */ 
    }

    derive_pitch(){
        let pitch = this.noteFromFloat(this.numberCruncher.scaledValue, this.midimin, this.midimax);
        return pitch;
    }

    derive_velocity(){
        let velocity = Math.floor(127.0 * this.numberCruncher.velocityFloat);
        return velocity;
    }

    derive_duration(){
        let duration = this.update_last_note_time();
        let qduration = this.quantize_duration(duration);
        return qduration;
    }

    update_last_note_time(){
        let now = Date.now();
        let duration = now - this.last_note_time;
        this.last_note_time = now;
        return duration;
    }

    // convert milliseconds into nearest note length.
    quantize_duration(duration){
        // iterate through note lengths and find the closest one
        let t1 = false;
        let t2 = false;
        for (let i in this.notelength_values) {
            let t = this.notelength_values[i];
            if(!t1){
                t1 = t;
                continue;
            }else{
                t1 = t2;
                t2 = t;
            }
            let midpoint = (t1 +t2) / 2;
            if(duration < midpoint  ){
                return t1;
            }
            if(duration > midpoint && duration <= t2){
                return t2;
            }
        }      
        return t2;   
    }

    noteFromFloat(value, min, max){
        this.db.log("note from float " + value);
        this.makeWorkingList(min, max);
        //Serial.print("note from value ");
        //Serial.println(value);
        //Serial.println(workinglistlength);
        let index = Math.floor(this.workinglist.length * value);
        if(index == this.workinglist.length){
            index = this.workinglist.length -1;
        }
        this.db.log(index);
        //Serial.println(index);
        let note  = this.workinglist[index];// % workingList.length]
        this.db.log("returning note " + note);
        //Serial.println(note);
        return note;
    }

    fixedNoteFromFloat(value){
        // in a "fixed" setup, the same float value should result in the same midi note (octave may vary), regardless of scale
        // - map the float across FULL range, from min to max
        // - move resulting value DOWN to the closest note in the scale
        this.makeworkinglist(min, max);
        let range = max - min;
        let initial = min + Math.floor(range * value);
        while(indexOf(initial, workinglist) < 0){
            initial--;
        }
        return initial;
    }

    getRootedBestNoteFromFlat(value, min, max){
        // for a "rooted" scale/chord, expand the min and max so that both min and max are the root
        min = moveMinMax(this.rootMidi, min);
        max = moveMinMax(this.rootMidi, max);

        let note = noteFromFloat(value, min, max);
        if(!note){
            return false;
        }
        return note;
    }

    moveMinMax(root, minmax){
        // for a "rooted" scale/chord, expand the min and max so that both min and max are the root
        //		maxApi.post("getChordNoteFromFloat "+labelid + ", " + value);
        //		maxApi.post(chordNoteSetMidi);
        let orig = minmax;
        let mindiff = (minmax % 12) - (root % 12);
        let minmove = abs(6 - mindiff);

        if(mindiff == 0){
            // do nothing
        }
        else if (mindiff < -6){
            mindiff = -12 - mindiff;
            minmax = minmax - mindiff;
            //big distance, go opposite way around
        }
        else if (mindiff < 0){
            // small different, go toward
            minmax = minmax - mindiff;
        }
        else if(mindiff < 6){
            minmax = minmax - mindiff;
        }
        else if (mindiff < 12){
            mindiff = 12 - mindiff;
            minmax = minmax + mindiff;
        }
        return minmax;
    }

    // Make a new array that's a subset of the notelist, with min and max values
    makeWorkingList(min, max){
        let wi = -1;
        this.workinglist = [];
        for(let i = 0; i < this.notelist.length; i ++){
          if(this.notelist[i] >= min && this.notelist[i] <= max){
            wi++;
            this.workinglist[wi] = this.notelist[i];
          }
        }
    }


    /*******************************     */
    /** END INTERNAL NOTE CREATION  FUNCTIONS   */
    /******************************* */


    ////////////////////////
    // MIDI FUNCTIONS
    midi_setup(){

    }

    midiMakeNote(note, velocity, duration){
        // this.db.log(this.synth.foothing + " MAKING NOTE UDP " + this._midi_channel + " : " + note + " : " + velocity + " : " + duration);
        // note: each instrument needs its own channel, or the instrument will be the same tone.
        this.db.log("mideMakeNote : ", this._midi_vol, this.midi_channel, this._midi_bank, this._midi_program,  note, velocity, duration);
        if(!Number.isFinite(note) || !Number.isFinite(velocity) || !Number.isFinite(duration)){
            this.db.log("bad midi values, returning");
            return;
        }
        if(!this.skip_duplicate_notes || note != this.previous_pitch ){
        }else{
            return;
        }
        this.previous_pitch = note;

        if(velocity == 0){
//            this.db.log("no volume, no note");
            return;
        }
//        this.midiSetInstrument(); // do we really need to set the bank an program for every note? seems like overkill...
        if(this.synth){
            this.synth
            .noteOn(this.midi_channel, note, velocity)
            .wait(duration)
            .noteOff(this.midi_channel, note);
        }
        // if there's a hardware midi device attached to this instrument
        if(this.midi_hardware_engine){
            this.midi_hardware_engine.makenote(this.midi_channel, note, velocity, duration);
        }else{
            this.db.log("NNNNNNNNNNNNNNNo hardware engine");
        }

        if(this.makenote_callback){
            this.makenote_callback(this, note, velocity, duration);
        }
    }

    midiSetInstrument(){
        if(this.synth){
            this.synth.allNotesOff(this._midi_channel);  
            if(this.synth.good_voices){
                let realvoice = this.synth.good_voices[this._midi_program % this.synth.good_voices.length]
                this.synth
                .program(this._midi_channel, realvoice)        

            }else{
                this.synth
                .program(this._midi_channel, this._midi_voice)        
            }
        }
        if(this.midi_hardware_engine){
            this.midi_hardware_engine.send('cc',{
                controller: 0,
                value: this._midi_bank, 
                channel: this._midi_channel
            });  
            this.midi_hardware_engine.send('program',{
                number: this._midi_program, 
                channel: this._midi_channel
            }); 
        }
    }


    midiSetBankProgram(){
        if(this.midi_hardware_engine){
//            this.db.log(this._midi_bank);
            this.midi_hardware_engine.send('cc',{
                controller: 0,
                value: 0, //this._midi_bank, 
                channel: this._midi_channel
            }); 
  //          this.db.log(this._midi_program);
            this.midi_hardware_engine.send('program',{
                number: this._midi_program, 
                channel: this._midi_channel
            }); 
        }    
    }

    midiSetVolume(){
        // don't allow volumes over 254
        if(this._midi_vol > 254){
            this._midi_vol = 254;
        }
        // control change value to set volume.
        if(this.midi_hardware_engine){
            this.midi_hardware_engine.send('cc',{
                controller: 7,
                value: this._midi_vol, // the volume, 
                channel: this._midi_channel
            });         
        }
    }    

    // we might care about this, for mono things
    midiNoteOn(channel, pitch, velocity){
        this.synth
        .noteOn(this._midi_channel, pitch, velocit)
    }

    midiNoteOff(channel, pitch){
        this.synth
        .noteOff(this._midi_channel, pitch);
    }
    // END MIDI FUNCTIONS
    ////////////////////////

 

}

module.exports = Instrument;