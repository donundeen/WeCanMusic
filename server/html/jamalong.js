let USE_HTTPS = true;
let WEBSOCKET_PORT = 80;
let WEBSOCKET_PROTOCOL = "ws://";
if(USE_HTTPS){
    WEBSOCKET_PORT = 443;
    WEBSOCKET_PROTOCOL = "wss://";
}
let curscore = "simplescore.txt";
let curperformance = "";
let scoreText = "";

$(function() {

    console.log("starting", window.location.host);

    // chnage this depending on location of webserver. Figure out a way to make this more dynamic...
    let host =  window.location.host;
    host = host.replace(/:[0-9]+/,""); // this doesn't work for a captive portal page, at least on macos
    // remove port
    console.log(host);


    

    // some note characters: 
    // ♭ 𝅘𝅥𝅮𝅗𝅥°♭𝅘𝅥𝅗𝅥𝅗 𝄼 𝄽 

    //  const ws = new WebSocket('ws://localhost:8080');
    //const ws = new WebSocket('ws://192.168.4.34:8080');
    //const ws = new WebSocket('ws://10.102.134.110:8080');

    let websocketurl = WEBSOCKET_PROTOCOL+host+':'+WEBSOCKET_PORT;
    console.log("trying to start websocket server ", websocketurl)
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
//        console.log("got message "+ event);
        msg = JSON.parse(event.data);
//        console.log(msg.address);

        if(msg.address == "score"){
            updateScore(msg.data);
        }

        if(msg.address == "curbeat"){
            updateBeat(msg.data[0],msg.data[1],msg.data[2]);
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
        $(".scorenametext").text(curscore);
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
    }


    function updateBeat(position, bar, beat){
        $(".position").text(bar+":"+beat);
        let selector = ".line[data-position='"+position+"']";
        if($(selector).length){
            $(".line").removeClass("curbeat");
            $(selector).addClass("curbeat");
            $(".chordDisplay").text($(selector).text());
        }
    }
   


    function posToBeatBar(curpos){
        let bar = Math.ceil(curpos / 4);
        let beat = ((curpos - 1) % 4) + 1;        
        return [bar, beat];
    }
    function barBeatToPos(bar, beat){
        curpos = ((bar - 1) * 4) + (beat);
        return curpos;
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


});