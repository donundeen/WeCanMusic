
//const WEBSOCKET_PORT = 80;
let USE_HTTPS = false;
let WEBSOCKET_PORT = 80;
let WEBSOCKET_PROTOCOL = "ws://";
if(USE_HTTPS){
    WEBSOCKET_PORT = 443;
    WEBSOCKET_PROTOCOL = "wss://";
}
let voicelist = [[1,79,"nodata"],[0,78,"nodata"]];
let scorelist = ["simplescore.txt"];
let curscore = "simplescore.txt";
let performancelist = [];
let curperformance = "";

let notelength_names = ["Double Whole", "Whole", "Half","Half Triplet","Quarter","Quarter Triplet","Eighth","Eighth Triplet","Sixteenth"];


$(function() {

    console.log("starting");

    // chnage this depending on location of webserver. Figure out a way to make this more dynamic...
    let host =  window.location.host;
    host = host.replace(/:[0-9]+/,"");
    // remove port
    console.log(host);



    // some note characters: 
    // ♭ 𝅘𝅥𝅮𝅗𝅥°♭𝅘𝅥𝅗𝅥𝅗 𝄼 𝄽 

    //  const ws = new WebSocket('ws://localhost:8080');
    //const ws = new WebSocket('ws://192.168.4.34:8080');
    //const ws = new WebSocket('ws://10.102.134.110:8080');
    let websocketurl = WEBSOCKET_PROTOCOL+host+':'+WEBSOCKET_PORT;
    console.log("trying to start websocket server ", websocketurl);
    const ws = new WebSocket(websocketurl);

    let wsready = false;  
    // Browser WebSockets have slightly different syntax than `ws`.
    // Instead of EventEmitter syntax `on('open')`, you assign a callback
    // to the `onopen` property.
    ws.onopen = function() {
        wsready = true;
        console.log("opened " + ws.readyState);
        message("getvoicelist",1);        
        message("getperformancelist",1);
        message("getscorelist",1);
        message("ready", "READY NOW")
    };

    ws.onerror = function(msg){
        console.log("ws error");
        console.log(msg);
    }

    ws.onclose = function(msg){
        console.log("wsclose");
        console.log(msg);
    }

    ws.onmessage = function(event) {
        console.log("got message "+ event);
        msg = JSON.parse(event.data);
        console.log(msg.address);

        if(msg.address == "score"){
            updateScore(msg.data);
        }

        if(msg.address == "curbeat"){
            updateBeat(msg.data[0],msg.data[1],msg.data[2]);
        }
        if(msg.address =="addinstrument"){
            console.log("adding instrument");
            instrumentAnnounced(msg);
        }

        //     // I don't think this is used. It doesn't make any sense..
        if(msg.address =="updateinstrument"){
            updateInstrumentData(msg.data.device_name, msg.data);
        }
        if(msg.address =="makenote"){
            updateInstrumentMakenote(msg.data.device_name, msg.data);
        }
        if(msg.address == "voicelist"){
            updateVoicelist(msg.data);
        }
        if(msg.address == "scorelist"){
            updateScoreList(msg.data);
        }

        if(msg.address == "performancelist"){
            updatePerformanceList(msg.data);
        }
        if(msg.address == "performancename"){
            updatePerformanceName(msg.data);
        }

        // add message about adding a new instrument here
    }

    function message(address, data){

        let msg = {address : address,
            data: data};  

        console.log("sending message ", msg);
        if(wsready){
        //    var buf = new Buffer.from(JSON.stringify(msg));
            ws.send(JSON.stringify(msg));
        }else{
            console.log("ws not ready");
        }
    }

    function updateScore(data){
        console.log("updating score", data);
        scoreText = data.text;
        curscore = data.scorename;
        $(".scorenametext").val(curscore);
        if(!scoreText){
            return;
        }
        let split = scoreText.split("\n");
        $(".score").empty();

        for (let i = 0; i < split.length; i++){
            line = split[i];
            let matches = line.match(/([0-9]+):([0-9]+)(.*)/);
            if(matches){
                let elem = $("<div>").appendTo(".score");
                $(elem).text(line);
                bar = parseInt(matches[1]);
                beat = parseInt(matches[2]);
                curpos = barBeatToPos(bar, beat);
                $(elem).addClass("line"); 
                $(elem).data("position", curpos);
                $(elem).attr("data-position", curpos);
            }
        }
        buildScoreListOptions();
    }

    function updateVoicelist(rvoicelist){
        console.log("got voicelist");
      //  console.log(rvoicelist);
        voicelist = rvoicelist;
        buildVoicelistOptions();
    }

    function updateScoreList(rscorelist){
        console.log("got scorelist");
        scorelist = rscorelist;
        buildScoreListOptions();
    }

    function updatePerformanceList(rperformancelist){
        console.log("got performancelist");
        performancelist = rperformancelist;
        buildPerformanceListOptions();
    }    

    function updatePerformanceName(rperformancename){
        curperformance = rperformancename;
        buildPerformanceListOptions();

    }

    function updateBeat(position, bar, beat){
        $(".position").text(bar+":"+beat);
        let selector = ".line[data-position='"+position+"']";
        if($(selector).length){
            $(".line").removeClass("curbeat");
            $(selector).addClass("curbeat");
        }
    }
        
    function sendScore(){
  //      let text = $(".score").text();
        let text = $.map(
            $(".line"), 
            function(element) {
                return $(element).text()
            })
            .join("\n");
        curscore = $(".scorenametext").val();
        console.log("sending score ", curscore, text);
        let msg = {scorename: curscore, 
                text: text
        }
        message("savescore", msg);
    }

    $(".sendscore").click(function(){
        sendScore();
    });

    function sendPerformance(){
        curperformance = $(".performancenametext").val();
        console.log("sending curperformance ", curperformance);
        let msg = {performancename: curperformance}
        message("saveperformance", msg);
    }

    $(".sendperformance").click(function(){
        sendPerformance();
    });



    let instrcount = 0;
    $(".play").click(function(){
        message("play", 1);
        /*
        instrcount++;
        let id = "instr"+instrcount;
        createInstrumentForm(id, {});        
        */
    });

    $(".stop").click(function(){
        message("stop", 1);
    });

    $(".reset").click(function(){
        console.log("sending reset");
        message("reset", 1);
    });


    $(".pause").click(function(){
        message("pause",1);
    });


    $(".getperformance").click(function(){
        let newperformance = $(".performanceselect").val();
        console.log("selecting   " + newperformance);
        message("loadperformance", newperformance);        
    });


    $(".getscore").click(function(){
        let newscore = $(".scoreselect").val();
        console.log("selecting   " + newscore);
        message("loadscore", newscore);        
    });

    $(".scoreselect").change(function(event, ui){
        let newscore = $(event.target).val();
        curscore = newscore;
        $(".scorenametext").val(curscore);
        console.log("selecting   " + newscore);
        message("loadscore", newscore);
    }); 

    $(".score").on('keyup',function(e) {
        if(e.which == 13) {
            addLinesToScore();
        }
        setFocus();
    });
    $(".score").on("mouseup", setFocus);

    function posToBeatBar(curpos){
        let bar = Math.ceil(curpos / 4);
        let beat = ((curpos - 1) % 4) + 1;        
        return [bar, beat];
    }
    function barBeatToPos(bar, beat){
        curpos = ((bar - 1) * 4) + (beat);
        return curpos;
    }

    function addLinesToScore(){

        let curpos = 0;
        let bar = Math.floor(curpos / 4) + 1;
        let beat = ((curpos - 1) % 4) + 1;    
        var startPosition = $(".score").selectionStart;
        var endPosition = $(".score").selectionEnd;    
        $(".score div").each(function(key, elem){
            // go line by line, and make sure
            // each line has a "line" class
            // - each line starts with a bar:beat that matches the data-position value
            // (change the data-position to mathc the written text)
            let content = $(elem).text();
            let matches = content.match(/([0-9]+):([0-9]+)(.*)/);
            if(matches){
                bar = parseInt(matches[1]);
                beat = parseInt(matches[2]);
                curpos = barBeatToPos(bar, beat);
                $(elem).addClass("line"); 
                $(elem).data("position", curpos);
                $(elem).attr("data-position", curpos);
            }else{
                curpos++;
                [bar, beat] = posToBeatBar(curpos);
                $(elem).addClass("line");
                content = bar+":"+beat+ " " +content;
                $(elem).data("position", curpos);
                $(elem).attr("data-position", curpos);
                $(elem).text(content);
            }
        });

        let lastpos = $(".score .line").last().data("position");
        $(".score div").not(".line").each(function(key,elem){
            curpos++
            let content = $(elem).text();
            let bar = Math.floor(curpos / 4) + 1;
            let beat = ((curpos - 1) % 4) + 1;
            content = bar+":"+beat+ " " +content;
            $(elem).addClass("line");
            $(elem).data("position", curpos);
            $(elem).attr("data-position", curpos);
            $(elem).text(content);
        });

        // send updated score here:
        sendScore();
    }

    var selectedElement = null;
    function setFocus(e) {
        $(".line").removeClass("highlight");
        selectedElement = window.getSelection().focusNode.parentNode;
            // walk up the DOM tree until the parent node is contentEditable
        while (selectedElement.parentNode && selectedElement.parentNode.contentEditable != 'true') {
            selectedElement = selectedElement.parentNode;
        }
        $(selectedElement).addClass("highlight");
    }

    $(".copyme").hide();

    function instrumentAnnounced(options){
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
            let midimin = options.data.filter((item)=>item.name=="midimin")[0].value;
            let midimax = options.data.filter((item)=>item.name=="midimax")[0].value;
            let midi_nlen = options.data.filter((item)=>item.name=="midi_nlen")[0].value;
            let midi_vol = options.data.filter((item)=>item.name=="midi_vol")[0].value;
            [midi_bank, midi_program] = midi_voice.split(":");
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
        createInstrumentForm(id, options.data, options_object);
    }

    function createInstrumentForm(id, options_array, options_object){
        console.log("coptying");
        let instr = $(".copyme").clone(true,true).removeClass("copyme").show().attr("id",id).appendTo(".instruments");
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
                message(address, data);
                data.var = "midimax";
                data.val = max;
                message(address, data);

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
                message(address, data);
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
                message(address, data);
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
                message(address, data);
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
            message(address, data);             
        }


        
        $( ".midi-voice",instr ).slider({
            range: false,
            min: 0,
            max: 127,// (voicelist.length > 0 ? voicelist.length : 127),//voicelist.length - 1,
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
                message(address, data);                
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
            message(address, data);               
        });

        console.log("setting select to " + midi_voice);
        $( ".voice_display",instr ).val( midi_voice );

        $( ".voice_display",instr ).on("change",function(event){
            console.log("voice_display. change");
            console.log($(event.target).val());
            let selectedIndex = $(event.target).prop('selectedIndex');
            let voiceval = $(event.target).val();
            parseVoiceVal(voiceval, instr, selectedIndex);
        });

    }



    function parseVoiceVal(val, instr, selectedIndex){
        console.log("voice value ", val, "selectedIndex ", selectedIndex);
        $( ".midi-voice",instr ).slider("option", "value", selectedIndex);
        $( ".voice_display",instr ).val(val);
        let instrtype = $(instr).data("instrtype");
        let id = $(instr).attr("id");               
        sendVoiceVal(val, id, instrtype);                
    }
    function sendVoiceVal(voiceval, id, instrtype){
        let address = "instrval";            
        let data = {id:id, 
            instrtype: instrtype,
            var: "midi_voice",
            val: voiceval,
            foo: "bar2" };
        message(address, data);             
    }


    function updateInstrumentData(id, data_obj){
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


    function updateInstrumentMakenote(id, data_obj){
//        console.log("updateMakenote");
//        console.log(data_obj);
        let instr = $("#"+id);
        let text = data_obj.pitch + ":"+data_obj.velocity+":"+data_obj.duration;
//        console.log(text);
        $( ".makenote span",instr ).text(text);
    }


    function buildVoicelistOptions(){
        console.log("building voice list options");
        let voptions = $("<select class='voice_display' name='midi_voice'>");
        console.log(voicelist);
        for (var i = 0; i< voicelist.length; i++){
            let [bank, program, name] = voicelist[i];
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
                midi_voice_index = voicelist.findIndex((v)=>{
                    return (midi_bank == v[0] && midi_program == v[1]);
                });
            }catch(e){}
            midi_voice_index = (midi_voice_index >=0 ? midi_voice_index : 0);
            console.log(midi_voice, midi_bank, midi_program, midi_voice_index); 
            $( ".midi-voice",this ).slider({
                max: (voicelist.length > 0 ? voicelist.length - 1 : 127),//voicelist.length - 1,
                value: midi_voice_index,//(midi_voice_index >=0 ? midi_voice_index : 0),// midi_voice,
            });
            $('.voice_display',this).val(midi_voice);
            $( ".voice_display",this ).on("change",function(event){
                console.log("voice_display. change");
                console.log($(event.target).val());
                let selectedIndex = $(event.target).prop('selectedIndex');
                let voiceval = $(event.target).val();
                parseVoiceVal(voiceval, instr, selectedIndex);
            });            

        });
        

    }

    function buildScoreListOptions(){
        $(".scoreselect").empty();
        $(".scoreselect").append('<option value="">SELECT SCORE</option>');

        for(let i = 0; i < scorelist.length; i++){
            let selected = "";
            if(scorelist[i] == curscore){
                selected = "SELECTED"
            }
            let elem = $("<option value='"+scorelist[i]+"' "+selected+">"+scorelist[i]+"</option>");
            $(".scoreselect").append(elem);
        }


    }


    function buildPerformanceListOptions(){
        $(".performanceselect").empty();
        $(".performanceselect").append('<option value="">SELECT PERFORMANCE</option>');

        for(let i = 0; i < performancelist.length; i++){
            let selected = "";
            if(performancelist[i] == curperformance){
                selected = "SELECTED"
            }
            let elem = $("<option value='"+performancelist[i]+"' "+selected+">"+performancelist[i]+"</option>");
            $(".performanceselect").append(elem);
        }

        $(".performanceselect").change(function(event, ui){
            let newperformance = $(event.target).val();
            curperformance = newperformance;
            $(".performancenametext").val(curperformance);
            console.log("selecting   " + newperformance);
            message("loadperformance", newperformance);
        });
    }


});