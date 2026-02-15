class Orchestra {
    constructor(divSelector) {
        this.orchestraDivSelector = divSelector;
        this.ws = null;
        this.voiceList = [];
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
        let id = options.data.filter((item)=>item.name=="deviceName")[0].value;
        
        // if the instrument already has an interface, don't create a new one,
        // but DO update the form with the options, since they might have changed in the meantime
        if($( "#"+id ).length){
            console.log("updating form");
            let instr = $("#"+id);
            let midiVoice = options.data.filter((item)=>item.name=="midiVoice")[0].value;
            let midiBank = options.data.filter((item)=>item.name=="midiBank")[0].value;
            let midiProgram = options.data.filter((item)=>item.name=="midiProgram")[0].value;
            midiVoice = midiBank + ":"+midiProgram; // this should already be true, but in case it's not, we take midi_bank and midi_program as the true values.
            let midiMin = options.data.filter((item)=>item.name=="midiMin")[0].value;
            let midiMax = options.data.filter((item)=>item.name=="midiMax")[0].value;
            let midiNlen = options.data.filter((item)=>item.name=="midiNlen")[0].value;
            let midiVol = options.data.filter((item)=>item.name=="midiVol")[0].value;
            
            //[midi_bank, midi_program] = midi_voice.split(":");
            midiBank = parseInt(midiBank);
            midiProgram = parseInt(midiProgram);            
            let midiVoiceIndex = this.voiceList.findIndex((v)=>{
                return (midiBank == parseInt(v[0]) && midiProgram == parseInt(v[1]));
            });  
            console.log("midiVoiceIndex", midiVoiceIndex, midiBank, midiProgram, this.voiceList);          
            $( ".midiRange",instr ).slider( "option", "values", [ midiMin, midiMax ] );
            $( ".rangeDisplay",instr ).val(  midiMin + " - " + midiMax );
            // this isn't right' need to find selected_index
            $( ".midiVoice",instr ).slider( "option", "value", midiVoiceIndex );
            $( ".voiceDisplay",instr ).val(  midiVoice );
            $( ".midiVolume",instr ).slider( "option", "value", midiVol );
            $( ".volumeDisplay",instr ).val(  midiVol );
            $( ".midiNoteLength",instr ).slider( "option", "value", midiNlen );
            $( ".noteLengthDisplay",instr ).val(  noteLengthNames[midiNlen] );

            return;
        }

        let optionsObject = {};
        for(let i =0; i< options.data.length; i++){
            optionsObject[options.data[i]["name"]] = options.data[i]["value"];
        }       
        console.log("id is  " +id);
        console.log(optionsObject);
        console.log(options.data);
        this.createInstrumentForm(id, options.data, optionsObject);
    }

    createInstrumentForm(id, optionsArray, optionsObject){
        console.log("copying");
        let self = this;
        let instr = $(".copyMe").clone(true,true).removeClass("copyMe").show().attr("id",id).appendTo(this.orchestraDivSelector);
        instr.addClass("collapsed");
        $(instr).find(".instrument-header").on("click", function(e) {
            $(e.currentTarget).closest(".instrument").toggleClass("collapsed");
        });
        //***** Setting up instrument nodes,  */
        let midiMin = optionsObject.midiMin  ? optionsObject.midiMin : 32;
        let midiMax = optionsObject.midiMax  ? optionsObject.midiMax : 100;
        // voice is bank:program
        let midiVoiceIndex = 0;
        let [midiBank, midiProgram] = [0,0];
        let midiVoice = optionsObject.midiVoice  ? optionsObject.midiVoice: "0:0";
        let midiVol = optionsObject.midiVol  ? optionsObject.midiVol: 200;
        try{
            [midiBank, midiProgram] = midiVoice.split(":");
            midiBank = parseInt(midiBank);
            midiProgram = parseInt(midiProgram);
            // figure out midi_voice index in voiceList
            console.log("finding voice index", midiBank, midiProgram);
            console.log(this.voiceList);
            midiVoiceIndex = this.voiceList.findIndex((v)=>{
                return (midiBank == parseInt(v[0]) && midiProgram == parseInt(v[1]));
            });
        }catch(e){}
        console.log("voice index is "+ midiVoiceIndex);
        midiVoiceIndex = (midiVoiceIndex >=0 ? midiVoiceIndex : 0);
        let midiChannel = optionsObject.midiChannel  ? optionsObject.midiChannel : 0;
        let midiNlen = optionsObject.midiNlen  ? optionsObject.midiNlen : 7;
        let deviceName = optionsObject.deviceName  ? optionsObject.deviceName : "BAD_NAME";
        let instrType = optionsObject.instrType ? optionsObject.instrType : "UNKNOWNTYPE";
        $(instr).data("deviceName", deviceName);
        $(instr).data("instrType", instrType);
        $(instr).data("midiVoice", midiVoice);
        $(instr).attr("id", deviceName);
        $( ".deviceName span",instr ).text(deviceName);
        $( ".midiRange",instr ).slider({
            range: true,
            min: 0,
            max: 127,
            values: [midiMin, midiMax ],
            slide : function( event, ui ) {
                $(event.target).closest(".instrument").attr("id")                
                $( ".rangeDisplay",instr ).val(  ui.values[ 0 ] + " - " + ui.values[ 1 ] );
            },
            stop    : function( event, ui ) {
                $(event.target).closest(".instrument").attr("id")                
                $( ".rangeDisplay",instr ).val(  ui.values[ 0 ] + " - " + ui.values[ 1 ] );
                let min = ui.values[ 0 ];
                let max = ui.values[ 1 ];
                let address = "instrVal";
                let instrType = $(instr).data("instrType"); // local or udp
                let data = {id:id, 
                            instrType : instrType,
                            var: "midiMin",
                            val: min};
                self.message(address, data);
                data.var = "midiMax";
                data.val = max;
                self.message(address, data);

            }
        });
        
        $( ".rangeDisplay" ,instr).val( midiMin +
            " - " + midiMax );

        $( ".midiNoteLength",instr ).slider({
            range: false,
            min: 0,
            max: 8,
            value: midiNlen,
            slide: function( event, ui ) {
                console.log("slide", ui.value);
                $(event.target).closest(".instrument").attr("id")                
                $( ".noteLengthDisplay",instr ).val(  noteLengthNames[ui.value] );
            },            
            stop: function( event, ui ) {
                $(event.target).closest(".instrument").attr("id")                
                $( ".noteLengthDisplay",instr ).val(  noteLengthNames[ui.value] );
                let address = "instrVal";
                let instrType = $(instr).data("instrType"); // local or udp
                let data = {id:id, 
                            instrType: instrType,
                            var: "midiNlen",
                            val: ui.value };
                self.message(address, data);
            }
        });
        $( ".noteLengthDisplay",instr ).val(  noteLengthNames[midiNlen] );

        $( ".midiVolume",instr ).slider({
            range: false,
            min: 0,
            max: 254,
            value: midiVol,
            slide: function( event, ui ) {
                console.log("slide", ui.value);
                $(event.target).closest(".instrument").attr("id")                
                $( ".volumeDisplay",instr ).val( ui.value );
            },            
            stop: function( event, ui ) {
                $(event.target).closest(".instrument").attr("id")                
                $( ".volumeDisplay",instr ).val(  ui.value );
                let address = "instrVal";
                let instrType = $(instr).data("instrType"); // local or udp
                let data = {id:id, 
                            instrType: instrType,
                            var: "midiVol",
                            val: ui.value };
                self.message(address, data);
            }
        });
        $( ".volumeDisplay",instr ).val( midiVol );


        $( ".midiChannel",instr ).slider({
            range: false,
            min: 0,
            max: 15,
            value: midiChannel,
            slide: function( event, ui ) {
                console.log("slide", ui.value);
                $(event.target).closest(".instrument").attr("id")                
                $( ".channel_display",instr ).val(  ui.value );
            },            
            stop: function( event, ui ) {
                $(event.target).closest(".instrument").attr("id")                
                $( ".channel_display",instr ).val(  ui.value );
                let address = "instrVal";
                let instrType = $(instr).data("instrType"); // local or udp
                let data = {id:id, 
                            instrType: instrType,
                            var: "midiChannel",
                            val: ui.value };
                self.message(address, data);
            }
        });

        $( ".channelDisplay",instr ).val(midiChannel );
        $( ".channelDisplay",instr ).keyup(function(event){
            console.log(event.which);
            if(event.which == 13) {
                let val = parseInt($(event.target).val());
                parseChannelVal(val, instr);
            }
        });
        $( ".channelDisplay",instr ).blur(function(event){
            let channelval = parseInt($(event.target).val());
            parseChannelVal(channelval, instr);
        });

        function parseChannelVal(val, instr){
            console.log("channel value", val);
            if(!isNaN(val)){
                $( ".midiChannel",instr ).slider("value", val);
                $( ".channelDisplay",instr ).val(val);
                sendChannelVal(val);                
            }
        }

        function sendChannelVal(val){
            let address = "instrVal";            
            let data = {id:id, 
                instrType: instrType,
                var: "midiChannel",
                val: val };
            self.message(address, data);             
        }
        
        $( ".midiVoice",instr ).slider({    
            range: false,
            min: 0,
            max: (this.voiceList.length > 0 ? this.voiceList.length : 127),//voicelist.length - 1,
            value: midiVoiceIndex, //q0,//(midi_voice_index >=0 ? midi_voice_index : 0),// midi_voice,
            
            slide: function( event, ui ) {
                console.log("sliding");
                
                let instrid = $(event.target).closest(".instrument").attr("id");     
                console.log(ui.value);
                $('.voiceDisplay option',instr).prop("selected", false);
                $('.voiceDisplay option',instr).eq(ui.value).prop('selected', 'selected');          
             //   $( ".voice_display",instr ).val(  ui.value );
            },
            
            stop: function( event, ui ) {
                
                $(event.target).closest(".instrument").attr("id");         
                $('.voiceDisplay option',instr).prop("selected", false);
                $('.voiceDisplay option',instr).eq(ui.value).prop('selected', 'selected');          
                let instrType = $(instr).data("instrType"); // local or udp
                let value = $('.voiceDisplay option:eq('+ui.value+')',instr).val();
                if(!value.toString().includes(":")){
                    value = "0:"+value;
                }
                let address = "instrVal"
                let data = {id:id, 
                            instrType: instrType,
                            var: "midiVoice",
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

        $(".resetButton button", instr).click(function(event,ui){
            console.log("reset clicked");
            id = $(event.target).closest(".instrument").attr("id");
            let address = "instrVal";
            let instrType = $(instr).data("instrType"); // local or udp
            let data = {id:id, 
                        instrType: instrType,
                        var: "reset",
                        val: 1 };
            self.message(address, data);               
        });

        console.log("setting select to " + midiVoice);
        $( ".voiceDisplay",instr ).val( midiVoice );

        $( ".voiceDisplay",instr ).on("change",function(event){
            console.log("voiceDisplay. change");
            console.log($(event.target).val());
            let selectedIndex = $(event.target).prop('selectedIndex');
            let voiceval = $(event.target).val();
            self.parseVoiceVal(voiceval, instr, selectedIndex);
        });

    }



    parseVoiceVal(val, instr, selectedIndex){
        console.log("voice value ", val, "selectedIndex ", selectedIndex);
        $( ".midiVoice",instr ).slider("option", "value", selectedIndex);
        $( ".voiceDisplay",instr ).val(val);
        let instrType = $(instr).data("instrType");
        let id = $(instr).attr("id");               
        this.sendVoiceVal(val, id, instrType);                
    }

    sendVoiceVal(voiceval, id, instrType){
        let address = "instrVal";            
        let data = {id:id, 
            instrType: instrType,
            var: "midiVoice",
            val: voiceval,
            foo: "bar2" };
        this.message(address, data);             
    }


    updateInstrumentData(id, dataObj){
        console.log("updateInstrumentData");
        console.log(dataObj);
        let instr = $("#"+id);
        if($(instr).length){
            if (dataObj.midiChannel) {    
                $( ".midiChannel",instr ).slider("value", dataObj.midiChannel);
                $( ".channelDisplay",instr ).val(dataObj.midiChannel);
            }
            if (dataObj.midiNlen) {    
                $( ".midiNoteLength",instr ).slider("value", dataObj.midiNlen);
                $( ".noteLengthDisplay",instr ).val(noteLengthNames[dataObj.midiNlen]);
            }

            if (dataObj.midiVoice) {    
                console.log(dataObj.midiVoice);
                $('.voiceDisplay option[value="'+dataObj.midiVoice+'"]', instr).prop('selected', true);
                let selectedIndex = $('.voiceDisplay', instr ).prop('selectedIndex');
                console.log(selectedIndex);
                $( ".midiVoice",instr ).slider("option", "value", selectedIndex);
            }
            if (dataObj.midiMin && dataObj.midiMax) {    
                $( ".rangeDisplay",instr ).val(  dataObj.midiMin + " - " + dataObj.midiMax );
                $( ".midiRange",instr ).slider({values:[dataObj.midiMin , dataObj.midiMax]});
            }
        }
    }


    updateInstrumentMakenote(id, dataObj){
//        console.log("updateMakenote");
//        console.log(data_obj);
        let instr = $("#"+id);
        let text = dataObj.pitch + ":"+Math.round(parseFloat(dataObj.velocity)*100)/100+":"+parseInt(dataObj.duration);
//        console.log(text);
        $( ".makeNote span",instr ).text(text);
    }

    updateVoiceList(voiceList){
      //  console.log(voiceList);
        this.voiceList = voiceList;
        this.voiceList.sort((a,b)=>{
            if(a[0] === b[0]){
                return parseInt(a[1]) - parseInt(b[1]);
            }else{
                return parseInt(a[0]) - parseInt(b[0]);
            }
        });       
        this.buildVoiceListOptions();
    }

    buildVoiceListOptions(){
        let voptions = $("<select class='voiceDisplay' name='midiVoice'>");
        let self = this;
        for (var i = 0; i< self.voiceList.length; i++){
            let [bank, program, name] = this.voiceList[i];
           // console.log(bank, program, name);
            let id = bank.toString()+":"+program.toString(); 
            let elem = $("<option value='"+id+"'>"+id+" "+name+"</option>");
            $(voptions).append(elem);
        }
        $(".voiceDisplay").replaceWith(voptions);    
        // also need to update the voice slider to link with the new select options...
        $(".instrument").not(".copyMe").each(function(index,instr){
            let midiVoice = $(this).data("midiVoice");
            console.log("voice", midiVoice);
            let midiVoiceIndex = 0;
            let [midiBank, midiProgram] = [0,0];
            try{
                [midiBank, midiProgram] = midiVoice.split(":");
                // figure out midi_voice index in voiceList
                midiVoiceIndex = self.voiceList.findIndex((v)=>{
                    return (midiBank == v[0] && midiProgram == v[1]);
                });
            }catch(e){console.log("error ", e);}
            midiVoiceIndex = (midiVoiceIndex >=0 ? midiVoiceIndex : 0);
            console.log(midiVoice, midiBank, midiProgram, midiVoiceIndex); 
            $( ".midiVoice",this ).slider({
                max: (self.voiceList.length > 0 ? self.voiceList.length - 1 : 127),//voiceList.length - 1,
                value: midiVoiceIndex,//(midi_voice_index >=0 ? midi_voice_index : 0),// midi_voice,
            });
            $('.voiceDisplay',this).val(midiVoice);
            $( ".voiceDisplay",this ).on("change",function(event){
                console.log("voiceDisplay. change");
                console.log($(event.target).val());
                let selectedIndex = $(event.target).prop('selectedIndex');
                let voiceVal = $(event.target).val();
                self.parseVoiceVal(voiceVal, instr, selectedIndex);
            });            
        });
    }
}