const DynRescale = require("./dynRescale.module");
const FunctionCurve = require("./functionCurve.module");
const SensorStream = require("./stream.sensorstream.module");

class Instrument {

    constructor(options, config) {
        this.db = false;
        this.config = config;

        if(options.db){
            this.db = options.db;
        }
        this._type = "local";
        this.type = "local";

    // input values
        this._sensorValue = false;
        this.changeRate = false;
        this.prevChangeVal = false;

        // new values from sensor processing in Streamlined arduino code
        this.smoothValue = false;
        this.rmsValue = false;
        this.peakValue = false;
        this.velValue = false;

        this._deviceName = "RENAME_ME";

        // midi vars    
        this._midiVoice = "0:1"; // in format bank:program, when this is set, parse and set bank and program
        this._midiBank = 0; // bank and program together select the tone.
        this._midiProgram = 1;
        this._midiChannel = 1;
        this._midiMin = 32;
        this._midiMax = 100;
        this._midiVol = 200; //(0-254) // sometimes we use shorter names because of arduino restrictions in OSC routes
        this._midiNlen = 6;

        this._reset = false; // if the "reset" value is set, call the reset function 

    // dictionary of note names and their lengths
        this.noteLengths = {};
        this.noteLengthValues = [];

        this.currentNotes = []; // need to keep track of all playing notes to to a panic stop

        // set hardware synth out object (easymidi)
        this.midiHardwareEngine = false;

        this.lastNoteTime = Date.now();

        // timing for different common note values.
        this._bpm = 120;

        this.running = false;

        // instr, pitch, velocity, duration
        this.makeNoteCallback = false;

        // track the previous note, so we don't play the same note twice in a row
        this._previousPitch = 0;
        this.skipDuplicateNotes = true;

        this.theoryEngine = false;
    
        // vars that might be externally set.
        // we can send this info to a server so it can set up a UI to collect those values
        // maybe array of objects?
        this.configProps = [
            {name:"deviceName", type:"s"},
            {name:"type", type:"s"},
            {name:"sensorValue", type:"f"},
            {name:"smoothValue", type:"f"},
            {name:"rmsValue", type:"f"},
            {name:"peakValue", type:"f"},
            {name:"velValue", type:"f"},
            {name:"wecanmusicServerIp", type:"s"},
            {name:"wecanmusicPort", type:"i"},
            {name:"midiVoice", type:"s"},
            {name:"midiBank", type:"i"},
            {name:"midiProgram", type:"i"},
//            {name:"midiChannel", type:"i"}, // i think we always want to dynamically set this.
            {name:"midiNlen", type:"i"},
            {name:"midiVol", type:"i"},
            {name:"midiMin", type:"i"},
            {name:"midiMax", type:"i"},
            /* // TBD: saving of the data in these curve objects.
            {name:"velocitycurve", type:"fa"},
            {name:"changeratecurve", type:"fa"},
            */
            {name:"bpm", type:"i"},        
        ];


        this.db?.log?.("CONSTRUCTING");
        this.lastNoteTime = Date.now();
        this.setNoteLengths();
        this.getConfigProps();

        this.sensorStream = new SensorStream({db: this.db}, this.config);

    }

    /******************************* */
    /** get/set properties   */
    /******************************* */

    set reset(resetval){
        // don't need to set the reset value, just call the reset function
        this.resetInstrument();
    }



    set bpm(bpm){
        this._bpm = bpm;
        this.setNoteLengths();
    }

    get bpm(){
        return this._bpm;
    }

    get midiVoice(){
        return this._midiVoice;
    }

    set midiVoice(voice){
        this.db?.log?.("setting midiVoice ", voice);
        let split = voice.split(":");
        let bank = 0;
        let program = 1;
        if(split.length == 1){
            program = split[0];
        }else{
            bank = split[0];
            program = split[1];
        }
        this.midiBank = bank;
        this.midiProgram = program;
    }

    set midiProgram(program){
        this._midiProgram = parseInt(program);
        this._midiVoice = this._midiBank +":"+ this._midiProgram;
        this.midiSetBankProgram();
    }
    get midiProgram(){
        return this._midiProgram;
    }

    set midiBank(bank){
        this._midiBank = parseInt(bank);
        this._midiVoice = this._midiBank +":"+ this._midiProgram;        
        this.midiSetBankProgram(); // program and bank might come in reverse order, better to set it both times; at least the second time you set it the bank and program will be legit.
    }

    get midiBank(){
        return this._midiBank;
    }

    get midiNlen(){
        return this._midiNlen;
    }

    set midiNlen(nlen){
        this._midiNlen = parseInt(nlen);
    }

    // what to do when a new sensor value is received. Need to trigger a note here
    set sensorValue(value){
        // might be a number or an OSC-formatted value message
        this.db?.log?.("instrument.sensorValue", value);
        if(typeof value == "number"){
            value = value;
        }else if(Array.isArray(value) && value.length > 0 && Object.hasOwn(value[0], "value")){
            value = value[0].value;
        }else{
            this.db?.log?.("!!!!!!!!!!!!!! ");
            this.db?.log?.("don't know what value is " + Array.isArray(value) + " : " + value.length);
        }
//        this.db?.log?.(value);
        this.db?.log?.("********************");

        this.db?.log?.("instrument sensorStream.push", value);

        this.sensorStream.push(value);

        this._sensorValue = value;
        this.noteTrigger();
    }

    get sensorValue(){
        return this._sensorValue;
    }

    set midiChannel(channel){
        this.db?.log?.("changing midi channel to " + channel);
        this._midiChannel = channel;
    }
    get midiChannel(){
        return this._midiChannel;
    }

    get midiVol(){
        return this._midiVol;
    }

    set midiVol(vol){
        this._midiVol = vol;
        this.midiSetVolume();
    }

   ////////////////////////
    // MUSIC FUNCTIONS



    set midiMax(max){
        this._midiMax = max;
    }

    get midiMax(){
        return this._midiMax;
    }

    set midiMin(min){
        this._midiMin = min;
    }

    get midiMin(){
        return this._midiMin;
    }

    /******************************* */
    /** END get/set properties   */
    /******************************* */

    /******************************* */
    /** Configurable properties FUNCTIONS   */
    /******************************* */
    getConfigProps(){
        this.populateConfigProps();
        return this.configProps;
    }

    populateConfigProps(){
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
        this.db?.log?.("instrument loadPerformanceData");
        // extract configProps data, 
        // set internally, 
        // and do any announcing you need to do
        for(let i = 0; i < this.configProps.length; i++){
            // maybe we don't want ALL of these fields sent over udp as updates.
//            this.db?.log?.("Setting " , this.configProps[i].name,  perfData[this.configProps[i].name]);
            this[this.configProps[i].name] = perfData[this.configProps[i].name];
            if(this.performancePropUpdateCallback){
                this.performancePropUpdateCallback(this, this.configProps[i].name, this.configProps[i].type, this[this.configProps[i].name] )
            }            
        }
        this.db?.log?.("calling insrt performanceUpdateCallback?", this.performanceUpdateCallback);

        if(this.performanceUpdateCallback){
            this.db?.log?.("calling insrt performanceUpdateCallback!")
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

    resetInstrument(){
        this.db?.log?.("RESETTING LOCAL---------------------------------------");
        this._sensorValue = false;
        this.sensorStream.reset();
    }

    /******************************* */
    /** END RESET FUNCTIONS   */
    /******************************* */

    /******************************* */
    /** NOTE LENGTH FUNCTIONS   */
    /******************************* */
    setNoteLengths(){
        // set note constant lengths, depending on bpms
        this.noteLengthValues = [];
        this.noteLengths.QN = this.bpmToMS();
        this.noteLengths.WN = this.noteLengths.QN * 4;
        this.noteLengths.DWN = this.noteLengths.WN * 2;
        this.noteLengths.HN = this.noteLengths.QN * 2;
        this.noteLengths.N8 = this.noteLengths.QN / 2;
        this.noteLengths.N16 = this.noteLengths.QN / 4;
        this.noteLengths.QN3 = this.noteLengths.HN / 3;
        this.noteLengths.HN3 = this.noteLengths.WN / 3;
        this.noteLengths.N83 = this.noteLengths.QN / 3;
        this.noteLengthValues.push(this.noteLengths.WN);
        this.noteLengthValues.push(this.noteLengths.DWN);
        this.noteLengthValues.push(this.noteLengths.HN);
        this.noteLengthValues.push(this.noteLengths.QN);
        this.noteLengthValues.push(this.noteLengths.N8);
        this.noteLengthValues.push(this.noteLengths.N16);
        this.noteLengthValues.push(this.noteLengths.QN3);
        this.noteLengthValues.push(this.noteLengths.HN3);
        this.noteLengthValues.push(this.noteLengths.N83);
        this.noteLengthValues.sort(function(a, b){return b - a});        
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
    noteLoop(){
        // process the input and send a note
        if(this.sensorValue === false){
            setTimeout((function(){
                this.noteLoop();
            }).bind(this), 500);            
            return false;
        }
        if(this.running === false){
            setTimeout((function(){
                this.noteLoop();
            }).bind(this), 500);              
            return false;
        }
        this.noteTrigger();
        
        setTimeout((function(){
            this.noteLoop()
        }).bind(this), mididuration);
    }

    noteTrigger(){
        
        if(this.sensorValue === false){    
    //        this.db?.log?.("stream:noteTrigger sensorValue false");
            return false;
        }
        if(this.running === false){    
    //        this.db?.log?.("stream:noteTrigger running false");
            return false;
        }
            
        let midiPitch    = this.derivePitch();
        let midiVelocity = this.deriveVelocity();
        let midiDuration = this.deriveDuration();
   //     this.db?.log?.("stream: noteTrigger midiPitch, midiVelocity, midiDuration", midiPitch, midiVelocity, midiDuration);
        if(midiPitch === false || midiVelocity === false || midiDuration === false){
    //        this.db?.log?.("stream: noteTrigger false values", midiPitch, midiVelocity, midiDuration);
            return false;
        }
        this.midiMakeNote(midiPitch, midiVelocity, midiDuration);
       
    }

    sensorLoop(){
        // process the recieved sensor_value
    }

    derivePitch(){
        let pitch = this.noteFromFloat(this.sensorStream.scaledValue, this.midiMin, this.midiMax);
        return pitch;
    }

    deriveVelocity(){
        let velocity = Math.floor(127.0 * this.sensorStream.rateOfChange);
        return velocity;
    }

    deriveDuration(){
        return this.noteLengthValues[this.midiNlen];

        // the apprach below doesn't work so great.
        let duration = this.updateLastNoteTime();
        let qduration = this.quantizeDuration(duration);
        return qduration;
    }


    deriveNoteLengthFromFloat(float){
        let index = Math.floor(this.noteLengthValues.length * float);
        return this.noteLengthValues[index];
    }


    updateLastNoteTime(){
        let now = Date.now();
        let duration = now - this.lastNoteTime;
        this.lastNoteTime = now;
        return duration;
    }

    // convert milliseconds into nearest note length.
    quantizeDuration(duration){
        // iterate through note lengths and find the closest one
        let t1 = false;
        let t2 = false;
        for (let i in this.noteLengthValues) {
            let t = this.noteLengthValues[i];
            if(!t1){
                t1 = t;
                if(duration < t){
                    return t;
                }
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
        if(this.theoryEngine){
            return this.theoryEngine.getBestNoteFromFloat(value, min, max);
        }

    }

    fixedNoteFromFloat(value){
        if(this.theoryEngine){
            return this.theoryEngine.getFixedBestNoteFromFloat(value, min, max);
        }
        // in a "fixed" setup, the same float value should result in the same midi note (octave may vary), regardless of scale
        // - map the float across FULL range, from min to max
        // - move resulting value DOWN to the closest note in the scale
    }

    getRootedBestNoteFromFloat(value, min, max){
        if(this.theoryEngine){
            return this.theoryEngine.getRootedBestNoteFromFloat(value, min, max);
        }
    }

    /*******************************     */
    /** END INTERNAL NOTE CREATION  FUNCTIONS   */
    /******************************* */


    ////////////////////////
    // MIDI FUNCTIONS
    midiSetup(){

    }

    midiMakeNote(note, velocity, duration){
        // note: each instrument needs its own channel, or the instrument will be the same tone.
        this.db?.log?.("midiMakeNote : ",  note, velocity, duration, this._midiVol, this._midiChannel, this._midiBank, this._midiProgram);
        if(!Number.isFinite(note) || !Number.isFinite(velocity) || !Number.isFinite(duration)){
            this.db?.log?.("bad midi values, returning");
            return;
        }
        if(!this.skipDuplicateNotes || note != this._previousPitch ){
        }else{
    //        this.db?.log?.("skipping duplicate note " + note);
            return;
        }
        this._previousPitch = note;

        if(velocity == 0){
    //        this.db?.log?.("no volume, no note");
            return;
        }
//        this.midiSetInstrument(); // do we really need to set the bank an program for every note? seems like overkill...
        // if there's a hardware midi device attached to this instrument
        if(this.midiHardwareEngine){
    //        this.db?.log?.("midiHardwareEngine makeNote");
            this.midiHardwareEngine.makeNote(this._midiChannel, note, velocity, duration);
        }else{
    //        this.db?.log?.("NNNNNNNNNNNNNNNo hardware engine");
        }

        if(this.makeNoteCallback){
            this.makeNoteCallback(this, note, velocity, duration);
        }
    }

    midiSetInstrument(){
        if(this.midiHardwareEngine){
            this.midiHardwareEngine.send('cc',{
                controller: 0,
                value: this._midiBank, 
                channel: this._midiChannel
            });  
            this.midiHardwareEngine.send('program',{
                number: this._midiProgram, 
                channel: this._midiChannel
            }); 
        }
    }


    midiSetBankProgram(){
        if(this.midiHardwareEngine){
    //        this.db?.log?.(this._midiBank);
            this.midiHardwareEngine.send('cc',{
                controller: 0,
                value: this._midiBank, 
                channel: this._midiChannel
            }); 
    //        this.db?.log?.(this._midiProgram);
            this.midiHardwareEngine.send('program',{
                number: this._midiProgram, 
                channel: this._midiChannel
            }); 
        }    
    }

    midiSetVolume(){
        // don't allow volumes over 254
        if(this._midiVol > 254){
            this._midiVol = 254;
        }
        // control change value to set volume.
        if(this.midiHardwareEngine){
    //        this.db?.log?.("setting volume to ", this._midiVol, "channel " , this._midiChannel);
            this.midiHardwareEngine.send('cc',{
                controller: 7,
                value: this._midiVol, // the volume, 
                channel: this._midiChannel
            });         
        }else{
    //        this.db?.log?.("no hardware engine, setting volume to ", this._midiVol, "channel " , this._midiChannel);
        }
    }    


    // END MIDI FUNCTIONS
    ////////////////////////

 

}

module.exports = Instrument;