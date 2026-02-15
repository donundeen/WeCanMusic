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
        let self = this;
        $(".play", this.transportContainer).click(function(){
            if(self.playClicked){
                self.playClicked();
            }
        });

        $(".stop", this.transportContainer).click(function(){
            if(self.stopClicked){
                self.stopClicked();
            }
        });

        $(".pause", this.transportContainer).click(function(){
            if(self.pauseClicked){
                self.pauseClicked();
            }
        });

        $(".reset", this.transportContainer).click(function(){
            if(self.resetClicked){
                self.resetClicked();
            }
        });

    }

    updateBeat(bar, beat){
        $(".position", this.transportContainer).text(bar+":"+beat);
    }

}