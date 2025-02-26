
var config = {
    "db.active" : true,
    "synthtype" : false,  // tiny or fluidsynth or false
    "bluetooth.active" : false,
    "bluetooth.deviceID" :  "40:EF:4C:6F:C8:45", //relay: 40:EF:4C:6F:C8:45, oontz 74:F0:F0:AB:D5:21
    "playerState" : "play", // stop or play
    "soundfont" : "./soundfonts/DayOfTheDeadSF.sf2",
    "commonSoundfont" : "./soundfonts/FluidSynthDefaultSoundfont.sf2", // the file that the soundfont file in use gets copied to. 
    "soundfontInstrumentList" : "./soundfonts/DayOfTheDeadSF.sf2.voicelist.json",
    "scoreDir" : "./scores",
    "scoreName" : "simplescore.txt",
    "performanceDir" : "./performances",
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
    ]
}

module.exports = config;
