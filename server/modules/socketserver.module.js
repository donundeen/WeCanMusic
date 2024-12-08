// comments here
const path = require('path');
var connect = require('connect');
var serveStatic = require('serve-static');
let my_ip_address= "localhost";
// figuring out IP address:
const { networkInterfaces } = require('os');
const WebSocket = require('ws'); //https://www.npmjs.com/package/ws#sending-and-receiving-text-data


let globalvar = "goo";

let SocketServer = {

  WEBSOCKET_PORT : 8001,
  WEBSERVER_PORT : 8002,
  default_webpage : "index.html",

  socketserver : false,
  sockets : [],

  messageReceivedCallback : false,

  startSocketServer(){

    this.db.log("trying to start websockets...");

    this.socketserver = new WebSocket.Server({

      port: this.WEBSOCKET_PORT
    });
    
    let self = this;

    this.socketserver.on('connection', (function(socket) {
      this.sockets.push(socket);
      this.db.log("STARTD websockets " +globalvar);
//      this.db.log(this.socketserver);

      // When you receive a message, send that message to every socket.
      socket.on('message', (function(msg) {
        //this.socketserver.onmessage = function(msg) {
            this.db.log("got message");
          //this.sockets.forEach(s => s.send(msg)); // send back out - we don't need to do this
      //  	this.db.log(msg);
      //	  this.db.log("Got message " + msg.toString());
          //this is messages FROM the web page
          this.db.log(msg.toString());
          let newmsg = JSON.parse(msg.toString());          
          this.db.log(newmsg);
        this.messageReceived(newmsg);
      }).bind(this));

      // When a socket closes, or disconnects, remove it from the array.
      socket.on('close', (function() {
        this.sockets = this.sockets.filter(s => s !== socket);
      }).bind(this));

    }).bind(this));

  },

  messageReceived(msg){
    if(this.messageReceivedCallback){
      this.messageReceivedCallback(msg);
    }
  },

  setMessageReceivedCallback(callback){
    this.messageReceivedCallback = callback;
  },


  sendMessage(address, data){
    let msg = {
      address: address,
      data : data
    }
    this.sockets.forEach(s => s.send(JSON.stringify(msg)));
  },

  startWebServer(){
    // this is serving the web page
    this.db.log("startWebServer");
    this.db.log(__dirname);    
    self= this;
    let options = {index: this.default_webpage};
    this.db.log(options);
    connect()
      .use(serveStatic(__dirname+"/../html",options))
      .listen(this.WEBSERVER_PORT, () => 	{

      const nets = networkInterfaces();
      const results = Object.create(null); // Or just '{}', an empty object
      for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
            // 'IPv4' is in Node <= 17, from 18 it's a number 4 or 6
            const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4
            if (net.family === familyV4Value && !net.internal) {
                if (!results[name]) {
                    results[name] = [];
                }
                this.db.log(name);
                results[name].push(net.address);
            }
        }
      }
      this.db.log(results);
      if(results["en0"]){
        my_ip_address = results["en0"]; 
      }else if(results["Ethernet"]){
        my_ip_address = results["Ethernet 2"]; 
      }

      this.db.log('Server running on '+self.WEBSERVER_PORT+'... http://'+my_ip_address+':'+self.WEBSERVER_PORT+'/aiselector.html '+__dirname);
      this.db.log('http://'+my_ip_address+':'+self.WEBSERVER_PORT+'/aiselector.html');
      this.db.log('UIInterface http://'+my_ip_address+':'+self.WEBSERVER_PORT+'/aiselector.html');
      this.db.log('ipaddress '+my_ip_address);
     });
  },

  startExpressWebServer(){
    const express = require('express');
    const path = require('path');
    const app = express();

    // Serve static files from the "public" directory
    // __dirname+"/../html"
    const staticPath = path.join(__dirname, '../html');
    app.use(express.static(staticPath));

    // Handle specific OS detection probes
    app.get(['/hotspot-detect.html', '/generate_204', '/connecttest.txt'], (req, res) => {
        // Respond to detection probes with either a redirect or basic content
        res.redirect('/portal.html'); // Redirect to the captive portal
    });

    // Fallback route for unhandled requests
    app.get('*', (req, res) => {
        res.sendFile(path.join(staticPath, 'portal.html'));
    });

    const PORT = 80; // Use port 80 for HTTP
    app.listen(this.WEBSERVER_PORT, () => {
        console.log(`Captive portal server running on port ${this.WEBSERVER_PORT}`);
    });

  }
}


exports.SocketServer = SocketServer;
