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
    this.websocketPort = 80;
    this.webserverPort = 80;
    this.useHttps = false;
    this.defaultWebpage = "index.html";
    this.websocketServer = false;
    this.sockets = [];
    this.messageReceivedCallback = false;
    this.expressApp = false;

    this.messageReceivedCallback = false;
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
    this.expressApp = express();

    let http = require('http');
    if(this.useHttps){
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

    const server = http.createServer(options, this.expressApp);

    // Start the HTTP server
    server.listen(this.webserverPort, () => {
      const address = server.address(); // Get the address of the HTTP server
      const port = address.port; // Extract the port      
      console.log(`HTTP server is listening on port ${port}`);
    });

    // Serve static files from the "public" directory
    const staticPath = path.join(__dirname, '../html');
    this.expressApp.use(express.static(staticPath));

    // Handle specific OS detection probes
    this.expressApp.get(['/hotspot-detect.html', '/generate_204', '/connecttest.txt'], (req, res) => {
        // Respond to detection probes with either a redirect or basic content
        res.redirect('/' + this.defaultWebpage); // Redirect to the captive portal
    });

    // Fallback route for unhandled requests
    this.expressApp.get('*', (req, res) => {
        res.sendFile(path.join(staticPath, this.defaultWebpage));
    });

    // Initialize the WebSocket server using the same HTTP server
    this.socketServer = new WebSocket.Server({ server });

    let self = this;

    this.socketServer.on("error", function(e) {
        console.log("socketServer error", e);
    });

    this.socketServer.on('listening', function() {
        const address = server.address(); // Get the address of the HTTP server
        const port = address.port; // Extract the port
        console.log("WebSocket server is listening on port " + port);
    });

    this.socketServer.on('connection', (function(socket) {
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