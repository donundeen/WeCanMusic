class StatusMelodies  {

    constructor(options){
        this.db = false;
        if(options.db){
            this.db = options.db;
        }
        this.midi_hardware_engine = options.midi_hardware_engine;
        this.active = options.active;
        this.midi_channel = options.midi_channel;
        this.midi_bank = options.midi_bank;
        this.midi_program = options.midi_program;
        
        this.midi_channel = 8;
        this.midi_bank = 0;
        this.midi_program = 2; 

        this.readyNotes = [65, 69, 72, 65, 69, 72];
        this.errorNotes = [72, 68, 65, 72, 68, 65];
        this.performanceChange = [72, 65, 68, 72, 65, 68];
    }

    playready(){
        // play a series of notes that mean "ready";
        this.playnotes(this.readyNotes, 127, 500, 250);
    }

    playerror(){
        this.playnotes(this.errorNotes, 127, 500, 250);
    }

    playperformancechange(){
        this.playnotes(this.performanceChange, 127, 500, 250);
    }


    playnotes(series, volume, duration, spacing){
        if(this.midi_hardware_engine){
            this.midi_hardware_engine.send('cc',{
                controller: 0,
                value: this.midi_bank, 
                channel: this.midi_channel
            }); 
  //          this.db.log(this._midi_program);
            this.midi_hardware_engine.send('program',{
                number: this.midi_program, 
                channel: this.midi_channel
            }); 
            this.playnoteInSeries(series, 0, volume, duration, spacing );
        }
    }

    playnoteInSeries(series, index, volume, duration, spacing){
        if(index < series.length){

            this.playnote(series[index], volume);
            let self= this;
            setTimeout(function(){
                self.endnote(series[index])
            }, duration);
            index++;
            setTimeout(function(){
                self.playnoteInSeries(series, index, volume, duration, spacing);
            }, spacing);
        }
    }

    playnote(pitch, volume){
        if(this.midi_hardware_engine){
            this.midi_hardware_engine.send('noteon', {
                note: pitch,
                velocity: volume,
                channel: this.midi_channel
            });
        }
    }

    endnote(pitch){
        if(this.midi_hardware_engine){
            this.midi_hardware_engine.send('noteoff', {
                note: pitch,
                velocity: 0,
                channel: this.midi_channel
            });
        }
    }
}

module.exports = StatusMelodies;