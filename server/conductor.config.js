
var config = {
    "synthtype" : false,  // tiny or fluidsynth or false
    "bluetooth.active" : false,
    "bluetooth.deviceID" :  "40:EF:4C:6F:C8:45", //relay: 40:EF:4C:6F:C8:45, oontz 74:F0:F0:AB:D5:21
    "player_state" : "play", // stop or play
    "soundfont" : "./soundfonts/DayOfTheDeadSF.sf2",
    "common_soundfont" : "./soundfonts/FluidSynthDefaultSoundfont.sf2", // the file that the soundfont file in use gets copied to. 
    "scoreDir" : "./scores",
    "scorename" : "cheeseBlues.txt",
    "performanceDir" : "./performances",
    "defaultWebpage" : "jamalong.html",
    "soundfont_instrument_list" : "./soundfonts/DayOfTheDeadSF.sf2.voicelist.json",
    "use_midi_out" : true,
    "midi_out_portname" : "all", /// "all" to use all ports, or an array of regex matches to check against the portnames
    "midi_waitfor_portnames" : ["FLUID"], // make SURE these ports are all present before starting the conductor
    "fluidpath" : '/usr/bin/fluidsynth', // OS-specific, overrider in [mac/rpi].conductor.config.js
    "fluidargs" : ["a", "pulseaudio","-R", 1, "-C", 1], // OS-specific, overrider in [mac/rpi].conductor.config.js
    "UDPSENDPORT" : 7004,
    "UDPSENDIP" : "10.0.0.255",
    "UDPLISTENPORT" : 7005,
    "WEBSOCKET_PORT" : 80,
    "WEBSERVER_PORT" : 80,
    "HTTPS" : true,
    "HTTPS_WEBSOCKET_PORT" : 443,
    "HTTPS_WEBSERVER_PORT" : 443,
    "quantize_time" : false // or array of note length names ("QN, N16, N83, etc")
}

module.exports = config;
