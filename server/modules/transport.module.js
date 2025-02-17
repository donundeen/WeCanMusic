class Transport {
    constructor(options) {
        this.db = false;
        if(options.db){
            this.db = options.db;
        }
        this.play = false;
        this.bpm = false;
        this.beatcount = 0;
        this.bar = false;
        this.beat = false;
        this.interval = false;
        this.notelengths = {};
        this.notelength_values = [];
        this.beatcallback = false;

        this.startCallback = false;
        this.stopCallback = false;
        this.pauseCallback = false;
        this.resetCallback = false;

        this.performanceProps = [
            {name: "bpm", type: "i"}
        ];
        this.performanceUpdateCallback = false; // callback that gets called when a performance data is updated
        this.performancePropUpdateCallback = false;

        this.quantize_time = false; // or array of note length names ("QN, N16, N83, etc")
        this.quantizecallback = false; // callback that gets called when a quantize time is reached
        this.quantize_intervals = [];
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
        this.notelength_values = [];
        this.notelengths.QN = this.bpmToMS(this.bpm);
        this.notelengths.WN = this.notelengths.QN * 4;
        this.notelengths.HN = this.notelengths.QN * 2;
        this.notelengths.N8 = this.notelengths.QN / 2;
        this.notelengths.N16 = this.notelengths.QN / 4;
        this.notelengths.QN3 = this.notelengths.HN / 3;
        this.notelengths.HN3 = this.notelengths.WN / 3;
        this.notelengths.N83 = this.notelengths.QN / 3;
        this.notelength_values.push(this.notelengths.QN);
        this.notelength_values.push(this.notelengths.WN);
        this.notelength_values.push(this.notelengths.HN);
        this.notelength_values.push(this.notelengths.N8);
        this.notelength_values.push(this.notelengths.N16);
        this.notelength_values.push(this.notelengths.QN3);
        this.notelength_values.push(this.notelengths.HN3);
        this.notelength_values.push(this.notelengths.N83);
        this.notelength_values.sort(function(a, b){return a - b});        
    }  

    onbeat() {
        this.bar = Math.floor(this.beatcount / 4) + 1;
        this.beat = (this.beatcount % 4) + 1;
        this.beatcount++;
        if (this.beatcallback) {
            this.beatcallback(this.beatcount, this.bar, this.beat, this);
        } else {
            this.db.log("no callback");
        }
    }

    onquantize(){
        if (this.quantizecallback) {
            this.quantizecallback(this);
        } else {
            this.db.log("no callback");
        }        
    }

    start() {
        if (!this.interval) {
            if (this.notelengths.QN) {
                this.db.log("Starting " + this.notelengths.QN);
                this.interval = setInterval((function () { this.onbeat(); }).bind(this), this.notelengths.QN);
            } else {
                this.db.log("no BPM set");
                this.db.log(this);
            }
        }
        if (this.startCallback) {
            this.startCallback(this);
        }
        this.startquantize();
    }

    startquantize(){
        if(this.quantize_time){
            this.stopquantize();
            for(let quantize_time of this.quantize_time){
                this.quantize_intervals.push(setInterval((function () { this.onquantize(); }).bind(this), this.notelengths[quantize_time]));
            }
        }
    }

    stopquantize(){
        // Clear all intervals in the quantize_intervals array
        for (let interval of this.quantize_intervals) {
            clearInterval(interval);
        }
        this.quantize_intervals = [];
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
        this.beatcount = 0;
        if (this.resetCallback) {
            this.resetCallback(this);
        }
    }

    setBeatCallback(callback) {
        this.beatcallback = callback;
    }
}

// Export the Transport class
module.exports = Transport;