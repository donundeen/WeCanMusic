// comments here
const path = require('path');
var connect = require('connect');
var serveStatic = require('serve-static');
const fs=require('fs')


// figuring out IP address:
const { networkInterfaces } = require('os');
const WebSocket = require('ws'); //https://www.npmjs.com/package/ws#sending-and-receiving-text-data

class SocketServer {

  constructor(options){
    this.db = false;
    if(options.db){
      this.db = options.db;
    }
    this.WEBSOCKET_PORT = 80;
    this.WEBSERVER_PORT = 80;
    this.USE_HTTPS = false;
    this.default_webpage = "index.html";
    this.socketserver = false;
    this.sockets = [];
    this.messageReceivedCallback = false;
    this.expressapp = false;
  
    this.socketserver = false;
    this.sockets = [];

    this.messageReceivedCallback = false;
    this.expressapp = false;
  }

  messageReceived(msg){
    if(this.messageReceivedCallback){
      this.messageReceivedCallback(msg);
    }
  }

  setMessageReceivedCallback(callback){
    this.messageReceivedCallback = callback;
  }

  sendMessage(address, data){
    let msg = {
      address: address,
      data : data
    }
    this.sockets.forEach(s => s.send(JSON.stringify(msg)));
  }

  startWebAndSocketServer(){
    this.db.log("trying to start web and websocket servers...");

    // Initialize the Express app
    const express = require('express');
    const path = require('path');
    this.expressapp = express();

    let http = require('http');
    if(this.USE_HTTPS){
      http = require('https');
    }


    // Create the HTTP server instance
//    const server = http.createServer((req, res) => {
//      this.expressapp(req, res); // Handle requests with the Express app
//    });

    let options = {};
    try{
      options = {
        key:fs.readFileSync(path.join(__dirname,'./../cert/key.pem')),
        cert:fs.readFileSync(path.join(__dirname,'./../cert/cert.pem'))
      };
      console.log("ssl certs found, using https");
    }catch(e){
      console.log("no ssl certs found, using http");
    }

    const server = http.createServer(options, this.expressapp);

    // Start the HTTP server
    server.listen(this.WEBSERVER_PORT, () => {
      const address = server.address(); // Get the address of the HTTP server
      const port = address.port; // Extract the port      
      console.log(`HTTP server is listening on port ${port}`);
    });

    // Serve static files from the "public" directory
    const staticPath = path.join(__dirname, '../html');
    this.expressapp.use(express.static(staticPath));

    // Handle specific OS detection probes
    this.expressapp.get(['/hotspot-detect.html', '/generate_204', '/connecttest.txt'], (req, res) => {
        // Respond to detection probes with either a redirect or basic content
        res.redirect('/' + this.default_webpage); // Redirect to the captive portal
    });

    // Fallback route for unhandled requests
    this.expressapp.get('*', (req, res) => {
        res.sendFile(path.join(staticPath, this.default_webpage));
    });

    // Initialize the WebSocket server using the same HTTP server
    this.socketserver = new WebSocket.Server({ server });

    let self = this;

    this.socketserver.on("error", function(e) {
        console.log("socketserver error", e);
    });

    this.socketserver.on('listening', function() {
        const address = server.address(); // Get the address of the HTTP server
        const port = address.port; // Extract the port
        console.log("WebSocket server is listening on port " + port);
    });

    this.socketserver.on('connection', (function(socket) {
      console.log("socket connection estblished");
      this.sockets.push(socket);
      this.db.log("STARTED websockets");
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
  }
}

module.exports = SocketServer;