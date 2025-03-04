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
        this.db.log("scaling " + this.name + " " + inval);
        this.db.log(this.min +" , "+this.max);
        // do thje math
        if(this.min === false || inval < this.min){
            this.db.log("<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< setting min " + inval);
            this.min = inval;
        }
        if(this.max === false || inval > this.max){
            this.db.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> setting max " + inval);
            this.max = inval;
        }
        this.db.log(this.min +" , "+this.max);
        let mapped = this.floatMap(inval, this.min, this.max, outmin, outmax);
        this.db.log("mapped " + mapped);
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
        this.db.log("floatMap : " + inValue + " : " + inMin + " : " + inMax);
        // assume all values are 0-1
        let inRange = inMax - inMin;
        this.db.log(inRange);
        if(inRange == 0){
            this.db.log("0 range, returning outMin " +outMin);
            //bad division, just return the outMin
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