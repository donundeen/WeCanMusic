
let Transport = {

    db: false,

    play: false,
    bpm: false,
    beatcount: 0,
    bar: false,
    beat: false,
    interval: false,
    QN: false,
    HN : false,
    WN: false,
    N8: false,
    beatcallback: false,

    performanceProps : [
        {name:"bpm", type:"i"}
    ],
    performanceUpdateCallback: false, // callback that gets called when a performance data is updated
    performancePropUpdateCallback: false,

    getPerformanceData(){
        // gather the data in performanceProps and return it
        let perfData = {};
        for(let i = 0; i < this.performanceProps.length; i++){
            perfData[this.performanceProps[i].name] = this[this.performanceProps[i].name];
        }
        return perfData;
    },

    loadPerformanceData(perfData){
        // extract performanceProps data, 
        // set internally, 
        // and do any announcing you need to do
        for(let i = 0; i < this.performanceProps.length; i++){
            this[this.performanceProps[i].name] = perfData[this.performanceProps[i].name];
            if(this.performancePropUpdateCallback){
                this.performancePropUpdateCallback(this, this.performanceProps[i].name, this.performanceProps[i].type, this[this.performanceProps[i].name] )
            }             
        }
        this.updateBpm(this.bpm);
        if(this.performanceUpdateCallback){
            this.performanceUpdateCallback();
        }
    },

    bpmToMS(bpm){
        return 60000 / bpm;
    },

    updateBpm(bpm){
        this.db.log("set bpm " + bpm);
        this.bpm = bpm;
        this.QN = this.bpmToMS(bpm);
        this.HN = this.QN * 2;
        this.WN = this.QN * 4;
        this.N8 = this.QN / 2;
    },

    onbeat(){
        this.bar = Math.floor(this.beatcount / 4) + 1;
        this.beat = (this.beatcount % 4) + 1;
        this.beatcount++;
        if(this.beatcallback){
            this.beatcallback(this.beatcount, this.bar, this.beat, this);
        }else{
            this.db.log("no callback");
        }
    },

    start(){
        if(!this.interval){
            if(this.QN){
                this.db.log("Starting " + this.QN);
                this.interval = setInterval((function(){this.onbeat();}).bind(this), this.QN);
            }else{
                this.db.log("no BPM set");
                this.db.log(this);
            }
        }
    },

    stop(){
        clearInterval(this.interval);
        this.interval = false;
        this.reset();
    },

    pause(){
        clearInterval(this.interval);
        this.interval = false;
    },    

    reset(){
        this.beatcount = 0;
    },

    setBeatCallback(callback){
        this.beatcallback = callback;
    }
}

exports.Transport = Transport;