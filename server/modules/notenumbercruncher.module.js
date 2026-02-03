const DynRescale = require("./dynRescale.module");
const FunctionCurve = require("./functionCurve.module");

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
        this.inputScale = new DynRescale({db: db});
        this.inputScale.name = "inputScale";
        this.changeRateScale = new DynRescale({db: db});
        this.changeRateScale.name = "changeRateScale";
        this.velocityScale = new DynRescale({db: db});
        this.velocityScale.name = "velocityScale";
        this.pitchCurve = new FunctionCurve([0., 0.0, 0., 1.0, 1.0, 0.0], {db:this.db});
        this.velocityCurve = new FunctionCurve([0., 0.0, 0., 1.0, 1.0, 0.0], {db:this.db});
        this.durationCurve = new FunctionCurve([0., 0.0, 0., 1.0, 1.0, 0.0], {db:this.db});
        this.timeToNextNoteCurve = new FunctionCurve([0., 0.0, 0., 1.0, 1.0, 0.0], {db:this.db});        

    }

    reset(){
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
        this.inputScale.reset();
        this.changeRateScale.reset();
        this.velocityScale.reset();      
        
    }

    setValue(value){
        this.db.log("notenumbercrunchersetValue", value);
        this.rawValue = value;
        this.scaledValue = this.inputScale.scale(value, 0, 1);
        this.db.log("notenumbercruncher. got scaledValue", this.scaledValue);
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
            this.db.log("notenumbercruncher. changeRate firstRead");
            this.prevValue = this.rawValue;    //
            this.prevChangeTime = Date.now(); //
            this.changeRate = 0;
            return;
        }

        let millis = Date.now();
        this.db.log("notenumbercruncher. millis", millis.toString(), this.prevChangeTime.toString());
        let millisDiff = millis - this.prevChangeTime;
        this.db.log("values ", this.rawValue, this.prevValue);
        let ochange = Math.abs(this.rawValue - this.prevValue);
        if(ochange > 0){
            this.db.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        }
        this.db.log("notenumbercruncher. ochange", ochange, millisDiff);
        let change = ochange / millisDiff;
        this.db.log("notenumbercruncher. change", change);
        this.changeRate = this.changeRateScale.scale(change, 0, 1);
        this.prevChangeTime = millis;
        this.prevValue = this.rawValue;

    }

    derivePitchFloat(){
        this.pitchFloat = this.pitchCurve.mapValue(this.scaledValue);
    }

    deriveVelocityFloat(){
        this.db.log("deriveVelocityFloat", this.changeRate);
        this.velocityFloat = this.velocityCurve.mapValue(this.changeRate);
    }

    deriveDurationFloat(){
        this.durationFloat = 1;  //a constant at the moment.
    }

    deriveTimeToNextNoteFloat(){
        this.timeToNextNoteFloat = this.durationFloat;
    }


}

module.exports = NoteNumberCruncher;