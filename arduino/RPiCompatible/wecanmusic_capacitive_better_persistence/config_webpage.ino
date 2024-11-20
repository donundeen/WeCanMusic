

//callback notifying us of the need to save config
void saveConfigCallback () {
  Serial.println("Should save config");
  shouldSaveConfig = true;
}

void config_webpage_setup() {
  // put your setup code here, to run once:

  pinMode(resetButtonPin, INPUT_PULLUP);
  bool configMode = false;
  if(digitalRead(resetButtonPin) == LOW){
    Serial.println("config Mode ON");
    digitalWrite(BUILTIN_LED, HIGH);
    configMode = true;
  }else{
    digitalWrite(BUILTIN_LED, LOW);
  }

  // The extra parameters to be configured (can be either global or just in the setup)
  // After connecting, parameter.getValue() will get you the configured value
  // id/name placeholder/prompt default length
  WiFiManagerParameter custom_wecanmusic_server_ip("server", "weCanMusic server IP", wecanmusic_server_ip, 40);
  WiFiManagerParameter custom_wecanmusic_port("port", "WeCanMusic port", wecanmusic_port, 6);
  WiFiManagerParameter custom_this_device_name("devicename", "Device Name", this_device_name, 32);

  //WiFiManager
  //Local intialization. Once its business is done, there is no need to keep it around
  WiFiManager wifiManager;

  //set config save notify callback
  wifiManager.setSaveConfigCallback(saveConfigCallback);

  //set static ip
  // don: I'd reather get a dynamic IP, don't need static for the devices
  //wifiManager.setSTAStaticIPConfig(IPAddress(10, 0, 1, 99), IPAddress(10, 0, 1, 1), IPAddress(255, 255, 255, 0));

  //add all your parameters here
  wifiManager.addParameter(&custom_wecanmusic_server_ip);
  wifiManager.addParameter(&custom_wecanmusic_port);
  wifiManager.addParameter(&custom_this_device_name);

  //reset settings - for testing
  // don: does this make the ap mode pop up? I don't want it to delete my settings though, just let me enter new ones
  //wifiManager.resetSettings();

  //set minimu quality of signal so it ignores AP's under that quality
  //defaults to 8%
  //wifiManager.setMinimumSignalQuality();

  //sets timeout until configuration portal gets turned off
  //useful to make it all retry or go to sleep
  //in seconds
  //wifiManager.setTimeout(120);
  char* apname = this_device_name;
  //fetches ssid and pass and tries to connect
  //if it does not connect it starts an access point with the specified name
  //here  "AutoConnectAP"
  //and goes into a blocking loop awaiting configuration
  //  if (!wifiManager.autoConnect(apname, "password")) {
  // instead we fire this up if the button is pressed at startup
  wifiManager.setConfigPortalTimeout(120);

  if(configMode){
    if(!wifiManager.startConfigPortal(apname)){
      Serial.println("failed to connect and hit timeout");
      delay(3000);
      //reset and try again, or maybe put it to deep sleep
      ESP.restart();
      delay(5000);
    }
  }else{
    if(!wifiManager.autoConnect(apname)){
      Serial.println("failed to connect and hit timeout");
      delay(3000);
      //reset and try again, or maybe put it to deep sleep
      ESP.restart();
      delay(5000);
    }
  }
/* 
  if (!wifiManager.autoConnect(apname)) {
    Serial.println("failed to connect and hit timeout");
    delay(3000);
    //reset and try again, or maybe put it to deep sleep
    ESP.restart();
    delay(5000);
  }
*/
  //if you get here you have connected to the WiFi
  Serial.println("connected...yeey :)");
  digiflash(BUILTIN_LED, 10, 100, LOW);


  //read updated parameters
  /*
  strcpy(wecanmusic_server_ip, custom_wecanmusic_server_ip.getValue());
  strcpy(wecanmusic_port, custom_wecanmusic_port.getValue());
  strcpy(this_device_name, custom_this_device_name.getValue());
  */
  strcpy(wecanmusic_server_ip, custom_wecanmusic_server_ip.getValue());
  strcpy(wecanmusic_port, custom_wecanmusic_port.getValue());
  strcpy(this_device_name, custom_this_device_name.getValue());  
  Serial.println("The values in the file are: ");
  Serial.println("\twecanmusic_server_ip : " + String(wecanmusic_server_ip));
  Serial.println("\twecanmusic_port : " + String(wecanmusic_port));
  Serial.println("\tthis_device_name : " + String(this_device_name));

  UDPReceiverIP = wecanmusic_server_ip; // ip where UDP messages are going //presetip
  // just for testing:
  UDPReceiverIP = presetip;

  UDPPort = atoi(wecanmusic_port); // convert to int //  7002; // the UDP port that Max is listening on
  for (int vindex = 0 ; vindex < NUM_MULTIVALUES; vindex++){
    char vindexchar[2];
    String str = String(vindex);
    Serial.println(vindex);
    str.toCharArray(vindexchar, 2);
    strcpy(DEVICE_NAME[vindex], this_device_name);
    Serial.println(DEVICE_NAME[vindex]);
    strcat(DEVICE_NAME[vindex], "_");
    strcat(DEVICE_NAME[vindex], vindexchar);
    Serial.println(DEVICE_ID[vindex]);
    strcpy(DEVICE_ID[vindex], "/");
    strcat(DEVICE_ID[vindex], DEVICE_NAME[vindex]);
    strcat(DEVICE_ID[vindex], DEVICE_ID_SUFFIX);
    Serial.println("\tDEVICE_ID : " + String(DEVICE_ID[vindex]) + " : "+ this_device_name);
  }

  Serial.print("\t UDPPort ");
  Serial.println(UDPPort);

  //save the custom parameters to FS
  if (shouldSaveConfig) {
//    save_persistent_values();
  }
  save_persistent_values();
  Serial.println("local ip");
  Serial.println(WiFi.localIP());
}




// END SETUP CONFIG WEBPAGE FUNCTIONS
/////////////////////////////////////////
