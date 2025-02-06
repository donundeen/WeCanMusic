class Orchestra {
    constructor(divSelector) {
        this.orchestraDivSelector = divSelector;
        this.ws = null;
        this.voicelist = [];
        this.init();
    }

    init(){
    }

    message(address, data) {

        let msg = {
            address : address,
            data: data
        };  

        console.log("sending message ", msg);
        if(this.ws.wsready){
        //    var buf = new Buffer.from(JSON.stringify(msg));
            this.ws.send(JSON.stringify(msg));
        }else{
            console.log("ws not ready");
        }
    }



    instrumentAnnounced(options){
        /*
        options is an array of objects w/ properties name, type, and value        
        */
        console.log("instrumentAnnounced");
        console.log(options.data);
        let id = options.data.filter((item)=>item.name=="device_name")[0].value;
        
        // if the instrument already has an interface, don't create a new one,
        // but DO update the form with the options, since they might have changed in the meantime
        if($( "#"+id ).length){
            console.log("updating form");
            let instr = $("#"+id);
            let midi_voice = options.data.filter((item)=>item.name=="midi_voice")[0].value;
            let midi_bank = options.data.filter((item)=>item.name=="midi_bank")[0].value;
            let midi_program = options.data.filter((item)=>item.name=="midi_program")[0].value;
            midi_voice = midi_bank + ":"+midi_program; // this should already be true, but in case it's not, we take midi_bank and midi_program as the true values.
            let midimin = options.data.filter((item)=>item.name=="midimin")[0].value;
            let midimax = options.data.filter((item)=>item.name=="midimax")[0].value;
            let midi_nlen = options.data.filter((item)=>item.name=="midi_nlen")[0].value;
            let midi_vol = options.data.filter((item)=>item.name=="midi_vol")[0].value;
            
            //[midi_bank, midi_program] = midi_voice.split(":");
            midi_bank = parseInt(midi_bank);
            midi_program = parseInt(midi_program);            
            let midi_voice_index = voicelist.findIndex((v)=>{
                return (midi_bank == parseInt(v[0]) && midi_program == parseInt(v[1]));
            });  
            console.log("midi_voice_index", midi_voice_index, midi_bank, midi_program, voicelist);          
            $( ".midi-range",instr ).slider( "option", "values", [ midimin, midimax ] );
            $( ".range_display",instr ).val(  midimin + " - " + midimax );
            // this isn't right' need to find selected_index
            $( ".midi-voice",instr ).slider( "option", "value", midi_voice_index );
            $( ".voice_display",instr ).val(  midi_voice );
            $( ".midi-volume",instr ).slider( "option", "value", midi_vol );
            $( ".volume_display",instr ).val(  midi_vol );
            $( ".midi-notelength",instr ).slider( "option", "value", midi_nlen );
            $( ".notelength_display",instr ).val(  notelength_names[midi_nlen] );

            return;
        }

        let options_object = {};
        for(let i =0; i< options.data.length; i++){
            options_object[options.data[i]["name"]] = options.data[i]["value"];
        }       
        console.log("id is  " +id);
        console.log(options_object);
        console.log(options.data);
        this.createInstrumentForm(id, options.data, options_object);
    }

    createInstrumentForm(id, options_array, options_object){
        console.log("copying");
        let self = this;
        let instr = $(".copyme").clone(true,true).removeClass("copyme").show().attr("id",id).appendTo(this.orchestraDivSelector);
        //***** Setting up instrument nodes,  */
        let midimin = options_object.midimin  ? options_object.midimin : 32;
        let midimax = options_object.midimax  ? options_object.midimax : 100;
        // voice is bank:program
        let midi_voice_index = 0;
        let [midi_bank, midi_program] = [0,0];
        let midi_voice = options_object.midi_voice  ? options_object.midi_voice: "0:0";
        let midi_vol = options_object.midi_vol  ? options_object.midi_vol: 200;
        try{
            [midi_bank, midi_program] = midi_voice.split(":");
            midi_bank = parseInt(midi_bank);
            midi_program = parseInt(midi_program);
            // figure out midi_voice index in voicelist
            console.log("finding voice index", midi_bank, midi_program);
            console.log(voicelist);
            midi_voice_index = voicelist.findIndex((v)=>{
                return (midi_bank == parseInt(v[0]) && midi_program == parseInt(v[1]));
            });
        }catch(e){}
        console.log("voice index is "+ midi_voice_index);
        midi_voice_index = (midi_voice_index >=0 ? midi_voice_index : 0);
        let midi_channel = options_object.midi_channel  ? options_object.midi_channel : 0;
        let midi_nlen = options_object.midi_nlen  ? options_object.midi_nlen : 7;
        let device_name = options_object.device_name  ? options_object.device_name : "BAD_NAME";
        let instrtype = options_object.type ? options_object.type : "UNKNOWNTYPE";
        $(instr).data("device_name", device_name);
        $(instr).data("instrtype", instrtype);
        $(instr).data("midi_voice", midi_voice);
        $(instr).attr("id", device_name);
        $( ".device_name span",instr ).text(device_name);
        $( ".midi-range",instr ).slider({
            range: true,
            min: 0,
            max: 127,
            values: [midimin, midimax ],
            slide : function( event, ui ) {
                $(event.target).closest(".instrument").attr("id")                
                $( ".range_display",instr ).val(  ui.values[ 0 ] + " - " + ui.values[ 1 ] );
            },
            stop    : function( event, ui ) {
                $(event.target).closest(".instrument").attr("id")                
                $( ".range_display",instr ).val(  ui.values[ 0 ] + " - " + ui.values[ 1 ] );
                let min = ui.values[ 0 ];
                let max = ui.values[ 1 ];
                let address = "instrval";
                let instrtype = $(instr).data("instrtype"); // local or udp
                let data = {id:id, 
                            instrtype : instrtype,
                            var: "midimin",
                            val: min};
                self.message(address, data);
                data.var = "midimax";
                data.val = max;
                self.message(address, data);

            }
        });
        
        $( ".range_display" ,instr).val( midimin +
            " - " + midimax );

        $( ".midi-notelength",instr ).slider({
            range: false,
            min: 0,
            max: 8,
            value: midi_nlen,
            slide: function( event, ui ) {
                console.log("slide", ui.value);
                $(event.target).closest(".instrument").attr("id")                
                $( ".notelength_display",instr ).val(  notelength_names[ui.value] );
            },            
            stop: function( event, ui ) {
                $(event.target).closest(".instrument").attr("id")                
                $( ".notelength_display",instr ).val(  notelength_names[ui.value] );
                let address = "instrval";
                let instrtype = $(instr).data("instrtype"); // local or udp
                let data = {id:id, 
                            instrtype: instrtype,
                            var: "midi_nlen",
                            val: ui.value };
                self.message(address, data);
            }
        });
        $( ".notelength_display",instr ).val(  notelength_names[midi_nlen] );

        $( ".midi-volume",instr ).slider({
            range: false,
            min: 0,
            max: 254,
            value: midi_vol,
            slide: function( event, ui ) {
                console.log("slide", ui.value);
                $(event.target).closest(".instrument").attr("id")                
                $( ".volume_display",instr ).val( ui.value );
            },            
            stop: function( event, ui ) {
                $(event.target).closest(".instrument").attr("id")                
                $( ".volume_display",instr ).val(  ui.value );
                let address = "instrval";
                let instrtype = $(instr).data("instrtype"); // local or udp
                let data = {id:id, 
                            instrtype: instrtype,
                            var: "midi_vol",
                            val: ui.value };
                self.message(address, data);
            }
        });
        $( ".volume_display",instr ).val( midi_vol );


        $( ".midi-channel",instr ).slider({
            range: false,
            min: 0,
            max: 15,
            value: midi_channel,
            slide: function( event, ui ) {
                console.log("slide", ui.value);
                $(event.target).closest(".instrument").attr("id")                
                $( ".channel_display",instr ).val(  ui.value );
            },            
            stop: function( event, ui ) {
                $(event.target).closest(".instrument").attr("id")                
                $( ".channel_display",instr ).val(  ui.value );
                let address = "instrval";
                let instrtype = $(instr).data("instrtype"); // local or udp
                let data = {id:id, 
                            instrtype: instrtype,
                            var: "midi_channel",
                            val: ui.value };
                self.message(address, data);
            }
        });

        $( ".channel_display",instr ).val(midi_channel );
        $( ".channel_display",instr ).keyup(function(event){
            console.log(event.which);
            if(event.which == 13) {
                let val = parseInt($(event.target).val());
                parseChannelVal(val, instr);
            }
        });
        $( ".channel_display",instr ).blur(function(event){
            let channelval = parseInt($(event.target).val());
            parseChannelVal(channelval, instr);
        });

        function parseChannelVal(val, instr){
            console.log("channel value", val);
            if(!isNaN(val)){
                $( ".midi-channel",instr ).slider("value", val);
                $( ".channel_display",instr ).val(val);
                sendChannelVal(val);                
            }
        }
        function sendChannelVal(val){
            let address = "instrval";            
            let data = {id:id, 
                instrtype: instrtype,
                var: "midi_channel",
                val: val };
            self.message(address, data);             
        }


        
        $( ".midi-voice",instr ).slider({
            range: false,
            min: 0,
            max: (voicelist.length > 0 ? voicelist.length : 127),//voicelist.length - 1,
            value: midi_voice_index, //q0,//(midi_voice_index >=0 ? midi_voice_index : 0),// midi_voice,
            
            slide: function( event, ui ) {
                console.log("sliding");
                
                let instrid = $(event.target).closest(".instrument").attr("id");     
                console.log(ui.value);
                $('.voice_display option',instr).prop("selected", false);
                $('.voice_display option',instr).eq(ui.value).prop('selected', 'selected');          
             //   $( ".voice_display",instr ).val(  ui.value );
            },
            
            stop: function( event, ui ) {
                
                $(event.target).closest(".instrument").attr("id");         
                $('.voice_display option',instr).prop("selected", false);
                $('.voice_display option',instr).eq(ui.value).prop('selected', 'selected');          
                let instrtype = $(instr).data("instrtype"); // local or udp
                let value = $('.voice_display option:eq('+ui.value+')',instr).val();
                if(!value.toString().includes(":")){
                    value = "0:"+value;
                }
                let address = "instrval"
                let data = {id:id, 
                            instrtype: instrtype,
                            var: "midi_voice",
                            val: value};
                self.message(address, data);                
            }
        });

        /*
        $( ".voice_display",instr ).blur(function(event){
            let voiceval = parseInt($(event.target).val());
            parseVoiceVal(voiceval, instr);
        });
*/

        $(".resetbutton button", instr).click(function(event,ui){
            console.log("reset clicked");
            id = $(event.target).closest(".instrument").attr("id");
            let address = "instrval";
            let instrtype = $(instr).data("instrtype"); // local or udp
            let data = {id:id, 
                        instrtype: instrtype,
                        var: "reset",
                        val: 1 };
            self.message(address, data);               
        });

        console.log("setting select to " + midi_voice);
        $( ".voice_display",instr ).val( midi_voice );

        $( ".voice_display",instr ).on("change",function(event){
            console.log("voice_display. change");
            console.log($(event.target).val());
            let selectedIndex = $(event.target).prop('selectedIndex');
            let voiceval = $(event.target).val();
            self.parseVoiceVal(voiceval, instr, selectedIndex);
        });

    }



    parseVoiceVal(val, instr, selectedIndex){
        console.log("voice value ", val, "selectedIndex ", selectedIndex);
        $( ".midi-voice",instr ).slider("option", "value", selectedIndex);
        $( ".voice_display",instr ).val(val);
        let instrtype = $(instr).data("instrtype");
        let id = $(instr).attr("id");               
        this.sendVoiceVal(val, id, instrtype);                
    }

    sendVoiceVal(voiceval, id, instrtype){
        let address = "instrval";            
        let data = {id:id, 
            instrtype: instrtype,
            var: "midi_voice",
            val: voiceval,
            foo: "bar2" };
        this.message(address, data);             
    }


    updateInstrumentData(id, data_obj){
        console.log("updateInstrumentData");
        console.log(data_obj);
        let instr = $("#"+id);
        if($(instr).length){
            if (data_obj.midi_channel) {    
                $( ".midi-channel",instr ).slider("value", data_obj.midi_channel);
                $( ".channel_display",instr ).val(data_obj.midi_channel);
            }
            if (data_obj.midi_nlen) {    
                $( ".midi-notelength",instr ).slider("value", data_obj.midi_nlen);
                $( ".notelength_display",instr ).val(notelength_names[data_obj.midi_nlen]);
            }

            if (data_obj.midi_voice) {    
                console.log(data_obj.midi_voice);
                $('.voice_display option[value="'+data_obj.midi_voice+'"]', instr).prop('selected', true);
                let selectedIndex = $('.voice_display', instr ).prop('selectedIndex');
                console.log(selectedIndex);
                $( ".midi-voice",instr ).slider("option", "value", selectedIndex);
            }
            if (data_obj.midimin && data_obj.midimax) {    
                $( ".range_display",instr ).val(  data_obj.midimin + " - " + data_obj.midimax );
                $( ".midi-range",instr ).slider({values:[data_obj.midimin , data_obj.midimax]});
            }
        }
    }


    updateInstrumentMakenote(id, data_obj){
//        console.log("updateMakenote");
//        console.log(data_obj);
        let instr = $("#"+id);
        let text = data_obj.pitch + ":"+data_obj.velocity+":"+data_obj.duration;
//        console.log(text);
        $( ".makenote span",instr ).text(text);
    }

    updateVoicelist(rvoicelist){
      //  console.log(rvoicelist);
        this.voicelist = rvoicelist;
        this.voicelist.sort((a,b)=>{
            if(a[0] === b[0]){
                return parseInt(a[1]) - parseInt(b[1]);
            }else{
                return parseInt(a[0]) - parseInt(b[0]);
            }
        });       
        this.buildVoicelistOptions();
    }

    buildVoicelistOptions(){
        let voptions = $("<select class='voice_display' name='midi_voice'>");
        let self = this;
        for (var i = 0; i< self.voicelist.length; i++){
            let [bank, program, name] = this.voicelist[i];
           // console.log(bank, program, name);
            let id = bank.toString()+":"+program.toString(); 
            let elem = $("<option value='"+id+"'>"+id+" "+name+"</option>");
            $(voptions).append(elem);
        }
        $(".voice_display").replaceWith(voptions);    
        // also need to update the voice slider to link with the new select options...
        $(".instrument").not(".copyme").each(function(index,instr){
            let midi_voice = $(this).data("midi_voice");
            console.log("voice", midi_voice);
            let midi_voice_index = 0;
            let [midi_bank, midi_program] = [0,0];
            try{
                [midi_bank, midi_program] = midi_voice.split(":");
                // figure out midi_voice index in voicelist
                midi_voice_index = self.voicelist.findIndex((v)=>{
                    return (midi_bank == v[0] && midi_program == v[1]);
                });
            }catch(e){console.log("error ", e);}
            midi_voice_index = (midi_voice_index >=0 ? midi_voice_index : 0);
            console.log(midi_voice, midi_bank, midi_program, midi_voice_index); 
            $( ".midi-voice",this ).slider({
                max: (self.voicelist.length > 0 ? self.voicelist.length - 1 : 127),//voicelist.length - 1,
                value: midi_voice_index,//(midi_voice_index >=0 ? midi_voice_index : 0),// midi_voice,
            });
            $('.voice_display',this).val(midi_voice);
            $( ".voice_display",this ).on("change",function(event){
                console.log("voice_display. change");
                console.log($(event.target).val());
                let selectedIndex = $(event.target).prop('selectedIndex');
                let voiceval = $(event.target).val();
                self.parseVoiceVal(voiceval, instr, selectedIndex);
            });            
        });
    }
}