//////////////////////////
// DEFINE CONFIGS FILE
///*************************
// Defining all the config values
// functions that are specific to different config values

/* make an array of defined vonfig vars, sorta like
["var1","int",
"var2", "string",
"var3", "intarray",
etc...]
*/

//Variable List
// int midi_voice = 12;
// int midimin
// int midimax
// int midi_nlen
// int midi_vol

void config_setup(){
  for (int vindex = 0 ; vindex < NUM_MULTIVALUES; vindex++){
    config_setup(vindex);
  }
}


void config_setup(int vindex){   //MULTIVALUE UPDATE REQUIRED
  // midi_voice just split out into bank/program when received.
 // midi_voice[vindex] = getStoredConfigValInt(vindex, "midi_voice");  //MULTIVALUE UPDATE REQUIRED
  midi_bank[vindex] = getStoredConfigValInt(vindex, "midi_bank");  //MULTIVALUE UPDATE REQUIRED
  midi_program[vindex] = getStoredConfigValInt(vindex, "midi_program");  //MULTIVALUE UPDATE REQUIRED
  midimin[vindex] = getStoredConfigValInt(vindex, "midimin");  //MULTIVALUE UPDATE REQUIRED
  midimax[vindex] = getStoredConfigValInt(vindex, "midimax");  //MULTIVALUE UPDATE REQUIRED
  midi_notelength[vindex] = getStoredConfigValInt(vindex, "midi_nlen");  //MULTIVALUE UPDATE REQUIRED
  midi_vol[vindex] = getStoredConfigValInt(vindex, "midi_vol");  //MULTIVALUE UPDATE REQUIRED
  Serial.println("setting midi bank and program and note length");
  midiSetChannelBank(0, midi_bank[vindex]);  //MULTIVALUE UPDATE REQUIRED
  midiSetChannelProgram(0, midi_program[vindex]);  //MULTIVALUE UPDATE REQUIRED
}


void routeDeviceMsg(OSCMessage &msg, int addrOffset ){  //MULTIVALUE UPDATE REQUIRED
  Serial.println("devicemsg");
  char devroute[100];
  char address[32];
  msg.getAddress(address);
  Serial.println (address);
  for(int vindex = 0; vindex < NUM_MULTIVALUES; vindex++){
    sprintf(devroute, "/%s/config", DEVICE_NAME[vindex]);   //MULTIVALUE UPDATE REQUIRED
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
    sprintf(devroute,"/%s/config/somevar",DEVICE_NAME[vindex]);  //MULTIVALUE UPDATE REQUIRED
    msg.route(devroute, routeConfig_somevar);  //MULTIVALUE UPDATE REQUIRED

    // midi_vocie
    sprintf(devroute,"/%s/config/midi_voice",DEVICE_NAME[vindex]);  //MULTIVALUE UPDATE REQUIRED
    msg.route(devroute, routeConfig_midi_voice);  //MULTIVALUE UPDATE REQUIRED

    // also add bank and program (transition to bank and program from midi_voice)
    sprintf(devroute,"/%s/config/midi_program",DEVICE_NAME[vindex]);  //MULTIVALUE UPDATE REQUIRED
    msg.route(devroute, routeConfig_midi_program);  //MULTIVALUE UPDATE REQUIRED
    sprintf(devroute,"/%s/config/midi_bank",DEVICE_NAME[vindex]);  //MULTIVALUE UPDATE REQUIRED
    msg.route(devroute, routeConfig_midi_bank);  //MULTIVALUE UPDATE REQUIRED

    sprintf(devroute,"/%s/config/midimin",DEVICE_NAME[vindex]);  //MULTIVALUE UPDATE REQUIRED
    msg.route(devroute, routeConfig_midimin);  //MULTIVALUE UPDATE REQUIRED

    sprintf(devroute,"/%s/config/midimax",DEVICE_NAME[vindex]);   //MULTIVALUE UPDATE REQUIRED
    msg.route(devroute, routeConfig_midimax);  //MULTIVALUE UPDATE REQUIRED

    sprintf(devroute,"/%s/config/midi_nlen",DEVICE_NAME[vindex]);   //MULTIVALUE UPDATE REQUIRED
    msg.route(devroute, routeConfig_midi_notelength);  //MULTIVALUE UPDATE REQUIRED

    sprintf(devroute,"/%s/config/midi_vol",DEVICE_NAME[vindex]);   //MULTIVALUE UPDATE REQUIRED
    msg.route(devroute, routeConfig_midi_vol);  //MULTIVALUE UPDATE REQUIRED

    sprintf(devroute,"/%s/config/velocitycurve",DEVICE_NAME[vindex]);  //MULTIVALUE UPDATE REQUIRED
    msg.route(devroute, routeConfig_velocitycurve);  //MULTIVALUE UPDATE REQUIRED


    // reset system (max/mins, etc)
    sprintf(devroute,"/%s/config/reset",DEVICE_NAME[vindex]);  //MULTIVALUE UPDATE REQUIRED
    msg.route(devroute, routeConfig_reset);  //MULTIVALUE UPDATE REQUIRED
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
void routeConfig_somevar(OSCMessage &msg, int addrOffset ){  //MULTIVALUE UPDATE REQUIRED
  char address[32];
  msg.getAddress(address);
  int vindex = extractVindexFromRoute(address);
  route_int(vindex, msg, addrOffset, "somevar");  //MULTIVALUE UPDATE REQUIRED
}

void routeConfig_midi_voice(OSCMessage &msg, int addrOffset ){  //MULTIVALUE UPDATE REQUIRED
  char address[32];
  msg.getAddress(address);
  int vindex = extractVindexFromRoute(address);
  String midi_voice = route_string(vindex, msg, addrOffset, "midi_voice", false);  //MULTIVALUE UPDATE REQUIRED
  Serial.println("midi voice");
  Serial.println(midi_voice);
  int bank = -1;
  int program = -1;
  midi_voice_to_bank_program(midi_voice, bank, program);
  midi_bank[vindex] = bank;
  midi_program[vindex] = program;
  Serial.println("stepa");
  midiSetChannelBank(0, midi_bank[vindex]);  //MULTIVALUE UPDATE REQUIRED
  midiSetChannelProgram(0, midi_program[vindex]);  //MULTIVALUE UPDATE REQUIRED

  setStoredConfigVal(vindex, "midi_bank", bank);  //MULTIVALUE UPDATE REQUIRED
  setStoredConfigVal(vindex, "midi_program", program);  //MULTIVALUE UPDATE REQUIRED

  // deprecating this for bank:program
//  midiSetChannelProgram(0, midi_voice[vindex]);  //MULTIVALUE UPDATE REQUIRED
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

void routeConfig_midi_bank(OSCMessage &msg, int addrOffset ){  //MULTIVALUE UPDATE REQUIRED
  char address[32];
  msg.getAddress(address);
  int vindex = extractVindexFromRoute(address);
  midi_bank[vindex] = route_int(vindex, msg, addrOffset, "midi_bank");  //MULTIVALUE UPDATE REQUIRED
  Serial.println("midi bank");
  Serial.println(midi_bank[vindex]);
  midiSetChannelBank(0, midi_bank[vindex]);  //MULTIVALUE UPDATE REQUIRED
}

void routeConfig_midi_program(OSCMessage &msg, int addrOffset ){  //MULTIVALUE UPDATE REQUIRED
  char address[32];
  msg.getAddress(address);
  int vindex = extractVindexFromRoute(address);
  midi_bank[vindex] = route_int(vindex, msg, addrOffset, "midi_program");  //MULTIVALUE UPDATE REQUIRED
  Serial.println("midi program");
  Serial.println(midi_program[vindex]);
  midiSetChannelBank(0, midi_bank[vindex]);  //MULTIVALUE UPDATE REQUIRED
  midiSetChannelProgram(0, midi_program[vindex]);  //MULTIVALUE UPDATE REQUIRED
}



void routeConfig_midimin(OSCMessage &msg, int addrOffset ){  //MULTIVALUE UPDATE REQUIRED
  char address[32];
  msg.getAddress(address);
  int vindex = extractVindexFromRoute(address);
  midimin[vindex] = route_int(vindex, msg, addrOffset, "midimin"); //MULTIVALUE UPDATE REQUIRED
  Serial.println("midimin"+String(vindex));
  Serial.println(midimin[vindex]); //MULTIVALUE UPDATE REQUIRED
}

void routeConfig_midimax(OSCMessage &msg, int addrOffset ){ //MULTIVALUE UPDATE REQUIRED
  char address[32];
  msg.getAddress(address);
  int vindex = extractVindexFromRoute(address);
  midimax[vindex] = route_int(vindex, msg, addrOffset, "midimax");    //MULTIVALUE UPDATE REQUIRED
  Serial.println("midimax");
  Serial.println(midimax[vindex]);    //MULTIVALUE UPDATE REQUIRED
}


void routeConfig_midi_notelength(OSCMessage &msg, int addrOffset ){ //MULTIVALUE UPDATE REQUIRED
  char address[32];
  msg.getAddress(address);
  int vindex = extractVindexFromRoute(address);
  midi_notelength[vindex] = route_int(vindex, msg, addrOffset, "midi_nlen");    //MULTIVALUE UPDATE REQUIRED
  Serial.println("midi_nlen");
  Serial.println( midi_notelength[vindex]);    //MULTIVALUE UPDATE REQUIRED
}

void routeConfig_midi_vol(OSCMessage &msg, int addrOffset ){ //MULTIVALUE UPDATE REQUIRED
  char address[32];
  msg.getAddress(address);
  int vindex = extractVindexFromRoute(address);
  midi_vol[vindex] = route_int(vindex, msg, addrOffset, "midi_vol");    //MULTIVALUE UPDATE REQUIRED
  Serial.println("midi_vol");
  Serial.println( midi_vol[vindex]);    //MULTIVALUE UPDATE REQUIRED
}

void routeConfig_velocitycurve(OSCMessage &msg, int addrOffset ){     //MULTIVALUE UPDATE REQUIRED
  // custom function, it's a little wierd.... not sure the best way to handle arrays
  // I'm not evening using velocity curves in the UI yet, so this message isn't happening. So put it to one side for now.
  char address[32];
  msg.getAddress(address);
  int vindex = extractVindexFromRoute(address);

  Serial.println("velocityCurve");
//  Serial.println(velocitycurve[vindex]);    //MULTIVALUE UPDATE REQUIRED
}



void routeConfig_reset(OSCMessage &msg, int addrOffset ){  //MULTIVALUE UPDATE REQUIRED
  char address[32];
  msg.getAddress(address);
  int vindex = extractVindexFromRoute(address);
  // getting the reset command is enough, no need to get the value
  Serial.println("********************resetting minmax");
  reset_minmax(vindex);  //MULTIVALUE UPDATE REQUIRED
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
int route_int(int vindex, OSCMessage &msg, int addrOffset, String varname){  //MULTIVALUE UPDATE REQUIRED
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
    theval = msg.getInt(i);   //MULTIVALUE UPDATE REQUIRED
    Serial.println("got val");
    Serial.println(theval);
    setStoredConfigVal(varname, theval);  //MULTIVALUE UPDATE REQUIRED
    i++;
  }
  return theval;
}




String route_string(int vindex, OSCMessage &msg, int addrOffset, String varname, boolean storeit){ //MULTIVALUE UPDATE REQUIRED
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

    msg.getString(i, theval);  //MULTIVALUE UPDATE REQUIRED
    Serial.println("got val");
    Serial.println(theval);  
    if(storeit){ // not storing strings yet...
    //  setStoredConfigVal(varname, theval);  //MULTIVALUE UPDATE REQUIRED
    }
    i++;
  }
  return String(theval);
}


// END DEFINE CONFIGS FILE
//////////////////////////