/*
OscRouter
=========
This module encapsulates the OSC/UDP *inbound* routing that used to live in
`conductor.node.js` under `udpPort.on("message", ...)` plus the helper
`routeFromOSC()`.

It is intentionally "dumb": it just wires incoming OSC addresses to existing
methods on the already-instantiated modules (orchestra, performance, etc),
keeping conductor's behavior the same.
*/

const { exec } = require("child_process");

module.exports = class OscRouter {
  constructor({
    db,
    udpPort,
    orchestra,
    performance,
    statusMelodies,
    transport,
    socket,
  } = {}) {
    this.db = db;
    this.udpPort = udpPort;

    this.orchestra = orchestra;
    this.performance = performance;
    this.statusMelodies = statusMelodies;
    this.transport = transport;
    this.socket = socket;

    this._boundOnMessage = null;
  }

  attach() {
    if (!this.udpPort) {
      throw new Error("OscRouter.attach(): udpPort is required");
    }
    if (this._boundOnMessage) {
      return;
    }
    this._boundOnMessage = this._onMessage.bind(this);
    this.udpPort.on("message", this._boundOnMessage);
  }

  detach() {
    if (!this.udpPort || !this._boundOnMessage) {
      return;
    }
    this.udpPort.removeListener("message", this._boundOnMessage);
    this._boundOnMessage = null;
  }

  _onMessage(oscMsg) {
    // when an OSC messages comes in
    if (this.db?.log) {
      this.db?.log?.("An OSC message just arrived!", oscMsg);
    }

    const orchestra = this.orchestra;
    const performance = this.performance;
    const statusMelodies = this.statusMelodies;
    const transport = this.transport;
    const socket = this.socket;
    const db = this.db;

    // announcind UDP (arduino esp32 mostly) instruments to create them in the orchestra
    this._routeFromOSC(oscMsg, "/announceUDPInstrument", function (oscMsg) {
      db?.log?.("!!!!!!!!!!!!!!!!!!!! UDP INSTRUMENT !!!!!!!!!!!!!!!!!!!!!!");
      let value = oscMsg.simpleValue;
      db?.log?.(value);
      let name = value[0];
      let midiBank = 0;
      let midiProgram = value[1];
      let midimin = value[2];
      let midimax = value[3];
      let midiNlen = value[4];
      let midiVol = value[5];
      if (value.length > 6) {
        midiBank = value[1];
        midiProgram = value[2];
        midimin = value[3];
        midimax = value[4];
        midiNlen = value[5];
        midiVol = value[6];
      }
      if (value?.name) {
        name = value.name;
      }
      let midiVoice = midiBank + ":" + midiProgram;
      // legacy debug prints kept as-is
      db?.log?.(db);
      let instrument = orchestra.createUDPInstrument(name, value);
      db?.log?.(db);
      db?.log?.(midiVoice, midiBank, midiProgram);
      orchestra.udpInstrumentSetValue(name, "midiVoice", midiVoice);
      orchestra.udpInstrumentSetValue(name, "midiBank", midiBank);
      orchestra.udpInstrumentSetValue(name, "midiProgram", midiProgram);
      orchestra.udpInstrumentSetValue(name, "midimin", midimin);
      orchestra.udpInstrumentSetValue(name, "midimax", midimax);
      orchestra.udpInstrumentSetValue(name, "midiNlen", midiNlen);
      orchestra.udpInstrumentSetValue(name, "midiVol", midiVol);
      let props = instrument.getConfigProps();
      db?.log?.("setting add instrument props");
      db?.log?.(midiVoice);
      db?.log?.(props);
      socket.sendMessage("addinstrument", props);
      instrument.start();
    });

    // processing makeNote messages from UDP connected devices
    this._routeFromOSC(oscMsg, "/makeNote", function (oscMsg) {
      db?.log?.("MAKING NOTE in routeFromOSC");
      let value = oscMsg.simpleValue;
      let name = value[0];
      let pitch = value[1];
      let velocity = value[2];
      let duration = value[3];
      if (!orchestra.hasUDPInstrument(name)) {
        let instrument = orchestra.createUDPInstrument(name, {});
        let props = instrument.getConfigProps();
        props.push({ name: "instrtype", value: "udp" });
        socket.sendMessage("addinstrument", props);
        instrument.start();
      }
      if (pitch < 128 && velocity < 128) {
        orchestra.udpMakeNote(name, pitch, velocity, duration);
      }
    });

    // processing request to destroy UDP instruments
    this._routeFromOSC(oscMsg, "/removeUDPInstrument", function (oscMsg) {
      let value = oscMsg.simpleValue;
      let name = value;
      if (value?.name) {
        name = value.name;
      }
      orchestra.destroyUDPInstrument(name);
    });

    this._routeFromOSC(oscMsg, "/performance", function (oscMsg) {
      let value = oscMsg.simpleValue;
      let name = value;
      if (value?.name) {
        name = value.name;
      }
      performance.performanceFile = name;
      performance.loadPerformance(name, function () {
        statusMelodies.playPerformanceChange();
        transport.stop();
        transport.reset();
        transport.start();
      });

      socket.sendMessage("performancename", name);
    });

    this._routeFromOSC(oscMsg, "/sayperformance", function (oscMsg) {
      let value = oscMsg.simpleValue;
      let name = value;
      db?.log?.("saying performance", name);
      if (value?.name) {
        name = value.name;
      }
      let command = 'flite -t "' + name + '"';
      exec(command);
    });

    this._routeFromOSC(oscMsg, "/selnextper", function () {
      performance.selectNextPerformance(function (_index, performanceObj) {
        let sayname = performanceObj.sayname;
        let command = 'flite -t "' + sayname + '"';
        exec(command);
      });
    });

    this._routeFromOSC(oscMsg, "/playselper", function () {
      let performanceObj = performance.getCurrentSelectedPerformanceData();
      performance.performanceFile = performanceObj.filename;
      performance.loadPerformance(performanceObj.filename, function () {
        statusMelodies.playPerformanceChange();
        transport.stop();
        transport.reset();
        transport.start();
      });
      socket.sendMessage("performancename", performanceObj.filename);
    });

    /***
     * Dealing with local instruments , aka "dumb instruments" that send on number values, and their ID
     * the rest of their data is stored locally, and notes are generated locally
     */

    // announcing local instruments to create them in the orchestra
    // NOTE: all localInstrument stuff is broken, needs updating
    this._routeFromOSC(oscMsg, "/announceLocalInstrument", function (oscMsg) {
      db?.log?.("announcing local instrument", oscMsg);
      let value = oscMsg.simpleValue;
      db?.log?.(value);
      let name = value;
      if (value?.name) {
        name = value.name;
      }
      let instrument = orchestra.createLocalInstrument(name, value);
      let props = instrument.getConfigProps();
      props.push({ name: "instrType", value: "local" });
      socket.sendMessage("addInstrument", props);
      instrument.start();
    });


    // local and thenew udo instrumets basically the same.
    this._routeFromOSC(oscMsg, "/announceInstrument", function (oscMsg) {
      db?.log?.("announcing local instrument", oscMsg);
      let value = oscMsg.simpleValue;
      db?.log?.(value);
      let name = value;
      if (value?.name) {
        name = value.name;
      }
      let instrument = orchestra.createLocalInstrument(name, value);
      let props = instrument.getConfigProps();
      props.push({ name: "instrType", value: "local" });
      socket.sendMessage("addInstrument", props);
      instrument.start();
    });

    this._routeFromOSC(oscMsg, "/announceCircleRhythmInstrument", function (oscMsg) {
      db?.log?.("announcing circle rhythm instrument", oscMsg);
      let value = oscMsg.simpleValue;
      db?.log?.(value);
      let name = value;
      if (value?.name) {
        name = value.name;
      }
      let instrument = orchestra.createCircleRhythmInstrument(name, value);
      let props = instrument.getConfigProps();
      props.push({ name: "instrType", value: "local" });
      socket.sendMessage("addInstrument", props);
      instrument.start();
    });

    // processing request to destroy local instruments
    this._routeFromOSC(oscMsg, "/removeLocalInstrument", function (oscMsg) {
      let value = oscMsg.simpleValue;
      let name = value;
      if (value?.name) {
        name = value.name;
      }
      orchestra.destroyLocalInstrument(name);
    });

    this._routeFromOSC(oscMsg, "/rawval", function (oscMsg) {
      let value = oscMsg.simpleValue;
      db?.log?.("rawval", oscMsg);
      let name = value[0];
      let rawval = parseFloat(value[1]);
      let instrument = orchestra.getLocalInstrument(name);
      if (instrument) {
        instrument.sensorValue = rawval;
      }
    });

    this._routeFromOSC(oscMsg, "/circleRhythm", function (oscMsg) {
      let value = oscMsg.simpleValue;
      db?.log?.("circle_rhythm", oscMsg);
      db?.log?.(value);
      let name = value[0];
      let point = value[1];
      db?.log?.("circle_rhythm loading point", name, point);
      let instrument = orchestra.getLocalInstrument(name);
      if (instrument) {
        instrument.loadHashPointBuffer(point);
      }
    });

    this._routeFromOSC(oscMsg, "/circleRhythmClear", function (oscMsg) {
      let name = oscMsg.simpleValue;
      db?.log?.("circle_rhythm clear", oscMsg);
      db?.log?.(name);

      let instrument = orchestra.getLocalInstrument(name);
      if (instrument) {
        instrument.clearHashPoints();
        instrument.clearHashPointBuffer();
      }
    });

    this._routeFromOSC(oscMsg, "/circleRhythmNewSet", function (oscMsg) {
      let name = oscMsg.simpleValue;
      db?.log?.("circle_rhythm clear", oscMsg);
      db?.log?.(name);

      let instrument = orchestra.getLocalInstrument(name);
      if (instrument) {
        instrument.clearHashPointBuffer();
      }
    });

    this._routeFromOSC(oscMsg, "/circleRhythmSetDone", function (oscMsg) {
      let name = oscMsg.simpleValue;
      db?.log?.("circle_rhythm clear", oscMsg);
      db?.log?.(name);

      let instrument = orchestra.getLocalInstrument(name);
      if (instrument) {
        instrument.copyHashPointBufferToHash();
      }
    });

    this._routeFromOSC(oscMsg, "/sensor", function (oscMsg) {
      let value = oscMsg.simpleValue;
      let name = value[0];
      db?.log?.("sensor", name, value);
      let rawval = parseFloat(value[1]);
      let smoothval = parseFloat(value[2]);
      let rmsval = parseFloat(value[3]);
      let peakval = parseFloat(value[4]);
      let velval = parseFloat(value[5]);
      let instrument = orchestra.getLocalInstrument(name);
      if (instrument) {
        instrument.sensorValue = rawval;
        instrument.smoothValue = smoothval;
        instrument.rmsValue = rmsval;
        instrument.peakValue = peakval;
        instrument.velValue = velval;
      }else{
        db?.log?.("sensor", name, value, "no UDP instrument found");
        // we need to create a new instrument here
        let instrument = orchestra.createLocalInstrument(name, value);
        let props = instrument.getConfigProps();
        props.push({ name: "instrType", value: "local" });
        socket.sendMessage("addInstrument", props);
        instrument.start();
      }
    });

    // setting config values for instruments (local instruments)
    // THIS NEEDS REVIEW
    let instrNames = orchestra.getLocalInstrumentNames();
    let localInstrMatch = "(" + instrNames.join("|") + ")";
    if (localInstrMatch !== "()") {
      let configMatch = "/property/" + localInstrMatch + "/[^/]+";
      this._routeFromOSC(oscMsg, new RegExp(configMatch), function (oscMsg, address) {
        let instrName = address[2];
        let propName = address[3];
        let value = oscMsg.simpleValue;
        if (instrName.toLowerCase() === "all") {
          orchestra.allLocalInstrumentSetValue(propName, value);
        } else {
          orchestra.localInstrumentSetValue(instrName, propName, value);
        }
        let updateObj = { deviceName: instrName };
        updateObj[propName] = value;
        socket.sendMessage("updateLocalInstrument", updateObj);
      });
    }
  }

  // routing helper for handling OSC messages
  _routeFromOSC(oscMsg, route, callback) {
    // get the OSC value. Need to figure out types here,
    let value = oscMsg.args;
    let newValue = false;

    if (typeof value === "number") {
      newValue = value;
    } else if (
      Array.isArray(value) &&
      value.length === 1 &&
      Object.hasOwn(value[0], "value")
    ) {
      if (value[0].type === "s") {
        try {
          newValue = JSON.parse(value[0].value);
        } catch (e) {
          newValue = value[0].value;
        }
      } else {
        newValue = value[0].value;
      }
    } else if (
      Array.isArray(value) &&
      value.length > 1 &&
      Object.hasOwn(value[0], "value")
    ) {
      newValue = [];
      for (let i = 0; i < value.length; i++) {
        if (value[0].type === "s") {
          try {
            newValue[i] = JSON.parse(value[i].value);
          } catch (e) {
            newValue[i] = value[i].value;
          }
        } else {
          newValue[i] = value[i].value;
        }
      }
    } else {
      this.db?.log?.("!!!!!!!!!!!!!! ");
      this.db?.log?.(
        "don't know what value is " +
          Array.isArray(value) +
          " : " +
          value?.length +
          " type :" +
          typeof value
      );
    }

    oscMsg.simpleValue = newValue;

    let matches = oscMsg.address.match(route);
    if (matches) {
      let split = oscMsg.address.split("/");
      callback(oscMsg, split);
    }
  }
};
