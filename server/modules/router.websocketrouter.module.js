/*
WebsocketRouter
===============
This module encapsulates the websocket *inbound* routing logic that used to live
in `conductor.node.js`:

- `socket.setMessageReceivedCallback(...)`
- the helper `routeFromWebsocket(msg, route, callback)`

It is intentionally "dumb": it wires incoming websocket messages to existing
module methods (theory, score, orchestra, etc), keeping conductor behavior the
same.
*/

module.exports = class WebsocketRouter {
  constructor({
    db,
    socket,
    theory,
    score,
    performance,
    orchestra,
    transport,
    midiHardwareEngine,
    udpPort,
    osc,
    UDPSendIP,
    UDPSendPort,
    soundfont,

    // legacy / optional (used only by "reset" route, which appears incomplete)
    synthtype,
    synth,
    JZZ,
    fluidpath,
    fluidargs,
  } = {}) {
    this.db = db;
    this.socket = socket;
    this.theory = theory;
    this.score = score;
    this.performance = performance;
    this.orchestra = orchestra;
    this.transport = transport;
    this.midiHardwareEngine = midiHardwareEngine;

    this.udpPort = udpPort;
    this.osc = osc;
    this.UDPSendIP = UDPSendIP;
    this.UDPSendPort = UDPSendPort;
    this.soundfont = soundfont;

    this.synthtype = synthtype;
    this.synth = synth;
    this.JZZ = JZZ;
    this.fluidpath = fluidpath;
    this.fluidargs = fluidargs;

    this._boundOnMessage = null;
  }

  attach() {
    if (!this.socket?.setMessageReceivedCallback) {
      throw new Error("WebsocketRouter.attach(): socket.setMessageReceivedCallback is required");
    }
    if (this._boundOnMessage) {
      return;
    }
    this._boundOnMessage = this._onMessage.bind(this);
    this.socket.setMessageReceivedCallback(this._boundOnMessage);
  }

  detach() {
    if (!this.socket?.setMessageReceivedCallback || !this._boundOnMessage) {
      return;
    }
    // SocketServer doesn't expose a "remove" API; overwrite callback with a noop.
    this.socket.setMessageReceivedCallback(function () {});
    this._boundOnMessage = null;
  }

  _onMessage(msg) {
    const db = this.db;
    const socket = this.socket;
    const theory = this.theory;
    const score = this.score;
    const performance = this.performance;
    const orchestra = this.orchestra;
    const transport = this.transport;
    const midiHardwareEngine = this.midiHardwareEngine;

    const udpPort = this.udpPort;
    const osc = this.osc;
    const UDPSendIP = this.UDPSendIP;
    const UDPSendPort = this.UDPSendPort;
    const soundfont = this.soundfont;

    // /chord message sets the chord for the theory engine to make a notelist
    let result = this._routeFromWebsocket(msg, "chord", function (msg) {
      theory.runSetter(msg, "fromSocket");
    });

    // getscore ask for the contents and name of the current score
    this._routeFromWebsocket(msg, "getScore", function () {
      let data = { scoreName: score.scoreFilename, text: score.scoreText };
      socket.sendMessage("score", data);
    });

    // getscorelist asks for a list of all scores
    this._routeFromWebsocket(msg, "getScoreList", function () {
      score.getScoreList(function (list) {
        socket.sendMessage("scoreList", list);
      });
    });

    // getperformanceList asks for a list of all performances
    this._routeFromWebsocket(msg, "getPerformanceList", function () {
      performance.getPerformanceList(function (list) {
        socket.sendMessage("performanceList", list);
      });
    });

    // getvoicelist ask for a list of bank:program and name of every instrument in the soundfont
    this._routeFromWebsocket(msg, "getVoiceList", function () {
      // get voicelist and send as socket.sendMessage("voicelist", voicelist);
      orchestra.soundfontFile = soundfont;
      orchestra.getVoiceList(function (voiceList) {
        console.log("sending voiceList", voiceList);
        socket.sendMessage("voiceList", voiceList); //  transport.start();
      });
    });

    // loadperformance sends a performance name
    this._routeFromWebsocket(msg, "loadPerformance", function (msg) {
      performance.performanceFile = msg;
      performance.loadPerformance(msg);
    });

    this._routeFromWebsocket(msg, "savePerformance", function (msg) {
      db.log(msg);
      let filename = msg.performanceName;

      performance.performanceFile = filename;

      performance.savePerformance(filename, function (performance) {
        db.log("performance written");
        performance.getPerformanceList(function (list) {
          socket.sendMessage("performanceList", list);
        });
      });
    });

    // loadscore updates the name and contents of the score objects current score
    this._routeFromWebsocket(msg, "loadScore", function (msg) {
      score.scoreFilename = msg;
      score.openScore(function (scoreText) {
        let data = { scoreName: score.scoreFilename, text: scoreText };
        db.log("sending score data", data);
        socket.sendMessage("score", data); //  trans.start();
      });
    });

    // savescore sends a name and content to be saved on the server
    this._routeFromWebsocket(msg, "saveScore", function (msg) {
      db.log(msg);
      let filename = msg.scoreName;
      let scoreText = msg.text;
      let dir = score.scoreDir;
      let fullpath = dir + "/" + filename;

      score.scoreFilename = filename;
      score.scoreText = scoreText;

      score.writeScore(function (scoreobj) {
        db.log("score written");
        score.openScore(function (scoreText) {
          let data = { scoreName: score.scoreFilename, text: scoreText };
          db.log("sending score data", data);
          socket.sendMessage("score", data); //  transport.start();
        });
        // send the scorelist
        score.getScoreList(function (list) {
          socket.sendMessage("scoreList", list);
        });
      });
    });

    // stop tells the transport to stop (stop and go to beginning)
    this._routeFromWebsocket(msg, "stop", function () {
      transport.stop();
      midiHardwareEngine.quantizeActive = false;
    });

    // play tells the transport to play from current point
    this._routeFromWebsocket(msg, "play", function () {
      transport.start();
      midiHardwareEngine.quantizeActive = true;
    });

    // pause tells the transport to stop playing but don't change position
    this._routeFromWebsocket(msg, "pause", function () {
      transport.pause();
      midiHardwareEngine.quantizeActive = false;
    });

    // set bpm changes the bpm. might not be fully implemented
    this._routeFromWebsocket(msg, "setBpm", function (msg) {
      let bpm = msg.bpm;
      transport.updateBpm(bpm);
      orchestra.allInstrumentSetValue("bpm", bpm);
    });

    // web page just loaded and is ready
    this._routeFromWebsocket(msg, "ready", function () {
      let data = { scoreName: score.scoreFilename, text: score.scoreText };
      socket.sendMessage("score", data);

      // send all the instruments if there are currently any running:
      orchestra.allLocalInstruments(function (instrument) {
        let props = instrument.getConfigProps();
        props.push({ name: "instrType", value: "local" });
        socket.sendMessage("addInstrument", props);
      });
      orchestra.allUDPInstruments(function (instrument) {
        let props = instrument.getConfigProps();
        props.push({ name: "instrType", value: "udp" });
        socket.sendMessage("addInstrument", props);
      });

      if (db.createFakeInstruments) {
        // TESTING THINGS HERE
        // create some dummy instruments for UI testing. they won't play
        let instrument = orchestra.createUDPInstrument("thread1", "TEST");
        let props = instrument.getConfigProps();
        props.push({ name: "instrType", value: "udp" });
        socket.sendMessage("addInstrument", props);
        instrument.start();

        let instrument2 = orchestra.createUDPInstrument("thread2", "2TEST2");
        let props2 = instrument2.getConfigProps();
        props2.push({ name: "instrType", value: "udp" });
        socket.sendMessage("addInstrument", props2);
        instrument2.start();
      }
    });

    // reset resets the synth and midi engine (not sure this has been tested)
    this._routeFromWebsocket(msg, "reset", (text) => {
      db.log("~~~~~~~~~~~~~~~~`RESETTING EVERYTHING ~~~~~~~~~~~~~~~~~~~~~~~~~~~~`");
      // reset a bunch of stuff.
      // the synth:
      //        synth.stop();
      if (this.synthtype == "FLUID") {
        this.synth.close();
        this.synth = false;
        this.synth = this.JZZ.synth.Fluid({
          path: this.fluidpath,
          sf: soundfont,
          args: this.fluidargs,
        });
        orchestra.synth = this.synth;
        orchestra.allUDPInstrumentSetValue("synth", this.synth);
        orchestra.allLocalInstrumentSetValue("synth", this.synth);
      }
      // midiHardwareEngine
      orchestra.midiHardwareEngine.send("reset");
    });

    ////////////////////////////
    // instrval gets a varname and a value, and updates the instrument's variables accordingly
    this._routeFromWebsocket(msg, "instrVal", function (data) {
      // send config messages to instruments
      db.log("instrVal update");
      let deviceName = data.id;
      let prop = data.var;
      let mappedProp = orchestra.configPropMap[prop];
      if (!mappedProp) {
        mappedProp = prop;
      }
      let value = data.val;
      let instrType = data.instrType;
      if (instrType == "local") {
        db.log("setting local instr value", deviceName, prop, value);
        orchestra.localInstrumentSetValue(deviceName, prop, value);
      } else if (instrType == "udp") {
        // set locally in orchestra AND remotely on device.
        orchestra.udpInstrumentSetValue(deviceName, prop, value);
        db.log("set udp instr value");
        db.log(msg);
        // sending UDP message to remote instruments
        let type = "s";
        if (typeof value == "number") {
          value = parseInt(value);
          type = "i";
        }
        let address = "/" + deviceName + "/config/" + mappedProp;
        let args = [{ type: type, value: value }];
        let bundle = {
          timeTag: osc.timeTag(1),
          packets: [
            {
              address: address,
              args: args,
            },
          ],
        };
        db.log("sending udp message " + address, args, UDPSendIP, UDPSendPort);
        // send device prop to all UDP connected devices
        udpPort.send(bundle, UDPSendIP, UDPSendPort);
      }
    });
  }

  // helper: parse message into channel + payload and route to callback
  _routeFromWebsocket(msg, route, callback) {
    let channel = false;
    let newMsg = false;
    if (msg && msg.address) {
      channel = msg.address;
      newMsg = msg.data;
    } else {
      let split = msg.split(/ /);
      channel = split.shift();
      newMsg = split.join(" ");
    }
    if (channel.toLowerCase() == route.toLowerCase()) {
      callback(newMsg);
      return true;
    }
    return false;
  }
};
