class SensorNumberCruncher {
    constructor(options){
        if(options.db){
            this.db = db;
        }
        this.firstRead = true;
        this.prevValue = 0;
        this.scaledValue = 0;
        this.pitchFloat = false;
        this.velocityFloat = false;
        this.durationFloat = false;
        this.timeToNextNoteFloat = false;

        this.sensorValue = 0;
        this.smoothValue = 0;
        this.rmsValue = 0;
        this.peakValue = 0;
        this.velValue = 0;
    }

    setValue(value){
        this.rawValue = value;
        this.scaledValue = this.inputScale.scale(value, 0, 1);
    }


    /* values from instrument sensor are
    instrument.sensorValue = rawval;
    instrument.smoothValue = smoothval;
    instrument.rmsValue = rmsval;
    instrument.peakValue = peakval;
    instrument.velValue = velval;
    */
    setSensorValues(values){
        this.sensorValue = values.sensorValue;
        this.smoothValue = values.smoothValue;
        this.rmsValue = values.rmsValue;
        this.peakValue = values.peakValue;
        this.velValue = values.velValue;
    }

    crunch(){
    }


}

module.exports = SensorNumberCruncher;