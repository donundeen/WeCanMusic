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

class Performance {
    orchestra = false; // the orchestra object
    score = false; // the score object
    transport = false; // the transport object

    performanceDir = false;
    performanceFile = false;



    savePerformance(name, callback){
        //  use performanceProps in score and transport,
        // and configProps in the orchestra's udp instruments,
        // to get all the savable values
        // each of these objects has functions getPerformanceData and setPerformanceData
        this.performanceFile = name;
        
        let scoreData = score.getPerformanceData();
        let transportData = transport.getPerformanceData();
        let orchestraData = orchestrea.getPerformanceData();
        let perfData = {
            score: scoreData,
            transport: transportData,
            orchestra: orchestraData
        }

        let fullpath = this.performanceDir + "/" + this.performanceFile;
        console.log("writing perf file", this.performanceDir, this.performanceFile, perfData, fullpath);
        fs.writeFile(fullpath, JSON.stringify(perfData, null, "  "), err => {
            if (err) {
                console.error(err);
            } else {
                // file written successfully
                if(callback){
                    callback(this);
                }
            }
        });

        // save the JSON
    }

    loadPerformance(name){
        // load the performance file and extract the data
        // load the json
        perfData = false; // load it here
        let self = this;
        fs.readFile(self.performanceDir + "/" + self.performanceFile, 'utf8', (err, perfData) => {
            if (err) {
                console.error(err);
                return;
            }

            scoreData     = perfData.score;
            transportData = perfData.transport;
            orchestraData = perfData.orchestra;
            // send the data to the respective objects, 
            // they should know what to do with it.

            this.score.loadPerformanceData(scoreData);
            this.transport.loadPerformanceData(transportData);
            this.orchestra.loadPerformanceData(orchestraData);

            if(callback){
                callback(self.scoreText);
            }
        });
    }

}

module.exports = Performance