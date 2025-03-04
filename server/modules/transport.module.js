class Transport {
    constructor(options) {
        this.db = false;
        if(options.db){
            this.db = options.db;
        }
        this.play = false;
        this.bpm = false;
        this.beatCount = 0;
        this.bar = false;
        this.beat = false;
        this.interval = false;
        this.noteLengths = {};
        this.noteLengthValues = [];
        this.beatCallback = false;

        this.startCallback = false;
        this.stopCallback = false;
        this.pauseCallback = false;
        this.resetCallback = false;

        this.performanceProps = [
            {name: "bpm", type: "i"}
        ];
        this.performanceUpdateCallback = false; // callback that gets called when a performance data is updated
        this.performancePropUpdateCallback = false;

        this.quantizeTime = false; // or array of note length names ("QN, N16, N83, etc")
        this.quantizeCallback = false; // callback that gets called when a quantize time is reached
        this.quantizeIntervals = [];
    }

    getPerformanceData() {
        // gather the data in performanceProps and return it
        let perfData = {};
        for (let i = 0; i < this.performanceProps.length; i++) {
            perfData[this.performanceProps[i].name] = this[this.performanceProps[i].name];
        }
        return perfData;
    }

    loadPerformanceData(perfData) {
        // extract performanceProps data, 
        // set internally, 
        // and do any announcing you need to do
        for (let i = 0; i < this.performanceProps.length; i++) {
            this[this.performanceProps[i].name] = perfData[this.performanceProps[i].name];
            if (this.performancePropUpdateCallback) {
                this.performancePropUpdateCallback(this, this.performanceProps[i].name, this.performanceProps[i].type, this[this.performanceProps[i].name]);
            }
        }
        this.updateBpm(this.bpm);
        if (this.performanceUpdateCallback) {
            this.performanceUpdateCallback();
        }
    }

    bpmToMS(bpm) {
        return 60000 / bpm;
    }

    updateBpm(bpm) {
        this.db.log("set bpm " + bpm);
        this.bpm = bpm;
        this.setNoteLengths();
    }

    setNoteLengths(){
        // set note constant lengths, depending on bpms
        this.noteLengthValues = [];
        this.noteLengths.QN = this.bpmToMS(this.bpm);
        this.noteLengths.WN = this.noteLengths.QN * 4;
        this.noteLengths.HN = this.noteLengths.QN * 2;
        this.noteLengths.N8 = this.noteLengths.QN / 2;
        this.noteLengths.N16 = this.noteLengths.QN / 4;
        this.noteLengths.QN3 = this.noteLengths.HN / 3;
        this.noteLengths.HN3 = this.noteLengths.WN / 3;
        this.noteLengthValues.N83 = this.noteLengthValues.QN / 3;
        this.noteLengthValues.push(this.noteLengths.QN);
        this.noteLengthValues.push(this.noteLengths.WN);
        this.noteLengthValues.push(this.noteLengths.HN);
        this.noteLengthValues.push(this.noteLengths.N8);
        this.noteLengthValues.push(this.noteLengths.N16);
        this.noteLengthValues.push(this.noteLengths.QN3);
        this.noteLengthValues.push(this.noteLengths.HN3);
        this.noteLengthValues.push(this.noteLengthValues.N83);
        this.noteLengthValues.sort(function(a, b){return a - b});        
    }  

    onBeat() {
        this.bar = Math.floor(this.beatCount / 4) + 1;
        this.beat = (this.beatCount % 4) + 1;
        this.beatCount++;
        if (this.beatCallback) {
            this.beatCallback(this.beatCount, this.bar, this.beat, this);
        } else {
//            this.db.log("no callback");
        }
    }

    onQuantize(){
        if (this.quantizeCallback) {
            this.quantizeCallback(this);
        } else {
        }        
    }

    start() {
        if (!this.interval) {
            if (this.noteLengths.QN) {
                this.db.log("Starting " + this.noteLengths.QN);
                this.interval = setInterval((function () { this.onBeat(); }).bind(this), this.noteLengths.QN);
            } else {
                this.db.log("no BPM set");
                this.db.log(this);
            }
        }
        if (this.startCallback) {
            this.startCallback(this);
        }
        this.startQuantize();
    }

    startQuantize(){
        if(this.quantizeTime){
            this.stopQuantize();
            for(let quantizeTime of this.quantizeTime){
                this.quantizeIntervals.push(setInterval((function () { this.onQuantize(); }).bind(this), this.noteLengths[quantizeTime]));
            }
        }
    }

    stopQuantize(){
        // Clear all intervals in the quantize_intervals array
        for (let interval of this.quantizeIntervals) {
            clearInterval(interval);
        }
        this.quantizeIntervals = [];
    }

    stop() {
        clearInterval(this.interval);
        this.interval = false;
        this.reset();
        if (this.stopCallback) {
            this.stopCallback(this);
        }
    }

    pause() {
        clearInterval(this.interval);
        this.interval = false;
        if (this.pauseCallback) {
            this.pauseCallback(this);
        }
    }

    reset() {
        this.beatCount = 0;
        if (this.resetCallback) {
            this.resetCallback(this);
        }
    }

    setBeatCallback(callback) {
        this.beatCallback = callback;
    }
}

// Export the Transport class
module.exports = Transport;