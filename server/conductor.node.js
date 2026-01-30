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




let bpm = 120; // this should eventually be configurable as a performance variable in the UI

// defining some note lengths
let scoreName = config.scoreName; //"simplescore.txt";
let UDPSendIP = config.UDPSendIP; //"10.0.0.255";
//let UDPSendIP = "10.0.0.131";
let UDPSendPort = config.UDPSendPort;//7004;
let UDPListenPort = config.UDPListenPort;//7005;


let useHTTPS = config.useHTTPS;
let websocketPort = config.websocketPort;
let webserverPort = config.webserverPort;
if(useHTTPS){
    websocketPort = config.httpsWebsocketPort;
    webserverPort = config.httpsWebserverPort;
}

let defaultWebpage = config.defaultWebpage; //"conductor.html";

// defining some useful curves for tweaking instrument values. used by both the localinstrument and arduino instruments
// they are named for easier communication with the arduino devices over osc
let curveCollection = {
    str8up : [0., 0., 0., 1., 1., 0.], // 1
    str8dn : [0., 1., 0., 1., 0., 0.], // 2
    logup : [0., 0., 0., 1., 1., -0.65], // 3
    logdn : [0., 1., 0., 1., 0., -0.65], // 4 not sure if this is right
    str8upthresh : [0., 0., 0., 0.05, 0., 0., 1., 1., 0.], // 5 
    str8dnthresh : [0., 1., 0., 0.95, 0., 0., 1., 0., 0., 1., 0., 0.], // 6
    logupthresh : [0., 0., 0., 0.05, 0., 0., 1., 1., -0.65], // 7
    logdnthresh : [0., 1., 0., 0.95, 0., -0.65, 1., 0., -0.65] //8
}

// we should get these values from the instruments themselves when we can
let synthDeviceVoices = {
    "thread1" : [0,10],
    "thread2" : [0,11],
    "thread3" : [0,12],
    "thread4" : [0,13],
    "thread5" : [0,14],
    "thread6" : [0,15],
    "thread7" : [0,16],
    "thread8" : [0,17],
    "thread9" : [0,18],
    "thread10" : [0,19],
    "RENAME_ME" : [0,20]
}


//////////////////////////////////////////////////////////////////
///// Defining Note Length Names /////////////////////////////////
///// the order needs to match the order in the arduino code 
let  noteLengths = ["WN", "HN", "HN3", "QN", "QN3", "N8", "N83", "N16"];

let noteLengthNames = ["Whole", "Half","Half Triplet","Quarter","Quarter Triplet","Eighth","Eighth Triplet","Sixteenth"];

////////////////// END CONFIG VARIABLES //////////////////////////


/// SET UP OSC SERVER - SENDS AND RECIEVES MESSAGES FROM DEVICES
var osc = require("osc");
var udpPort = new osc.UDPPort({
    localAddress: "0.0.0.0",
    localPort: UDPListenPort, // this port for listening
    broadcast: true,
    metadata: true
});

udpPort.open();


/////////////////////////////////////
// SET UP THE MODULE OBJECTS
// transport generates beat messges
const Transport    = require("./modules/transport.module.js");
// Score reader outputs messages at timed intervals
const ScoreReader  = require("./modules/scorereader.module.js");
// thoeryEngine generates lists of notes from theory terms (eg A MINORPENTATONIC)
const TheoryEngine = require("./modules/theoryengine.module.js");
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

db.log("starting");

// initialize the modules
let orchestra = new Orchestra({db:db});
let transport  = new Transport({db:db});
let score  = new ScoreReader({db:db});
let theory = new TheoryEngine({db:db});
let socket =  new SocketServer({db:db});
let persistence = new Persistence({db:db});
socket.useHTTPS = useHTTPS;
socket.websocketPort  = websocketPort;
socket.webserverPort  = webserverPort;
socket.defaultWebpage = defaultWebpage;


performance = new Performance({db:db});
statusMelodies = new StatusMelodies({db:db});
statusMelodies.midiHardwareEngine = midiHardwareEngine;


// config score obect
score.setScoreDir(config.scoreDir);

// set up performance object with links to other objeccts
performance.performanceDir = config.performanceDir;
performance.score = score;
performance.transport = transport;
performance.orchestra = orchestra;
// set up listeners/callbacks for score, transport, and orchestra
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
transport.performanceUpdateCallback = function(transportObj){
    db.log("transport.performanceUpdateCallback")

    //send message to webpage?
    //restart transport? not sure....
};
transport.performancePropUpdateCallback =function(transportobj, propname, proptype, propvalue ){
    db.log("transport.performancePropUpdateCallback") 
};



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
        db.log("sending udp message " + address, args, UDPSendIP, UDPSendPort);
        // send prop to all devices, but route will only be accepted by the one with the same name 
        udpPort.send(bundle, UDPSendIP, UDPSendPort);
    }    

    // send prop and value over OSC to the device, one value at a times
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


// soundfont file setup - needs to match what's in the fluidsynth startup script config
let soundfont = config.soundfont;//'./soundfonts/141-Compleet bank synth.sf2'
let soundfontInstrumentList = config.soundfontInstrumentList; //'./soundfonts/141-Compleet bank synth.sf2.voicelist.json'




//////////////////////////////////////
// SET UP ORCHESTRA
orchestra.synthDeviceVoices = synthDeviceVoices;
orchestra.midiHardwareEngine = midiHardwareEngine;
orchestra.persistence = persistence;
orchestra.soundfontFile = soundfont;
orchestra.soundfontVoiceListFile = soundfontInstrumentList;
orchestra.theoryEngine = theory;


///////////////////////////////
// SETUP TRANSPORT/SCORE CONNECTION
// tell the score to do smomething when a beat happens
// send a data over websockets with the transport info
transport.setBeatCallback(function(beatCount, bar, beat, transport){
    score.onBeat(beatCount, bar, beat, transport);
    let data = [beatCount, bar, beat]; 
    socket.sendMessage("curBeat", data);    
});


////////////////////////////////////////
// SCORE/THEORY CONNECTION
// when score produces a messages, send it to the theory engine
score.setMessageCallback(function(msg){
    theory.runSetter(msg, "fromScore");
});

// set up the theory engine with any initial messages from the config
// this way there can be a default theory state before any messages are received
config.initialTheoryMsgs.forEach(function(msg){
    theory.runSetter(msg, "fromConfig");
});


////////////////////////////////////////
// HANDLING MESSAGES FROM THE WEBPAGE
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
    UDPSendIP: UDPSendIP,
    UDPSendPort: UDPSendPort,
    soundfont: soundfont
});
websocketRouter.attach();



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
    udpPort.send(bundle, UDPSendIP, UDPSendPort);
    // and send to local ochestra
    orchestra.allLocalInstrumentSetValue("noteList", msg);   
    orchestra.allUDPInstrumentSetValue("noteList", msg);   
});


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


//////////////////////////////////////
// setting things up and starting
// set the bpm in the transport and the orchestra
transport.updateBpm(bpm);
orchestra.allLocalInstrumentSetValue("bpm", bpm);

// set the name of the score
score.scoreFilename = scoreName;

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
    db.log("+++++++++++sending udp message /all/req_ann", args, UDPSendIP, UDPSendPort);
    // send "requestannounce" to all active devices, so they'll re-send their announce message
    udpPort.send(bundle, UDPSendIP, UDPSendPort);
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
