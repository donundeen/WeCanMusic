class StatusMelodies  {

    constructor(options){
        this.db = false;
        if(options.db){
            this.db = options.db;
        }
        this.midiHardwareEngine = options.midiHardwareEngine;
        this.active = options.active;
        this.midiChannel = options.midiChannel;
        this.midiBank = options.midiBank;
        this.midiProgram = options.midiProgram;
        
        this.midiChannel = 8;
        this.midiBank = 0;
        this.midiProgram = 2; 

        this.readyNotes = [65, 69, 72, 65, 69, 72];
        this.errorNotes = [72, 68, 65, 72, 68, 65];
        this.performanceChange = [72, 65, 68, 72, 65, 68];
    }

    playReady(){
        // play a series of notes that mean "ready";
        this.playNotes(this.readyNotes, 127, 500, 250);
    }

    playError(){
        this.playNotes(this.errorNotes, 127, 500, 250);
    }

    playPerformanceChange(){
        this.playNotes(this.performanceChange, 127, 500, 250);
    }


    playNotes(series, volume, duration, spacing){
        if(this.midiHardwareEngine){
            this.midiHardwareEngine.send('cc',{
                controller: 0,
                value: this.midiBank, 
                channel: this.midiChannel
            }); 
  //          this.db.log(this._midi_program);
            this.midiHardwareEngine.send('program',{
                number: this.midiProgram, 
                channel: this.midiChannel
            }); 
            this.playNoteInSeries(series, 0, volume, duration, spacing );
        }
    }

    playNoteInSeries(series, index, volume, duration, spacing){
        if(index < series.length){

            this.playNote(series[index], volume);
            let self= this;
            setTimeout(function(){
                self.endNote(series[index])
            }, duration);
            index++;
            setTimeout(function(){
                self.playNoteInSeries(series, index, volume, duration, spacing);
            }, spacing);
        }
    }

    playNote(pitch, volume){
        if(this.midiHardwareEngine){
            this.midiHardwareEngine.send('noteon', {
                note: pitch,
                velocity: volume,
                channel: this.midiChannel
            });
        }
    }

    endNote(pitch){
        if(this.midiHardwareEngine){
            this.midiHardwareEngine.send('noteoff', {
                note: pitch,
                velocity: 0,
                channel: this.midiChannel
            });
        }
    }
}

module.exports = StatusMelodies;