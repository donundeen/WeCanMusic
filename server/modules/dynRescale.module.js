class dynRescale {

    constructor() {
        this.min = false;
        this.max = false;
        this.db = false;
    }

    
    scale(inval, outmin, outmax){
        this.db.log("scaling " + inval);
        this.db.log(this.min +" , "+this.max);
        // do thje math
        if(this.min === false || inval < this.min){
            this.min = inval;
        }
        if(this.max === false || inval > this.max){
            this.max = inval;
        }
        this.db.log(this.min +" , "+this.max);
        let mapped = this.floatmap(inval, this.min, this.max, outmin, outmax);
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

    floatmap(inval, inmin, inmax, outmin, outmax){
        this.db.log("floatmap : " + inval + " : " + inmin + " : " + inmax);
        // assume all values are 0-1
        let inrange = inmax - inmin;
        this.db.log(inrange);
        if(inrange == 0){
            this.db.log("0 range, returning outmin " +outmin);
            //bad division, just return the outmin
            return outmin;
        }
        let outrange = outmax - outmin;
        let ratio = outrange / inrange; 
        let inflat = inval - inmin;
        let outflat = inflat * ratio;
        let out = outmin + outflat;
        return out;
      }

}

module.exports = dynRescale;