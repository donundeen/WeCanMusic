/*
this object handles the saving, loading, and sending of performance configurations, 
which includes
- scorename
- bpm
- instrument configurations
    - bank/program
    - midimin/midimax
    - channel

savePerformance (name)
- gets the stuff to save from the local objects
- saves it to a file of the given name in the performances folder

loadPerformance(name)
- loads the given performance file 
- updates local objects 
- send updates to the webui 
- sends updates to the remove instruments 

ultimately, each object should probably say 
"this is the stuff I want to save in a performance,
and this is how I want to be updated when new stuff is loaded
udpInstrument has configProps, which is this"

NOTE: udpInstrument doesn't actually have any UDP handling code, 
that's all in conductor.node.js, which handles all communication protocols
maybe this should change? 

transport and score could have "performanceProps"

or maybe these objects need to just deliver up their own performance JSON, 
and handle loading thier config JSON

"

*/

class Performance {
    orchestra = false; // the orchestra object
    score = false; // the score object
    transport = false; // the transport object
    savePerformance(name){
        //  use performanceProps in score and transport,
        // and configProps in the orchestra's udp instruments,
        // to get all the savable values
        let scoreData = false;
        let transportData = false;
        let orchestraData = false;
        let perfData = {
            score: scoreData,
            transport: transportData,
            orchestra: orchestraData
        }

        // save the JSON
    }

    loadPerformance(name){
        // load the performance file and extract the data
        // load the json
        perfData = false; // load it here
        scoreData = perfData.score;
        transportData = perfData.transport;
        orchestraData = perfData.orchestra;
        
        // send the data to the respective objects, 
        // they should know what to do with it.
    }

}


module.exports = Performance