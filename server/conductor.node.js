/*
Conductor.node.js is the code that runs. 
It connects the various modules, 
holds the configuration variables
and shows how messages are routed from one to the other.
*/
const fs = require('node:fs');

var exec = require('child_process').exec;
  
////////////////////////
// LOAD MAIN CONFIG FILE
const merge = require('deepmerge')
let envConfig = require("./env.config.js");
let env = envConfig.env;
let config = require("./conductor.config.js");
let machineConfig = require("./"+env+".conductor.config.js");
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

let bluetooth = false;
if(config["bluetooth.active"]){
    Bluetooth = require('./modules/bluetooth.module.js');
    bluetooth = new Bluetooth();
    bluetooth.active = config["bluetooth.active"];
    bluetooth.deviceID = config["bluetooth.deviceID"]; 
    bluetooth.keepUp();
}
////////////////// CONFIG VARIABLES //////////////////////////
let synthType = config.synthType; // tiny or fluidsynth or false
// tiny can't handle too many notes at once, and some don't sound good:
let badTinyVoices = [6,7,8,22,23,24,40,41,42,43,44,55,56,57,59,60,61,62,63,64,65,66,67,68,69,71,72, 84, 90, 105,110,118,119,120,121,122,123,124,125,126,127];



///////////////////////////////////////////////////////////////
// midi hardware setup:
///////////////////////////////////////////////////////////////

const MidiOuts = require('./modules/midiouts.module.js');
let midiWaitForPortnames = config.midiWaitForPortnames;
let useMidiOut = config.useMidiOut; // whether or not to send midi values through a hardware output, via easymidi
midiHardwareEngine = new MidiOuts({db:db, active: useMidiOut, matches: "all", waitfor : midiWaitForPortnames});
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

db.log("starting");

// initialize the modules
orchestra = new Orchestra({db:db});
trans  = new Transport({db:db});
score  = new ScoreReader({db:db});
theory = new TheoryEngine({db:db});
socket =  new SocketServer({db:db});
persistence = new Persistence({db:db});
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
performance.transport = trans;
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
trans.performanceUpdateCallback = function(transportObj){
    db.log("trans.performanceUpdateCallback")

    //send message to webpage?
    //restart transport? not sure....
};
trans.performancePropUpdateCallback =function(transportobj, propname, proptype, propvalue ){
    db.log("trans.performancePropUpdateCallback") 
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
trans.startCallback = function(transportobj){
    db.log("trans.startCallback");
    midiHardwareEngine.quantizeTime = config.quantizeTime;
    trans.quantizeTime = config.quantizeTime;
    if(config.quantizeTime){   
        db.log("setting quantizeCallback");
        trans.quantizeCallback = function(transport){
            midiHardwareEngine.processMakeNoteQueue();
        }
    }
};
trans.stopCallback = function(transportObj){
    db.log("trans.stopCallback");
    midiHardwareEngine.quantizeTime = null;
    trans.quantizeTime = null;
    trans.quantizeCallback = null;
};

// intialize the midi synth (fluid or tiny)
let synth = false;

// soundfont file setup - needs to match what's in the fluidsynth startup script config
let soundfont = config.soundfont;//'./soundfonts/141-Compleet bank synth.sf2'
let soundfontInstrumentList = config.soundfontInstrumentList; //'./soundfonts/141-Compleet bank synth.sf2.voicelist.json'




//db.testSynth(synth, bluetooth);
//////////////////////////////////////
// SET UP ORCHESTRA
orchestra.synth = synth;
orchestra.synthDeviceVoices = synthDeviceVoices;
orchestra.midiHardwareEngine = midiHardwareEngine;
orchestra.persistence = persistence;

orchestra.soundfontFile = soundfont;
orchestra.soundfontVoiceListFile = soundfontInstrumentList;


///////////////////////////////
// SETUP TRANSPORT/SCORE CONNECTION
// tell the score to do smomething when a beat happens
// send a data over websockets with the transport info
trans.setBeatCallback(function(beatCount, bar, beat, transport){
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
socket.setMessageReceivedCallback(function(msg){

    // /chord message sets the chord for the theory engine to make a notelist
    let result = routeFromWebsocket(msg, "chord", function(msg){
        theory.runSetter(msg, "fromSocket");
    });

    // getscore ask for the contents and name of the current score
    routeFromWebsocket(msg, "getScore", function(msg){     
        let data = {scoreName : score.scoreFilename,
                text: score.scoreText};
        socket.sendMessage("score", data);    
    });

    // getscorelist asks for a list of all scores
    routeFromWebsocket(msg, "getScoreList", function(msg){
        score.getScoreList(function(list){
            socket.sendMessage("scoreList", list);    
        });
    });

    // getscorelist asks for a list of all scores
    routeFromWebsocket(msg, "getPerformanceList", function(msg){
        performance.getPerformanceList(function(list){
            socket.sendMessage("performanceList", list);    
        });
    });    

    // getvoicelist ask for a list of the
    // bank:program and name of every instrument in the soundfont
    routeFromWebsocket(msg, "getVoiceList", function(msg){
        // get voicelist and send as socket.sendMessage("voicelist", voicelist);
        orchestra.soundfontFile = soundfont;
        orchestra.getVoiceList(function(voiceList){    
            console.log("sending voiceList", voiceList);
            socket.sendMessage("voiceList", voiceList);             //  trans.start();
        });        
    });


    // loadperformance sends a performance name, 
    // and triggers the loading of all those configurations where they are needed
    routeFromWebsocket(msg,"loadPerformance", function(msg){
        performance.performanceFile = msg;
        performance.loadPerformance(msg);
    });

    routeFromWebsocket(msg,"savePerformance", function(msg){
        db.log(msg);
        let filename = msg.performanceName;

        performance.performanceFile = filename;

        performance.savePerformance(filename, function(performance ){
            db.log("performance written");
            performance.getPerformanceList(function(list){
                socket.sendMessage("performanceList", list);    
            });            
        });
        
    });


    // loadscore updates the name and contents of the score objects current score,
    // and sends the name and content back to the web page
    routeFromWebsocket(msg,"loadScore", function(msg){
        score.scoreFilename = msg;
        score.openScore(function(scoreText){   
            let data = {scoreName : score.scoreFilename,
                text: scoreText
            };
            db.log("sending score data", data);
            socket.sendMessage("score", data);             //  trans.start();
        });        
    });

    // savescore sends a name and content to be saved on the server,
    // and also sends that content back to the webpage
    routeFromWebsocket(msg,"saveScore", function(msg){
        db.log(msg);
        let filename = msg.scoreName;
        let scoreText = msg.text;
        let dir = score.scoreDir;
        let fullpath = dir + "/"+filename;

        score.scoreFilename = filename;
        score.scoreText = scoreText;

        score.writeScore(function(scoreobj){
            db.log("score written");
            score.openScore(function(scoreText){   
                let data = {scoreName : score.scoreFilename,
                    text: scoreText
                };
                db.log("sending score data", data);
                socket.sendMessage("score", data);             //  trans.start();
            });
            // send the scorelist
            score.getScoreList(function(list){
                socket.sendMessage("scoreList", list);
            });            
        });
        
    });

    // stop tells the transport to stop (stop and go to beginning)
    routeFromWebsocket(msg, "stop", function(msg){
        trans.stop();
        midiHardwareEngine.quantizeActive = false;
    });

    // play tells the transport to play from current point
    routeFromWebsocket(msg, "play", function(msg){
        trans.start();
        midiHardwareEngine.quantizeActive = true;
    });

    // pause tells the transport to stop playing but don't change position
    routeFromWebsocket(msg, "pause", function(msg){
        trans.pause();
        midiHardwareEngine.quantizeActive = false;
    });

    // set bpm changes the bpm. might not be fully implemented
    routeFromWebsocket(msg, "setBpm", function(msg){
        bpm = msg.bpm;
        trans.updateBpm(bpm);
        orchestra.allInstrumentSetValue("bpm", bpm);
    });

    // web page just loaded and is ready
    routeFromWebsocket(msg, "ready", function(msg){
        let data = {scoreName: score.scoreFilename, 
                text: score.scoreText};
        socket.sendMessage("score", data);

        /* I think the web page should request this data instead of sending it unbidden
        // send the voicelist
        orchestra.getVoiceList(function(voiceList){    
            socket.sendMessage("voiceList", voiceList);             //  trans.start();
        }); 

        // send the scorelist
        score.getScoreList(function(list){
            socket.sendMessage("scoreList", list);
        });
        */

        //send all the instruments if there are currently any running:
        orchestra.allLocalInstruments(function(instrument){
            let props = instrument.getConfigProps();
            props.push({name: "instrType", value: "local"});
            socket.sendMessage("addInstrument", props);    
        });
        orchestra.allUDPInstruments(function(instrument){
            let props = instrument.getConfigProps();
            props.push({name: "instrType", value: "udp"});
            socket.sendMessage("addInstrument", props);    
        });


        if(db.createFakeInstruments){
            // TESTING THINGS HERE
            // create some dummy instruments for UI testing. they won't play
            
            let instrument = orchestra.createUDPInstrument("thread1", "TEST");
            let props = instrument.getConfigProps();
            props.push({name: "instrType", value: "udp"});
            socket.sendMessage("addInstrument", props);
            instrument.start();        

            let instrument2 = orchestra.createUDPInstrument("thread2", "2TEST2");
            let props2 = instrument2.getConfigProps();
            props2.push({name: "instrType", value: "udp"});
            socket.sendMessage("addInstrument", props2);
            instrument2.start();      
        }

    });

    // reset resets the synth and midi engine (not sure this has been tested)
    routeFromWebsocket(msg, "reset", function(text){
        db.log("~~~~~~~~~~~~~~~~`RESETTING EVERYTHING ~~~~~~~~~~~~~~~~~~~~~~~~~~~~`");
        // reset a bunch of stuff.
        // the synth:
//        synth.stop();
        if(synthtype == "FLUID"){
            synth.close();
            synth = false;
            synth = JZZ.synth.Fluid({ path: fluidpath, 
                sf: soundfont,
                args: fluidargs });
            orchestra.synth = synth;  
            orchestra.allUDPInstrumentSetValue("synth", synth);      
            orchestra.allLocalInstrumentSetValue("synth", synth);      
        }
        // midiHardwareEngine
        orchestra.midiHardwareEngine.send('reset'); 
    });


    ////////////////////////////
    // instrval gets a varname and a value, and updates the instrument's variables accordingly
    // midimin, midimax, channel, voice (bank:program), midi_nlen, etc
    // one var can be "reset" which here resets the instruments calibration
    routeFromWebsocket(msg, "instrVal", function(data){
        // send config messages to instruments
        // remind myself how the instruments like to get messages...
        db.log("instrVal update");
        let deviceName = data.id;
        let prop = data.var;
        let mappedProp = orchestra.configPropMap[prop];
        if(!mappedProp){
            mappedProp = prop;
        }
        let value = data.val;
        let instrType = data.instrType;
        if(instrType == "local"){
            db.log("setting local instr value", deviceName, prop, value);
            orchestra.localInstrumentSetValue(deviceName, prop, value);
        }else if(instrType == "udp"){
            // set locally in orchestra AND remotely on device.
            orchestra.udpInstrumentSetValue(deviceName, prop, value);
            db.log("set udp instr value");
            db.log(msg);
            // sending UDP message to remote instruments
            let type = "s";
            if(typeof value == "number" ){
                value = parseInt(value);
                type = "i";
            };
            let address = "/"+deviceName+"/config/"+mappedProp;
            let args = [{type: type, value: value}];
            let bundle = {
                timeTag: osc.timeTag(1),
                packets :[{
                    address: address,
                    args: args
                }]
            }
            db.log("sending udp message " + address, args, UDPSendIP, UDPSendPort);
            // send device prop to all UDP connected devices
            udpPort.send(bundle, UDPSendIP, UDPSendPort);
        }
    });
});



// handling messages over OSC/UDP
udpPort.on("message", function (oscMsg) {
    // when an OSC messages comes in
    db.log("An OSC message just arrived!", oscMsg);
    // pass the message to the orchestra, which controls all the instruments
    // orchestra.parseOSC(oscMsg.address, oscMsg.args);

    // announcind UDP (arduino esp32 mostly) instruments to create them in the orchestra
    routeFromOSC(oscMsg, "/announceUDPInstrument", function(oscMsg, address){
        db.log("!!!!!!!!!!!!!!!!!!!! UDP INSTRUMENT !!!!!!!!!!!!!!!!!!!!!!");
        let value = oscMsg.simpleValue;
        db.log(value);
        let name = value[0];
        let midiBank = 0;
        let midiProgram = value[1];
        let midimin = value[2];
        let midimax = value[3];        
        let midiNlen = value[4];
        let midiVol = value[5];
        if(value.length>6){
            midiBank = value[1];
            midiProgram = value[2];
            midimin = value[3];
            midimax = value[4];
            midiNlen = value[5];
            midiVol = value[6];
        }
        if(value.name){
            name = value.name;
        }
        let midiVoice = midiBank+":"+midiProgram;
        console.log(db);
        let instrument = orchestra.createUDPInstrument(name, value);
        console.log(db);
        db.log(midiVoice, midiBank, midiProgram);
        orchestra.udpInstrumentSetValue(name, "midiVoice", midiVoice);
        orchestra.udpInstrumentSetValue(name, "midiBank", midiBank);
        orchestra.udpInstrumentSetValue(name, "midiProgram", midiProgram);
        orchestra.udpInstrumentSetValue(name, "midimin", midimin);
        orchestra.udpInstrumentSetValue(name, "midimax", midimax);
        orchestra.udpInstrumentSetValue(name, "midiNlen", midiNlen);
        orchestra.udpInstrumentSetValue(name, "midiVol", midiVol);
        let props = instrument.getConfigProps();
        db.log("setting add instrument props");
        db.log(midiVoice);
        db.log(props);
        socket.sendMessage("addinstrument", props);
        instrument.start();
    });


    // processign makeNote messages from UDP connected devices (eg, if they aren't using their own speakers)
    routeFromOSC(oscMsg, "/makeNote", function(oscMsg, address){
        db.log("MAKING NOTE in routeFromOSC");
        let value = oscMsg.simpleValue;
        let name = value[0];
        let pitch = value[1];
        let velocity = value[2];
        let duration = value[3];
        if(!orchestra.hasUDPInstrument(name)){
            let instrument = orchestra.createUDPInstrument(name, {});
            let props = instrument.getConfigProps();
            props.push({name: "instrtype", value: "udp"});
            socket.sendMessage("addinstrument", props);
            instrument.start();
        };
        if(pitch < 128 && velocity < 128 ){
            orchestra.udpMakeNote(name, pitch, velocity, duration);
        }        
    });

    // processing request to destroy UDP instruments
    routeFromOSC(oscMsg, "/removeUDPInstrument", function(oscMsg, address){
        let value = oscMsg.simpleValue;
        let name = value;
        if(value.name){
            name = value.name;
        }
        orchestra.destroyUDPInstrument(name);
    });    

    routeFromOSC(oscMsg, "/performance", function(oscMsg, address){
        let value = oscMsg.simpleValue;
        let name = value;
        if(value.name){
            name = value.name;
        }
        performance.performanceFile = name;
        performance.loadPerformance(name, function(){
            statusMelodies.playPerformanceChange();
            trans.stop();
            trans.reset();
            trans.start();
        });

        socket.sendMessage("performancename", name);     
    });
    
    routeFromOSC(oscMsg, "/sayperformance", function(oscMsg, address){
        let value = oscMsg.simpleValue;
        let name = value;
        db.log("saying performance", name);
        if(value.name){
            name = value.name;
        }
        let command = "flite -t \""+name+"\"";
        exec(command);
    });

    routeFromOSC(oscMsg, "/selnextper", function(oscMsg, address){
        performance.selectNextPerformance(function(index, performanceObj){
            let sayname = performanceObj.sayname;
            let command = "flite -t \""+sayname+"\"";
            exec(command);
        });
    });

    routeFromOSC(oscMsg, "/playselper", function(oscMsg, address){
       let performanceObj = performance.getCurrentSelectedPerformanceData();
       performance.performanceFile = performanceObj.filename;
       performance.loadPerformance(performanceObj.filename, function(){
            statusMelodies.playPerformanceChange();
            trans.stop();
            trans.reset();
            trans.start();
        });
        socket.sendMessage("performancename", performanceObj.filename);
    });


    /***
     * Dealing with local instruments , aka "dumb instruments" that send on number values, and their ID
     * the rest of their data is stored locally, and notes are generated locally
     */

    // announcing local instruments to create them in the orchestra
    // NOTE: all localInstrument stuff is broken, needs updating
    routeFromOSC(oscMsg, "/announceLocalInstrument", function(oscMsg, address){
        db.log("announcing local instrument", oscMsg);
        let value = oscMsg.simpleValue;
        db.log(value);
        let name = value;
        if(value.name){
            name = value.name;
        }
        let instrument = orchestra.createLocalInstrument(name, value);
        let props = instrument.getConfigProps();
        props.push({name: "instrType", value: "local"});
        socket.sendMessage("addInstrument", props);
        instrument.start();
    });

    routeFromOSC(oscMsg, "/announceCircleRhythmInstrument", function(oscMsg, address){
        db.log("announcing circle rhythm instrument", oscMsg);
        let value = oscMsg.simpleValue;
        db.log(value);
        let name = value;
        if(value.name){
            name = value.name;
        }
        let instrument = orchestra.createCircleRhythmInstrument(name, value);
        let props = instrument.getConfigProps();
        props.push({name: "instrType", value: "local"});
        socket.sendMessage("addInstrument", props);
        instrument.start();
    });    

    // processing request to destroy and instruments
    routeFromOSC(oscMsg, "/removeLocalInstrument", function(oscMsg, address){
        let value = oscMsg.simpleValue;
        let name = value;
        if(value.name){
            name = value.name;
        }
        orchestra.destroyLocalInstrument(name);
    });  
    
    
    routeFromOSC(oscMsg, "/rawval", function(oscMsg, address){
        let value = oscMsg.simpleValue;
        db.log("rawval", oscMsg);
        let name = value[0];
        let rawval = parseFloat(value[1]);
        let instrument = orchestra.getLocalInstrument(name);
        if(instrument){
            instrument.sensorValue = rawval;
        }
    });


    routeFromOSC(oscMsg, "/circleRhythm", function(oscMsg, address){
        let value = oscMsg.simpleValue;
        db.log("circle_rhythm", oscMsg);
        db.log(value);
        let instrument = orchestra.getLocalInstrument("circleRhythm");
        if(instrument){
            instrument.loadHashPoint(value);
        }
    });
    routeFromOSC(oscMsg, "/circleRhythmClear", function(oscMsg, address){
        let value = oscMsg.simpleValue;
        db.log("circle_rhythm", oscMsg);
        db.log(value);
        let instrument = orchestra.getLocalInstrument("circleRhythm");
        if(instrument){
            instrument.clearHashPoints();
        }
    });

    // setting config values for instruments
    // for if a UDP message is sent to change settings on a localInstrument
    // THIS NEEDS REVIEW
    let instrNames = orchestra.getLocalInstrumentNames()
    let localInstrMatch = "("+ instrNames.join("|")+")";
    if(localInstrMatch != "()"){
        let configMatch =  "\/property\/"+localInstrMatch+"\/[^\/]+"
        routeFromOSC(oscMsg, configMatch, function(oscMsg, address){
            let instrName = address[2];
            let propName = address[3];
            let value = oscMsg.simpleValue;
            if(instrName.toLowerCase() == "all"){
                orchestra.allLocalInstrumentSetValue(propName, value);
            }else{
                orchestra.localInstrumentSetValue(instrName, propName, value);
            }
            let updateObj = {"deviceName": instrName};
            updateObj[propName] = value;
            socket.sendMessage("updateLocalInstrument",updateObj);
        });
    }
});



/////////////////////////////////////////
// routing function for handling all OSC messages
// oasMsg : osc message, with .address and .args address provided
// route : string or regex to match the address
// args: the message content
// callback function(oscMsg, routematches)
// -- the orginal OSCMsg, with propery simpleValue added, 
//    which is the best we could do to get the sent message value as a simple value or JSON array
// -- the address split into an arrqy on /
function routeFromOSC(oscMsg, route, callback){

    // get teh OSC value. Need to figure out types here, 
    let value = oscMsg.args;
    let newValue = false;
/*
    db.log("got oscMsg " + value, value);
    db.log(oscMsg);
    db.log(typeof value);
*/
    if(typeof value == "number"){
        newValue = value;
    }else if(Array.isArray(value) && value.length == 1 && Object.hasOwn(value[0], "value")){
        if(value[0].type == "s"){
            try{
                newValue = JSON.parse(value[0].value);
            }catch(e){
                newValue = value[0].value;
            }
        }else{
            newValue = value[0].value;
        }
    }else if(Array.isArray(value) && value.length > 1 && Object.hasOwn(value[0], "value")){
        newValue = [];
        for(let i = 0; i < value.length; i++){
            if(value[0].type == "s"){
                try{
                    newValue[i] = JSON.parse(value[i].value);
                }catch(e){
                    newValue[i] = value[i].value;
                }
            }else{
                newValue[i] = value[i].value;
            }
        }
    }else{
        db.log("!!!!!!!!!!!!!! ");
        db.log("don't know what value is " + Array.isArray(value) + " : " + value.length + " type :" + typeof value);
    }

    oscMsg.simpleValue = newValue;

    let matches = oscMsg.address.match(route);
    if(matches){
        let split = oscMsg.address.split("/");
        callback(oscMsg, split);
    }
}


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


// some websocket messages come in with a word preceding them, 
// which helps determine what they mean and where they should go.
// pass to Route to send to a specific callback.
// return true if the route was a match, false otherwise.
function routeFromWebsocket(msg, route, callback){
    let channel = false;
    let newMsg = false;
    if(msg.address){    
        channel = msg.address; 
        newMsg = msg.data;       
    }else{
        let split = msg.split(/ /);
        channel = split.shift();
        newMsg = split.join(" ");
    }
    if(channel.toLowerCase() == route.toLowerCase()){
        callback(newMsg);
        return true;
    }
    return false;
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
    // send notelist to all UDP connected devices
    udpPort.send(bundle, UDPSendIP, UDPSendPort);
    // and send to local ochestra
    orchestra.allLocalInstrumentSetValue("noteList", msg);   
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
trans.updateBpm(bpm);
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
        trans.start();
    }else{
        // even if the player state is not play, we want to read the very first score line
        // so that the theory engine has a starting point
        score.onBeat(1, 1, 1, trans);
    }
});
