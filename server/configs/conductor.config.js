
var config = {
    "db.active" : true,
    "bpm" : 120,
    "bluetooth.active" : false,
    "bluetooth.deviceID" :  "40:EF:4C:6F:C8:45", //relay: 40:EF:4C:6F:C8:45, oontz 74:F0:F0:AB:D5:21
    "playerState" : "play", // stop or play
    "soundfont" : "./soundfonts/DayOfTheDeadSF.sf2",
    "commonSoundfont" : "./soundfonts/FluidSynthDefaultSoundfont.sf2", // the file that the soundfont file in use gets copied to. 
    "soundfontInstrumentList" : "./soundfonts/DayOfTheDeadSF.sf2.voicelist.json",
    "scoreDir" : "./scores",
    "scoreName" : "simplescore.txt",
    "performanceDir" : "./performances",
    "initialTheoryMsgs" : ["C M"],
    "defaultWebpage" : "jamalong.html",
    "useMidiOut" : true,
    "midiOutPortname" : "all", /// "all" to use all ports, or an array of regex matches to check against the portnames
    "midiWaitForPortnames" : ["FLUID"], // make SURE these ports are all present before starting the conductor
    "fluidPath" : '/usr/bin/fluidsynth', // OS-specific, overrider in [mac/rpi].conductor.config.js
    "fluidArgs" : ["a", "pulseaudio","-R", 1, "-C", 1], // OS-specific, overrider in [mac/rpi].conductor.config.js
    "UDPSendPort" : 7004,
    "UDPSendIP" : "10.0.0.255",
    "UDPListenPort" : 7005,
    "websocketPort" : 80,
    "webserverPort" : 80,
    "useHttps" : false,
    "httpsWebsocketPort" : 443,
    "httpsWebserverPort" : 443,
    "quantizeTime" : ["N16", "N83"],// or array of note length names ("QN, N16, N83, etc")
    "performanceList" : [
        {
            "fileName" : "blessingWand",
            "sayName" : "Blessing Wand"
        },
        {
            "fileName" : "cheeseBlues",
            "sayName" : "Cheese Blues"
        },
        {
            "fileName" : "voicesinmyhead",
            "sayName" : "Voices in My Head"
        }
    ],
    "synthDeviceVoices" : {
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
    },
    "curveCollection" : {
        "str8up" : [0., 0., 0., 1., 1., 0.], // 1
        "str8dn" : [0., 1., 0., 1., 0., 0.], // 2
        "logup" : [0., 0., 0., 1., 1., -0.65], // 3
        "logdn" : [0., 1., 0., 1., 0., -0.65], // 4 not sure if this is right
        "str8upthresh" : [0., 0., 0., 0.05, 0., 0., 1., 1., 0.], // 5 
        "str8dnthresh" : [0., 1., 0., 0.95, 0., 0., 1., 0., 0., 1., 0., 0.], // 6
        "logupthresh" : [0., 0., 0., 0.05, 0., 0., 1., 1., -0.65], // 7
        "logdnthresh" : [0., 1., 0., 0.95, 0., -0.65, 1., 0., -0.65] //8
    },
    "noteLengths" : ["WN", "HN", "HN3", "QN", "QN3", "N8", "N83", "N16"],
    "noteLengthNames" : ["Whole", "Half","Half Triplet","Quarter","Quarter Triplet","Eighth","Eighth Triplet","Sixteenth"]
}

module.exports = config;
