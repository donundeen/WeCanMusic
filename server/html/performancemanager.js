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

        $(".sendscore", this.performanceContainer).click(function(){
            this.currentScoreName = $(".scorenametext", this.performanceContainer).val();
            if(this.sendScoreCallback){
                this.sendScoreCallback();
            }
        });

        $(".sendperformance", this.performanceContainer).click(function(){
            this.currentPerformanceName = $(".performancenametext", this.performanceContainer).val();
            if(this.sendPerformanceCallback){
                this.sendPerformanceCallback();
            }
        });

        $(".getperformance", this.performanceContainer).click(function(){
            let newperformance = $(".performanceselect").val();
            if(this.getPerformanceCallback){
                this.getPerformanceCallback(newperformance);
            }
        });

        $(".performanceselect", this.performanceContainer ).change(function(event, ui){
            let newperformance = $(event.target).val();
            this.currentPerformanceName = newperformance;
            $(".performancenametext", this.performanceContainer).val(newperformance);
            console.log("selecting   " + newperformance);
            if(this.getPerformanceCallback){
                this.getPerformanceCallback(newperformance);
            }
        });        
    



        $(".getscore", this.performanceContainer).click(function(){
            let newscore = $(".scoreselect").val();
            if(this.getScoreCallback){
                this.getScoreCallback(newscore);
            }
        });

        $(".scoreselect", this.performanceContainer).change(function(event, ui){
            let newscore = $(event.target).val();
            this.currentScoreName = newscore;   
            $(".scorenametext", this.performanceContainer).val(newscore);
            console.log("selecting   " + newscore);
            if(this.getScoreCallback){
                this.getScoreCallback(newscore);
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


