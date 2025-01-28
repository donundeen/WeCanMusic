

////////////////////////////////////////////////////////
//////////   EVERYTHING BELOW HERE SHOULD NOT CHANGE ///

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


// LOCAL HEADER FILES
#include "headers/config_variables.h"
#include "headers/persistent_variables.h"
#include "headers/global_variables.h"
#include "../common_headers/scaling.h"
#include "../common_headers/helper_functions.h"




/////////////////////////////
// SETUP AND LOOP FUNCTIONS
// calls other setup and loop functions
void setup() {
  delay(1000);
  
  Serial.begin(115200);

  persistence_setup();

  if(!no_network){  
    network_setup();
  }

  udp_setup();

  midi_setup();
  test_setup();
  sensor_setup();
  announceCreation();

}

void loop() {  
  // everything else should be handled as async calls
  udp_loop();
  t.handle();
}
// END SETUP AND LOOP FUNCTIONS
/////////////////////////////////
/////////////////////////////////////////////////////
//// 