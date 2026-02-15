
let useHttps = false;
let websocketPort = 80;
let websocketProtocol = "ws://";
if(useHttps){
    websocketPort = 443;
    websocketProtocol = "wss://";
}
let voiceList = [[1,79,"nodata"],[0,78,"nodata"]];
let scoreList = ["simplescore.txt"];
let curScore = "simplescore.txt";
let performanceList = [];
let curPerformance = "";

let noteLengthNames = ["Double Whole", "Whole", "Half","Half Triplet","Quarter","Quarter Triplet","Eighth","Eighth Triplet","Sixteenth"];


$(function() {

    console.log("starting");

    $(".copyMe").hide();


    // chnage this depending on location of webserver. Figure out a way to make this more dynamic...
    let host =  window.location.host;
    host = host.replace(/:[0-9]+/,"");
    // remove port
    console.log(host);

    //  const ws = new WebSocket('ws://localhost:8080');
    //const ws = new WebSocket('ws://192.168.4.34:8080');
    //const ws = new WebSocket('ws://10.102.134.110:8080');
    let websocketUrl = websocketProtocol+host+':'+websocketPort;
    console.log("trying to start websocket server ", websocketUrl);
    let ws = new WebSocket(websocketUrl);

    ws.wsready = false;  


    /***************** SCORE EDITOR SETUP *****************/
    let score = new NewScore('scoreDivID'); // Initialize with the ID of the score div
 //   score.textToScore("1:1 Gm\n2:1 Fm\n6:2 A M\n8:1 Fm\n9:1 Gm");
    score.changeCallback = function(){
        let text = score.scoreToText();
        let scoreName = performanceManager.currentScoreName;
        curScore = $(".scoreNameText").val();
        console.log("sending score ", scoreName, text);
        let msg = {scoreName: scoreName, 
                text: text
        }
        message("saveScore", msg);
    }
    /***************** END SCORE EDITOR SETUP *****************/


    /***************** ORCHESTRA SETUP *****************/
    let orchestra = new Orchestra("#orchestraDiv");
    // some note characters: 
    // ♭ 𝅘𝅥𝅮𝅗𝅥°♭𝅘𝅥𝅗𝅥𝅗 𝄼 𝄽 
    orchestra.ws = ws;
    /***************** END ORCHESTRA SETUP *****************/


    /***************** PERFORMANCE MANAGER SETUP*****************/
    let performanceManager = new PerformanceManager("#performanceManager");

    performanceManager.sendScoreCallback = function(){
        let text = score.scoreToText();
        let scoreName = performanceManager.currentScoreName;
        curScore = $(".scoreNameText").val();
        console.log("sending score ", scoreName, text);
        let msg = {scoreName: scoreName, 
                text: text
        }
        message("saveScore", msg);
    }

    performanceManager.sendPerformanceCallback = function(){
        let performanceName = performanceManager.currentPerformanceName;
        console.log("sending performance ", performanceName);
        let msg = {performanceName: performanceName}
        message("savePerformance", msg); 
    }

    performanceManager.getPerformanceCallback = function(performanceName){
        console.log("selecting   " + performanceName);
        message("loadPerformance", performanceName);        
    }

    performanceManager.getScoreCallback = function(scoreName){
        console.log("selecting   " + scoreName);
        message("loadScore", scoreName);        
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
        message("getVoiceList",1);        
        message("getPerformanceList",1);
        message("getScoreList",1);
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


        if(msg.address == "curBeat"){
            let bar = msg.data[1];
            let beat = msg.data[2];
            transport.updateBeat(bar, beat);
            score.highlightBeat(bar, beat);
        }

        if(msg.address == "score"){
            console.log("got score", msg);
            console.log("updating score", msg.data);
            scoreText = msg.data.text;
            curScore = msg.data.scoreName;
    
            performanceManager.updateCurrentScoreName(curScore);
            performanceManager.buildScoreListOptions();
            
            if(!scoreText){
                return;
            }
            score.textToScore(scoreText);
        }

        if(msg.address == "scoreList"){
            console.log("got scorelist");
            scoreList = msg.data;
            console.log("scorelist", scoreList);
            performanceManager.scoreList = scoreList;
            performanceManager.buildScoreListOptions();
        }
        if(msg.address == "performanceList"){
            console.log("got performancelist", msg);
            let performanceList = msg.data;
            performanceManager.performanceList = performanceList;
            performanceManager.buildPerformanceListOptions();
        }
        if(msg.address == "performanceName"){
            let curPerformance = msg.data;
            performanceManager.updateCurrentPerformanceName(curPerformance);
            performanceManager.buildPerformanceListOptions();            
        }


        if(msg.address =="addInstrument"){
            console.log("adding instrument");
            orchestra.instrumentAnnounced(msg);
        }
        //     // I don't think this is used. It doesn't make any sense..
        if(msg.address =="updateInstrument"){
            orchestra.updateInstrumentData(msg.data.deviceName, msg.data);
        }
        if(msg.address =="makeNote"){
            console.log("got makeNote", msg);
            orchestra.updateInstrumentMakenote(msg.data.deviceName, msg.data);
        }
        if(msg.address == "voiceList"){
            console.log("got voiceList");
            orchestra.updateVoiceList(msg.data);
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