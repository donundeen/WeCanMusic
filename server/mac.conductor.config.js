var config = {
    "fluidPath" : '/opt/homebrew/bin/fluidsynth',
    "fluidArgs" : ["a", "coreaudio"],
    "playerState" : "stop", // stop or play
    "midiWaitForPortnames" :false, // make SURE these ports are all present before starting the conductor
    "commonSoundfont" : "./soundfonts/FluidSynthDefaultSoundfont.sf2", // the file that the soundfont file in use gets copied to. 
    "soundfontInstrumentList" : "./soundfonts/FluidSynthDefaultSoundfont.sf2.voicelist.json",
}

module.exports = config;
