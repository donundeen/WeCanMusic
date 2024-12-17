class Debugging {
    constructor() {
        this.active = false;
        this.show_levels = [1]; // debug levels to show. hide the others.
        this.trace = false; // if you should do a console.trace with the log statement
    }

    show(levels) {
        const merge = (a, b, predicate = (a, b) => a === b) => {
            const c = [...a]; // copy to avoid side effects
            // add all items from B to copy C if they're not already present
            b.forEach((bItem) => (c.some((cItem) => predicate(bItem, cItem)) ? null : c.push(bItem)))
            return c;
        }
        this.show_levels = merge(this.show_levels, levels);
    }

    hide(level) {
        this.show_levels = this.show_levels.filter(function (el) {
            return !level.includes(el);
        });
    }

    log(text) {
        this.logl(1, ...arguments);
    }

    // log w category or level information, so we can conditionally display certain log info and not other
    logl(level, text) {
        if (!this.active) { return; }
        var [level, ...rest] = arguments;

        if (this.show_levels.includes(level)) {
            console.log(...rest);
        }
        if (this.trace) {
            console.trace();
        }
    }

    testSynth(synth, bluetooth) {
        if (!this.active) { return; }

        this.log("speakerTest");
        let channel = 1;
        let note = 65;
        let velocity = 127;
        let duration = 500;
        let repeat = 750;

        let self = this;

        setInterval(function () {
            self.log("test note");
            synth
                .noteOn(channel, note, velocity)
                .wait(duration)
                .noteOff(channel, note);
        }, repeat);
    }

    bluetoothTest(bluetooth) {
        bluetooth.test();
    }
}

// Exporting the Debugging class
module.exports =  Debugging ;