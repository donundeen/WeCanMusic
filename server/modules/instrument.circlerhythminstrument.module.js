const DynRescale = require("./dynRescale.module");
const FunctionCurve = require("./functionCurve.module");
const NoteNumberCruncher = require("./numbercruncher.notenumbercruncher.module");

const LocalInstrument = require("./instrument.localinstrument.module");

class CircleRhythmInstrument extends LocalInstrument {
    constructor(options) {
        
        super(options);
        this.type = "local";
        this.circleRhythmHash = {};
        this.circleRhythmHashBuffer = {};
        this.noteScale = new DynRescale({db: this.db});
        this.durationScale = new DynRescale({db: this.db});
        this.velocityScale = new DynRescale({db: this.db});
        this.numPulses = 8 * 8;
        this.pulse = 0;
        this.db?.log?.("stting CircleRhythmInstrument");
        let self = this;
        setInterval(function(){
            self.playNextPulse();
        },this.noteLengths.N16);

    }

    playNextPulse(){
        this.playPulse(this.pulse);
        this.nextPulse();
    }

    nextPulse(){
        this.pulse++;
        if (this.pulse >= this.numPulses){
            this.pulse = 0;
        }
    }

    clearHashPoints(){
        this.circleRhythmHash = {};
    }

    clearHashPointBuffer(){
        this.circleRhythmHashBuffer = {};
    }

    copyHashPointBufferToHash(){
        this.circleRhythmHash = this.circleRhythmHashBuffer;
        // write out the hash to a file
        this.db?.log?.("writing out hash to file", this.circleRhythmHash);
/*
        let fs = require("fs");
        fs.writeFileSync("circleRhythmHash"+this.deviceName+".json", JSON.stringify(this.circleRhythmHash, null, 2));
        fs.writeFileSync("circleRhythmHashBuffer"+this.deviceName+".json", JSON.stringify(this.circleRhythmHashBuffer, null, 2));
        */
        this.circleRhythmHashBuffer = {};
    }

    loadHashPoint(point){
        // given a point, add it to the circleRhythmHash
        // if the point is already in the hash, add it to the array
        // if the point is not in the hash, create a new array with the point
        this.db?.log?.("loading hash point", point);
        if (!this.circleRhythmHash[point.pulse]) {
            this.circleRhythmHash[point.pulse] = [];
        }
        this.circleRhythmHash[point.pulse].push(point);
    }

    loadHashPointBuffer(point){
        // given a point, add it to the circleRhythmHashBuffer
        // if the point is already in the hash, add it to the array
        // if the point is not in the hash, create a new array with the point
        this.db?.log?.("loading hash point", point);
        this.db?.log?.("loading hash point", point);
        if (!this.circleRhythmHashBuffer[point.pulse]) {
            this.circleRhythmHashBuffer[point.pulse] = [];
        }
        this.circleRhythmHashBuffer[point.pulse].push(point);
    }

    getHashPoints(pulse){
        // given a pulse, return the note
        return this.circleRhythmHash[pulse];
    }
    
    deriveNoteFromPoint(point){
        let length = point.length;
        let line_angle = point.line_angle;
        let distance_float = point.distance_from_center_scaled;
        let note = this.noteFromFloat(distance_float, this.midiMin, this.midiMax);
        let velocity = this.velocityScale.scale(line_angle, 0, 127);
        let duration_float = this.durationScale.scale(length, 0,1);
        let duration = this.deriveNoteLengthFromFloat(duration_float);
        return {note: note, velocity: velocity, duration: duration};
    }

    playPulse(pulse){
        this.db?.log?.("playing pulse", pulse);
        let points = this.getHashPoints(pulse);
        this.db?.log?.("points", points);
        if(!points){
            return;
        }
        for (let point of points){
            let note = this.deriveNoteFromPoint(point);
            this.midiMakeNote(note.note, note.velocity, note.duration);
        }
    }

}

module.exports = CircleRhythmInstrument;