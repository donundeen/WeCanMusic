const teoria = require("teoria");
const teoriaChordProgression = require('teoria-chord-progression');
const MidiNoteList = require("./theory.midinotelist.module.js");

 /*

    How to use this:
    interface to teoria : https://www.npmjs.com/package/teoria

    // set the harmonid structure:
    set  [command]
    - [command] - one of a variety of setter commands:

    setter commands:
    -  /^[a-gA-G][b#]?[0-9]?$/ : eg Ab, G, C#3 - Sets the root note. will adjust the scale and chord root if they are currently set

    - [Any of the list of KNOWN_SCALES]: sets the Scale used

    - [+-][INTERVAL_VALUES] : transpose by some interval. 

    - [0-7].[34] : set the chord based on the diatonic position in the set scale. 3 or 4 for 3 or 4-note chords

    // get notes
    get  [command]

    getter commands
    - s0.[0-9]+(Min-Max) : (float val btw 0.0 and 1.0) get the scale note at the position in the scale represented by the float, between the Min and Max MIDI values
    - c0.[0-9]+(Min-Max) : (float val btw 0.0 and 1.0) get the chord note at the position in the scale represented by the float, between the Min and Max MIDI values
    - s[0-9]+(min-Max) : get the note at that index in the list of scale notes, btw Min and Max. Loops around to bottom.
    - c[0-9]+(min-Max) : get the note at that index in the list of chord notes, btw Min and Max. Loops around to bottom.

    KNOWN_SCALES:
    major
    minor
    ionian (Alias for major)
    dorian
    phrygian
    lydian
    mixolydian
    aeolian (Alias for minor)
    locrian
    majorpentatonic
    minorpentatonic
    chromatic
    harmonicchromatic (Alias for chromatic)
    blues
    doubleharmonic
    flamenco
    harmonicminor
    melodicminor
    wholetone

    INTERVAL_VALUES
    examples:
    m3 (minor third)
    P5 (perfect fifth)
    M3 (major third)
    [will need to experiment to find more]

    */

class TheoryEngine {
    constructor(options) {
        this.db = options.db;

        this.notes = [
            "C",	//0  
            "Db",	//1	
            "D",	//2
            "Eb",	//3
            "E",	//4
            "F",	//5
            "Gb",	//6
            "G",	//7
            "Ab",	//8
            "A",	//9
            "Bb",	//10
            "B",	//11
        ];

        this.currentNoteListMidi = new MidiNoteList([43, 47, 49], false, {db: this.db});

        this.curNote = false;
        this.curScale = false;
        this.curScaleName = false;

        this.curRootMidi = 0;

        this.curChord = false;
        this.curChordName = false;

        this.scaleNoteSetMidi = new MidiNoteList([], false, {db: this.db});
        this.weightedScaleNoteSetMidi = new MidiNoteList([], false, {db: this.db, allowDuplicates: true});
        this.chordNoteSetMidi = new MidiNoteList([], false, {db: this.db});

        // some system might not want to think about the difference between "chords" and "scales" as teoria defines them. He're we'll just store whichever was the MOST RECENT note set created, either scale or chord.
        this.curBestSetChordOrScale = false;
        this.curBestSetName = false;
        this.bestNoteSetMidi = new MidiNoteList([], false, {db: this.db});

        this.outputCallback = false;
        this.midiListCallback = false;

        this.debugmode = false;
    }

    setMidiListCallback(callback) {
        this.midiListCallback = callback;
    }

    sendBestMidiList(list) {
        this.midiListCallback(list);
    }

    bestSetIsChord() {
        this.bestNoteSetMidi = this.chordNoteSetMidi;
        this.curBestSetName = this.curChordName;
        this.getBestNoteMidiList();
    }

    bestSetIsScale() {
        this.bestNoteSetMidi = this.scaleNoteSetMidi;
        this.curBestSetName = this.curScaleName;
        this.getBestNoteMidiList();
    }

    debugmsg(msg) {
        if (this.debugmode) {
            this.db.log(msg);
        }
    }

    getKnownScales() {
        return teoria.Scale.KNOWN_SCALES;
    }

    // setter commands
    runSetter(command, labelid) {
        // if there's spaces, split and run each one
        command = command.trim();
        this.db.log("runSetter " , command);
        let self = this;
        if(command.match(/ /)){
            let split = command.split(" ");
            this.db.log("split " , this.db);
            split.forEach(function(com){
                self.db.log("com " , com);
                self.runSetter(com.trim());
            });
            return;
        }
        if(command.match(/^[a-gA-G][b#♭]?[0-9]?$/)){
            this.setNote(command);
        }else if(teoria.Scale.KNOWN_SCALES.indexOf(command.toLowerCase()) >= 0){
            this.setScale(command.toLowerCase());
            this.bestSetIsScale();
        }else if (command.match(/^[+-]/)){
            var interval  = command.replace(/^[+-]/,"");
            if(command[0] == "-" && command[1] != "-"){
                interval = [interval.slice(0, 1), "-", interval.slice(1)].join('');
            }
            this.transpose(command.replace(/^[+-]/,""));
        }else if(command.match(/[0-7]\.[34]/)){
            var position = command[0];
            var size = command[2];
            this.setChordDiatonic(parseInt(position), parseInt(size));
            this.bestSetIsChord();
        }else{
            this.db.log("trying ::: " , command);

            let result = this.tryChord(command);
            if(!result){
                this.db.log("no command match for :: ",command);
            }
        }
    }

    tryChord(command) {
        this.db.log("trying " , command);
        try{
            this.setChord(command);
            this.bestSetIsChord();
        }catch(e){
            this.db.log("chord set error " , e);
            return false;
        }
        return true;
    }

    runGetter(command, labelid) {
        // - s0.[0-9]+(Min-Max) : (float val btw 0.0 and 1.0) get the scale note at the position in the scale represented by the float, between the Min and Max MIDI values
        // - c0.[0-9]+(Min-Max) : (float val btw 0.0 and 1.0) get the chord note at the position in the scale represented by the float, between the Min and Max MIDI values
        // - w0.[0-9]+(Min-Max) : (float val btw 0.0 and 1.0) get the note at the position in the weighted scale  represented by the float, between the Min and Max MIDI values
        // - s[0-9]+(min-Max) : get the note at that index in the list of scale notes, btw Min and Max. Loops around to bottom.
        // - c[0-9]+(min-Max) : get the note at that index in the list of chord notes, btw Min and Max. Loops around to bottom.
        // - w[0-9]+(min-Max) : get the note at that index in the list of weighted scale notes, btw Min and Max. Loops around to bottom.
        
        command = command.toLowerCase();

        var matches = command.match(/([bscwrf])([0-9]*\.?[0-9]+)\(([0-9]+)-([0-9]+)\)/);
    //	this.debugmsg(matches); //
        if(!matches){
    //		this.debugmsg("no command match for "+command);
            return;
        }
        var sc = matches[1];
        var intfl = "int";
        if(matches[2].match(/\./)){
            var intfl = "float";
        }
    //	this.debugmsg(intfl);
        var value = parseFloat(matches[2]);
    //	this.debugmsg(value);
        
        var min = parseInt(matches[3]);
        var max = parseInt(matches[4]);
    //	this.debugmsg("min: " + min);
    //	this.debugmsg("max: " + max);
        
        if(sc == "s"){
            if(intfl == "int"){
                this.getScaleNoteFromInt(labelid, value, min, max);
            }
            if(intfl == "float"){
                this.getScaleNoteFromFloat(labelid, value, min, max);
            }		
        }
        if(sc == "c"){
            if(intfl == "int"){
                this.getChordNoteFromInt(labelid, value, min, max);
            }
            if(intfl == "float"){
                this.getChordNoteFromFloat(labelid, value, min, max);
            }		
        }
        if(sc == "b"){
            if(intfl == "int"){
                this.getBestNoteFromInt(labelid, value, min, max);
            }
            if(intfl == "float"){
                this.getBestNoteFromFloat(labelid, value, min, max);
            }		
        }	
        if(sc == "w"){
            if(intfl == "int"){
                this.getWeightedScaleNoteFromInt(labelid, value, min, max);
            }
            if(intfl == "float"){
                this.getWeightedScaleNoteFromFloat(labelid, value, min, max);
            }		
        }
        if(sc == "r"){
            if(intfl == "int"){
                this.getRootedBestNoteFromInt(labelid, value, min, max);
            }
            if(intfl == "float"){
                this.getRootedBestNoteFromFloat(labelid, value, min, max);
            }		
        }

        if(sc == "f"){
            if(intfl == "int"){
                this.getFixedBestNoteFromInt(labelid, value, min, max);
            }
            if(intfl == "float"){
                this.getFixedBestNoteFromFloat(labelid, value, min, max);
            }		
        }	

    }

    transpose(theinterval) {
        if(!theinterval){
            this.db.log("no interval");
            return;
        }
    //	this.debugmsg("now note");
        if(this.curNote){
            try{
                this.curNote = this.curNote.interval(theinterval);
            }catch(e){
                this.db.log("error transposing "+ theinterval);
                this.db.log(JSON.stringify(e, null, "  "));
            }
        }
    //	this.debugmsg("now scale");
        if(this.curScale){
            try{
                this.curScale = this.curNote.scale(this.curScaleName);
                this.createScaleSet();
            }catch(e){
                this.db.log("error transposing scale "+ theinterval);
                this.db.log(JSON.stringify(e, null, "  "));
            }
        }
    //	this.debugmsg("now chord");
        if(this.curChord){
            try{
                this.curChord = this.curChord.interval(theinterval);
                this.curChordName = this.curChord.name.toLowerCase().replace(this.curChord.root.toString(true),"");
                this.createChordSet();
            }catch(e){
                this.db.log("error transposing chord "+ theinterval);
                this.db.log(JSON.stringify(e, null, "  "));
            }
        }

    }

    setNote(note) {
        this.curNote = teoria.note(note);
        if(this.curScale){
            try{
                this.curScale = this.curNote.scale(this.curScaleName);
                this.createScaleSet();
            }catch(e){
                // maybe the curScaleName was bad, in which case just skip and move on

            }
        }
        if(this.curChord){
            try{
                this.curChord = this.curNote.chord(this.curChordName);
                this.createChordSet();
            }catch(e){
                // maybe the curChordName was bad, in which case just skip and move on
            }
        }
    }

    setChord(chord) {
    //	this.debugmsg("+++++ setChord " + chord);
        if(!this.curNote){
            throw new Error("need a note set first");
        }
        this.curChordName = chord;
        this.curChord = this.curNote.chord(chord);
        this.createChordSet();
    }

    setChordDiatonic(position, size) {
        try{
            this.debugmsg("+++++ set diatonic " +position +" size " +size);
            if(this.curScale){
                this.curChord = teoriaChordProgression(this.curScale, [position], size).getChord(0);
                this.curChordName = this.curChord.name.toLowerCase().replace(this.curChord.root.toString(true),"");
                this.createChordSet();

            }
        }catch(e){
            this.debugmsg("some error processing setChordDiatonic " + position + ", "+ size);
            this.debugmsg(JSON.stringify(e, null, "  "));
        }
    }

    setScale(scale) {
    //	this.debugmsg("+++++ setScale " + scale);
        if(!this.curNote){
            throw new Error("need a note set first");
        }
        this.curScaleName = scale;
        this.curScale = this.curNote.scale(scale);
        this.createScaleSet()
    }

    getScaleNotes() {
        if(this.curScale){
            /*
            this.debugmsg("getScaleNotes");
            this.debugmsg(curScaleName);
            this.debugmsg(curScale.simple());
            */
            return this.curScale.simple();
        }
    }

    getChordNotes() {
        if(this.curChord){
            return this.curChord.simple();
        }
    }

    createScaleSet() {
        this.debugmsg("creating scale set ");
        this.debugmsg("creating scale set ");
        var notes = this.curScale.notes();
        this.curRootMidi = this.curScale.tonic.midi() % 12;

        this.scaleNoteSetMidi = new MidiNoteList(false, false, {db: this.db});
        this.scaleNoteSetMidi.addTeoriaNoteFullRangeList(notes);
        this.scaleNoteSetMidi.setRootNote(this.curRootMidi);
        
        this.createWeightedScaleSet();	
    }


    createChordSet() {
    //	this.debugmsg("creating chord set ");
        this.chordNoteSetMidi = new MidiNoteList(false, false, {db: this.db});
        var notes = this.curChord.notes();
        this.curRootMidi = this.curChord.root.midi() % 12;
        this.chordNoteSetMidi.addTeoriaNoteFullRangeList(notes);
        this.chordNoteSetMidi.setRootNote(this.curRootMidi);

        this.debugmsg(this.chordNoteSetMidi);
        
        this.createWeightedScaleSet();
    }


    // make a scaleset that has duplicates of chord notes, so chord notes are more likely
    createWeightedScaleSet() {
        if(this.chordNoteSetMidi &&  this.scaleNoteSetMidi){
            this.weightedScaleNoteSetMidi = this.scaleNoteSetMidi.copy();
            this.weightedScaleNoteSetMidi.allowDuplicates = true;
            this.weightedScaleNoteSetMidi.concat(this.chordNoteSetMidi);
            this.weightedScaleNoteSetMidi.sortNoteList();
            this.weightedScaleNoteSetMidi.setRootNote(this.curRootMidi);
        }
    }

    getChordNoteMidiList(labelid) {
        if(!labelid){
            labelid = "chordNoteMidiList";
        }
        if(this.chordNoteSetMidi){
            var output = labelid+" " + this.chordNoteSetMidi.getNoteList().join(" ");
            return this.chordNoteSetMidi.getNoteList();
        }else{
            this.debugmsg("no chord set");
        }	
    }

    getBestNoteMidiList(labelid) {
        if(!labelid){
            labelid = "bestNoteMidiList";
        }
        if(this.bestNoteSetMidi){
            var output = labelid+" " + this.bestNoteSetMidi.getNoteList().join(" ");
    //		this.debugmsg(output);
            this.sendBestMidiList(this.bestNoteSetMidi.getNoteList());
            this.currentNoteListMidi = this.bestNoteSetMidi.copy();
        }else{
            this.debugmsg("no best set");
        }	
    }

    noteList() {
        return this.currentNoteListMidi.getNoteList();
    }

    getScaleNoteFromFloat(labelid, value, min, max) {

        var note = this.scaleNoteSetMidi.getNoteFromFloat(value, min, max);
        if(!note){
            this.debugmsg("no note");
            this.debugmsg("getScaleNoteFromFloat");
    //		this.debugmsg(scaleNoteSetMidi.join(" "));	
            this.debugmsg("sending " + labelid + " " + note);		 
            return false;
        }
    //	this.debugmsg("getScaleNoteFromFloat");
    //	this.debugmsg(scaleNoteSetMidi.join(" "));	
    //	this.debugmsg("sending " + labelid + " " + note);
        return note;
    }

    getWeightedScaleNoteFromFloat(labelid, value, min, max) {

        var note = this.weightedScaleNoteSetMidi.getNoteFromFloat(value, min, max);
        if(!note){
            return false;
        }
    //	this.debugmsg("sending " + labelid + " " + note);
        return note;
    }

    getScaleNoteFromInt(labelid, value, min, max) {
        var note = this.scaleNoteSetMidi.getNoteFromInt(value, min, max);
        if(!note){
            return false;
        }
        return note;
    }

    getWeightedScaleNoteFromInt(labelid, value, min, max) {
        var note = this.weightedScaleNoteSetMidi.getNoteFromInt(value, min, max);
        if(!note){
            return false;
        }
        return note;
    }

    getChordNoteFromFloat(labelid, value, min, max) {
    //		this.debugmsg("getChordNoteFromFloat "+labelid + ", " + value);
    //		this.debugmsg(chordNoteSetMidi);
        var note = this.chordNoteSetMidi.getNoteFromFloat(value, min, max);
    //	this.debugmsg("note " + note);
        if(!note){
            return false;
        }
        return note;
        
    }

    getChordNoteFromInt(labelid, value, min, max) {
        var note = this.chordNoteSetMidi.getNoteFromInt(value, min, max);
        if(!note){
            return false;
        }
        return note;
    }


    getBestNoteFromFloat(value, min, max) {
        //		this.debugmsg("getChordNoteFromFloat "+labelid + ", " + value);
        //		this.debugmsg(chordNoteSetMidi);
        var note = this.bestNoteSetMidi.getNoteFromFloat(value, min, max);
        //	this.debugmsg("note " + note);
        if(!note){
            return false;
        }
        return note;
    }
        
    getBestNoteFromInt(value, min, max) {
        var note = this.bestNoteSetMidi.getNoteFromInt(value, min, max);
        if(!note){
            return false;
        }
        return note;
    }

    getRootedBestNoteFromFloat(value, min, max) {
        var note = this.bestNoteSetMidi.getRootedNoteFromFloat(value, min, max);
        //	this.debugmsg("note " + note);
        if(!note){
            return false;
        }
        return note;
    }

        
    getRootedBestNoteFromInt(value, min, max) {
        var note = this.bestNoteSetMidi.getRootedNoteFromInt(value, min, max);
        if(!note){
            return false;
        }
        return note;
    }
        
        
    getFixedBestNoteFromFloat(value, min, max) {
    // in a "fixed" setup, the same float value should result in the same midi note (octave may vary), regardless of scale

        var note = this.bestNoteSetMidi.getFixedNoteFromFloat(value, min, max);
        //	this.debugmsg("note " + note);
        if(!note){
            return false;
        }
        return note;
    }

        
    getRootedBestNoteFromInt(value, min, max) {
        
        var note = this.bestNoteSetMidi.getRootedNoteFromInt(value, min, max);
        if(!note){
            return false;
        }   
        return note;
    }


    // based on input noteIn, find the closest note in the noteList
    getClosestCorrectNote(noteIn){
        return this.currentNoteListMidi.getClosestCorrectNote(noteIn);
    }   

}


module.exports = TheoryEngine;