Instrument = require("./instrument.instrument.module");

class LocalInstrument extends Instrument {

    constructor(options, config) {
        super(options, config);
        this._type = "local";
        this.type = "local";
    }

}

module.exports = LocalInstrument;