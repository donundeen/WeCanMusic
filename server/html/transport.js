class Transport {
    constructor(divID) {
        this.transportContainer = document.getElementById(divID);
        this.init();
        this.playClicked = null;
        this.stopClicked = null;
        this.pauseClicked = null;
        this.resetClicked = null;
    }

    init() {

        $(".play", this.transportContainer).click(function(){
            if(this.playClicked){
                this.playClicked();
            }
        });

        $(".stop", this.transportContainer).click(function(){
            if(this.stopClicked){
                this.stopClicked();
            }
        });

        $(".pause", this.transportContainer).click(function(){
            if(this.pauseClicked){
                this.pauseClicked();
            }
        });

        $(".reset", this.transportContainer).click(function(){
            if(this.resetClicked){
                this.resetClicked();
            }
        });

    }

    updateBeat(bar, beat){
        $(".position", this.transportContainer).text(bar+":"+beat);
    }

}