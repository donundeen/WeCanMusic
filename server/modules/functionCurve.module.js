class FunctionCurve{

    constructor(curve, options){
        this.curveList = [0., 0.0, 0., 1.0, 1.0, 0.0];
        this.e = 2.71828; 
    
        this.db = false;
        if(options.db){
            this.db = options.db;
        }
        
        this.curveList = curve;
    }

    mapValue(x){
        // where is x in the curvelist?
        let xIndex = 0;
        while(xIndex < this.curveList.length){
            let curX = this.curveList[xIndex];
            let nextX = this.curveList[xIndex + 3];
            if(x >= curX && x <= nextX ){
                break;
            }
            xIndex = xIndex + 3;
        }
        let minX = this.curveList[xIndex];
        let maxX = this.curveList[xIndex + 3];
        let minY = this.curveList[xIndex+1];
        let maxY = this.curveList[xIndex + 4];
        let curve = this.curveList[xIndex + 5];
        if(x == minX){
            return minY;
        }
        if(x == maxX){
            return maxY;
        }
        return this.curveScale(x, minX, maxX, minY, maxY, curve);
    }

    curveScale(x , inMin, inMax, outMin, outMax, curve ){
        // treat input and output like it's scaled 0-1, then do the curve on it, then scale back to the output scaling
        let inScaled = this.floatMap(x, inMin, inMax, 0.0, 1.0);
        let outScaled = inScaled;
        if(curve < 0){
          outScaled = this.logScale(inScaled, curve);
        }else if (curve > 0){
          outScaled = this.expScale(inScaled, curve);
        }
        outScaled = this.floatMap(outScaled, 0.0, 1.0, outMin, outMax);
        return outScaled;
    }
      
    floatMap(inVal, inMin, inMax, outMin, outMax){
        // assume all values are 0-1
        let inRange = inMax - inMin;
        let outRange = outMax - outMin;
        let ratio = outRange / inRange;
        let inFlat = inVal - inMin;
        let outFlat = inFlat * ratio;
        let out = outMin + outFlat;
        return out;
    }

    logScale(x, curve){
        // assume input is 0-1.0
        let innerPow = (1 / (1+ curve)) - 1;
        let pow1 =  Math.pow(this.e, -1 * x * innerPow) ;
        let pow2 = Math.pow(this.e, -1 * innerPow);
        let y = (1 - pow1) / (1 - pow2 );  
        return y;
    }

    expScale(x, curve){
        // assume input is 0-1.0
        let innerPow = (1 / (1-curve)) - 1;
        let pow1 =  Math.pow(this.e, x * innerPow) ;
        let pow2 = Math.pow(this.e, innerPow);
        let y = (1 - pow1) / (1 - pow2 );  
        return y;
      }
            

}

module.exports = FunctionCurve;