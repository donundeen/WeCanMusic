/*
this object handles the saving, loading, and sending of performance configurations, 
which includes
- scorename
- bpm
- instrument configurations
    - bank/program
    - midimin/midimax
    - channel

savePerformance (name)
- gets the stuff to save from the local objects
- saves it to a file of the given name in the performances folder

loadPerformance(name)
- loads the given performance file 
- updates local objects 
- send updates to the webui 
- sends updates to the remove instruments 

ultimately, each object should probably say 
"this is the stuff I want to save in a performance,
and this is how I want to be updated when new stuff is loaded
udpInstrument has configProps, which is this"

NOTE: udpInstrument doesn't actually have any UDP handling code, 
that's all in conductor.node.js, which handles all communication protocols
maybe this should change? 

transport and score could have "performanceProps"

or maybe these objects need to just deliver up their own performance JSON, 
and handle loading thier config JSON

"

*/

const fs = require('node:fs');

class Performance {
    constructor(options) {
        this.orchestra = false; // the orchestra object
        this.score = false; // the score object
        this.transport = false; // the transport object

        this.performanceDir = false;
        this.performanceFile = false;

        this.performanceList = []; // array of objects with params filename and sayname
        this.currentPerformanceIndex = 0;

        if(options.db){
            this.db = options.db;
        }else{
            this.db = false;
        }
    }

    savePerformance(name, callback) {
        //  use performanceProps in score and transport,
        // and configProps in the orchestra's udp instruments,
        // to get all the savable values
        // each of these objects has functions getPerformanceData and setPerformanceData
        this.performanceFile = name;

        let scoreData = this.score.getPerformanceData();
        let transportData = this.transport.getPerformanceData();
        let orchestraData = this.orchestra.getPerformanceData();
        let perfData = {
            score: scoreData,
            transport: transportData,
            orchestra: orchestraData
        }

        let fullpath = this.performanceDir + "/" + this.performanceFile;
        this.db.log("writing perf file", this.performanceDir, this.performanceFile, perfData, fullpath);
        fs.writeFile(fullpath, JSON.stringify(perfData, null, "  "), err => {
            if (err) {
                console.error(err);
            } else {
                // file written successfully
                if (callback) {
                    callback(this);
                }
            }
        });

        // save the JSON
    }

    loadPerformance(name, callback) {
        // load the performance file and extract the data
        // load the json
        this.performanceFile = name;
        let perfData = false; // load it here
        let self = this;
        fs.readFile(self.performanceDir + "/" + self.performanceFile, 'utf8', (err, perfData) => {
            if (err) {
                console.error(err);
                return;
            }
            perfData = JSON.parse(perfData);
            let scoreData = perfData["score"];
            let transportData = perfData.transport;
            let orchestraData = perfData.orchestra;
            // send the data to the respective objects, 
            // they should know what to do with it.
            this.db.log("perfomance loadPerformanceDAta");
            this.score.loadPerformanceData(scoreData);
            this.transport.loadPerformanceData(transportData);
            this.orchestra.loadPerformanceData(orchestraData);

            if (callback) {
                callback(perfData);
            }
        });
    }

    getPerformanceList(callback) {
        // get list of all files in dir
        fs.readdir(this.performanceDir, (err, files) => {
            callback(files);
        });
    }

    selectNextPerformance(callback) {
        this.currentPerformanceIndex++;
        if(this.currentPerformanceIndex >= this.performanceList.length){
            this.currentPerformanceIndex = 0;
        }
        callback(this.currentPerformanceIndex, this.performanceList[this.currentPerformanceIndex]);
    }

    getSelectedPerformanceData() {
        return this.performanceList[this.currentPerformanceIndex];
    }



}

module.exports = Performance;