class DynRescale {

    constructor(options) {
        this.min = false;
        this.max = false;
        this.db = false;
        this.name = false;
        if(options.db){
            this.db = options.db;
        }
    }

    
    scale(inval, outmin, outmax){
        this.db?.log?.("scaling " + this.name + " " + inval);
        this.db?.log?.(this.min +" , "+this.max);
        // do the math
        if(this.min === false || inval < this.min){
            this.db?.log?.("<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< setting min " + inval);
            this.min = inval;
        }
        if(this.max === false || inval > this.max){
            this.db?.log?.(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> setting max " + inval);
            this.max = inval;
        }
        this.db?.log?.(this.min +" , "+this.max);
        let mapped = this.floatMap(inval, this.min, this.max, outmin, outmax);
        this.db?.log?.("mapped " + mapped);
        return mapped;
    }

    cappedScale(inval, outmin, outmax, capratio){
        if (capratio == null || capratio <= 1) capratio = 1.5;
        this.db?.log?.("crunch cappedScale " + this.name + " " + inval + " capratio " + capratio);
        this.db?.log?.(this.min + " , " + this.max);
        // First read: set range to this value
        if (this.min === false || this.max === false) {
            this.min = inval;
            this.max = inval;
            this.db?.log?.("crunch cappedScale first read, min=max=" + inval);
            return outmin;
        }
        const range = this.max - this.min;
        const nudge = range * capratio;
        const highBound = this.max + nudge;
        const lowBound = this.min - nudge;
        // Outside capratio bounds: constrain and return 0 or 1
        if (range > 0 && inval > highBound) {
            this.max = highBound;
            this.db?.log?.("crunch cappedScale above high bound",highBound,"new max " + this.max);
            return outmax;
        }
        if (range > 0 && inval < lowBound) {
            this.min = lowBound;
            this.db?.log?.("crunch cappedScale below low bound",lowBound,"new min " + this.min);
            return outmin;
        }
        // Within bounds: normal update and map
        if (inval < this.min) this.min = inval;
        if (inval > this.max) this.max = inval;
        this.db?.log?.(this.min + " , " + this.max);
        let mapped = this.floatMap(inval, this.min, this.max, outmin, outmax);
        this.db?.log?.("cappedScale mapped " + mapped);
        return mapped;
    }


    reset(){
        this.min = false;
        this.max = false;

    }

    constrain(inval, min, max){
        if(inval < min){
            inval = min;
        }
        if(inval > max){
            inval = max;
        }
        return inval;
    }

    floatMap(inValue, inMin, inMax, outMin, outMax){
        this.db?.log?.("floatMap : " + inValue + " : " + inMin + " : " + inMax);
        let inRange = inMax - inMin;
        this.db?.log?.(inRange);
        // Avoid division by tiny inRange: ratio blows up and can produce out >> outMax (e.g. > 1).
        const epsilon = 1e-10;
        if (inRange === 0 || Math.abs(inRange) < epsilon) {
            this.db?.log?.("range too small, returning outMin " + outMin);
            return outMin;
        }
        let outRange = outMax - outMin;
        let ratio = outRange / inRange;
        let inFlat = inValue - inMin;
        let outFlat = inFlat * ratio;
        let out = outMin + outFlat;
        return out;
      }

}

module.exports = DynRescale;