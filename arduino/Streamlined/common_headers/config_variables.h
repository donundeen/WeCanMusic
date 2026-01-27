//////////////////////////////
// CONFIG VARS
#include "device_config.h"

// set to true if teh config file is corrupted.
boolean resetConfigFile = false;

// NO NETWORK MODE? for testing sensor without network
const bool no_network = false;

// if we want to save the config data to local file. change to false to bypass SPIFFS stuff.
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

// default wifi config variables (device-specific defaults in device_config.h)
const char *WIFI_SSID = DEVICE_DEFAULT_WIFI_SSID;
const char *WIFI_PASSWORD = DEVICE_DEFAULT_WIFI_PASSWORD;

boolean override_ip = false;
char *presetip = DEVICE_PRESET_IP; // in case we just want to force it for testing

int UDPINPort = 7004; // the UDP port that the device is listening on
// END NETWORK CONFIGS
////////////////////////

int NUM_MULTIVALUES = DEVICE_NUM_MULTIVALUES;

// CONFIG WEBPAGE PINS AND VARS
int resetButtonPin = A0; // this pin starts the AP mode config page web portal
/// END SETTING UP CONFIG WEBPAGE VARS
///////////////////////////

int SERIALBAUDRATE = 115200;


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

int DEFAULT_NOTELENGTH = N16;

////////////////////////////////
// MUSIC PERFORMANCE VARIABLES
//int noteloop_rate[6] = {7,7,7,7,7,7};
int noteloop_rate[6] = {4,4,4,4,4,4};
int notelength_assortment[9] = {2,3,4,5,5,6,7,8,8}; // noteloop_rates could be randomly chosen from this list. 
                                                    //  list must be 9 elements, but you can double numbers up to incrase occurence
int sensor_loop_rate = 10;
////// END MUSIC PERFORMANCE VARIABLES  
///////////////////////////////////////

/////////////////////////////
// SENSOR STREAMING VARIABLES
// network send rate for raw/feature data (Hz)
int sensor_send_rate_hz = 100;
// debounce: minimum change required to accept a new sample
float sensor_debounce_delta = 1.0;
// debounce: max time to hold a stable value (ms)
int sensor_debounce_ms = 20;
// EMA smoothing factor (0-1). Higher = less smoothing.
float sensor_ema_alpha = 0.2;
// quantization bits for network payload (12 or 16 recommended)
int sensor_quantize_bits = 16;
/////////////////////////////



/////////////////////////////
// TIMING VARIABLES 
int bpm = 120;

// END TIMING VARIABLES
////////////////////////


// END CONFIG VARS
//////////////////////////////