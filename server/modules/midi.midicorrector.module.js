class MidiCorrector {
    constructor(options) {
        this.db = options.db;
        this.theoryEngine = options.theoryEngine;
        this.inputMidiPort = options.inputMidiPort;
        this.outputMidiPort = options.outputMidiPort;
        this.inputMidiPort.on("message", (message) => {
            this.correctMidiNote(message);
        });
    }

    correctMidiMessage(message) {
        let note = message[0];
        let velocity = message[1];
        let duration = message[2];
        let correctedNote = this.theoryEngine.getClosestCorrectNote(note);
        this.outputMidiPort.send(correctedNote, velocity, duration);
    }

    correctMidiNote(note) {
        return this.theoryEngine.getClosestCorrectNote(note);
    }
}

module.exports = MidiCorrector;