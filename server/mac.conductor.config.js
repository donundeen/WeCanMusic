var config = {
    "fluidpath" : '/opt/homebrew/bin/fluidsynth',
    "fluidargs" : ["a", "coreaudio"],
    "player_state" : "stop", // stop or play
    "midi_waitfor_portnames" :false, // make SURE these ports are all present before starting the conductor
    "common_soundfont" : "./soundfonts/FluidSynthDefaultSoundfont.sf2", // the file that the soundfont file in use gets copied to. 
    "soundfont_instrument_list" : "./soundfonts/FluidSynthDefaultSoundfont.sf2.voicelist.json",

}

module.exports = config;
