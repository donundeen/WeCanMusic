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

    
    scale(inval, outmin, outmax, shrinkRatio){
        // do the math
        if (this.min !== false && this.max !== false && this.min !== this.max && shrinkRatio != null && shrinkRatio > 0) {
            // nope, ratio is based on the the range, not the min and max
            const range = this.max - this.min;
            const shrinkAmount = range * shrinkRatio;
            if(shrinkAmount > 0 && this.min + shrinkAmount < this.max - shrinkAmount){
                this.min = this.min + shrinkAmount;
                this.max = this.max - shrinkAmount;
            }
        }
        if(this.min === false || inval < this.min){
            this.min = inval;
        }
        if(this.max === false || inval > this.max){
            this.max = inval;
        }
        let mapped = this.floatMap(inval, this.min, this.max, outmin, outmax);
        return mapped;
    }

    cappedScale(inval, outmin, outmax, capratio, shrinkRatio){
        if (capratio == null || capratio <= 1) capratio = 1.5;
        // First read: set range to this value
        if (this.min === false || this.max === false) {
            this.min = inval;
            this.max = inval;
            this.db?.log?.("crunch cappedScale first read, min=max=" + inval);
            return outmin;
        }
        // if shrinkratio is set, shrink the range by the shrinkratio
        let range = this.max - this.min;

        if (shrinkRatio != null && shrinkRatio > 0) {
            // nope, ratio is based on the the range, not the min and max
            const shrinkAmount = range * shrinkRatio;
            this.min = this.min + shrinkAmount;
            this.max = this.max - shrinkAmount;
            range = this.max - this.min;
        }
        const nudge = range * capratio;
        const highBound = this.max + nudge;
        const lowBound = this.min - nudge;
        // Outside capratio bounds: constrain and return 0 or 1
        if (range > 0 && inval > highBound) {
            this.max = highBound;
            return outmax;
        }
        if (range > 0 && inval < lowBound) {
            this.min = lowBound;
            return outmin;
        }
        // Within bounds: normal update and map
        if (inval < this.min) this.min = inval;
        if (inval > this.max) this.max = inval;
        let mapped = this.floatMap(inval, this.min, this.max, outmin, outmax);
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
        let inRange = inMax - inMin;
        // Avoid division by tiny inRange: ratio blows up and can produce out >> outMax (e.g. > 1).
        const epsilon = 1e-10;
        if (inRange === 0 || Math.abs(inRange) < epsilon) {
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