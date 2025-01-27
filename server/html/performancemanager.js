class PerformanceManager {
    constructor(divID) {
        this.performanceContainer = document.getElementById(divID);
        this.currentScoreName = null;
        this.currentPerformanceName = null;
        this.scoreList = [];
        this.performanceList = [];

        this.sendScoreCallback= null;
        this.sendPerformanceCallback = null;
        this.getPerformanceCallback = null;
        this.getScoreCallback = null;

        this.init();
    }

    init(){
        let self = this;
        $(".sendscore", this.performanceContainer).click(function(){
            self.currentScoreName = $(".scorenametext", self.performanceContainer).val();
            if(self.sendScoreCallback){
                self.sendScoreCallback();
            }
        });

        $(".sendperformance", this.performanceContainer).click(function(){
            console.log("sendperformance clicked");
            self.currentPerformanceName = $(".performancenametext", this.performanceContainer).val();
            if(self.sendPerformanceCallback){
                console.log("sendPerformanceCallback");
                self.sendPerformanceCallback();
            }
        });

        $(".getperformance", this.performanceContainer).click(function(){
            let newperformance = $(".performanceselect").val();
            if(self.getPerformanceCallback){
                self.getPerformanceCallback(newperformance);
            }
        });

        $(".performanceselect", this.performanceContainer ).change(function(event, ui){
            let newperformance = $(event.target).val();
            self.currentPerformanceName = newperformance;
            $(".performancenametext", self.performanceContainer).val(newperformance);
            console.log("selecting   " + newperformance);
            if(self.getPerformanceCallback){
                self.getPerformanceCallback(newperformance);
            }
        });        

        $(".getscore", this.performanceContainer).click(function(){
            let newscore = $(".scoreselect").val();
            if(self.getScoreCallback){
                self.getScoreCallback(newscore);
            }
        });

        $(".scoreselect", this.performanceContainer).change(function(event, ui){
            let newscore = $(event.target).val();
            self.currentScoreName = newscore;   
            $(".scorenametext", self.performanceContainer).val(newscore);
            console.log("selecting   " + newscore);
            if(self.getScoreCallback){
                self.getScoreCallback(newscore);
            }
        }); 

    }

    
    updateCurrentScoreName(scorename){
        this.currentScoreName = scorename;
        $(".scorenametext", this.performanceContainer).val(scorename);
    }

    updateCurrentPerformanceName(performancename){
        this.currentPerformanceName = performancename;
        $(".performancenametext", this.performanceContainer).val(performancename);
    }

    buildScoreListOptions(){

        console.log("building score list options", this.scoreList);
        $(".scoreselect", this.performanceContainer).empty();
        $(".scoreselect", this.performanceContainer).append('<option value="">SELECT SCORE</option>');

        for(let i = 0; i < this.scoreList.length; i++){
            let selected = "";
            if(this.scoreList[i] == this.currentScoreName){
                selected = "SELECTED"
            }
            let elem = $("<option value='"+this.scoreList[i]+"' "+selected+">"+this.scoreList[i]+"</option>");
            $(".scoreselect", this.performanceContainer).append(elem);
        }
    }


    buildPerformanceListOptions(){
        $(".performanceselect", this.performanceContainer).empty();
        $(".performanceselect", this.performanceContainer).append('<option value="">SELECT PERFORMANCE</option>');

        if(!this.performanceList || this.performanceList.length == 0){
            return;
        }
        for(let i = 0; i < this.performanceList.length; i++){
            let selected = "";
            if(this.performanceList[i] == this.currentPerformanceName){
                selected = "SELECTED"
            }
            let elem = $("<option value='"+this.performanceList[i]+"' "+selected+">"+this.performanceList[i]+"</option>");
            $(".performanceselect", this.performanceContainer).append(elem);
        }


    }
}   


