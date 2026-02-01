

class MidiNoteList {
    constructor(noteList, rootNote, options){
        this.db = options.db || false;   
        this.midiNoteList = noteList || [];
        this.rootNote = rootNote || false;
        this.allowDuplicates = options.allowDuplicates || false;
    }

    reset(){
        this.midiNoteList = [];
        this.rootNote = false;
    }

    concat(otherNoteList){
        this.midiNoteList = this.midiNoteList.concat(otherNoteList.midiNoteList);
        this.sortNoteList();
    }

    copy(){
        return new MidiNoteList(this.midiNoteList, this.rootNote, {
            db: this.db,
        });
    }

    addTeoriaNote(teoriaNote){
        this.midiNoteList.push(teoriaNote.midi());
        this.sortNoteList();
    }

    addTeoriaNoteList(teoriaNoteList){
        for(let note of teoriaNoteList){
            this.addTeoriaNote(note);
        }
    }

    addTeoriaNoteFullRange(teoriaNote){
        this.addFullRangeOfNote(teoriaNote.midi());
    }

    addTeoriaNoteFullRangeList(teoriaNoteList){
        for(let note of teoriaNoteList){
            this.addTeoriaNoteFullRange(note);
        }
    }



    addNote(note){
        this.midiNoteList.push(note);
        this.sortNoteList();
    }

    removeNote(note){
        this.midiNoteList = this.midiNoteList.filter(function(n){
            return n !== note;
        });
        this.sortNoteList();
    }

    removeFullRangeOfNote(note){
        for (let i = note; i < 128; i += 12){
            this.removeNote(i);
        }
        for (let i = note; i > 0; i -= 12){
            this.removeNote(i);
        }
        this.sortNoteList();
    }

    removeAllNotes(){
        this.midiNoteList = [];
    }

    expandToFullRangeOfNotes(){
        for(let note of this.midiNoteList){
            this.addFullRangeOfNote(note);
        }
    }

    addFullRangeOfNote(note){
        // add all versions of this note in all octaves
        for (let i = note; i < 128; i += 12){
            this.midiNoteList.push(i);
        }
        for (let i = note; i > 0; i -= 12){
            this.midiNoteList.push(i);
        }
        // sort the list
        this.sortNoteList();
    }

    sortNoteList(){
        this.midiNoteList.sort(function(a,b){
            return a - b;
        });
        if(!this.allowDuplicates){
            this.midiNoteList = this.midiNoteList.filter(function(note, index, self){
                return self.indexOf(note) === index;
            });
        }
    }

    getNoteList(){
        return this.midiNoteList;
    }

    setRootNote(note){
        this.rootNote = note;
    }

    getRootNote(){
        return this.rootNote;
    }

    getRootedNoteFromFloat(value, min, max) {
        // for a "rooted" scale/chord, expand the min and max so that both min and max are the root
        //		this.debugmsg(chordNoteSetMidi);
        if(this.rootNote !== false){
            min = this.moveMinMax(this.rootNote, min);
            max = this.moveMinMax(this.rootNote, max);
        }
        //this.debugmsg("newminmax  "+ min +", " + max) ;

        var note = this.selectFromFloat(value, this.midiNoteList, min, max);
        //	this.debugmsg("note " + note);
        if(!note){
            return false;
        }
        return note;
    }

        
    getRootedNoteFromInt(value, min, max) {
        if(this.rootNote !== false){
            min = this.moveMinMax(this.rootNote, min);
            max = this.moveMinMax(this.rootNote, max);	
        }
        var note = this.selectFromInt(value, this.midiNoteList, min, max);
        if(!note){
            return false;
        }
        return note;
    }

    selectFixedFromFloat(value, theList, min, max) {
        // in a "fixed" setup, the same float value should result in the same midi note (octave may vary), regardless of scale
        // - map the float across FULL range, from min to max
        // - move resulting value DOWN to the closest note in the scale
    
        if(!theList){
            return false;
        }

        let range = max - min;
        let initial = min + Math.floor(range * value);
        while(theList.indexOf(initial) < 0){
            initial--;
        }
        return initial;
    }   


    selectFromFloat(value, theList, min, max) {
        if(!theList){
            return false;
        }

        var workingList = theList.filter(function(note){
            if(note >= min && note <= max){
                return true;
            }
            return false;
        });
    //	this.debugmsg(workingList);
        var index = Math.floor(workingList.length * value);
        var note  = workingList[index];// % workingList.length];
    //	this.debugmsg(note);	
        return note;
    }


    selectFromInt(value, theList, min, max) {
        if(!theList){
            return false;
        }
        var workingList = theList.filter(function(note){
            if(note >= min && note <= max){
                return true;
            }
            return false;
        });
    //	this.debugmsg(workingList);
        var note  = workingList[value % workingList.length];
    //	this.debugmsg(note);	
        return note;
    }



    moveMinMax(root, minmax) {
        // for a "rooted" scale/chord, expand the min and max so that both min and max are the root
        let orig = minmax;
        let mindiff = (minmax % 12) - (root % 12);
        let minmove = Math.abs(6 - mindiff);

        if(mindiff == 0){
            // do nothing
        }else if (mindiff < -6){
            mindiff = -12 - mindiff;
            minmax = minmax - mindiff
            //big distance, go opposite way around
        }else if (mindiff < 0){
            // small different, go toward
            minmax = minmax - mindiff
        }else if(mindiff < 6){
            minmax = minmax - mindiff
        }else if (mindiff < 12){
            mindiff = 12 - mindiff;
            minmax = minmax + mindiff
        }
        return minmax;
    }


    // based on input noteIn, find the closest note in the noteList
    getClosestCorrectNote(noteIn){
        let closest = noteIn;
        if(this.midiNoteList.includes(closest)){
            return closest;
        }        
        let diff = 0;
        while (diff <= 13){
            closest = noteIn + diff;
            if(this.midiNoteList.includes(closest)){
                return closest;
            }
            closest = noteIn - diff;
            if(this.midiNoteList.includes(closest)){
                return closest;
            }
            diff++;
        }
        return noteIn;
    }     
}

module.exports = MidiNoteList;