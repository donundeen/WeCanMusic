///////////////////////////////
// functions to handle communication with the server/conductor via UDP/OSC

char *UDPReceiverIP = "10.0.0.255"; // ip where UDP messages are going
int UDPPort = 7005; // the UDP port that Max is listening on


//  UDP SETUP/LOOP FUNCTIONS
void sendOSCUDP(int vindex, int sendVal){  //
 if(WiFi.status() == WL_CONNECTED){   
  Serial.println("sending udp");
  Serial.println(UDPReceiverIP);
  Serial.println(UDPPort);
  //send hello world to server
  char ipbuffer[20];
  thisarduinoip.toCharArray(ipbuffer, 20);
  OSCMessage oscmsg(DEVICE_ID[vindex]);  //
  oscmsg.add((int32_t)sendVal).add(ipbuffer);
  udp.beginPacket(UDPReceiverIP, UDPPort);
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
  UDPPort = atoi(wecanmusic_port); // convert to int //  7002; // the UDP port that Max is listening on

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
      bundleIN.route("/all/notelist", routeNotelist);
      bundleIN.route("/all/req_ann", routeRequestAnnounce);
      char devroute[100];
      for(int vindex = 0; vindex < NUM_MULTIVALUES; vindex++){
        sprintf(devroute,"/%s",DEVICE_NAME[vindex]);  //
        bundleIN.route(devroute, routeDeviceMsg);
        Serial.println("done BundleIn");
      }
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
  for(int vindex = 0; vindex < NUM_MULTIVALUES; vindex++){
    sprintf(devroute, "/%s/config", DEVICE_NAME[vindex]);   //
    Serial.println(devroute);
    msg.route(devroute, routeConfigVal);
  }
  Serial.println("done routeDeviceMsg");
}


void routeConfigVal(OSCMessage &msg, int addrOffset ){
  Serial.println("configvar");
  char devroute[100];

  for (int vindex = 0; vindex < NUM_MULTIVALUES; vindex++){

    // one of these for each variable
    sprintf(devroute,"/%s/config/somevar",DEVICE_NAME[vindex]);  //
    msg.route(devroute, routeConfig_somevar);  //

    // midi_vocie
    sprintf(devroute,"/%s/config/midi_voice",DEVICE_NAME[vindex]);  //
    msg.route(devroute, routeConfig_midi_voice);  //

    // also add bank and program (transition to bank and program from midi_voice)
    sprintf(devroute,"/%s/config/midi_program",DEVICE_NAME[vindex]);  //
    msg.route(devroute, routeConfig_midi_program);  //
    sprintf(devroute,"/%s/config/midi_bank",DEVICE_NAME[vindex]);  //
    msg.route(devroute, routeConfig_midi_bank);  //

    sprintf(devroute,"/%s/config/midimin",DEVICE_NAME[vindex]);  //
    msg.route(devroute, routeConfig_midimin);  //

    sprintf(devroute,"/%s/config/midimax",DEVICE_NAME[vindex]);   //
    msg.route(devroute, routeConfig_midimax);  //

    sprintf(devroute,"/%s/config/midi_nlen",DEVICE_NAME[vindex]);   //
    msg.route(devroute, routeConfig_midi_notelength);  //

    sprintf(devroute,"/%s/config/midi_vol",DEVICE_NAME[vindex]);   //
    msg.route(devroute, routeConfig_midi_vol);  //

    sprintf(devroute,"/%s/config/velocitycurve",DEVICE_NAME[vindex]);  //
    msg.route(devroute, routeConfig_velocitycurve);  //


    // reset system (max/mins, etc)
    sprintf(devroute,"/%s/config/reset",DEVICE_NAME[vindex]);  //
    msg.route(devroute, routeConfig_reset);  //
  }
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

void routeConfig_midi_voice(OSCMessage &msg, int addrOffset ){  //
  char address[32];
  msg.getAddress(address);
  Serial.print("address");
  Serial.println(address);
  int vindex = extractVindexFromRoute(address);
  String midi_voice = route_string(vindex, msg, addrOffset, "midi_voice", false);  //
  Serial.println("midi voice");
  Serial.println(midi_voice);
  int bank = -1;
  int program = -1;
  midi_voice_to_bank_program(midi_voice, bank, program);
  if( midi_bank[vindex]  != bank || midi_program[vindex] != program){
    midi_bank[vindex] = bank;
    midi_program[vindex] = program;
    midiSetChannelBank(0, midi_bank[vindex]);  //
    midiSetChannelProgram(0, midi_program[vindex]);  //
    save_persistent_values(); // save all the values every time there's any new value. 
  }  
  Serial.println("midi_voice saved");
  // deprecating this for bank:program
//  midiSetChannelProgram(0, midi_voice[vindex]);  //
}

void midi_voice_to_bank_program(String midi_voice, int & bank, int & program){
  int resultarrayp[] = {-1,-1};
  char delimiters[] = ":";
  char stringBuf[50];
  midi_voice.toCharArray(stringBuf, 50);
//  char delimbuf[3];
  //delimiters.toCharArray(delimbuf, 3);

  char *token = strtok(stringBuf, delimiters);
  bank = atoi(token);

  // Print each token
  while (token != NULL) {
    token = strtok(NULL, delimiters);
    if(token != NULL){
      program = atoi(token);
    }
  }
}

void routeConfig_midi_bank(OSCMessage &msg, int addrOffset ){  //
  char address[32];
  msg.getAddress(address);
  int vindex = extractVindexFromRoute(address);
  midi_bank[vindex] = route_int(vindex, msg, addrOffset, "midi_bank");  //
  Serial.println("midi bank");
  Serial.println(midi_bank[vindex]);
  midiSetChannelBank(0, midi_bank[vindex]);  //
}

void routeConfig_midi_program(OSCMessage &msg, int addrOffset ){  //
  char address[32];
  msg.getAddress(address);
  int vindex = extractVindexFromRoute(address);
  midi_bank[vindex] = route_int(vindex, msg, addrOffset, "midi_program");  //
  Serial.println("midi program");
  Serial.println(midi_program[vindex]);
  midiSetChannelBank(0, midi_bank[vindex]);  //
  midiSetChannelProgram(0, midi_program[vindex]);  //
}

void routeConfig_midimin(OSCMessage &msg, int addrOffset ){  //
  char address[32];
  msg.getAddress(address);
  int vindex = extractVindexFromRoute(address);
  int temp = route_int(vindex, msg, addrOffset, "midimin"); 
  if(midimin[vindex] != temp){
    midimin[vindex] = temp;    //
    save_persistent_values(); // save all the values every time there's any new value. 
  }
  Serial.println("midimin"+String(vindex));
  Serial.println(midimin[vindex]); //
}

void routeConfig_midimax(OSCMessage &msg, int addrOffset ){ //
  char address[32];
  msg.getAddress(address);
  int vindex = extractVindexFromRoute(address);
    int temp = route_int(vindex, msg, addrOffset, "midimax"); 
  if(midimax[vindex] != temp){
    midimax[vindex] = temp;    //
    save_persistent_values(); // save all the values every time there's any new value. 
  }
  Serial.println("midimax");
  Serial.println(midimax[vindex]);    //
}


void routeConfig_midi_notelength(OSCMessage &msg, int addrOffset ){ //
  char address[32];
  msg.getAddress(address);
  int vindex = extractVindexFromRoute(address);
  int temp = route_int(vindex, msg, addrOffset, "midi_nlen"); 
  if(midi_notelength[vindex] != temp){
    midi_notelength[vindex] = temp;    //
    save_persistent_values(); // save all the values every time there's any new value. 
  }
  Serial.println("midi_nlen");
  Serial.println( midi_notelength[vindex]);    //
}

void routeConfig_midi_vol(OSCMessage &msg, int addrOffset ){ //
  char address[32];
  msg.getAddress(address);
  int vindex = extractVindexFromRoute(address);
  int temp = route_int(vindex, msg, addrOffset, "midi_vol"); 
  if(midi_vol[vindex] != temp){
    midi_vol[vindex] = temp;    //
    save_persistent_values(); // save all the values every time there's any new value. 
  }
  Serial.println("midi_vol");
  Serial.println( midi_vol[vindex]);    //
}

void routeConfig_velocitycurve(OSCMessage &msg, int addrOffset ){     //
  // custom function, it's a little wierd.... not sure the best way to handle arrays
  // I'm not evening using velocity curves in the UI yet, so this message isn't happening. So put it to one side for now.
  char address[32];
  msg.getAddress(address);
  int vindex = extractVindexFromRoute(address);
  save_persistent_values(); // save all the values every time there's any new value. 

  Serial.println("velocityCurve");
//  Serial.println(velocitycurve[vindex]);    //
}

void routeConfig_reset(OSCMessage &msg, int addrOffset ){  //
  char address[32];
  msg.getAddress(address);
  int vindex = extractVindexFromRoute(address);
  // getting the reset command is enough, no need to get the value
  Serial.println("********************resetting minmax");
  reset_minmax(vindex);  //
}


void routeRequestAnnounce(OSCMessage &msg, int addrOffset ){
  Serial.println("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~`routeRequestAnnounce");
  announceCreation();
}


void routeNotelist(OSCMessage &msg, int addrOffset ){
  Serial.println("notelist");

  int newnotelist[127];

  int i = 0;
  //Serial.println(msg.getType(i));
  //Serial.println(msg.getFloat(i));
  while (msg.getType(i) == 'i'){
    //Serial.println(msg.getInt(i));
    //Serial.print(" ");
    newnotelist[i] = msg.getInt(i);
    i++;
  }
  //Serial.println(" Setting ");
  //Serial.println(i);
  setNotelist(newnotelist, notelist, i);

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




void announceCreation(){
  for(int i=0; i< NUM_MULTIVALUES; i++){
    announceCreation(i);
  }
}
// send announce message over OSC when connected
void announceCreation(int vindex){
  if(WiFi.status() == WL_CONNECTED){   
    Serial.println("ANNOUNCING udp:::");
    Serial.println(UDPReceiverIP);
    Serial.println(UDPPort);
    Serial.println(DEVICE_NAME[vindex]);  //
    Serial.println(midi_bank[vindex]);  //
    Serial.println(midi_program[vindex]);  //
    Serial.println(midi_notelength[vindex]);  //
    Serial.println(midi_vol[vindex]);  //
    //send hello world to server
    char ipbuffer[20];
    thisarduinoip.toCharArray(ipbuffer, 20);
    Serial.println(ipbuffer);
    OSCMessage oscmsg("/announceUDPInstrument");  
    oscmsg.add(DEVICE_NAME[vindex]).add((int32_t)midi_bank[vindex]).add((int32_t)midi_program[vindex]).add((int32_t)midimin[vindex]).add((int32_t)midimax[vindex]).add((int32_t)midi_notelength[vindex]).add((int32_t)midi_vol[vindex]);  //
 //   udp.beginPacket(UDPReceiverIP, UDPPort);
    udp.beginPacket(UDPReceiverIP, 7005); // this needs to get set in a config somehwere...
 
   // udp.beginMulticastPacket(UDPReceiverIP, UDPPort, WiFi.localIP());
  //  udp.write(buffer, msg.length()+1);
    oscmsg.send(udp);
    udp.endPacket();
    oscmsg.empty();
  }else{
    Serial.println("not sending udp, not connected");
  }  
}

// send a makenote to the server (use this when device doesn't have its own speakers or synth)
void sendMakeNote(int vindex, int pitch, int velocity, int duration){  //
  if(velocity == 0){
    // don't send if value is 0
//    Serial.println("no velocity, not sending");
    return;
  }
  Serial.println("sending makenote");
  OSCMessage oscmsg("/makenote");  
  oscmsg.add(DEVICE_NAME[vindex]).add((int32_t)pitch).add((int32_t)velocity).add((int32_t)duration);  //
  //   udp.beginPacket(UDPReceiverIP, UDPPort);
  udp.beginPacket(UDPReceiverIP, 7005); // this needs to get set in a config somehwere...

  // udp.beginMulticastPacket(UDPReceiverIP, UDPPort, WiFi.localIP());
  //  udp.write(buffer, msg.length()+1);
  oscmsg.send(udp);
  udp.endPacket();
  oscmsg.empty();  
}


