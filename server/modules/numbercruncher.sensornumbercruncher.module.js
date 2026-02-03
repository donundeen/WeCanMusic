const DynRescale = require("./dynRescale.module");
const FunctionCurve = require("./functionCurve.module");

class SensorNumberCruncher {
    constructor(options){
        this.db = (options && options.db) ? options.db : false;
        this.firstRead = true;
        this.prevSensorValue = 0;
        this.prevChangeTime = 0;
        this.scaledValue = 0;
        this.pitchFloat = 0;
        this.velocityFloat = 0;
        this.durationFloat = 0;
        this.timeToNextNoteFloat = 0;

        this.newNote = false;
        // sensor values
        this.sensorValue = 0;
        this.sensorScale = new DynRescale({db: this.db});
        this.sensorScale.name = "sensorScale";
        this.sensorCurve = new FunctionCurve([0., 0.0, 0., 1.0, 1.0, 0.0], {db: this.db});
        // rate of change of sensorValue → velocityFloat
        this.changeRateScale = new DynRescale({db: this.db});
        this.changeRateScale.name = "changeRateScale";
        this.changeRateCurve = new FunctionCurve([0., 0.0, 0., 1.0, 1.0, 0.0], {db: this.db});
        this.smoothValue = 0;
        this.smoothScale = new DynRescale({db: this.db});
        this.smoothCurve = new FunctionCurve([0., 0.0, 0., 1.0, 1.0, 0.0], {db: this.db});
        this.rmsValue = 0;
        this.rmsScale = new DynRescale({db: this.db});
        this.rmsCurve = new FunctionCurve([0., 0.0, 0., 1.0, 1.0, 0.0], {db: this.db});
        this.peakValue = 0;
        this.peakScale = new DynRescale({db: this.db});
        this.peakCurve = new FunctionCurve([0., 0.0, 0., 1.0, 1.0, 0.0], {db: this.db});
        this.velValue = 0;
        this.velScale = new DynRescale({db: this.db});
        this.velCurve = new FunctionCurve([0., 0.0, 0., 1.0, 1.0, 0.0], {db: this.db});
    }

    reset(){
        this.firstRead = true;
        this.prevSensorValue = 0;
        this.prevChangeTime = 0;
        this.scaledValue = 0;
        this.pitchFloat = 0;
        this.velocityFloat = 0;
        this.sensorScale.reset();
        this.changeRateScale.reset();
    }

    setSensorValues(values){
        this.sensorValue = values.sensorValue;
        this.smoothValue = values.smoothValue;
        this.rmsValue = values.rmsValue;
        this.peakValue = values.peakValue;
        this.velValue = values.velValue;
        this.crunch();
    }

    crunch(){
        // DynRescale sensor value to 0–1, then curve → pitchFloat
        this.scaledValue = this.sensorScale.scale(this.sensorValue, 0, 1);
        this.pitchFloat = this.sensorCurve.mapValue(this.scaledValue);

        // Rate of change of sensorValue → velocityFloat
        const now = Date.now();
        if (this.firstRead) {
            this.prevSensorValue = this.sensorValue;
            this.prevChangeTime = now;
            this.velocityFloat = 0;
            this.firstRead = false;
            return;
        }
        const dt = now - this.prevChangeTime;
        const change = Math.abs(this.sensorValue - this.prevSensorValue);
        const changeRate = dt > 0 ? change / dt : 0;
        const scaledChangeRate = this.changeRateScale.scale(changeRate, 0, 1);
        this.velocityFloat = this.changeRateCurve.mapValue(scaledChangeRate);
        this.prevSensorValue = this.sensorValue;
        this.prevChangeTime = now;
    }
}

module.exports = SensorNumberCruncher;