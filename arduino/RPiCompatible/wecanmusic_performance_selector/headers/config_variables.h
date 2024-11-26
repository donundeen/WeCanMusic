//////////////////////////////
// CONFIG VARS


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

// default wifi config variables
const char *WIFI_SSID = "icanmusic";// "icanmusic"; //"JJandJsKewlPad";
const char *WIFI_PASSWORD = "";//"wecanmusic";//"wecanmusic"; //"WeL0veLettuce";

boolean override_ip = false;
char *presetip = "10.0.0.255"; // in case we just want to force it for testing


char *UDPReceiverIP = "10.0.0.255"; // ip where UDP messages are going
int UDPOutPort = 7005; // the UDP port that Max is listening on

int UDPINPort = 7004; // the UDP port that the device is listening on
// END NETWORK CONFIGS
////////////////////////

// CONFIG WEBPAGE PINS AND VARS
int resetButtonPin = A1; // this pin starts the AP mode config page web portal
/// END SETTING UP CONFIG WEBPAGE VARS
///////////////////////////

int SERIALBAUDRATE = 115200;



// END CONFIG VARS
//////////////////////////////