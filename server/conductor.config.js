
var config = {
    "synthtype" : false,  // tiny or fluidsynth or false
    "bluetooth.active" : false,
    "bluetooth.deviceID" :  "40:EF:4C:6F:C8:45", //relay: 40:EF:4C:6F:C8:45, oontz 74:F0:F0:AB:D5:21
    "player_state" : "play", // stop or play
    "soundfont" : "./soundfonts/141-Compleet bank synth.sf2",
    "soundfont_instrument_list" : "./soundfonts/141-Compleet bank synth.sf2.voicelist.json",
    "use_midi_out" : true,
    "midi_out_portname" : "FLUID",
    "scorename" : "./scores/simplescore.txt",
    "fluidpath" : '/usr/bin/fluidsynth', // OS-specific, overrider in [mac/rpi].conductor.config.js
    "fluidargs" : ["a", "pulseaudio","-R", 1, "-C", 1], // OS-specific, overrider in [mac/rpi].conductor.config.js
    "UDPSENDPORT" : 7004,
    "UDPSENDIP" : "10.0.0.255",
    "UDPLISTENPORT" : 7005,
    "WEBSOCKET_PORT" : 8001,
    "WEBSERVER_PORT" : 8002
}

module.exports = config;
