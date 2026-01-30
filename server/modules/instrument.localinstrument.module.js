Instrument = require("./instrument.instrument.module");

class LocalInstrument extends Instrument {

    constructor(options) {
        super(options);
        this._type = "local";
        this.type = "local";
    }

}

module.exports = LocalInstrument;