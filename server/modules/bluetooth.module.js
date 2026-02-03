const { exec } = require('child_process');

class Bluetooth {
    constructor() {
        this.deviceID = "74:F0:F0:AB:D5:21";
        this.deviceName = "";
        this.blue = false;
        this.active = false;
        this.connected = false;
        this.db = false;
    }

    init() {
        this.db?.log?.("bluetooth init 1");

        if (!this.active) return;

        this.db?.log?.("bluetooth init");
        this.blue = require("bluetoothctlwe");
        this.blue.Bluetooth();
    }

    keepUp() {
        if (!this.active) return;
        let self = this;

        function deviceCheckAndConnect(options, callback) {
            exec("pacmd list-sinks", (error, stdout, stderr) => {
                if (error) {
                    this.db?.log?.(`exec error: ${error.message}`);
                }
                if (stderr) {
                    this.db?.log?.(`exec stderr: ${stderr}`);
                }
                if (stdout) {
                    if (stdout.includes("module-bluez5-device")) {
                        this.db?.log?.("headphones found");
                    } else {
                        this.db?.log?.("headphones not found, connecting");
                        exec("/usr/bin/bluetoothctl connect " + self.deviceID, (error, stdout, stderr) => {
                            if (error) {
                                this.db?.log?.(`exec error: ${error.message}`);
                            }
                            if (stderr) {
                                this.db?.log?.(`exec stderr: ${stderr}`);
                            }
                            this.db?.log?.(`exec stdout ${stdout}`);
                        });
                    }
                }
            });
        }

        deviceCheckAndConnect();
        setInterval(deviceCheckAndConnect, 10000);
    }

    test() {
        this.keepUp();
    }

    test2() {
        if (!this.active) return;

        if (!this.blue) { this.init(); }

        var hasBluetooth = this.blue.checkBluetoothController();
        this.db?.log?.('system has bluetooth controller:' + hasBluetooth);

        this.blue.on(this.blue.bluetoothEvents.device, function (devices) {
            this.db?.log?.('devices:' + JSON.stringify(devices, null, 2));
            deviceFound = devices.filter((d) => { return d.mac = this.deviceID })[0];
            this.db?.log?.(deviceFound);
        });

        if (hasBluetooth) {
            let self = this;

            function waitForHeadphones(options, callback) {
                if (self.deviceID) {
                    this.db?.log?.("connected to headphones " + self.deviceID);
                    exec("bluetoothctl connect " + self.deviceID, (error, stdout, stderr) => {
                        if (error) {
                            this.db?.log?.(`exec error: ${error.message}`);
                        }
                        if (stderr) {
                            this.db?.log?.(`exec stderr: ${stderr}`);
                        }
                    });
                }

                exec("pacmd list-sinks", (error, stdout, stderr) => {
                    if (error) {
                        this.db?.log?.(`exec error: ${error.message}`);
                    }
                    if (stderr) {
                        this.db?.log?.(`exec stderr: ${stderr}`);
                    }
                    if (stdout.includes("module-bluez5-device")) {
                        this.db?.log?.("headphones found");
                        callback();
                    } else {
                        this.db?.log?.("headphones not found");
                        setTimeout(function () { waitForHeadphones(options, callback) }, 1000);
                    }
                });
            }

            waitForHeadphones({}, function () {
                this.db?.log?.("^&^&^&^&^&^&^&^&^&^&&^&^&^&^ CONNECTED");
            });
        }
    }
}

module.exports = Bluetooth;
