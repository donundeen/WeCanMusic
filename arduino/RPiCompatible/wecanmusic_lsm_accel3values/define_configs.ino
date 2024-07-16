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
  for (int = 0 ; i < NUM_MULTIVALUES; i++){
    config_setup(i);
  }
}


void config_setup(int vindex){   //MULTIVALUE UPDATE REQUIRED
  midi_voice[vindex] = getStoredConfigValInt(vindex, "midi_voice");  //MULTIVALUE UPDATE REQUIRED
  Serial.println("setting midi voice");
  Serial.println(midi_voice[vindex]);
  midiSetInstrument(0, midi_voice[vindex]);  //MULTIVALUE UPDATE REQUIRED
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
  // also add bank and program

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




// one of these for each variable
void routeConfig_somevar(OSCMessage &msg, int addrOffset ){  //MULTIVALUE UPDATE REQUIRED
  route_int(msg, addrOffset, "somevar");  //MULTIVALUE UPDATE REQUIRED
}

void routeConfig_midi_voice(OSCMessage &msg, int addrOffset ){  //MULTIVALUE UPDATE REQUIRED
  midi_voice = route_int(msg, addrOffset, "midi_voice");  //MULTIVALUE UPDATE REQUIRED
  Serial.println("midi voice");
  Serial.println(midi_voice);

  midiSetInstrument(0, midi_voice);  //MULTIVALUE UPDATE REQUIRED
}

void routeConfig_midimin(OSCMessage &msg, int addrOffset ){  //MULTIVALUE UPDATE REQUIRED
  midimin = route_int(msg, addrOffset, "midimin"); //MULTIVALUE UPDATE REQUIRED
  Serial.println("midimin");
  Serial.println(midimin); //MULTIVALUE UPDATE REQUIRED
}

void routeConfig_midimax(OSCMessage &msg, int addrOffset ){ //MULTIVALUE UPDATE REQUIRED
  midimax = route_int(msg, addrOffset, "midimax");    //MULTIVALUE UPDATE REQUIRED
  Serial.println("midimax");
  Serial.println(midimax);    //MULTIVALUE UPDATE REQUIRED
}

void routeConfig_velocitycurve(OSCMessage &msg, int addrOffset ){     //MULTIVALUE UPDATE REQUIRED
  midimax = route_int(msg, addrOffset, "velocitycurve");      //MULTIVALUE UPDATE REQUIRED
  Serial.println("midimax");
  Serial.println(midimax);    //MULTIVALUE UPDATE REQUIRED
}



void routeConfig_reset(OSCMessage &msg, int addrOffset ){  //MULTIVALUE UPDATE REQUIRED
  // getting the reset command is enough, no need to get the value
  Serial.println("********************resetting minmax");
  reset_minmax();  //MULTIVALUE UPDATE REQUIRED
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
int route_int(OSCMessage &msg, int addrOffset, String varname){  //MULTIVALUE UPDATE REQUIRED
  int i = 0;
  //Serial.println(msg.getType(i));
  //Serial.println(msg.getFloat(i));
  int theval= -1;
  while (msg.getType(i) == 'i'){
    //Serial.println(msg.getInt(i));
    //Serial.print(" ");
    theval = msg.getInt(i);   //MULTIVALUE UPDATE REQUIRED
    Serial.println("got val");
    Serial.println(theval);
    setStoredConfigVal(varname,theval);  //MULTIVALUE UPDATE REQUIRED
    i++;
  }
  return theval;
}

int route_string(OSCMessage &msg, int addrOffset, String varname){ //MULTIVALUE UPDATE REQUIRED
  int i = 0;
  //Serial.println(msg.getType(i));
  //Serial.println(msg.getFloat(i));
  int theval= -1;
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