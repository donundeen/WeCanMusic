/*
Conductor.node.js is the code that runs. 
It connects the various modules, 
holds the configuration variables
and shows how messages are routed from one to the other.
*/
const fs = require('node:fs');
  
////////////////////////
// LOAD MAIN CONFIG FILE
const merge = require('deepmerge')
let config = require("./configs/conductor.config.js");
let envConfig = require("./configs/env.config.js");
let env = envConfig.env;
let machineConfig = require("./configs/"+env+".conductor.config.js");
config.env = env;
config = {...config, ...machineConfig, ...envConfig};

////////////////////////////////
// LOAD DEBUGGING FRAMEWORK
const Debugging = require('./modules/debugging.module.js');
// TURN DEBUGGING ON/OFF HERE
db = new Debugging();
db.active = config["db.active"];
db.trace = false;
db.log("starting","now",[1,2,3]);
db.log(config);



/////////////////////////////////////
// SET UP THE MODULE OBJECTS
// transport generates beat messges
const Transport    = require("./modules/transport.module.js");
// Score reader outputs messages at timed intervals
const ScoreReader  = require("./modules/scorereader.module.js");
// thoeryEngine generates lists of notes from theory terms (eg A MINORPENTATONIC)
const TheoryEngine = require("./modules/theory.theoryengine.module.js");
// socketServer is the web page that gets control messages
const SocketServer = require("./modules/socketserver.module.js");
// performance saves and restores settings that might change per performance, song, etc
const Performance = require("./modules/performance.module.js");
// orchestra controls local instruments that generate midi values, and /or actual tones
const Orchestra    = require("./modules/orchestra.module.js");
// Status Melodies = plays specific note series to announce things like startup, crashes, etc.
const StatusMelodies = require('./modules/statusmelodies.module.js');
// persistence saves and restores settings that might change per performance, song, etc
const Persistence = require('./modules/persistence.module.js');
// oscrouter encapsulates routing of inbound OSC/UDP messages
const OscRouter = require("./modules/router.oscrouter.module.js");
// websocketrouter encapsulates routing of inbound websocket messages
const WebsocketRouter = require("./modules/router.websocketrouter.module.js");

// initialize the modules
let orchestra = new Orchestra({db:db});
let transport  = new Transport({db:db});
let score  = new ScoreReader({db:db});
let theory = new TheoryEngine({db:db});
let persistence = new Persistence({db:db});
let socket =  new SocketServer({db:db});
let performance = new Performance({db:db});
let statusMelodies = new StatusMelodies({db:db});



db.log("starting");



/////////////////////////////////////
// set up bluetooth module, if we're using it
let bluetooth = false;
if(config["bluetooth.active"]){
    Bluetooth = require('./modules/bluetooth.module.js');
    bluetooth = new Bluetooth();
    bluetooth.active = config["bluetooth.active"];
    bluetooth.deviceID = config["bluetooth.deviceID"]; 
    bluetooth.keepUp();
}


///////////////////////////////////////////////////////////////
// midi hardware setup:
///////////////////////////////////////////////////////////////
const MidiOuts = require('./modules/midiouts.module.js');
let midiWaitForPortnames = config.midiWaitForPortnames;
let useMidiOut = config.useMidiOut; // whether or not to send midi values through a hardware output, via easymidi
midiHardwareEngine = new MidiOuts({db:db, active: useMidiOut, matches: "all", waitFor : midiWaitForPortnames});
midiHardwareEngine.init();
midiHardwareEngine.quantizeTime = config.quantizeTime;


///////////////////////////////////////////////////////////////
/// SET UP OSC SERVER - SENDS AND RECIEVES MESSAGES FROM DEVICES
var osc = require("osc");
var udpPort = new osc.UDPPort({
    localAddress: "0.0.0.0",
    localPort: config.UDPListenPort,
    broadcast: true,
    metadata: true
});
udpPort.open();


///////////////////////////////////////////////////////////////
// SET UP THE SOCKET SERVER FOR THE WEB PAGE
socket.useHTTPS = config.useHTTPS;
if(config.useHTTPS){
    socket.websocketPort  = config.httpsWebsocketPort;
    socket.webserverPort  = config.httpsWebserverPort;
}else{
    socket.websocketPort  = config.websocketPort;
    socket.webserverPort  = config.webserverPort;
}
socket.defaultWebpage = config.defaultWebpage;


////////////////////////////////////////
// WEBSOCKET HANDLING MESSAGES FROM THE WEBPAGE
// when the websocket gets a message, send it where it needs to go
websocketRouter = new WebsocketRouter({
    db: db,
    socket: socket,
    theory: theory,
    score: score,
    performance: performance,
    orchestra: orchestra,
    transport: transport,
    midiHardwareEngine: midiHardwareEngine,
    udpPort: udpPort,
    osc: osc,
    UDPSendIP: config.UDPSendIP,
    UDPSendPort: config.UDPSendPort,
    soundfont: config.soundfont
});
websocketRouter.attach();


///////////////////////////////////////////////////////////////
// OSC ROUTING SETUP
/////////////////////////////////////////////////////////////////
// set up OSC routing (moved out of this file)
oscRouter = new OscRouter({
    db: db,
    udpPort: udpPort,
    orchestra: orchestra,
    performance: performance,
    statusMelodies: statusMelodies,
    transport: transport,
    socket: socket
});
oscRouter.attach();


///////////////////////////////////////////////////////////////
// SET UP THE STATUS MELODIES OBJECT WITH LINKS TO OTHER OBJECTS
statusMelodies.midiHardwareEngine = midiHardwareEngine;


///////////////////////////////////////////////////////////////
//  PERFORMANCE OBJECT SETUP
///////////////////////////////////////////////////////////////
performance.performanceDir = config.performanceDir;
performance.score = score;
performance.transport = transport;
performance.orchestra = orchestra;


///////////////////////////////////////////////////////////////
// SCORE OBJECT SETUP
///////////////////////////////////////////////////////////////
score.scoreDir = config.scoreDir;
score.performanceUpdateCallback = function(scoreObj){
    // send messages to webpage
    let data = {scoreName : scoreObj.scoreFilename,
        text: scoreObj.scoreText
    };
    db.log("sending score data for new performance", data);
    socket.sendMessage("score", data);     

};
score.performancePropUpdateCallback = function(scoreObj, propName, propType, propValue ){
    db.log("score performancePropUpdateCallback");
    
};
// when score produces a messages, send it to the theory engine
score.setMessageCallback(function(msg){
    theory.runSetter(msg, "fromScore");
});


///////////////////////////////////////////////////////////////
// ORCHESTRA OBJECT SETUP
//////////////////////////////////////
orchestra.synthDeviceVoices = config.synthDeviceVoices;
orchestra.midiHardwareEngine = midiHardwareEngine;
orchestra.persistence = persistence;
orchestra.soundfontFile = config.soundfont;;
orchestra.soundfontVoiceListFile = config.soundfontInstrumentList;
orchestra.theoryEngine = theory;

orchestra.performanceUpdateCallback = function(instrument, perfData){
    db.log("instrument.performanceUpdateCallback")

    // send deivce name and newData to web page (all instrument data at once)
    db.log("sending perfData");
    db.log(perfData);
    socket.sendMessage("updateInstrument", perfData);
};
orchestra.performancePropUpdateCallback = function(instrument, propName, propType, propValue ){
    db.log("instrument.performancePropUpdateCallback");

    let deviceName = instrument.deviceName;
    let prop = propName;
    let value = propValue;
    let instrType = instrument.type;
    if(instrType == "local"){
//        orchestra.local_instrument_set_value(device_name, prop, value);
    }else if(instrType == "udp"){
        // set locally in orchestra AND remotely on device.
        orchestra.udpInstrumentSetValue(deviceName, prop, value);
        db.log("set udp instr value", deviceName, prop, value);
        // sending UDP message to remote instruments
        let type = "s";
        if(typeof value == "number" ){
            value = parseInt(value);
            type = "i";
        };
        let address = "/"+deviceName+"/config/"+prop;
        let args = [{type: type, value: value}];
        let bundle = {
            timeTag: osc.timeTag(1),
            packets :[{
                address: address,
                args: args
            }]
        }
        db.log("sending udp message " + address, args, config.UDPSendIP, config.UDPSendPort);
        // send prop to all devices, but route will only be accepted by the one with the same name 
        udpPort.send(bundle, config.UDPSendIP, config.UDPSendPort);
    }    
    // send prop and value over OSC to the device, one value at a times
};

// some things to do whenever an instrument makes a note
// send the data to the webpage to display
orchestra.makeNoteCallback = function(instr, pitch, velocity, duration){
    let deviceName = instr.deviceName;


    // tell the webpage what devices played what note, so it can update the UI
    // NOTE: this might eat up a lot of network, so we could take it out.
    // it's just useful to show that an instrument is still active
    let dataObj = {deviceName: deviceName, 
                    pitch: pitch, 
                    velocity: velocity,
                    duration: duration}
    db.log("sending message", dataObj)
    socket.sendMessage("makeNote", dataObj );
}



///////////////////////////////////////////////////////////////
// TRANSPORT SETUP
/////////////////////////////////////////////////////////////////
transport.performanceUpdateCallback = function(transportObj){
    db.log("transport.performanceUpdateCallback")

    //send message to webpage?
    //restart transport? not sure....
};
transport.performancePropUpdateCallback =function(transportobj, propname, proptype, propvalue ){
    db.log("transport.performancePropUpdateCallback") 
};

// setting up quantization in instruments on transport start, 
// disable on transport stop
transport.startCallback = function(transportobj){
    db.log("transport.startCallback");
    midiHardwareEngine.quantizeTime = config.quantizeTime;
    transport.quantizeTime = config.quantizeTime;
    if(config.quantizeTime){   
        db.log("setting quantizeCallback");
        transport.quantizeCallback = function(transport){
            midiHardwareEngine.processMakeNoteQueue();
        }
    }
};
transport.stopCallback = function(transportObj){
    db.log("transport.stopCallback");
    midiHardwareEngine.quantizeTime = null;
    transport.quantizeTime = null;
    transport.quantizeCallback = null;
};
// tell the score to do smomething when a beat happens
// send a data over websockets with the transport info
transport.setBeatCallback(function(beatCount, bar, beat, transport){
    score.onBeat(beatCount, bar, beat, transport);
    let data = [beatCount, bar, beat]; 
    socket.sendMessage("curBeat", data);    
});


///////////////////////////////////////////////////////////////
// THEORY ENGINE SETUP
/////////////////////////////////////////////////////////////////
// when the theory engine produces a list of notes,
// send it out over udp (to networked devices)
// also send it to local instruments in the orchestra
theory.setMidiListCallback(function(msg){
    //db.log("theory output ");
    //db.log(msg);
    let args = msg.map(function(x) {return {type: "i", value: parseInt(x)};});
    let bundle = {
        timeTag: osc.timeTag(1),
        packets :[{
            address: "/all/noteList",
            args: args
        }]  
    }
    // send noteList to all UDP connected devices
    udpPort.send(bundle, config.UDPSendIP, config.UDPSendPort);
    // and send to local ochestra
    orchestra.allLocalInstrumentSetValue("noteList", msg);   
    orchestra.allUDPInstrumentSetValue("noteList", msg);   
});


///////////////////////////////////////////////////////////////
// some randome functions that maybe aren't needed anymore
/////////////////////////////////////////////////////////////////

/// FLUIDSYNTH SETUP
function setSoundfontFile(filename){
    // copy this file to common_soundfont file

    // restart FluidSynth
    resetFluidSynth();
}

function resetFluidSynth(){
    const { exec } = require("child_process");
    
    exec("systemctl --user restart fluidsynth.service", (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
    });
    setTimeout(function(){
        let midiFound = false;
        const MidiOuts = require('./modules/midiouts.module.js');
        let useMidiOut = config.useMidiOut; // whether or not to send midi values through a hardware output, via easymidi
        midiHardwareEngine = new MidiOuts({db:db, active: useMidiOut});
        midiHardwareEngine.init();
        
        statusMelodies.midiHardwareEngine = midiHardwareEngine;
        orchestra.midiHardwareEngine = midiHardwareEngine;
        orchestra.resendInstrumentsBankProgramChannel();
        statusMelodies.playReady();  
    },5000);    
}


///////////////////////////////////////////////////////////////
// STARTING THE CONDUCTOR
/////////////////////////////////////////////////////////////////

//////////////////////////////////////
// setting things up and starting
// set the bpm in the transport and the orchestra
// set up the theory engine with any initial messages from the config
// this way there can be a default theory state before any messages are received
config.initialTheoryMsgs.forEach(function(msg){
    theory.runSetter(msg, "fromConfig");
});


transport.updateBpm(config.bpm);
orchestra.allLocalInstrumentSetValue("bpm", config.bpm);

// set the name of the score
score.scoreFilename = config.scoreName;

// start the socket server and the web server
//socket.startExpressWebServer();
//socket.startSocketServer();
socket.startWebAndSocketServer();

setTimeout(function(){
    // request that all listening instruments announce themselves:
    let args = [{type: "i", value: 1}];
    let bundle = {
        timeTag: osc.timeTag(1),
        packets :[{
            address: "/all/req_ann", // request announce
            args: args
        }]
    }

    db.log("+++++++++++++++++++++++++++++++++++++++");
    db.log("+++++++++++sending udp message /all/req_ann", args, config.UDPSendIP, config.UDPSendPort);
    // send "requestannounce" to all active devices, so they'll re-send their announce message
    udpPort.send(bundle, config.UDPSendIP, config.UDPSendPort);
},2000);

// open the score file, 
// and when it's open, run the score (if the config file says so)
score.openScore(function(){    
    statusMelodies.playReady();
    if(config.playerState == "play"){
        transport.start();
    }else{
        // even if the player state is not play, we want to read the very first score line
        // so that the theory engine has a starting point
        score.onBeat(1, 1, 1, transport);
    }
});
