///////////////////////////////
// functions to handle communication with the server/conductor via UDP/OSC



//  UDP SETUP/LOOP FUNCTIONS
void sendOSCUDP( int sendVal){  //
 if(WiFi.status() == WL_CONNECTED){   
  Serial.println("sending udp");
  Serial.println(UDPReceiverIP);
  Serial.println(UDPOutPort);
  //send hello world to server
  char ipbuffer[20];
  thisarduinoip.toCharArray(ipbuffer, 20);
  OSCMessage oscmsg(this_device_name);  //
  oscmsg.add((int32_t)sendVal).add(ipbuffer);
  udp.beginPacket(UDPReceiverIP, UDPOutPort);
//  udp.write(buffer, msg.length()+1);
  oscmsg.send(udp);
  udp.endPacket();
  oscmsg.empty();
 }else{
  Serial.println("not sending udp, not connected");
 }
}


void udp_setup(){
  if(override_ip){    
    UDPReceiverIP = presetip;
  }else{
    UDPReceiverIP = wecanmusic_server_ip; // ip where UDP messages are going //presetip
    // just for testing:
  }
  UDPOutPort = atoi(wecanmusic_port); // convert to int //  7002; // the UDP port that Max is listening on

}

void udp_loop(){
  configUdp();
  if(!no_network){
    UDPListen();
  }    
}

void UDPListen(){
  OSCBundle bundleIN;
  int size;
 
  if( (size = udp.parsePacket())>0)
  {
    Serial.println("got UDP");
  // unsigned int outPort = Udp.remotePort();
    while(size--){
      byte b = udp.read();
//      bundleIN.fill(udp.read());
//      Serial.println(b);
      bundleIN.fill(b);
    }
    if(!bundleIN.hasError()){
      Serial.println("routing?");
      bundleIN.route("/all/req_ann", routeRequestAnnounce);
      char devroute[100];
      sprintf(devroute,"/%s",this_device_name);  //
      bundleIN.route(devroute, routeDeviceMsg);
      Serial.println("done BundleIn");
    }else{
      Serial.println("some error");
      Serial.println(bundleIN.getError());
    }
  }
}

/*
 * connecting to UDP port on laptop runnin Max (or otherwise sending/recieving UDP data)
 */
void configUdp(){

  if(WIFI_MODE_ON){
    if(!wifi_connected && WiFi.status() == WL_CONNECTED){
      Serial.println("HTTP server:" + WiFi.localIP().toString());
      thisarduinoip = WiFi.localIP().toString();
      Serial.println("SSID:" + WiFi.SSID());
      wifi_connected = true;
      udp.begin(UDPINPort);
      // re-announce device
      announceCreation();
    }
    if(WiFi.status() != WL_CONNECTED){
      Serial.println("wifi not connected");
      wifi_connected = false;
    }
  }
}
// END UDP SETUP/LOOP FUNCTIONS
/////////////////////////

/////////////////////////
/// ROUTING OSC MESSAGES
void routeDeviceMsg(OSCMessage &msg, int addrOffset ){  //
  Serial.println("devicemsg");
  char devroute[100];
  char address[32];
  msg.getAddress(address);
  Serial.println (address);
    sprintf(devroute, "/%s/config", this_device_name);   //
    Serial.println(devroute);
    msg.route(devroute, routeConfigVal);
  Serial.println("done routeDeviceMsg");
}


void routeConfigVal(OSCMessage &msg, int addrOffset ){
  Serial.println("configvar");
  char devroute[100];

    // one of these for each variable
    sprintf(devroute,"/%s/config/somevar",this_device_name);  //
    msg.route(devroute, routeConfig_somevar);  //

    // reset system (max/mins, etc)
    sprintf(devroute,"/%s/config/reset",this_device_name);  //
    msg.route(devroute, routeConfig_reset);  //
  Serial.println("end RoutConfigVal");
}


int extractVindexFromRoute(char* address){
  // format will be /some_devis_name_2/config/varname
  // and we want the number 2 (always one digit)
  // regex "/[^/]+_(%d)/.*"
  MatchState ms;
  Serial.println(address);
  char regexp[20]  = "/[^/]+_(%d)/.*";
  Serial.println(regexp);
  ms.Target(address);
  char result = ms.Match(regexp);
  if(result == REGEXP_MATCHED){
      char buf[3];
      ms.GetCapture(buf, 0);
      int vindex = atoi(buf);
      Serial.println("matched");
      Serial.println(vindex);
      return vindex;
  }else if (result == REGEXP_NOMATCH){ // no match
    Serial.println("NO MATCH");
    return -1;
  }else{ // some other error
    Serial.println("other match error");
    return -1;
  }
  return -1;
}

// one of these for each variable
void routeConfig_somevar(OSCMessage &msg, int addrOffset ){  //
  char address[32];
  msg.getAddress(address);
  int vindex = extractVindexFromRoute(address);
  route_int(vindex, msg, addrOffset, "somevar");  //
}


void routeConfig_reset(OSCMessage &msg, int addrOffset ){  //
  char address[32];
  msg.getAddress(address);
  int vindex = extractVindexFromRoute(address);
  // getting the reset command is enough, no need to get the value
}


void routeRequestAnnounce(OSCMessage &msg, int addrOffset ){
  Serial.println("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~`routeRequestAnnounce");
  announceCreation();
}


// don't change this part
int route_int(int vindex, OSCMessage &msg, int addrOffset, String varname){  //
  int i = 0;
  //Serial.println(msg.getType(i));
  //Serial.println(msg.getFloat(i));
  int theval= -1;
  if(vindex > -1){
    varname = varname + "_"+String(vindex);
  }
  while (msg.getType(i) == 'i'){
    //Serial.println(msg.getInt(i));
    //Serial.print(" ");
    theval = msg.getInt(i);   //
    Serial.println("got val");
    Serial.println(theval);
    i++;
  }
  return theval;
}




String route_string(int vindex, OSCMessage &msg, int addrOffset, String varname, boolean storeit){ //
  int i = 0;
  //Serial.println(msg.getType(i));
  //Serial.println(msg.getFloat(i));
  char theval[40] = "NONE";
  if(vindex > -1){
    varname = varname + "_"+String(vindex);
  }

  while (msg.getType(i) == 's'){
    //Serial.println(msg.getInt(i));
    //Serial.print(" ");

    msg.getString(i, theval);  //
    Serial.println("got val");
    Serial.println(theval);  
    if(storeit){ // not storing strings yet...
    //  setStoredConfigVal(varname, theval);  //
    }
    i++;
  }
  return String(theval);
}

/////////////////////////
/// END ROUTING OSC MESSAGES
//////////////////////////

// send announce message over OSC when connected
void announceCreation(){
  if(WiFi.status() == WL_CONNECTED){   
    Serial.println("ANNOUNCING udp:::");
    Serial.println(UDPReceiverIP);
    Serial.println(UDPOutPort);
    //send hello world to server
    char ipbuffer[20];
    thisarduinoip.toCharArray(ipbuffer, 20);
    Serial.println(ipbuffer);
    OSCMessage oscmsg("/announcePerformanceSelector");  
    oscmsg.add(this_device_name);  //
 //   udp.beginPacket(UDPReceiverIP, UDPOutPort);
    udp.beginPacket(UDPReceiverIP, UDPOutPort); // this needs to get set in a config somehwere...
 
   // udp.beginMulticastPacket(UDPReceiverIP, UDPOutPort, WiFi.localIP());
  //  udp.write(buffer, msg.length()+1);
    oscmsg.send(udp);
    udp.endPacket();
    oscmsg.empty();
  }else{
    Serial.println("not sending udp, not connected");
  }  
}


