Instrument = require("./instrument.module");

class LocalInstrument extends Instrument {

    constructor() {
        super();
        this._type = "local";
        this.type = "local";
    }

}

module.exports = LocalInstrument;