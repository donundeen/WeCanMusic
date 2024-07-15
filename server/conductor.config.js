
var config = {
    "synthtype" : false,  // tiny or fluidsynth or false
    "bluetooth.active" : false,
    "bluetooth.deviceID" :  "40:EF:4C:6F:C8:45",
    "player_state" : "stop", // stop or play
    "soundfont" : "./soundfonts/141-Compleet bank synth.sf2",
    "soundfont_instrument_list" : "./soundfonts/141-Compleet bank synth.sf2.voicelist.json",
    "use_midi_out" : true,
    "midi_out_portname" : "FLUID",
    "scorename" : "./scores/simplescore.txt",
    "UDPSENDPORT" : 7004,
    "UDPLISTENPORT" : 7005,
    "WEBSOCKET_PORT" : 8001,
    "WEBSERVER_PORT" : 8002
}

module.exports = config;
