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
//int midi_voice = 12;
// int midimin
// int midimax

void config_setup_multivalue(){
  for (int vindex = 0 ; vindex < NUM_MULTIVALUES; vindex++){
    config_setup(vindex);
  }
}


void config_setup(int vindex){   //MULTIVALUE UPDATE REQUIRED
  midi_voice[vindex] = getStoredConfigValInt(vindex, "midi_voice");  //MULTIVALUE UPDATE REQUIRED
  midi_bank[vindex] = getStoredConfigValInt(vindex, "midi_bank");  //MULTIVALUE UPDATE REQUIRED
  midi_program[vindex] = getStoredConfigValInt(vindex, "midi_program");  //MULTIVALUE UPDATE REQUIRED
  Serial.println("setting midi bank and program");
  Serial.println(midi_bank[vindex]);
  Serial.println(midi_program[vindex]);
  midiSetChannelBank(0, midi_bank[vindex]);  //MULTIVALUE UPDATE REQUIRED
  midiSetChannelProgram(0, midi_program[vindex]);  //MULTIVALUE UPDATE REQUIRED
}


void routeDeviceMsg(OSCMessage &msg, int addrOffset ){  //MULTIVALUE UPDATE REQUIRED
  Serial.println("devicemsg");
  char devroute[100];
  sprintf(devroute, "/%s/config", this_device_name);   //MULTIVALUE UPDATE REQUIRED
  msg.route(devroute, routeConfigVal);
}


void routeConfigVal(OSCMessage &msg, int addrOffset ){
  Serial.println("configvar");
  char devroute[100];

  // one of these for each variable
  sprintf(devroute,"/%s/config/somevar",this_device_name);  //MULTIVALUE UPDATE REQUIRED
  msg.route(devroute, routeConfig_somevar);  //MULTIVALUE UPDATE REQUIRED

  // midi_vocie
  sprintf(devroute,"/%s/config/midi_voice",this_device_name);  //MULTIVALUE UPDATE REQUIRED
  msg.route(devroute, routeConfig_midi_voice);  //MULTIVALUE UPDATE REQUIRED
  // also add bank and program (transition to bank and program from midi_voice)
  sprintf(devroute,"/%s/config/midi_program",this_device_name);  //MULTIVALUE UPDATE REQUIRED
  msg.route(devroute, routeConfig_midi_program);  //MULTIVALUE UPDATE REQUIRED
  sprintf(devroute,"/%s/config/midi_bank",this_device_name);  //MULTIVALUE UPDATE REQUIRED
  msg.route(devroute, routeConfig_midi_bank);  //MULTIVALUE UPDATE REQUIRED

  sprintf(devroute,"/%s/config/midimin",this_device_name);  //MULTIVALUE UPDATE REQUIRED
  msg.route(devroute, routeConfig_midimin);  //MULTIVALUE UPDATE REQUIRED


  sprintf(devroute,"/%s/config/midimax",this_device_name);   //MULTIVALUE UPDATE REQUIRED
  msg.route(devroute, routeConfig_midimax);  //MULTIVALUE UPDATE REQUIRED


  sprintf(devroute,"/%s/config/velocitycurve",this_device_name);  //MULTIVALUE UPDATE REQUIRED
  msg.route(devroute, routeConfig_velocitycurve);  //MULTIVALUE UPDATE REQUIRED


  // reset system (max/mins, etc)
  sprintf(devroute,"/%s/config/reset",this_device_name);  //MULTIVALUE UPDATE REQUIRED
  msg.route(devroute, routeConfig_reset);  //MULTIVALUE UPDATE REQUIRED

}


int extractVindexFromRoute(char* address){
  // format will be /some_devis_name_2/config/varname
  // and we want the number 2 (always one digit)
  // regex "/[^/]+_(%d)/.*"
  MatchState ms;
  Serial.println(address);
  ms.Target(address);
  char result = ms.Match("/[^/]+_(%d)/.*");
  if(result == REGEXP_MATCHED){
      char buf[3];
      ms.GetCapture(buf, 0);
      int vindex = atoi(buf);
      return vindex;
  }else if (result == REGEXP_NOMATCH){ // no match
    return -1;
  }else{ // some other error
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
  midi_voice[vindex] = route_int(vindex, msg, addrOffset, "midi_voice");  //MULTIVALUE UPDATE REQUIRED
  Serial.println("midi voice");
  Serial.println(midi_voice[vindex]);
  // deprecating this for bank:program
//  midiSetChannelProgram(0, midi_voice[vindex]);  //MULTIVALUE UPDATE REQUIRED
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




int route_string(int vindex, OSCMessage &msg, int addrOffset, String varname){ //MULTIVALUE UPDATE REQUIRED
  int i = 0;
  //Serial.println(msg.getType(i));
  //Serial.println(msg.getFloat(i));
  int theval= -1;
  if(vindex > -1){
    varname = varname + "_"+String(vindex);
  }

  while (msg.getType(i) == 's'){
    //Serial.println(msg.getInt(i));
    //Serial.print(" ");
    theval = msg.getInt(i);  //MULTIVALUE UPDATE REQUIRED
    Serial.println("got val");
    Serial.println(theval);  
    setStoredConfigVal(varname,theval);  //MULTIVALUE UPDATE REQUIRED
    i++;
  }
  return theval;
}


// END DEFINE CONFIGS FILE
//////////////////////////