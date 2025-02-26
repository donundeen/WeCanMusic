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
        $(".sendScore", this.performanceContainer).click(function(){
            self.currentScoreName = $(".scoreNameText", self.performanceContainer).val();
            if(self.sendScoreCallback){
                self.sendScoreCallback();
            }
        });

        $(".sendPerformance", this.performanceContainer).click(function(){
            console.log("sendperformance clicked");
            self.currentPerformanceName = $(".performanceNameText", this.performanceContainer).val();
            if(self.sendPerformanceCallback){
                console.log("sendPerformanceCallback");
                self.sendPerformanceCallback();
            }
        });

        $(".getPerformance", this.performanceContainer).click(function(){
            let newperformance = $(".performanceSelect").val();
            if(self.getPerformanceCallback){
                self.getPerformanceCallback(newperformance);
            }
        });

        $(".performanceSelect", this.performanceContainer ).change(function(event, ui){
            let newperformance = $(event.target).val();
            self.currentPerformanceName = newperformance;
            $(".performanceNameText", self.performanceContainer).val(newperformance);
            console.log("selecting   " + newperformance);
            if(self.getPerformanceCallback){
                self.getPerformanceCallback(newperformance);
            }
        });        

        $(".getScore", this.performanceContainer).click(function(){
            let newscore = $(".scoreSelect").val();
            if(self.getScoreCallback){
                self.getScoreCallback(newscore);
            }
        });

        $(".scoreselect", this.performanceContainer).change(function(event, ui){
            let newscore = $(event.target).val();
            self.currentScoreName = newscore;   
            $(".scoreNameText", self.performanceContainer).val(newscore);
            console.log("selecting   " + newscore);
            if(self.getScoreCallback){
                self.getScoreCallback(newscore);
            }
        }); 

    }

    
    updateCurrentScoreName(scorename){
        this.currentScoreName = scorename;
        $(".scoreNameText", this.performanceContainer).val(scorename);
    }

    updateCurrentPerformanceName(performancename){
        this.currentPerformanceName = performancename;
        $(".performanceNameText", this.performanceContainer).val(performancename);
    }

    buildScoreListOptions(){

        console.log("building score list options", this.scoreList);
        $(".scoreSelect", this.performanceContainer).empty();
        $(".scoreSelect", this.performanceContainer).append('<option value="">SELECT SCORE</option>');

        for(let i = 0; i < this.scoreList.length; i++){
            let selected = "";
            if(this.scoreList[i] == this.currentScoreName){
                selected = "SELECTED"
            }
            let elem = $("<option value='"+this.scoreList[i]+"' "+selected+">"+this.scoreList[i]+"</option>");
            $(".scoreSelect", this.performanceContainer).append(elem);
        }
    }


    buildPerformanceListOptions(){
        $(".performanceSelect", this.performanceContainer).empty();
        $(".performanceSelect", this.performanceContainer).append('<option value="">SELECT PERFORMANCE</option>');

        if(!this.performanceList || this.performanceList.length == 0){
            return;
        }
        for(let i = 0; i < this.performanceList.length; i++){
            let selected = "";
            if(this.performanceList[i] == this.currentPerformanceName){
                selected = "SELECTED"
            }
            let elem = $("<option value='"+this.performanceList[i]+"' "+selected+">"+this.performanceList[i]+"</option>");
            $(".performanceSelect", this.performanceContainer).append(elem);
        }


    }
}   


