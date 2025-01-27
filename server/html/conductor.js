
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

    $(".copyme").hide();


    // chnage this depending on location of webserver. Figure out a way to make this more dynamic...
    let host =  window.location.host;
    host = host.replace(/:[0-9]+/,"");
    // remove port
    console.log(host);

    //  const ws = new WebSocket('ws://localhost:8080');
    //const ws = new WebSocket('ws://192.168.4.34:8080');
    //const ws = new WebSocket('ws://10.102.134.110:8080');
    let websocketurl = WEBSOCKET_PROTOCOL+host+':'+WEBSOCKET_PORT;
    console.log("trying to start websocket server ", websocketurl);
    let ws = new WebSocket(websocketurl);

    ws.wsready = false;  


    /***************** SCORE EDITOR SETUP *****************/
    let score = new NewScore('scoreDivID'); // Initialize with the ID of the score div
 //   score.textToScore("1:1 Gm\n2:1 Fm\n6:2 A M\n8:1 Fm\n9:1 Gm");
    score.changeCallback = function(){
        console.log("score changed");
        sendScore();
    }
    /***************** END SCORE EDITOR SETUP *****************/


    /***************** ORCHESTRA SETUP *****************/
    let orchestra = new Orchestra("#orchestraDiv");
    // some note characters: 
    // ♭ 𝅘𝅥𝅮𝅗𝅥°♭𝅘𝅥𝅗𝅥𝅗 𝄼 𝄽 
    orchestra.ws = ws;
    /***************** END ORCHESTRA SETUP *****************/


    /***************** PERFORMANCE MANAGER SETUP*****************/
    let performancemanager = new PerformanceManager("#performancemanager");

    performancemanager.sendScoreCallback = function(){
        let text = score.scoreToText();
        let scorename = performancemanager.currentScoreName;
        curscore = $(".scorenametext").val();
        console.log("sending score ", scorename, text);
        let msg = {scorename: scorename, 
                text: text
        }
        message("savescore", msg);
    }

    performancemanager.sendPerformanceCallback = function(){
        let performancename = performancemanager.currentPerformanceName;
        console.log("sending performance ", performancename);
        let msg = {performancename: performancename}
        message("saveperformance", msg); 
    }

    performancemanager.getPerformanceCallback = function(performancename){
        console.log("selecting   " + performancename);
        message("loadperformance", performancename);        
    }

    performancemanager.getScoreCallback = function(scorename){
        console.log("selecting   " + scorename);
        message("loadscore", scorename);        
    }
    /***************** END PERFORMANCE MANAGER SETUPs*****************/



    /***************** TRANSPORT SETUP *****************/
    let transport = new Transport("#transportDiv");
    /****** PLAYER CONTROLS */
    transport.playClicked = function(){
        message("play", 1);
    }

    transport.stopClicked = function(){
        message("stop", 1);
    }

    transport.pauseClicked = function(){
        message("pause", 1);
    }

    transport.resetClicked = function(){
        message("reset", 1);
    }
    /****** END PLAYER CONTROLS */

    /***************** END TRANSPORT SETUP *****************/   

    
    // Browser WebSockets have slightly different syntax than `ws`.
    // Instead of EventEmitter syntax `on('open')`, you assign a callback
    // to the `onopen` property.
    ws.onopen = function() {
        ws.wsready = true;
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


        if(msg.address == "curbeat"){
            let bar = msg.data[1];
            let beat = msg.data[2];
            transport.updateBeat(bar, beat);
            score.highlightBeat(bar, beat);
        }

        if(msg.address == "score"){
            console.log("got score", msg);
            console.log("updating score", msg.data);
            scoreText = msg.data.text;
            curscore = msg.data.scorename;
    
            performancemanager.updateCurrentScoreName(curscore);
            performancemanager.buildScoreListOptions();
            
            if(!scoreText){
                return;
            }
            score.textToScore(scoreText);
        }

        if(msg.address == "scorelist"){
            console.log("got scorelist", msg);
            scorelist = msg.data;
            performancemanager.scorelist = scorelist;
            performancemanager.buildScoreListOptions();
        }
        if(msg.address == "performancelist"){
            console.log("got performancelist", msg);
            let performancelist = msg.data;
            performancemanager.performanceList = performancelist;
            performancemanager.buildPerformanceListOptions();
        }
        if(msg.address == "performancename"){
            let curperformance = msg.data;
            performancemanager.updateCurrentPerformanceName(curperformance);
            performancemanager.buildPerformanceListOptions();            
        }


        if(msg.address =="addinstrument"){
            console.log("adding instrument");
            orchestra.instrumentAnnounced(msg);
        }
        //     // I don't think this is used. It doesn't make any sense..
        if(msg.address =="updateinstrument"){
            orchestra.updateInstrumentData(msg.data.device_name, msg.data);
        }
        if(msg.address =="makenote"){
            orchestra.updateInstrumentMakenote(msg.data.device_name, msg.data);
        }
        if(msg.address == "voicelist"){
            orchestra.updateVoicelist(msg.data);
        }
        // add message about adding a new instrument here
    }

    function message(address, data){

        let msg = {address : address,
            data: data};  

        console.log("sending message ", msg);
        if(ws.wsready){
        //    var buf = new Buffer.from(JSON.stringify(msg));
            ws.send(JSON.stringify(msg));
        }else{
            console.log("ws not ready");
        }
    }






});