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
let env_config = require("./env.config.js");
let env = env_config.env;
let config = require("./conductor.config.js");
let machine_config = require("./"+env+".conductor.config.js");
config.env = env;
config = {...config, ...machine_config, ...env_config};

////////////////////////////////
// LOAD DEBUGGING FRAMEWORK
const db = require('./modules/debugging.module.js').Debugging;
// TURN DEBUGGING ON/OFF HERE
db.active = config["db.active"];
db.trace = false;
db.log("starting","now",[1,2,3]);
db.log(config);





let bluetooth = false;
if(config["bluetooth.active"]){
    bluetooth = require('./modules/bluetooth.module.js').Bluetooth;
    bluetooth.active = config["bluetooth.active"];
    bluetooth.deviceID = config["bluetooth.deviceID"]; 
    bluetooth.keepUp();
}
////////////////// CONFIG VARIABLES //////////////////////////
let synthtype = config.synthtype; // tiny or fluidsynth or false
// tiny can't handle too many notes at once, and some don't sound good:
let bad_tiny_voices = [6,7,8,22,23,24,40,41,42,43,44,55,56,57,59,60,61,62,63,64,65,66,67,68,69,71,72, 84, 90, 105,110,118,119,120,121,122,123,124,125,126,127];


// midi hardware setup:
let use_midi_out = config.use_midi_out; // whether or not to send midi values through a hardware output, via easymidi
let midi_hardware_engine = false;
let midi_out_portname = config.midi_out_portname; // FLUID for on-baord synth, UM-ONE for the midi cable, or other things"; 
let midi = require('midi');
let easymidi = require('easymidi');
if(use_midi_out){
    while(!midi_hardware_engine){
        // if it can't find the named midi port, this part will just keep looping and hang the app
        let midi_outputs = easymidi.getOutputs();
        db.log(midi_outputs);
        let real_portname = false;
        for(let i = 0; i<midi_outputs.length; i++){
            if(midi_outputs[i].includes(midi_out_portname)){
                real_portname = midi_outputs[i];
            }
        }
        if(real_portname){
            midi_hardware_engine = new easymidi.Output(real_portname);   
            midi_hardware_engine.send('reset'); 

        }
    }
}


setTimeout(function(){
    // testing restarting fluidsynth
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
    midi_hardware_engine = false;
    while(!midi_hardware_engine){
        // if it can't find the named midi port, this part will just keep looping and hang the app
        let midi_outputs = easymidi.getOutputs();
        console.log(midi_outputs);
        let real_portname = false;
        for(let i = 0; i<midi_outputs.length; i++){
            if(midi_outputs[i].includes(midi_out_portname)){
                real_portname = midi_outputs[i];
            }
        }
        if(real_portname){
            midi_hardware_engine = new easymidi.Output(real_portname);   
            midi_hardware_engine.send('reset'); 
        }
    }
},20000);


let bpm = 120; // this should eventually be configurable as a performance variable in the UI

// defining some note lengths
let scorename = config.scorename; //"simplescore.txt";
let UDPSENDIP = config.UDPSENDIP; //"10.0.0.255";
//let UDPSENDIP = "10.0.0.131";
let UDPSENDPORT = config.UDPSENDPORT;//7004;
let UDPLISTENPORT = config.UDPLISTENPORT;//7005;

let WEBSOCKET_PORT = config.WEBSOCKET_PORT //8001;
let WEBSERVER_PORT = config.WEBSERVER_PORT //8002;

let default_webpage = config.defaultWebpage; //"conductor.html";



// defining some useful curves for tweaking instrument values. used by both the localinstrument and arduino instruments
// they are numbered for easier communication with the arduino devices over osc
let curvecollection = {
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
///// int notelengths[] = {WN, HN, HN3, QN, QN3, N8, N83, N16};

let notelengthNames = ["Whole", "Half","Half Triplet","Quarter","Quarter Triplet","Eighth","Eighth Triplet","Sixteenth"];

////////////////// END CONFIG VARIABLES //////////////////////////


/// SET UP OSC SERVER - SENDS AND RECIEVES MESSAGES FROM DEVICES
var osc = require("osc");
var udpPort = new osc.UDPPort({
    localAddress: "0.0.0.0",
    localPort: UDPLISTENPORT, // this port for listening
    broadcast: true,
    metadata: true
});

udpPort.open();


/////////////////////////////////////
// SET UP THE MODULE OBJECTS
// transport generates beat messges
const Transport    = require("./modules/transport.module.js").Transport;
// Score reader outputs messages at timed intervals
const ScoreReader  = require("./modules/scorereader.module.js").ScoreReader;
// thoeryEngine generates lists of notes from theory terms (eg A MINORPENTATONIC)
const TheoryEngine = require("./modules/theoryengine.module.js").TheoryEngine;
// socketServer is the web page that gets control messages
const SocketServer = require("./modules/socketserver.module.js").SocketServer;
// performance saves and restores settings that might change per performance, song, etc
const Performance = require("./modules/performance.module.js").Performance;
// orchestra controls local instruments that generate midi values, and /or actual tones
const Orchestra    = require("./modules/orchestra.module.js");
// Status Melodies = plays specific note series to announce things like startup, crashes, etc.
const StatusMelodies = require('./modules/statusmelodies.module.js').StatusMelodies;

SocketServer.WEBSOCKET_PORT  = WEBSOCKET_PORT;
SocketServer.WEBSERVER_PORT  = WEBSERVER_PORT;
SocketServer.default_webpage = default_webpage;


db.log("starting");

// initialize the modules
orchestra = new Orchestra();
orchestra.db = db
trans  = Object.create(Transport);
trans.db = db
score  = Object.create(ScoreReader);
score.db = db
theory = Object.create(TheoryEngine);
theory.db = db
socket = Object.create(SocketServer);
socket.db = db
performance = Object.create(Performance);
performance.db = db
statusmelodies = Object.create(StatusMelodies);
statusmelodies.db = db;
statusmelodies.midi_hardware_engine = midi_hardware_engine;


// config score obect
score.setScoreDir(config.scoreDir);

// set up performance object with links to other objeccts
performance.performanceDir = config.performanceDir;
performance.score = score;
performance.transport = trans;
performance.orchestra = orchestra;
// set up listeners/callbacks for score, transport, and orchestra
score.performanceUpdateCallback = function(scoreobj){
    // send messages to webpage
    let data = {scorename : scoreobj.scoreFilename,
        text: scoreobj.scoreText
    };
    db.log("sending score data for new performance", data);
    socket.sendMessage("score", data);     

};
score.performancePropUpdateCallback = function(scoreobj, propname, proptype, propvalue ){
    db.log("score performancePropUpdateCallback");
    
};
trans.performanceUpdateCallback = function(transportobj){
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
    socket.sendMessage("updateinstrument", perfData);


};
orchestra.performancePropUpdateCallback = function(instrument, propname, proptype, propvalue ){
    db.log("instrument.performancePropUpdateCallback");

    let device_name = instrument.device_name;
    let prop = propname;
    let value = propvalue;
    let instrtype = instrument.type;
    if(instrtype == "local"){
//        orchestra.local_instrument_set_value(device_name, prop, value);
    }else if(instrtype == "udp"){
        // set locally in orchestra AND remotely on device.
        orchestra.udp_instrument_set_value(device_name, prop, value);
        db.log("set udp instr value", device_name, prop, value);
        // sending UDP message to remote instruments
        let type = "s";
        if(typeof value == "number" ){
            value = parseInt(value);
            type = "i";
        };
        let address = "/"+device_name+"/config/"+prop;
        let args = [{type: type, value: value}];
        let bundle = {
            timeTag: osc.timeTag(1),
            packets :[{
                address: address,
                args: args
            }]
        }
        db.log("sending udp message " + address, args, UDPSENDIP, UDPSENDPORT);
        // send notelist to all UDP connected devices
        udpPort.send(bundle, UDPSENDIP, UDPSENDPORT);
    }    

    // send prop and value over OSC to the device, one value at a times
};



// intialize the midi synth (fluid or tiny)
let synth = false;

// soundfont file setup - needs to match what's in the fluidsynth startup script config
let soundfont = config.soundfont;//'./soundfonts/141-Compleet bank synth.sf2'
let soundfont_instrument_list = config.soundfont_instrument_list; //'./soundfonts/141-Compleet bank synth.sf2.voicelist.json'

////////////////////////////////////////////
// SET UP SOFTWARE SYNTH 
// (as opposed to sending midi to an external or internal synth)
// - we've found that this approach exposes bugs in these software synths
// so we don't use this. Intead we use easymidi to send MIDI data to
// either external MIDI outs, or internal midi outs to the Fluidsynth
if(synthtype){
    // jzz controls a local synthesizer and connected midi devices
    const JZZ = require('jzz');
    if(synthtype == "fluidsynth"){
        let fluidpath = config.fluidpath; //'/usr/bin/fluidsynth';
        let fluidargs = config.fluidargs; // ["a", "pulseaudio","-R", 1, "-C", 1];
        
        require('jzz-synth-fluid')(JZZ);
        synth = JZZ.synth.Fluid({ path: fluidpath, 
            sf: soundfont,
            args: fluidargs });            
    }
    if(synthtype == "tiny"){
        const WAAPI = require('node-web-audio-api');
        require('jzz-synth-tiny')(JZZ);
        global.window = { AudioContext: WAAPI.AudioContext };   
        synth = JZZ.synth.Tiny({quality:0, useReverb:0, voices:32});
        let tiny_voices = [];
        for(let i = 0; i<=127;i++){
            if(!bad_tiny_voices.includes(i)){
                tiny_voices.push(i);
            }
        }
        synth.good_voices = tiny_voices;         
    }
}
let global_notecount = 0; // used as a hack for the fluidsynth software synth


//db.testSynth(synth, bluetooth);
//////////////////////////////////////
// SET UP ORCHESTRA
orchestra.synth = synth;
orchestra.synthDeviceVoices = synthDeviceVoices;
orchestra.midi_hardware_engine = midi_hardware_engine;

orchestra.soundfont_file = soundfont;
orchestra.soundfont_voicelist_file = soundfont_instrument_list;


///////////////////////////////
// SETUP TRANSPORT/SCORE CONNECTION
// tell the score to do smomething when a beat happens
// send a data over websockets with the transport info
trans.setBeatCallback(function(beatcount, bar, beat, transport){
    score.onbeat(beatcount, bar, beat, transport);
    let data = [beatcount, bar, beat]; 
    socket.sendMessage("curbeat", data);    
});


////////////////////////////////////////
// SCORE/THEORY CONNECTION
// when score produces a messages, send it to the theory engine
score.setMessageCallback(function(msg){
    theory.runSetter(msg, "fromscore");
});



////////////////////////////////////////
// HANDLING MESSAGES FROM THE WEBPAGE
// when the websocket gets a message, send it where it needs to go
socket.setMessageReceivedCallback(function(msg){

    // /chord message sets the chord for the theory engine to make a notelist
    let result = routeFromWebsocket(msg, "chord", function(msg){
        theory.runSetter(msg, "fromsocket");
    });

    // getscore ask for the contents and name of the current score
    routeFromWebsocket(msg, "getscore", function(msg){     
        let data = {scorename : score.scoreFilename,
                text: score.scoreText};
        socket.sendMessage("score", data);    
    });

    // getscorelist asks for a list of all scores
    routeFromWebsocket(msg, "getscorelist", function(msg){
        score.getScoreList(function(list){
            socket.sendMessage("scorelist", list);    
        });
    });

    // getscorelist asks for a list of all scores
    routeFromWebsocket(msg, "getperformancelist", function(msg){
        performance.getPerformanceList(function(list){
            socket.sendMessage("performancelist", list);    
        });
    });    

    // getvoicelist ask for a list of the
    // bank:program and name of every instrument in the soundfont
    routeFromWebsocket(msg, "getvoicelist", function(msg){
        // get voicelist and send as socket.sendMessage("voicelist", voicelist);
        orchestra.soundfont_file = soundfont;
        orchestra.get_voicelist(function(voicelist){    
            socket.sendMessage("voicelist", voicelist);             //  trans.start();
        });        
    });


    // loadperformance sends a performance name, 
    // and triggers the loading of all those configurations where they are needed
    routeFromWebsocket(msg,"loadperformance", function(msg){
        performance.performanceFile = msg;
        performance.loadPerformance(msg);
    });

    routeFromWebsocket(msg,"saveperformance", function(msg){
        db.log(msg);
        let filename = msg.performancename;

        performance.performanceFile = filename;

        performance.savePerformance(filename, function(performance ){
            db.log("performance written");
            performance.getPerformanceList(function(list){
                socket.sendMessage("performancelist", list);    
            });            
        });
        
    });


    // loadscore updates the name and contents of the score objects current score,
    // and sends the name and content back to the web page
    routeFromWebsocket(msg,"loadscore", function(msg){
        score.scoreFilename = msg;
        score.openscore(function(scoreText){   
            let data = {scorename : score.scoreFilename,
                text: scoreText
            };
            db.log("sending score data", data);
            socket.sendMessage("score", data);             //  trans.start();
        });        
    });

    // savescore sends a name and content to be saved on the server,
    // and also sends that content back to the webpage
    routeFromWebsocket(msg,"savescore", function(msg){
        db.log(msg);
        let filename = msg.scorename;
        let scoreText = msg.text;
        let dir = score.scoreDir;
        let fullpath = dir + "/"+filename;

        score.scoreFilename = filename;
        score.scoreText = scoreText;

        score.writescore(function(scoreobj){
            db.log("score written");
            score.openscore(function(scoreText){   
                let data = {scorename : score.scoreFilename,
                    text: scoreText
                };
                db.log("sending score data", data);
                socket.sendMessage("score", data);             //  trans.start();
            });
            // send the scorelist
            score.getScoreList(function(list){
                socket.sendMessage("scorelist", list);
            });            
        });
        
    });

    // stop tells the transport to stop (stop and go to beginning)
    routeFromWebsocket(msg, "stop", function(msg){
        trans.stop();
    });

    // play tells the transport to play from current point
    routeFromWebsocket(msg, "play", function(msg){
        trans.start();
    });

    // pause tells the transport to stop playing but don't change position
    routeFromWebsocket(msg, "pause", function(msg){
        trans.pause();
    });

    // set bpm changes the bpm. might not be fully implemented
    routeFromWebsocket(msg, "setbpm", function(msg){
        bpm = msg.bpm;
        trans.updateBpm(bpm);
        orchestra.all_instrument_set_value("bpm", bpm);
    });

    // web page just loaded and is ready
    routeFromWebsocket(msg, "ready", function(msg){
        let data = {scorename: score.scoreFilename, 
                text: score.scoreText};
        socket.sendMessage("score", data);

        /* I think the web page should request this data instead of sending it unbidden
        // send the voicelist
        orchestra.get_voicelist(function(voicelist){    
            socket.sendMessage("voicelist", voicelist);             //  trans.start();
        }); 

        // send the scorelist
        score.getScoreList(function(list){
            socket.sendMessage("scorelist", list);
        });
        */

        //send all the instruments if there are currently any running:
        orchestra.allLocalInstruments(function(instrument){
            let props = instrument.get_config_props();
            props.push({name: "instrtype", value: "local"});
            socket.sendMessage("addinstrument", props);    
        });
        orchestra.allUDPInstruments(function(instrument){
            let props = instrument.get_config_props();
            props.push({name: "instrtype", value: "udp"});
            socket.sendMessage("addinstrument", props);    
        });


        if(db.active){
            // TESTING THINGS HERE
            // create some dummy instruments for UI testing. they won't play
            let instrument = orchestra.create_udp_instrument("thread1", "TEST");
            let props = instrument.get_config_props();
            props.push({name: "instrtype", value: "udp"});
            socket.sendMessage("addinstrument", props);
            instrument.start();        

            let instrument2 = orchestra.create_udp_instrument("thread2", "2TEST2");
            let props2 = instrument2.get_config_props();
            props2.push({name: "instrtype", value: "udp"});
            socket.sendMessage("addinstrument", props2);
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
            orchestra.all_udp_instrument_set_value("synth", synth);      
            orchestra.all_local_instrument_set_value("synth", synth);      
        }
        // midi_hardware_engine
        orchestra.midi_hardware_engine.send('reset'); 
    });


    ////////////////////////////
    // instrval gets a varname and a value, and updates the instrument's variables accordingly
    // midimin, midimax, channel, voice (bank:program), midi_nlen, etc
    // one var can be "reset" which here resets the instruments calibration
    routeFromWebsocket(msg, "instrval", function(data){
        // send config messages to instruments
        // remind myself how the instruments like to get messages...
        db.log("instrval update");
        let device_name = data.id;
        let prop = data.var;
        let value = data.val;
        let instrtype = data.instrtype;
        if(instrtype == "local"){
            orchestra.local_instrument_set_value(device_name, prop, value);
        }else if(instrtype == "udp"){
            // set locally in orchestra AND remotely on device.
            orchestra.udp_instrument_set_value(device_name, prop, value);
            db.log("set udp instr value");
            db.log(msg);
            // sending UDP message to remote instruments
            let type = "s";
            if(typeof value == "number" ){
                value = parseInt(value);
                type = "i";
            };
            let address = "/"+device_name+"/config/"+prop;
            let args = [{type: type, value: value}];
            let bundle = {
                timeTag: osc.timeTag(1),
                packets :[{
                    address: address,
                    args: args
                }]
            }
            db.log("sending udp message " + address, args, UDPSENDIP, UDPSENDPORT);
            // send notelist to all UDP connected devices
            udpPort.send(bundle, UDPSENDIP, UDPSENDPORT);
        }
    });
});

// handling messages over OSC/UDP
udpPort.on("message", function (oscMsg) {
    // when an OSC messages comes in
    db.log("An OSC message just arrived!", oscMsg);
    // pass the message to the orchestra, which controls all the instruments
//    orchestra.parseOSC(oscMsg.address, oscMsg.args);

    // announcing local instruments to create them in the orchestra
    // NOTE: all localInstrument stuff is broken, needs updating
    routeFromOSC(oscMsg, "/announceLocalInstrument", function(oscMsg, address){
        let value = oscMsg.simpleValue;
        db.log(value);
        let name = value;
        if(value.name){
            name = value.name;
        }
        let instrument = orchestra.create_local_instrument(name, value);
        let props = instrument.get_config_props();
        props.push({name: "instrtype", value: "local"});
        socket.sendMessage("addinstrument", props);
        instrument.start();
    });

    // processing request to destroy and instruments
    routeFromOSC(oscMsg, "/removeLocalInstrument", function(oscMsg, address){
        let value = oscMsg.simpleValue;
        let name = value;
        if(value.name){
            name = value.name;
        }
        orchestra.destroy_local_instrument(name);
    });

    // announcind UDP (arduino esp32 mostly) instruments to create them in the orchestra
    routeFromOSC(oscMsg, "/announceUDPInstrument", function(oscMsg, address){
        db.log("!!!!!!!!!!!!!!!!!!!! UDP INSTRUMENT !!!!!!!!!!!!!!!!!!!!!!");
        let value = oscMsg.simpleValue;
        db.log(value);
        let name = value[0];
        let midi_bank = 0;
        let midi_program = value[1];
        let midimin = value[2];
        let midimax = value[3];        
        let midi_nlen = value[4];
        if(value.length>5){
            midi_bank = value[1];
            midi_program = value[2];
            midimin = value[3];
            midimax = value[4];
            midi_nlen = value[5];
        }
        if(value.name){
            name = value.name;
        }
        let midi_voice = midi_bank+":"+midi_program;
        let instrument = orchestra.create_udp_instrument(name, value);
        db.log(midi_voice, midi_bank, midi_program);
        orchestra.udp_instrument_set_value(name, "midi_voice", midi_voice);
        orchestra.udp_instrument_set_value(name, "midi_bank", midi_bank);
        orchestra.udp_instrument_set_value(name, "midi_program", midi_program);
        orchestra.udp_instrument_set_value(name, "midimin", midimin);
        orchestra.udp_instrument_set_value(name, "midimax", midimax);
        orchestra.udp_instrument_set_value(name, "midi_nlen", midi_nlen);
        let props = instrument.get_config_props();
        db.log("setting add instrument props");
        db.log(midi_voice);
        db.log(props);
        socket.sendMessage("addinstrument", props);
        instrument.start();
    });


    // processign makenote messages from UDP connected devices (eg, if they aren't using their own speakers)
    routeFromOSC(oscMsg, "/makenote", function(oscMsg, address){
        db.log("MAKING NOTE in routeFromOSC");
        let value = oscMsg.simpleValue;
        let name = value[0];
        let pitch = value[1];
        let velocity = value[2];
        let duration = value[3];
        if(!orchestra.has_udp_instrument(name)){
            let instrument = orchestra.create_udp_instrument(name, {});
            let props = instrument.get_config_props();
            props.push({name: "instrtype", value: "udp"});
            socket.sendMessage("addinstrument", props);
            instrument.start();
        };
        if(pitch < 128 && velocity < 128 ){
            orchestra.udp_makenote(name, pitch, velocity, duration);
        }        
    });

    // processing request to destroy UDP instruments
    routeFromOSC(oscMsg, "/removeUDPInstrument", function(oscMsg, address){
        let value = oscMsg.simpleValue;
        let name = value;
        if(value.name){
            name = value.name;
        }
        orchestra.destroy_udp_instrument(name);
    });    


    // setting config values for instruments
    // for if a UDP message is sent to change settings on a localInstrument
    // THIS NEEDS REVIEW
    let instrnames = orchestra.get_local_instrument_names()
    let localInstrMatch = "("+ instrnames.join("|")+")";
    if(localInstrMatch != "()"){
        let configMatch =  "\/property\/"+localInstrMatch+"\/[^\/]+"
        routeFromOSC(oscMsg, configMatch, function(oscMsg, address){
            let instrname = address[2];
            let propname = address[3];
            let value = oscMsg.simpleValue;
            if(instrname.toLowerCase() == "all"){
                orchestra.all_local_instrument_set_value(propname, value);
            }else{
                orchestra.local_instrument_set_value(instrname, propname, value);
            }
            updateobj= {"device_name": instrname};
            updateobj[propname] = value;
            socket.sendMessage("updateLocalInstrument",updateobj);
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
    let newvalue = false;
/*
    db.log("got oscMsg " + value, value);
    db.log(oscMsg);
    db.log(typeof value);
*/
    if(typeof value == "number"){
        newvalue = value;
    }else if(Array.isArray(value) && value.length == 1 && Object.hasOwn(value[0], "value")){
        if(value[0].type == "s"){
            try{
                newvalue = JSON.parse(value[0].value);
            }catch(e){
                newvalue = value[0].value;
            }
        }else{
            newvalue = value[0].value;
        }
    }else if(Array.isArray(value) && value.length > 1 && Object.hasOwn(value[0], "value")){
        newvalue = [];
        for(let i = 0; i < value.length; i++){
            if(value[0].type == "s"){
                try{
                    newvalue[i] = JSON.parse(value[i].value);
                }catch(e){
                    newvalue[i] = value[i].value;
                }
            }else{
                newvalue[i] = value[i].value;
            }
        }
    }else{
        db.log("!!!!!!!!!!!!!! ");
        db.log("don't know what value is " + Array.isArray(value) + " : " + value.length + " type :" + typeof value);
    }

    oscMsg.simpleValue = newvalue;

    let matches = oscMsg.address.match(route);
    if(matches){
        let split = oscMsg.address.split("/");
        callback(oscMsg, split);
    }
}


// some things to do whenever an instrument makes a note
// send the data to the webpage to display
orchestra.makenote_callback = function(instr, pitch, velocity, duration){
    let device_name = instr.device_name;

//    db.log(global_notecount + synth.foothing +  "******************************** makenote_callback ", device_name, pitch, velocity, duration);

    global_notecount++;
    
    if(synthtype == "fluidsynth"){
        if(global_notecount >= 300){
            db.log("RRRrrrrrrrrrr Reseting Synth +++++++++++++++++++++++++++++++++++++++");
            synth.close();
            synth = JZZ.synth.Fluid({ path: fluidpath, 
                sf: soundfont,
                args: fluidargs });
            synth.start();
            global_notecount = 0;
            synth.foothing = "NEXT";
            orchestra.all_udp_instrument_set_value("synth", synth);
        }
    }
    
    // tell the webpage what devices played what note, so it can update the UI
    // NOTE: this might eat up a lot of network, so we could take it out.
    // it's just useful to show that an instrument is still active
    let dataObj = {device_name: device_name, 
                    pitch: pitch, 
                    velocity: velocity,
                    duration: duration}
//    db.log("sending message")
    socket.sendMessage("makenote", dataObj );
}


// some websocket messages come in with a word preceding them, 
// which helps determine what they mean and where they should go.
// pass to Route to send to a specific callback.
// return true if the route was a match, false otherwise.
function routeFromWebsocket(msg, route, callback){
    let channel = false;
    let newmsg = false;
    if(msg.address){
        channel = msg.address; 
        newmsg = msg.data;       
    }else{
        let split = msg.split(/ /);
        channel = split.shift();
        newmsg = split.join(" ");
    }
    if(channel.toLowerCase() == route.toLowerCase()){
        callback(newmsg);
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
            address: "/all/notelist",
            args: args
        }]
    }
    // send notelist to all UDP connected devices
    udpPort.send(bundle, UDPSENDIP, UDPSENDPORT);
    // and send to local ochestra
    orchestra.all_local_instrument_set_value("notelist", msg);   
});


//////////////////////////////////////
// setting things up and starting
// set the bpm in the transport and the orchestra
trans.updateBpm(bpm);
orchestra.all_local_instrument_set_value("bpm", bpm);

// set the name of the score
score.scoreFilename = scorename;

// start the socket server and the web server
socket.startSocketServer();
socket.startWebServer();

// open the score file, 
// and when it's open, run the score (if the config file says so)
score.openscore(function(){    
    statusmelodies.playready();
    if(config.player_state == "play"){
        trans.start();
    }
});
