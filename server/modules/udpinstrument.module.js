
Instrument = require("./instrument.module");

class UDPInstrument extends Instrument {

    constructor(options){
        super(options);
        this._type = "udp";
        this.type = "udp";
        
    }

}

module.exports = UDPInstrument;