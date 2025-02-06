dynRescale = require("./dynRescale.module");
functionCurve = require("./functionCurve.module");

class NoteNumberCruncher {
    constructor(options){
        
        if(options.db){
            this.db = db;
        }
        this.firstRead = true;
        this.prevValue = 0;
        this.rawValue = 0;
        this.scaledValue = 0;
        this.pitchFloat = false;
        this.velocityFloat = false;
        this.durationFloat = false;
        this.timeToNextNoteFloat = false;
        this.changeRate = 0;
        this.prevChangeTime = 0;
        this.input_scale = new dynRescale({db: db});
        this.changerate_scale = new dynRescale({db: db});
        this.velocity_scale = new dynRescale({db: db});

        this.pitch_curve = new functionCurve([0., 0.0, 0., 1.0, 1.0, 0.0], {db:this.db});
        this.velocity_curve = new functionCurve([0., 0.0, 0., 1.0, 1.0, 0.0], {db:this.db});
        this.duration_curve = new functionCurve([0., 0.0, 0., 1.0, 1.0, 0.0], {db:this.db});
        this.timeToNextNote_curve = new functionCurve([0., 0.0, 0., 1.0, 1.0, 0.0], {db:this.db}   );        

    }

    reset(){
        this.firstRead = true;
        this.prevvalue = 0;
        this.rawValue = 0;
        this.scaledValue = 0;
        this.pitchFloat = false;
        this.velocityFloat = false;
        this.durationFloat = false;
        this.timeToNextNoteFloat = false;
        this.changeRate = 0;
        this.prevChangeTime = 0;
        this.input_scale.reset();
        this.changerate_scale.reset();
        this.velocity_scale.reset();      
        
    }

    setValue(value){
        this.rawValue = value;
        this.scaledValue = this.input_scale.scale(value, 0, 1);
    }

    crunch(){
        this.processChangeRate();
        this.derivePitchFloat();
        this.deriveVelocityFloat();
        this.deriveDurationFloat();
        this.deriveTimeToNextNoteFloat();
        this.firstRead = false;
    }

    processChangeRate(){

        if(this.firstRead){ //
            this.prevValue = this.rawValue;    //
            this.prevChangeTime = Date.now(); //
            this.changeRate = 0;
            return;
        }

        let millis = Date.now();
        let millisDiff = millis - this.prevChangeTime;

        let ochange = Math.abs(this.rawValue - this.prevvalue);
        let change = ochange / millisDiff;
        this.changeRate = this.changerate_scale.scale(change, 0, 1);
        this.prevChangeTime = millis;
        this.prevvalue = this.rawValue;

    }

    derivePitchFloat(){
        this.pitchFloat = this.pitch_curve.mapvalue(this.scaledValue);
    }

    deriveVelocityFloat(){
        this.velocityFloat = this.velocity_curve.mapvalue(this.changeRate);
    }

    deriveDurationFloat(){
        this.durationFloat = 1;  //a constant at the moment.
    }

    deriveTimeToNextNoteFloat(){
        this.timeToNextNoteFloat = this.durationFloat;
    }


}

module.exports = NoteNumberCruncher;