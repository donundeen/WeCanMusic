/*
not done yet, but parking this code here to get it out of theoryengine.module.js
*/

class MaxTheoryBridge {
    constructor(options) {
        this.db = options.db;
    }


    // setter commands
    runSetter(command, labelid) {
        // if there's spaces, split and run each one
        command = command.trim();
        this.db.log("runSetter " , command);
        let self = this;
        if(command.match(/ /)){
            let split = command.split(" ");
            this.db.log("split " , this.db);
            split.forEach(function(com){
                self.db.log("com " , com);
                self.runSetter(com.trim());
            });
            return;
        }
        if(command.match(/^[a-gA-G][b#♭]?[0-9]?$/)){
            this.setNote(command);
        }else if(teoria.Scale.KNOWN_SCALES.indexOf(command.toLowerCase()) >= 0){
            this.setScale(command.toLowerCase());
            this.bestSetIsScale();
        }else if (command.match(/^[+-]/)){
            var interval  = command.replace(/^[+-]/,"");
            if(command[0] == "-" && command[1] != "-"){
                interval = [interval.slice(0, 1), "-", interval.slice(1)].join('');
            }
            this.transpose(command.replace(/^[+-]/,""));
        }else if(command.match(/[0-7]\.[34]/)){
            var position = command[0];
            var size = command[2];
            this.setChordDiatonic(parseInt(position), parseInt(size));
            this.bestSetIsChord();
        }else{
            this.db.log("trying ::: " , command);

            let result = this.tryChord(command);
            if(!result){
                this.db.log("no command match for :: ",command);
            }
        }
    }


    runGetter(command, labelid) {
        // - s0.[0-9]+(Min-Max) : (float val btw 0.0 and 1.0) get the scale note at the position in the scale represented by the float, between the Min and Max MIDI values
        // - c0.[0-9]+(Min-Max) : (float val btw 0.0 and 1.0) get the chord note at the position in the scale represented by the float, between the Min and Max MIDI values
        // - w0.[0-9]+(Min-Max) : (float val btw 0.0 and 1.0) get the note at the position in the weighted scale  represented by the float, between the Min and Max MIDI values
        // - s[0-9]+(min-Max) : get the note at that index in the list of scale notes, btw Min and Max. Loops around to bottom.
        // - c[0-9]+(min-Max) : get the note at that index in the list of chord notes, btw Min and Max. Loops around to bottom.
        // - w[0-9]+(min-Max) : get the note at that index in the list of weighted scale notes, btw Min and Max. Loops around to bottom.
        
        command = command.toLowerCase();

        var matches = command.match(/([bscwrf])([0-9]*\.?[0-9]+)\(([0-9]+)-([0-9]+)\)/);
    //	this.debugmsg(matches); //
        if(!matches){
    //		this.debugmsg("no command match for "+command);
            return;
        }
        var sc = matches[1];
        var intfl = "int";
        if(matches[2].match(/\./)){
            var intfl = "float";
        }
    //	this.debugmsg(intfl);
        var value = parseFloat(matches[2]);
    //	this.debugmsg(value);
        
        var min = parseInt(matches[3]);
        var max = parseInt(matches[4]);
    //	this.debugmsg("min: " + min);
    //	this.debugmsg("max: " + max);
        
        if(sc == "s"){
            if(intfl == "int"){
                this.getScaleNoteFromInt(labelid, value, min, max);
            }
            if(intfl == "float"){
                this.getScaleNoteFromFloat(labelid, value, min, max);
            }		
        }
        if(sc == "c"){
            if(intfl == "int"){
                this.getChordNoteFromInt(labelid, value, min, max);
            }
            if(intfl == "float"){
                this.getChordNoteFromFloat(labelid, value, min, max);
            }		
        }
        if(sc == "b"){
            if(intfl == "int"){
                this.getBestNoteFromInt(labelid, value, min, max);
            }
            if(intfl == "float"){
                this.getBestNoteFromFloat(labelid, value, min, max);
            }		
        }	
        if(sc == "w"){
            if(intfl == "int"){
                this.getWeightedScaleNoteFromInt(labelid, value, min, max);
            }
            if(intfl == "float"){
                this.getWeightedScaleNoteFromFloat(labelid, value, min, max);
            }		
        }
        if(sc == "r"){
            if(intfl == "int"){
                this.getRootedBestNoteFromInt(labelid, value, min, max);
            }
            if(intfl == "float"){
                this.getRootedBestNoteFromFloat(labelid, value, min, max);
            }		
        }

        if(sc == "f"){
            if(intfl == "int"){
                this.getFixedBestNoteFromInt(labelid, value, min, max);
            }
            if(intfl == "float"){
                this.getFixedBestNoteFromFloat(labelid, value, min, max);
            }		
        }	

    }

}

module.exports = MaxTheoryBridge;