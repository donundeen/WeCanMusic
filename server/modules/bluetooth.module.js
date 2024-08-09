const { exec } = require('child_process');

let Bluetooth = {
    deviceID : "74:F0:F0:AB:D5:21",
    deviceName : "",
    blue : false,
    active: false,
    connected: false,

    db: false,

    init(){
        this.db.log("bluetooth init 1");

        if(!this.active) return;

        this.db.log("bluetooth init");
        this.blue = require("bluetoothctlwe");
        this.blue.Bluetooth();
    },

    keepUp(){
        if(!this.active) return;
        let self = this;

        function deviceCheckAndConnect(options, callback) {
            
            // this is where we might wait until we see a set of headphones connected before we start
            exec("pacmd list-sinks", (error, stdout, stderr) => {
                if (error) {
                  this.db.log(`exec error: ${error.message}`);
                }
                if (stderr) {
                  this.db.log(`exec stderr: ${stderr}`);
                }
                if (stdout) {
            //        this.db.log(`exec stdout: ${stdout}`);
                }
  
                //		if(stdout.includes("drive: <module-bluez5-device.c>")){
                if (stdout.includes("module-bluez5-device")) {
                    this.db.log("headphones found");
                } else {
                    this.db.log("headphones not found, connecting");
                    exec("/usr/bin/bluetoothctl connect " + self.deviceID, (error, stdout, stderr) => {
                        if (error) {
                            this.db.log(`exec error: ${error.message}`);
                        }
                        if (stderr) {
                            this.db.log(`exec stderr: ${stderr}`);
                        }
                        this.db.log(`exec stdout ${stdout}`);
                    });
                }                  
            });          
        }

        deviceCheckAndConnect();
        setInterval(deviceCheckAndConnect, 10000);

    },

    test(){
        this.keepUp();
    },

    test2(){
        if(!this.active) return;

        if(!this.blue){ this.init();}


        var hasBluetooth=this.blue.checkBluetoothController();
        this.db.log('system has bluetooth controller:' + hasBluetooth);

        this.blue.on(this.blue.bluetoothEvents.Device, function (devices) {
            this.db.log('devices:' + JSON.stringify(devices,null,2))
            device = devices.filter((d)=> {return d.mac = this.deviceID})[0];
            this.db.log(device);
        });

        
        if(hasBluetooth) {
            let self = this;

            function waitForHeadphones(options, callback) {
                //    callback();
                    
                
                  // if there's a headphones_id set, then we need to try to connect to it manually here
                  if (self.deviceID) {
                    this.db.log("connected to headphones " + self.deviceID);
                    exec("bluetoothctl connect " + self.deviceID, (error, stdout, stderr) => {
                      if (error) {
                        this.db.log(`exec error: ${error.message}`);
                      }
                      if (stderr) {
                        this.db.log(`exec stderr: ${stderr}`);
                      }
                 //     this.db.log(`exec stdout ${stdout}`);
                    });
                  }
                
                  // this is where we might wait until we see a set of headphones connected before we start
                  exec("pacmd list-sinks", (error, stdout, stderr) => {
                    if (error) {
                      this.db.log(`exec error: ${error.message}`);
                    }
                    if (stderr) {
                      this.db.log(`exec stderr: ${stderr}`);
                    }
                    //		if(stdout.includes("drive: <module-bluez5-device.c>")){
                    if (stdout.includes("module-bluez5-device")) {
                
                      this.db.log("headphones found");
                      callback();
                    } else {
                      this.db.log("headphones not found");
                 //     this.db.log(`exec stdout ${stdout}`);
                      setTimeout(function () { waitForHeadphones(options, callback) }, 1000);
                    }
                  });          
                }

            waitForHeadphones({}, function(){
                this.db.log("^&^&^&^&^&^&^&^&^&^&&^&^&^&^ CONNECTED");
              //  self.blue.scan(false);                
            });
/*
            this.db.log('isBluetooth Ready:' + this.blue.isBluetoothReady);
            this.db.log(this.blue.info(this.deviceID));
            */
/*
            this.blue.scan(true);
            setTimeout(function(){
                this.db.log('stopping scan')
                self.blue.scan(false)
                this.db.log(self.blue.info(self.deviceID));
            },5000);
            */
        }
    },



}

exports.Bluetooth = Bluetooth;
