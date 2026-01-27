


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

////////////////////////
// NETWORK+SENSOR CONFIGS
char DEVICE_NAME[][20] = {"RENAME_MExxxxxxx+xx", "RENAME_MExxxxxxx+xx", "RENAME_MExxxxxxx+xx", "RENAME_MExxxxxxx+xx", "RENAME_MExxxxxxx+xx", "RENAME_MExxxxxxx+xx"};  //: each value shows as DEVICE_NAME_[index]
char *DEVICE_ID_SUFFIX = "/val";
char DEVICE_ID[][40] = {"/","/","/","/","/","/"};  //: see above
// END NETWORK+SENSOR CONFIGS




float elasticMinMaxScale = .005; // if true, then the min and max values used for dynamic scaling slowly come closer together, 
                                // so that a rate large value over time will get smoothed out
                                // set to 0 to disable
// END Sensor scaling variables
/////////////////////////////

////////////////////////////////////
// SENSOR PROCESSING GLOBALS
bool firstSense[6] = {false, false, false, false, false, false}; //
float ADCRaw[6] = {-1, -1, -1, -1, -1, -1};          //. ALSO rename to sensorInputVal or something
float changerate[6] = {-1.0, -1.0, -1.0, -1.0, -1.0, -1.0}; //
float prevChangeVal[6] = {-1.0, -1.0, -1.0, -1.0, -1.0, -1.0};  //
int prevChangeTime[6] = {-1, -1, -1, -1, -1, -1} ;     //

int peaks[6] = {0,0,0,0,0,0};
int prevpeaks[6] = {0,0,0,0,0,0}; // track so we don't trigger a peak twice.

// Streaming processing state (debounce, smoothing, features)
float debouncedVal[6] = {-1.0, -1.0, -1.0, -1.0, -1.0, -1.0};
float smoothedVal[6] = {-1.0, -1.0, -1.0, -1.0, -1.0, -1.0};
unsigned long lastDebounceTime[6] = {0,0,0,0,0,0};

float rmsAccum[6] = {0,0,0,0,0,0};
int rmsCount[6] = {0,0,0,0,0,0};
float peakAbs[6] = {0,0,0,0,0,0};

float velocityVal[6] = {0,0,0,0,0,0};
float lastVelocityRaw[6] = {0,0,0,0,0,0};
unsigned long lastVelocityTime[6] = {0,0,0,0,0,0};
// END SENSOR PROCESSING GLOBALS
////////////////////////////////////



