
Instrument = require("./instrument.module");

class UDPInstrument extends Instrument {

    constructor(options){
        super(options);
        _type = "udp";
        type = "udp";
        
    }

}

module.exports = UDPInstrument;