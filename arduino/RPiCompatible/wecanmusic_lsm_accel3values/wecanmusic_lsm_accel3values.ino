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
#include "uClock.h"
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


////////////////////////////////////
// SENSOR INCLUDES
//gyro code:
// * LSM6DSOX + LIS3MDL FeatherWing : https://www.adafruit.com/product/4565
// * ISM330DHCX + LIS3MDL FeatherWing https://www.adafruit.com/product/4569
// * LSM6DSOX + LIS3MDL Breakout : https://www.adafruit.com/product/4517
// * LSM6DS33 + LIS3MDL Breakout Lhttps://www.adafruit.com/product/4485
// see here: https://learn.adafruit.com/st-9-dof-combo/ard/Users/donundeen/Downloads/TCS3200D/color/color.pdeuino 
/*
 * Libraries to install (include dependencies)
 * OSC
 * Adafruit LSM6DS 
 * Adafruit LIS3MDL
 * AutoConnect (see https://hieromon.github.io/AutoConnect/#installation)
 * 
 */
// SENSOR LIBS/Users/donundeen/Downloads/TCS3200D/TCS3200D/TCS3200D.pde
#include <Adafruit_LSM6DSOX.h>
#include <Adafruit_LIS3MDL.h>
// END SENSOR INCLUDES  
/////////////////////////////////////////

////////////////////////////////
// SENSOR OBJECT CREATION
//Adafruit_LSM6DSOX lsm6ds;
Adafruit_LSM6DSOX lsm6ds;
Adafruit_LIS3MDL lis3mdl;
// END OBJECT CREATION
///////////////////////

// MULTIVALUE SETUP
const int NUM_MULTIVALUES = 3;

///////////////////////////
// DEVICE CONFIGS
// set the accelerometer value to use afor the pitch
// one of:
//    case "gyro.x":
//    case "gyro.y":
//    case "gyro.z":
//    case "accel.x":
//    case "accel.y":
//    case "accel.z":
//    case "mag.x":
//    case "mag.y":
//    case "mag.z":
const int _GYROX = 1;
const int _GYROY = 2;
const int _GYROZ = 3;
const int _ACCELX = 4;
const int _ACCELY = 5;
const int _ACCELZ = 6;
const int _MAGX = 7;
const int _MAGY = 8;
const int _MAGZ = 9;
int AccelPitchVal[6] = {_GYROX, _GYROY, _GYROZ, _ACCELX, _ACCELY, _ACCELZ}; 


int SERIALBAUDRATE = 115200;

///////////////////////////////
// MUSIC PERFORMANCE VARIABLES
int notelist[127];
int notelistlength = 0;
int workinglist[6][127]; //MULTIVALUE UPDATE REQUIRED
int workinglistlength[6] = {0,0,0,0,0,0}; //MULTIVALUE UPDATE REQUIRED


// END MUSIC PERFORMANCE VARIABLES
///////////////////////////


// if the device has a synth/speakers attached, set this to true
// if false, it will send a makenote message out over the netework,
// for the server to play.
boolean localSynth = false;

////////////////// SETING UP CONFIG WEBPAGE - FOR WIFI AND OTHER VALUES
//define your default values here, if there are different values in config.json, they are overwritten.
// My values: (in addition to WIFI data)
// wecanmusic_server_ip
// wecanmusic_port
// this_device_name

// wifi autoconnect code
// CONFIG WEBPAGE PINS AND VARS
int resetButtonPin = A0;

char wecanmusic_server_ip[40] = "10.0.0.255";
char wecanmusic_port[6] = "7005";
char this_device_name[34] = "RENAME_ME";
//flag for saving data
bool shouldSaveConfig = true;
/// END SETTING UP CONFIG WEBPAGE VARS
///////////////////////////


/////////////////////////////
// TIMING VARIABLES 
AsyncTimer t;



////////////////////////////////////////////
// NETWORK SPECIFIC VARS - SHOULDN'T CHANGE
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
umodular::clock::uClockClass::PPQNResolution PPQNr = uClock.PPQN_96;
int PPQN = 96;

// number of pulses for different common note values.
int WN = PPQN * 4;
int HN = PPQN * 2;
int QN = PPQN;
int N8 = PPQN / 2;
int N16 = PPQN / 4;
int QN3 = HN / 3;
int HN3 = WN / 3;
int N83 = QN / 3;

// array of all notelengths, for picking
int notelengths[] = {WN, HN, HN3, QN, QN3, N8, N83, N16};

// END TIMING VARIABLES
////////////////////////


//////////////////////////////
/// NETWORK CONFIGS  
const boolean HARDCODE_SSID = false; //true; //false;

char *WIFI_SSID = "wecanmusic";// "wecanmusic"; //"JJandJsKewlPad";
char *WIFI_PASSWORD = "";//"wecanmusic";//"wecanmusic"; //"WeL0veLettuce";
char *UDPReceiverIP = "10.0.0.255"; // ip where UDP messages are going
char *presetip = "10.0.0.255"; // in case we just want to force it for testing
int UDPPort = 7005; // the UDP port that Max is listening on
int UDPINPort = 7004; // the UDP port that Max is listening on
// END NETWORK CONFIGS
////////////////////////

// NETWORK+SENSOR CONFIGS
char *DEVICE_NAME[6] = {"flex1", "flex1", "flex1", "flex1", "flex1", "flex1"};  //MULTIVALUE UPDATE REQUIRED: each value shows as DEVICE_NAME_[index]
char *DEVICE_ID_SUFFIX = "/val";
char DEVICE_ID[][40] = {"/","/","/","/","/","/"};  //MULTIVALUE UPDATE REQUIRED: see above

// NO NETWORK MODE? for testing sensor without network
bool no_network = false;


/////////// MIDI DEFINITIONS /////////////////////

//#define VS1053_GM1_OCARINA 81
#define VS1053_GM1_OCARINA 12 // change this for other sounds
// See http://www.vlsi.fi/fileadmin/datasheets/vs1053.pdf Pg 32 for more!
int midi_voice[6] = {12,12,12,12,12,12}; // see define_configs //MULTIVALUE UPDATE REQUIRED . Also update to bank/program for 
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
                                // set to 0 to disable //MULTIVALUE UPDATE REQUIRED

////////////////////////////////////
// SENSOR PROCESSING GLOBALS
bool firstSense[6] = {false, false, false, false, false, false}; //MULTIVALUE UPDATE REQUIRED
int ADCRaw[6] = {-1, -1, -1, -1, -1, -1};          //MULTIVALUE UPDATE REQUIRED. ALSO rename to sensorInputVal or something
float changerate[6] = {-1.0, -1.0, -1.0, -1.0, -1.0, -1.0}; //MULTIVALUE UPDATE REQUIRED
float prevChangeVal[6] = {-1.0, -1.0, -1.0, -1.0, -1.0, -1.0};  //MULTIVALUE UPDATE REQUIRED
int prevChangeTime[6] = {-1, -1, -1, -1, -1, -1} ;     //MULTIVALUE UPDATE REQUIRED


void reset_minmax(int vindex){  //MULTIVALUE UPDATE REQUIRED
  minVal[vindex] = 100000.0; //MULTIVALUE UPDATE REQUIRED
  maxVal[vindex] = -1.0;      //MULTIVALUE UPDATE REQUIRED
  changeMin[vindex] = 10000.0;  //MULTIVALUE UPDATE REQUIRED
  changeMax[vindex] = -1.0;     //MULTIVALUE UPDATE REQUIRED
}




void sensor_setup(){
  delay(1000);
  Serial.println("setup");

  // for incoming UDP
  //  SLIPSerial.begin(115200);

  pinMode(BUILTIN_LED, OUTPUT);

  // gyro/accel stuff
  bool lsm6ds_success, lis3mdl_success;

  // hardware I2C mode, can pass in address & alt Wire

  lsm6ds_success = lsm6ds.begin_I2C();
  lis3mdl_success = lis3mdl.begin_I2C();

  if (!lsm6ds_success){
    Serial.println("Failed to find LSM6DS chip");
  }
  if (!lis3mdl_success){
    Serial.println("Failed to find LIS3MDL chip");
  }
  if (!(lsm6ds_success && lis3mdl_success)) {
    while (1) {
      delay(10);
    }
  }

  Serial.println("LSM6DS and LIS3MDL Found!");

  // lsm6ds.setAccelRange(LSM6DS_ACCEL_RANGE_2_G);
  Serial.print("Accelerometer range set to: ");
  switch (lsm6ds.getAccelRange()) {
  case LSM6DS_ACCEL_RANGE_2_G:
    Serial.println("+-2G");
    break;
  case LSM6DS_ACCEL_RANGE_4_G:
    Serial.println("+-4G");
    break;
  case LSM6DS_ACCEL_RANGE_8_G:
    Serial.println("+-8G");
    break;
  case LSM6DS_ACCEL_RANGE_16_G:
    Serial.println("+-16G");
    break;
  }

  // lsm6ds.setAccelDataRate(LSM6DS_RATE_12_5_HZ);
  Serial.print("Accelerometer data rate set to: ");
  switch (lsm6ds.getAccelDataRate()) {
  case LSM6DS_RATE_SHUTDOWN:
    Serial.println("0 Hz");
    break;
  case LSM6DS_RATE_12_5_HZ:
    Serial.println("12.5 Hz");
    break;
  case LSM6DS_RATE_26_HZ:
    Serial.println("26 Hz");
    break;
  case LSM6DS_RATE_52_HZ:
    Serial.println("52 Hz");
    break;
  case LSM6DS_RATE_104_HZ:
    Serial.println("104 Hz");
    break;
  case LSM6DS_RATE_208_HZ:
    Serial.println("208 Hz");
    break;
  case LSM6DS_RATE_416_HZ:
    Serial.println("416 Hz");
    break;
  case LSM6DS_RATE_833_HZ:
    Serial.println("833 Hz");
    break;
  case LSM6DS_RATE_1_66K_HZ:
    Serial.println("1.66 KHz");
    break;
  case LSM6DS_RATE_3_33K_HZ:
    Serial.println("3.33 KHz");
    break;
  case LSM6DS_RATE_6_66K_HZ:
    Serial.println("6.66 KHz");
    break;
  }

  // lsm6ds.setGyroRange(LSM6DS_GYRO_RANGE_250_DPS );
  Serial.print("Gyro range set to: ");
  switch (lsm6ds.getGyroRange()) {
  case LSM6DS_GYRO_RANGE_125_DPS:
    Serial.println("125 degrees/s");
    break;
  case LSM6DS_GYRO_RANGE_250_DPS:
    Serial.println("250 degrees/s");
    break;
  case LSM6DS_GYRO_RANGE_500_DPS:
    Serial.println("500 degrees/s");
    break;
  case LSM6DS_GYRO_RANGE_1000_DPS:
    Serial.println("1000 degrees/s");
    break;
  case LSM6DS_GYRO_RANGE_2000_DPS:
    Serial.println("2000 degrees/s");
    break;
  case ISM330DHCX_GYRO_RANGE_4000_DPS:
    Serial.println("4000 degrees/s");
    break;
  }
  // lsm6ds.setGyroDataRate(LSM6DS_RATE_12_5_HZ);
  Serial.print("Gyro data rate set to: ");
  switch (lsm6ds.getGyroDataRate()) {
  case LSM6DS_RATE_SHUTDOWN:
    Serial.println("0 Hz");
    break;
  case LSM6DS_RATE_12_5_HZ:
    Serial.println("12.5 Hz");
    break;
  case LSM6DS_RATE_26_HZ:
    Serial.println("26 Hz");
    break;
  case LSM6DS_RATE_52_HZ:
    Serial.println("52 Hz");
    break;
  case LSM6DS_RATE_104_HZ:
    Serial.println("104 Hz");
    break;
  case LSM6DS_RATE_208_HZ:
    Serial.println("208 Hz");
    break;
  case LSM6DS_RATE_416_HZ:
    Serial.println("416 Hz");
    break;
  case LSM6DS_RATE_833_HZ:
    Serial.println("833 Hz");
    break;
  case LSM6DS_RATE_1_66K_HZ:
    Serial.println("1.66 KHz");
    break;
  case LSM6DS_RATE_3_33K_HZ:
    Serial.println("3.33 KHz");
    break;
  case LSM6DS_RATE_6_66K_HZ:
    Serial.println("6.66 KHz");
    break;
  }

  lis3mdl.setDataRate(LIS3MDL_DATARATE_155_HZ);
  // You can check the datarate by looking at the frequency of the DRDY pin
  Serial.print("Magnetometer data rate set to: ");
  switch (lis3mdl.getDataRate()) {
    case LIS3MDL_DATARATE_0_625_HZ: Serial.println("0.625 Hz"); break;
    case LIS3MDL_DATARATE_1_25_HZ: Serial.println("1.25 Hz"); break;
    case LIS3MDL_DATARATE_2_5_HZ: Serial.println("2.5 Hz"); break;
    case LIS3MDL_DATARATE_5_HZ: Serial.println("5 Hz"); break;
    case LIS3MDL_DATARATE_10_HZ: Serial.println("10 Hz"); break;
    case LIS3MDL_DATARATE_20_HZ: Serial.println("20 Hz"); break;
    case LIS3MDL_DATARATE_40_HZ: Serial.println("40 Hz"); break;
    case LIS3MDL_DATARATE_80_HZ: Serial.println("80 Hz"); break;
    case LIS3MDL_DATARATE_155_HZ: Serial.println("155 Hz"); break;
    case LIS3MDL_DATARATE_300_HZ: Serial.println("300 Hz"); break;
    case LIS3MDL_DATARATE_560_HZ: Serial.println("560 Hz"); break;
    case LIS3MDL_DATARATE_1000_HZ: Serial.println("1000 Hz"); break;
  }

  lis3mdl.setRange(LIS3MDL_RANGE_4_GAUSS);
  Serial.print("Range set to: ");
  switch (lis3mdl.getRange()) {
    case LIS3MDL_RANGE_4_GAUSS: Serial.println("+-4 gauss"); break;
    case LIS3MDL_RANGE_8_GAUSS: Serial.println("+-8 gauss"); break;
    case LIS3MDL_RANGE_12_GAUSS: Serial.println("+-12 gauss"); break;
    case LIS3MDL_RANGE_16_GAUSS: Serial.println("+-16 gauss"); break;
  }

  lis3mdl.setPerformanceMode(LIS3MDL_MEDIUMMODE);
  Serial.print("Magnetometer performance mode set to: ");
  switch (lis3mdl.getPerformanceMode()) {
    case LIS3MDL_LOWPOWERMODE: Serial.println("Low"); break;
    case LIS3MDL_MEDIUMMODE: Serial.println("Medium"); break;
    case LIS3MDL_HIGHMODE: Serial.println("High"); break;
    case LIS3MDL_ULTRAHIGHMODE: Serial.println("Ultra-High"); break;
  }

  lis3mdl.setOperationMode(LIS3MDL_CONTINUOUSMODE);
  Serial.print("Magnetometer operation mode set to: ");
  // Single shot mode will complete conversion and go into power down
  switch (lis3mdl.getOperationMode()) {
    case LIS3MDL_CONTINUOUSMODE: Serial.println("Continuous"); break;
    case LIS3MDL_SINGLEMODE: Serial.println("Single mode"); break;
    case LIS3MDL_POWERDOWNMODE: Serial.println("Power-down"); break;
  }

  lis3mdl.setIntThreshold(500);
  lis3mdl.configInterrupt(false, false, true, // enable z axis
                          true, // polarity
                          false, // don't latch
                          true); // enabled!
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
  t.setTimeout(note_loop, mididuration); // but changing the mididuration in this function could make notes overlap, so creeat space between notes. Or we make this a sensor-controlled variable as well
}

void sensor_loop_multivalue(){
  for(int vindex = 0 ; vindex < NUM_MULTIVALUES; vindex++){
    sensor_loop(vindex);
  }
}

void sensor_loop(int vindex){

  sensors_event_t accel, gyro, mag, temp;

  //  /* Get new normalized sensor events */
  lsm6ds.getEvent(&accel, &gyro, &temp);
  lis3mdl.getEvent(&mag);

  /* Display the results (acceleration is measured in m/s^2) */
  /*
  Serial.print("\t\tAccel X: ");
  Serial.print(accel.acceleration.x, 4);
  Serial.print(" \tY: ");
  Serial.print(accel.acceleration.y, 4);
  Serial.print(" \tZ: ");
  Serial.print(accel.acceleration.z, 4);
  Serial.println(" \tm/s^2 ");
  */

  /* Display the results (rotation is measured in rad/s) */
  /*
  Serial.print("\t\tGyro  X: ");
  Serial.print(gyro.gyro.x, 4);
  Serial.print(" \tY: ");
  Serial.print(gyro.gyro.y, 4);
  Serial.print(" \tZ: ");
  Serial.print(gyro.gyro.z, 4);
  Serial.println(" \tradians/s ");
  */
 /* Display the results (magnetic field is measured in uTesla) */
 /*
  Serial.print(" \t\tMag   X: ");
  Serial.print(mag.magnetic.x, 4);
  Serial.print(" \tY: ");
  Serial.print(mag.magnetic.y, 4);
  Serial.print(" \tZ: ");
  Serial.print(mag.magnetic.z, 4);
  Serial.println(" \tuTesla ");
  */

//  sendOSCUDP(gyro.gyro.x, gyro.gyro.y, gyro.gyro.z, accel.acceleration.x, accel.acceleration.y, accel.acceleration.z, mag.magnetic.x,mag.magnetic.y,mag.magnetic.z, sensorVal);

  switch(AccelPitchVal[vindex]){  //MULTIVALUE UPDATE REQUIRED
    case _GYROX:
      ADCRaw[vindex] = gyro.gyro.x;
      break;
    case _GYROY:
      ADCRaw[vindex] = gyro.gyro.x;
      break;
    case _GYROZ:
      ADCRaw[vindex] = gyro.gyro.z;
      break;
    case _ACCELX:
      ADCRaw[vindex] = accel.acceleration.x;
      break;
    case _ACCELY:
      ADCRaw[vindex] = accel.acceleration.y;
      break;      
    case _ACCELZ:
      ADCRaw[vindex] = accel.acceleration.z;
      break;
    case _MAGX:
      ADCRaw[vindex] = mag.magnetic.x;
      break;
    case _MAGY:
      ADCRaw[vindex] = mag.magnetic.y;
      break;            
    case _MAGZ:
      ADCRaw[vindex] = mag.magnetic.z;
      break;               
  }


  Serial.println("read value");
  Serial.println(ADCRaw[vindex]);  //MULTIVALUE UPDATE REQUIRED
  firstSense[vindex] = true;   //MULTIVALUE UPDATE REQUIRED


  /*
  if(!no_network){
    sendOSCUDP(ADCRaw);
  }
  */
  // should be 10
  //delay(10); // removing when using timeouts
}


void changerate_loop_multivalue(){
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
  Serial.println(pbuf);
  return change;

}

int derive_pitch(int vindex, float val){   //MULTIVALUE UPDATE REQUIRED
  int pitch = noteFromFloat(vindex, val, midimin[vindex], midimax[vindex]);  //MULTIVALUE UPDATE REQUIRED
  return pitch;
}

int derive_velocity(int vindex, int val){   //MULTIVALUE UPDATE REQUIRED
  int velocity = floor(127.0 * functioncurve(changerate[vindex], velocitycurve[vindex], velocitycurvelength[vindex]));  //MULTIVALUE UPDATE REQUIRED
  return velocity;
}


int derive_duration(int vindex, float val){  //MULTIVALUE UPDATE REQUIRED

  return pulseToMS(N16);
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
//  int notelengths[] = {WN, HN, HN3, QN, QN3, N8, N83, N16};
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
  return pulseToMS(WN);

}








// NETWORK+SENSOR CODE
// sending data over OSC/UDP.
void sendOSCUDP(int vindex, int sendVal){  //MULTIVALUE UPDATE REQUIRED
  /* egs
   *  '/perifit/1', valueInt1, valueInt2, device.name);
   *  28:ec:9a:14:2b:b3 l 180
      28:ec:9a:14:2b:b3 u 1391
   *  
   */
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
      char devroute[100];
      sprintf(devroute,"/%s",this_device_name);  //MULTIVALUE UPDATE REQUIRED
      bundleIN.route(devroute, routeDeviceMsg);
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

  if(!no_network){  
    network_setup();
  }

  midi_setup();
  clock_setup();
  test_setup();
  sensor_setup();  

  // Start the loops here, not in the loop() function
  t.setInterval(sensor_loop_multivalue, 10);
  sensor_loop_multivalue();  //MULTIVALUE UPDATE REQUIRED
//  t.setInterval(changerate_loop, 100);
  changerate_loop_multivalue();  //MULTIVALUE UPDATE REQUIRED
  note_loop();  //MULTIVALUE UPDATE REQUIRED

  config_setup_multivalue();  //MULTIVALUE UPDATE REQUIRED

  announceCreation_multivalue();  //MULTIVALUE UPDATE REQUIRED

}

void loop() {  
  // everything else should be handled as async calls
  if(!no_network){
    network_loop();
  }  
  udp_loop();
  t.handle();
//  sensor_loop(); // moving this into sensor_setup, with a setTimeout function to make the looping happen
}
// END SETUP AND LOOP FUNCTIONS
/////////////////////////////////




