//////////////////////////////
// CONFIG VARS

// if the device has a synth/speakers attached, set this to true
// if false, it will send a makenote message out over the netework,
// for the server to play.
boolean localSynth = false;

// set to true if teh config file is corrupted.
boolean resetConfigFile = false;

// NO NETWORK MODE? for testing sensor without network
const bool no_network = false;

char wecanmusic_server_ip[40] = "10.0.0.255";
char wecanmusic_port[6] = "7005";
char this_device_name[34] = "thread7";
//flag for saving data
bool shouldSaveConfig = true;

/* 
 *  WIFI_MODE_ON set to true to send osc data over WIFI.
 *  When this is true: 
 *  -- if the arduino can't connect to wifi, it will create its own AP, named esp32_ap (pw 12345678)
 *  -- you'll need to connect to that SSID via your phone, and use the interface that pops up on your phone 
 *     to configure the SSID and PW of the router you want to connect to
 *  When WIFI_MODE_ON = false, you need the arduino connected to the laptop, 
 *  and it will send data over serial USB
 */
const boolean WIFI_MODE_ON = true;
/* if we aren't using the auto-configuration process, 
    and we want to hard-code the router's SSID and password here.
    Also set HARDCODE_SSID = true
*/

//////////////////////////////
/// NETWORK CONFIGS  
const boolean HARDCODE_SSID = false; //true; //false;

const char *WIFI_SSID = "icanmusic";// "icanmusic"; //"JJandJsKewlPad";
const char *WIFI_PASSWORD = "";//"wecanmusic";//"wecanmusic"; //"WeL0veLettuce";
char *UDPReceiverIP = "10.0.0.255"; // ip where UDP messages are going
char *presetip = "10.0.0.255"; // in case we just want to force it for testing
int UDPPort = 7005; // the UDP port that Max is listening on
int UDPINPort = 7004; // the UDP port that Max is listening on
// END NETWORK CONFIGS
////////////////////////

// END CONFIG VARS
//////////////////////////////

////////////////////////////////////////////////////////
//////////   EVERYTHING BELOW HERE SHOULD NOT CHANGE ///

int NUM_MULTIVALUES = 1;

////////////////////////
// NETWORK INCLUDES
/*
 * Required libraries to install in the arduino IDE (use the Library Manager to find and install):
 * https://github.com/Hieromon/PageBuilder : PageBuilder
 * https://github.com/bblanchon/ArduinoJson : ArduinoJson
 * https://github.com/CNMAT/OSC : OSC
 * AutoConnect: https://hieromon.github.io/AutoConnect/index.html : instructions on how to install are here: 
 * follow the instructions under "Install the AutoConnect" if you can't just find it in the Library Manager
 */
// this is all the OSC libraries
#include <SLIPEncodedSerial.h>
#include <OSCData.h>
#include <OSCBundle.h>
#include <OSCBoards.h>
#include <OSCTiming.h>
#include <OSCMessage.h>
#include <OSCMatch.h>
// these the libraries for connecting to WiFi
// based on docs here: https://hieromon.github.io/AutoConnect/gettingstarted.html 
#include <WiFi.h>
// END NETWORK INCLUDES
////////////////////////

// REGEX LIBRARY FOR COMPLEX STRING PARSING
#include <Regexp.h>

// TIMING INCLUDES
#include <AsyncTimer.h> //https://github.com/Aasim-A/AsyncTimer
//#include "uClock.h"
// END TIMING INCLUDES

////////////////////////
// CONFIG WEBPAGE INCLUDES
#include <FS.h>                   //this needs to be first, or it all crashes and burns...
#include <WiFiManager.h>          //https://github.com/tzapu/WiFiManager
#ifdef ESP32
  #include <SPIFFS.h>
#endif
#include <ArduinoJson.h>          //https://github.com/bblanchon/ArduinoJson
// END CONFIG WEBPAGE INCLUDES
////////////////////////

int SERIALBAUDRATE = 115200;

///////////////////////////////
// MUSIC PERFORMANCE VARIABLES
int notelist[127];
int notelistlength = 0;
int workinglist[6][127]; //MULTIVALUE UPDATE REQUIRED
int workinglistlength[6] = {0,0,0,0,0,0}; //MULTIVALUE UPDATE REQUIRED
// END MUSIC PERFORMANCE VARIABLES
///////////////////////////

////////////////// SETING UP CONFIG WEBPAGE - FOR WIFI AND OTHER VALUES
//define your default values here, if there are different values in config.json, they are overwritten.
// CONFIG WEBPAGE PINS AND VARS
int resetButtonPin = A0;
/// END SETTING UP CONFIG WEBPAGE VARS
///////////////////////////

/////////////////////////////
// TIMING VARIABLES 
AsyncTimer t;

////////////////////////////////////////////
// NETWORK SPECIFIC VARS - SHOULDN'T CHANGE
// remember you can't connect to 5G networks with the arduino. 
bool wifi_connected =false;
/*
 * Sometimes we need to delete the SSIDs that are stored in the config of the arduino.
 * Set this value to TRUE and rerun the arduino, to remove all the stored SSIDs 
 * (aka clear the configuration storage). 
 * Then set it badk to false to start saving new SSID/Passwords
 * 
 */
const boolean DELETE_SSIDS = false;
String thisarduinomac = "";
String thishumanname = "";
String thisarduinoip = "";
//create UDP instance
WiFiUDP udp;
OSCErrorCode error;

// END NETWORK-SPECIFIC VARS
//////////////////////////////////////////////////////////////////////////////

////////////////
// Define the number of pulses per beat
//umodular::clock::uClockClass::PPQNResolution PPQNr = uClock.PPQN_96;
int PPQN = 96;

// number of pulses for different common note values.
int DWN = PPQN * 8;
int WN = PPQN * 4;
int HN = PPQN * 2;
int QN = PPQN;
int N8 = PPQN / 2;
int N16 = PPQN / 4;
int QN3 = HN / 3;
int HN3 = WN / 3;
int N83 = QN / 3;

// array of all notelengths, for picking
int notelengths[] = {DWN, WN, HN, HN3, QN, QN3, N8, N83, N16};

// END TIMING VARIABLES
////////////////////////

////////////////////////
// NETWORK+SENSOR CONFIGS
char DEVICE_NAME[][20] = {"RENAME_MExxxxxxx+xx", "RENAME_MExxxxxxx+xx", "RENAME_MExxxxxxx+xx", "RENAME_MExxxxxxx+xx", "RENAME_MExxxxxxx+xx", "RENAME_MExxxxxxx+xx"};  //MULTIVALUE UPDATE REQUIRED: each value shows as DEVICE_NAME_[index]
char *DEVICE_ID_SUFFIX = "/val";
char DEVICE_ID[][40] = {"/","/","/","/","/","/"};  //MULTIVALUE UPDATE REQUIRED: see above
// END NETWORK+SENSOR CONFIGS
////////////////////////

/////////// MIDI DEFINITIONS /////////////////////
// See http://www.vlsi.fi/fileadmin/datasheets/vs1053.pdf Pg 32 for more!
int midi_voice[6] = {12,12,12,12,12,12}; // see define_configs //MULTIVALUE UPDATE REQUIRED . Also update to bank/program (midi_voice is bank:program)
int midi_bank[6] = {0,0,0,0,0,0}; //MULTIVALUE UPDATE REQUIRED
int midi_program[6] = {1,1,1,1,1,1}; //MULTIVALUE UPDATE REQUIRED
///  END MIDI DEFINITIONS
/////////////////////////////////////////

///////////////////////////////
// MUSIC PERFORMANCE VARIABLES
// These might get changed at start, or during play
int rootMidi[6] = {0,0,0,0,0,0};  //MULTIVALUE UPDATE REQUIRED
int midimin[6] = {32,32,32,32,32,32};  //MULTIVALUE UPDATE REQUIRED
int midimax[6] = {100,100,100,100,100,100}; //MULTIVALUE UPDATE REQUIRED
int midi_notelength[6] = {7,7,7,7,7,7}; // these ints poin tot positions in the notelengths array
int midi_vol[6] = {200,200,200,200,200,200};
int noteloop_rate[6] = {7,7,7,7,7,7};
////// END MUSIC PERFORMANCE VARIABLES  
///////////////////////////////////////

//////////////////////////////
// CURVE VARIABLES
// initial velocity curve is a straight line, extra -1.0 variables are for when we want to make it longer
//float velocitycurve[] = {0., 0.0, 0., 1.0, 1.0, 0.0, -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 };
//MULTIVALUE UPDATE REQUIRED
float velocitycurve[][42] = {
  {0., 0., 0., 1., 1., -0.65, 1., 1., -0.65, -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 },
  {0., 0., 0., 1., 1., -0.65, 1., 1., -0.65, -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 },
  {0., 0., 0., 1., 1., -0.65, 1., 1., -0.65, -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 },
  {0., 0., 0., 1., 1., -0.65, 1., 1., -0.65, -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 },
  {0., 0., 0., 1., 1., -0.65, 1., 1., -0.65, -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 },
  {0., 0., 0., 1., 1., -0.65, 1., 1., -0.65, -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 }
};
float velocitycurvelength[] = {6,6,6,6,6,6}; 
String velocitycurvename[6] = {"curve_logup","curve_logup","curve_logup","curve_logup","curve_logup","curve_logup"};

// a collection of useful curves:
float curve_str8up[]       = {0., 0., 0., 1., 1., 0.};
float curve_str8dn[]       = {0., 1., 0., 1., 0., 0.};
float curve_logup[]        = {0., 0., 0., 1., 1., -0.65};
float curve_logdn[]        = {0., 1., 0., 1., 0., -0.65}; // not sure if this is right
float curve_expup[]        = {0., 0., 0., 1., 1., 0.65};
float curve_expdn[]        = {0., 1., 0., 1., 0., 0.65}; // not sure if this is right
float curve_str8upthresh[] = {0., 0., 0., 0.05, 0., 0., 1., 1., 0.};
float curve_str8dnthresh[] = {0., 1., 0., 0.95, 0., 0., 1., 0., 0., 1., 0., 0.};
float curve_logupthresh[]  = {0., 0., 0., 0.05, 0., 0., 1., 1., -0.65};
float curve_logdnthresh[]  = {0., 1., 0., 0.95, 0., -0.65, 1., 0., -0.65};
// END CURVE VARIABLES
//////////////////////////////

/////////////////////////////
// TIMING VARIABLES 
int bpm = 120;

/////////////////////////////
// Sensor scaling variables
float minVal[6] = {100000.0, 100000.0, 100000.0, 100000.0, 100000.0, 100000.0}; //MULTIVALUE UPDATE REQUIRED
float maxVal[6] = {-1.0, -1.0, -1.0, -1.0, -1.0, -1.0};    //MULTIVALUE UPDATE REQUIRED
float changeMin[6] = {10000.0, 10000.0, 10000.0, 10000.0, 10000.0, 10000.0};  //MULTIVALUE UPDATE REQUIRED
float changeMax[6] = {-1.0, -1.0, -1.0, -1.0, -1.0, -1.0}; //MULTIVALUE UPDATE REQUIRED

float elasticMinMaxScale = .005; // if true, then the min and max values used for dynamic scaling slowly come closer together, 
                                // so that a rate large value over time will get smoothed out
                                // set to 0 to disable
// END Sensor scaling variables
/////////////////////////////

////////////////////////////////////
// SENSOR PROCESSING GLOBALS
bool firstSense[6] = {false, false, false, false, false, false}; //MULTIVALUE UPDATE REQUIRED
float ADCRaw[6] = {-1, -1, -1, -1, -1, -1};          //MULTIVALUE UPDATE REQUIRED. ALSO rename to sensorInputVal or something
float changerate[6] = {-1.0, -1.0, -1.0, -1.0, -1.0, -1.0}; //MULTIVALUE UPDATE REQUIRED
float prevChangeVal[6] = {-1.0, -1.0, -1.0, -1.0, -1.0, -1.0};  //MULTIVALUE UPDATE REQUIRED
int prevChangeTime[6] = {-1, -1, -1, -1, -1, -1} ;     //MULTIVALUE UPDATE REQUIRED

int peaks[6] = {0,0,0,0,0,0};
int prevpeaks[6] = {0,0,0,0,0,0}; // track so we don't trigger a peak twice.
// END SENSOR PROCESSING GLOBALS
////////////////////////////////////




void sensor_setup(){
  sensor_setup_device();
  t.setInterval(sensor_loop, 10);
  sensor_loop();
//  t.setInterval(changerate_loop, 100);
  changerate_loop();
  note_loop();
}


void reset_minmax(int vindex){  //MULTIVALUE UPDATE REQUIRED
  minVal[vindex] = 100000.0; //MULTIVALUE UPDATE REQUIRED
  maxVal[vindex] = -1.0;      //MULTIVALUE UPDATE REQUIRED
  changeMin[vindex] = 10000.0;  //MULTIVALUE UPDATE REQUIRED
  changeMax[vindex] = -1.0;     //MULTIVALUE UPDATE REQUIRED
}

void note_loop(){
  for (int i = 0 ; i < NUM_MULTIVALUES; i++){
    note_loop(i);
  }
}

void note_loop(int vindex){
  if(!firstSense[vindex]){   //MULTIVALUE UPDATE REQUIRED
    // sensor hasn't sensed yet, skip this
    return;
  }
  changerate_loop(vindex);  //MULTIVALUE UPDATE REQUIRED
  char pbuf[100];
  sprintf(pbuf, "looppre: in:%d  min %f max %f", ADCRaw[vindex], minVal[vindex], maxVal[vindex]);
//  Serial.println(pbuf);
  float value = dyn_rescale(ADCRaw[vindex], &minVal[vindex], &maxVal[vindex], 0.0, 1.0);  //MULTIVALUE UPDATE REQUIRED
  sprintf(pbuf, "loop: in:%d scaled:%f min %f max %f", ADCRaw, value, minVal, maxVal);
//  Serial.println(pbuf);
  int midipitch    = derive_pitch(vindex, value);  //MULTIVALUE UPDATE REQUIRED
  int midivelocity = derive_velocity(vindex, ADCRaw[vindex]);  //MULTIVALUE UPDATE REQUIRED
  int mididuration = derive_duration(vindex, value);    //MULTIVALUE UPDATE REQUIRED
  sprintf(pbuf, "      in:%d scaled:%f p:%d v:%d d:%d", ADCRaw[vindex], value, midipitch, midivelocity, mididuration);
//  Serial.println(pbuf);
  // this will also make it monophonic:
  if(localSynth){
    midiMakeNote(vindex, midipitch, midivelocity, mididuration);  //MULTIVALUE UPDATE REQUIRED
  }else{
    sendMakeNote(vindex, midipitch, midivelocity, mididuration);  //MULTIVALUE UPDATE REQUIRED
  }
  t.setTimeout(note_loop, noteloop_rate[vindex]); // but changing the mididuration in this function could make notes overlap, so creeat space between notes. Or we make this a sensor-controlled variable as well
}

void sensor_loop(){
  for(int vindex = 0 ; vindex < NUM_MULTIVALUES; vindex++){
    sensor_loop(vindex);
  }
}

void changerate_loop(){
  for(int i = 0; i<NUM_MULTIVALUES; i++){
    changerate_loop(i);
  }
}

void changerate_loop(int vindex){   //MULTIVALUE UPDATE REQUIRED
  changerate[vindex] = get_changerate(vindex, ADCRaw[vindex]);  //MULTIVALUE UPDATE REQUIRED
}

float get_changerate(int vindex, int ival){   //MULTIVALUE UPDATE REQUIRED
  float val = (float)ival;  //MULTIVALUE UPDATE REQUIRED
  char pbuf[100];
  int millisr = millis();

  if(prevChangeVal[vindex] == -1){ //MULTIVALUE UPDATE REQUIRED
    prevChangeVal[vindex] = val;    //MULTIVALUE UPDATE REQUIRED
    prevChangeTime[vindex] = millisr; //MULTIVALUE UPDATE REQUIRED
    return 0;
  }

  float ochange = val - prevChangeVal[vindex]; //MULTIVALUE UPDATE REQUIRED
  if(ochange == 0){
    return 0;
  }
  int millisd = millisr - prevChangeTime[vindex];   //MULTIVALUE UPDATE REQUIRED
  ochange = abs(ochange);
  // divide the change amoutn by the timeframe, so chnages in shorter timeframes count for me.
  ochange = ochange / (float)millisd; 
  float change = dyn_rescale(ochange, &changeMin[vindex], &changeMax[vindex], 0, 1.0);

  // readjust changemin and max based on elasticMinMaxScale
  changeMin[vindex] = changeMin[vindex] + (changeMin[vindex] * elasticMinMaxScale); //MULTIVALUE UPDATE REQUIRED
  changeMax[vindex] = changeMax[vindex] - (changeMax[vindex] * elasticMinMaxScale); //MULTIVALUE UPDATE REQUIRED

 // Serial.println(pbuf);
  prevChangeVal[vindex] = val;          //MULTIVALUE UPDATE REQUIRED
  prevChangeTime[vindex] = millisr;     //MULTIVALUE UPDATE REQUIRED
  sprintf(pbuf, "changerate v: %.4f pv: %.4f oc:%.4f c:%.4f minc:%.4f maxc:%.4f", val, prevChangeVal[vindex], ochange, change, changeMin[vindex], changeMax[vindex]);
  //Serial.println(pbuf);
  return change;

}

int derive_pitch(int vindex, float val){   //MULTIVALUE UPDATE REQUIRED
  int pitch = noteFromFloat(vindex, val, midimin[vindex], midimax[vindex]);  //MULTIVALUE UPDATE REQUIRED
  return pitch;
}

int derive_velocity(int vindex, int val){   //MULTIVALUE UPDATE REQUIRED
  int velocity = floor(127.0 * functioncurve(changerate[vindex], velocitycurve[vindex], velocitycurvelength[vindex]));  //MULTIVALUE UPDATE REQUIRED
  // intergrate more clever ways of handling volume. peaks? bounce? etc? 
//  velocity = velocity * abs(peaks[vindex]);
  return velocity;

}


int derive_duration(int vindex, float val){  //MULTIVALUE UPDATE REQUIRED

  // midi_notelength is an index to a notelength in the array notelengths. 
  // this way if the bpm changes, the notelength changes too 
  // (though we don't actually have code to change bpm on the device )
  return pulseToMS(notelengths[midi_notelength[vindex]]);
//  return pulseToMS(N16);
/*
  unsigned long raw_duration = updateLastNoteTime();
  int duration = quantizeToNoteLength(raw_duration);
  return duration;
*/
}



unsigned long millisecs = millis();
unsigned long lastNoteTime[6] = {millisecs,millisecs,millisecs,millisecs,millisecs,millisecs};  //MULTIVALUE UPDATE REQUIRED
unsigned long updateLastNoteTime(int vindex){  //MULTIVALUE UPDATE REQUIRED
  unsigned long now = millis();
  unsigned long raw_duration = now - lastNoteTime[vindex];  //MULTIVALUE UPDATE REQUIRED
  lastNoteTime[vindex] = now;   //MULTIVALUE UPDATE REQUIRED
  return raw_duration;
}

int quantizeToNoteLength(unsigned long val){
//  int notelengths[] = {DWN, WN, HN, HN3, QN, QN3, N8, N83, N16};
  if(val < ((unsigned long)pulseToMS(N16) +(unsigned long)pulseToMS(N83) ) /  2.0 ){
    return pulseToMS(N16);
  }
  if(val < ((unsigned long)pulseToMS(N83) +(unsigned long)pulseToMS(N8) ) /  2.0 ){
    return pulseToMS(N83);
  }
  if(val < ((unsigned long)pulseToMS(N8) +(unsigned long)pulseToMS(QN3) ) /  2.0 ){
    return pulseToMS(N8);
  }
  if(val < ((unsigned long)pulseToMS(QN3) +(unsigned long)pulseToMS(QN) ) /  2.0 ){
    return pulseToMS(QN3);
  }
  if(val < ((unsigned long)pulseToMS(QN) +(unsigned long)pulseToMS(HN3) ) /  2.0 ){
    return pulseToMS(QN);
  }
  if(val < ((unsigned long)pulseToMS(HN3) +(unsigned long)pulseToMS(HN) ) /  2.0 ){
    return pulseToMS(HN3);
  }
  if(val < ((unsigned long)pulseToMS(HN) +(unsigned long)pulseToMS(WN) ) /  2.0 ){
    return pulseToMS(HN);
  }
  if(val < ((unsigned long)pulseToMS(WN) +(unsigned long)pulseToMS(DWN) ) /  2.0 ){
    return pulseToMS(WN);
  }
  return pulseToMS(DWN);

}
// NETWORK+SENSOR CODE
// sending data over OSC/UDP.
void sendOSCUDP(int vindex, int sendVal){  //MULTIVALUE UPDATE REQUIRED
 if(WiFi.status() == WL_CONNECTED){   
  Serial.println("sending udp");
  Serial.println(UDPReceiverIP);
  Serial.println(UDPPort);
  //send hello world to server
  char ipbuffer[20];
  thisarduinoip.toCharArray(ipbuffer, 20);
  OSCMessage oscmsg(DEVICE_ID[vindex]);  //MULTIVALUE UPDATE REQUIRED
  oscmsg.add(sendVal).add(ipbuffer);
  udp.beginPacket(UDPReceiverIP, UDPPort);
//  udp.write(buffer, msg.length()+1);
  oscmsg.send(udp);
  udp.endPacket();
  oscmsg.empty();
 }else{
  Serial.println("not sending udp, not connected");
 }
}

void udp_loop(){
  UDPListen();
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
      bundleIN.route("/all/requestannounce", routeRequestAnnounce);
      char devroute[100];
      for(int vindex = 0; vindex < NUM_MULTIVALUES; vindex++){
        sprintf(devroute,"/%s",DEVICE_NAME[vindex]);  //MULTIVALUE UPDATE REQUIRED
        bundleIN.route(devroute, routeDeviceMsg);
        Serial.println("done BundleIn");
      }
    }else{
      Serial.println("some error");
      Serial.println(bundleIN.getError());
    }
  }
}
// END UDP FUNCTIONS
/////////////////////////

/////////////////////////////
// SETUP AND LOOP FUNCTIONS
// calls other setup and loop functions
void setup() {
  delay(1000);
  
  Serial.begin(115200);

  NUM_MULTIVALUES = get_num_multivalues();

  if(!no_network){  
    network_setup();
  }

  midi_setup();
  test_setup();
  sensor_setup();
  config_setup();
  announceCreation();

}

void loop() {  
  // everything else should be handled as async calls
  if(!no_network){
    network_loop();
  }  
  udp_loop();
  t.handle();
}
// END SETUP AND LOOP FUNCTIONS
/////////////////////////////////
/////////////////////////////////////////////////////
//// 

