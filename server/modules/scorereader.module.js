const fs = require('node:fs');

class ScoreReader  {

    constructor(options){
        this.scoreFilename = false;
        this.scoreDir = false;
        this.parsedScore = false;
        this.scoreText = false;
        this.messageCallback = false;
        this.db = false;
        if(options.db){
            this.db = options.db;
        }
    


        this.performanceProps = [
            {name:"scoreFilename", type:"s"}
        ];

        this.performanceUpdateCallback = false; // callback that gets called when a performance data is updated
        this.performancePropUpdateCallback = false;
}

    getPerformanceData(){
        // gather the data in performanceProps and return it
        let perfData = {};
        for(let i = 0; i < this.performanceProps.length; i++){
            perfData[this.performanceProps[i].name] = this[this.performanceProps[i].name];
        }
        return perfData;
    }

    loadPerformanceData(perfData){
        // extract performanceProps data, 
        // set internally, 
        // and do any announcing you need to do
        this.db.log("scorereader loadPErformanceDAta");
        this.db.log(perfData);
        for(let i = 0; i < this.performanceProps.length; i++){
            this[this.performanceProps[i].name] = perfData[this.performanceProps[i].name];
            if(this.performancePropUpdateCallback){
                this.performancePropUpdateCallback(this, this.performanceProps[i].name, this.performanceProps[i].type, this[this.performanceProps[i].name] )
            }
        }
        // opent the score 
        let self = this;
        this.openscore(function(){
            if(self.performanceUpdateCallback){
                self.performanceUpdateCallback(self);
            }    
        });
    }

    setMessageCallback(callback){
        this.messageCallback = callback;
    }

    setScoreDir(dir){
        this.scoreDir = dir;
    }

    getScoreList(callback){
        // get list of all files in dir
        fs.readdir(this.scoreDir, (err, files) => {
            callback(files);
        });        
    }

    openscore(callback){
        let self = this;
        fs.readFile(self.scoreDir + "/" + self.scoreFilename, 'utf8', (err, data) => {
            if (err) {
                console.error(err);
                return;
            }
            self.scoreText = data;
            if(callback){
                callback(self.scoreText);
            }
        });
    }

    writescore(callback){
        let fullpath = this.scoreDir + "/" + this.scoreFilename;
        this.db.log("writing score", this.scoreFilename, this.scoreText, this.scoreDir, fullpath);
        fs.writeFile(fullpath, this.scoreText, err => {
            if (err) {
                console.error(err);
            } else {
                // file written successfully
                callback(this);
            }
        });
    }

    onbeat(beatcount, bar, beat, transport){
//        db.log("score beat");
        this.db.log(beatcount + ": " + bar + ":" + beat);
//        db.log(this.scoreText);
        let rstring = "(^|\r|\n|\r\n)"+bar+":"+beat+" (.*)($|\r|\n|\r\n)";
//        db.log(rstring);
        let regex = new RegExp(rstring, "g");
        let matches =  [...this.scoreText.matchAll(regex)];
//        db.log(matches);
        for(let match of matches){
            let msg = match[2];
            this.db.log(match[2]);
            let splits = msg.split(" ");
            for (split of splits){
                this.processMessage(split, transport);
            }
        }
    }

    processMessage(msg, transport){
        if(msg == "tostart"){
            transport.reset();
        }else if(this.messageCallback){
            this.messageCallback(msg, transport);
        }

    }

}

module.exports = ScoreReader;