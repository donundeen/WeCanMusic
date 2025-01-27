
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

    let score = new NewScore('scoreDivID'); // Initialize with the ID of the score div
 //   score.textToScore("1:1 Gm\n2:1 Fm\n6:2 A M\n8:1 Fm\n9:1 Gm");

    score.changeCallback = function(){
        console.log("score changed");
        sendScore();
    }


    let orchestra = new Orchestra("#orchestraDiv");
    // some note characters: 
    // ♭ 𝅘𝅥𝅮𝅗𝅥°♭𝅘𝅥𝅗𝅥𝅗 𝄼 𝄽 

    //  const ws = new WebSocket('ws://localhost:8080');
    //const ws = new WebSocket('ws://192.168.4.34:8080');
    //const ws = new WebSocket('ws://10.102.134.110:8080');
    let websocketurl = WEBSOCKET_PROTOCOL+host+':'+WEBSOCKET_PORT;
    console.log("trying to start websocket server ", websocketurl);
    let ws = new WebSocket(websocketurl);

    orchestra.ws = ws;

    ws.wsready = false;  
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
            updateBeat(msg.data[0],msg.data[1],msg.data[2]);
        }

        if(msg.address == "score"){
            console.log("got score", msg);
            updateScore(msg.data);
        }

        if(msg.address == "scorelist"){
            updateScoreList(msg.data);
        }
        if(msg.address == "performancelist"){
            console.log("got performancelist", msg);
            updatePerformanceList(msg.data);
        }
        if(msg.address == "performancename"){
            updatePerformanceName(msg.data);
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

    function updateScore(data){
        console.log("updating score", data);
        scoreText = data.text;
        curscore = data.scorename;

        $(".scorenametext").val(curscore);
        if(!scoreText){
            return;
        }
        score.textToScore(scoreText);
        buildScoreListOptions();
    }


    function updateScoreList(rscorelist){
        console.log("got scorelist");
        scorelist = rscorelist;
        buildScoreListOptions();
    }

    function updatePerformanceList(rperformancelist){
        console.log("got performancelist", rperformancelist);
        performancelist = rperformancelist;
        buildPerformanceListOptions();
    }    

    function updatePerformanceName(rperformancename){
        curperformance = rperformancename;
        buildPerformanceListOptions();
    }

    function updateBeat(position, bar, beat){
        $(".position").text(bar+":"+beat);
        score.highlightBeat(bar, beat);
    }
        
    function sendScore(){
        let text = score.scoreToText();
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


    /****** PLAYER CONTROLS */
    $(".play").click(function(){
        message("play", 1);
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
    /****** END PLAYER CONTROLS */


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