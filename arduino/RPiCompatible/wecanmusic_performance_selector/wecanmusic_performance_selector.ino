// ESP32encoder https://www.arduino.cc/reference/en/libraries/esp32encoder/
// documentation https://madhephaestus.github.io/ESP32Encoder/classESP32Encoder.html

#include <ESP32Encoder.h>

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
#include "headers/helper_functions.h"

#define ARRAYSIZE 10
String commands[ARRAYSIZE] = { "/performance", "/performance", "/performance" };
String arguments[ARRAYSIZE] = {"cheeseblues","veryspooky","perf1"};
int commandsLen = 3;
int commandIndex = 0;

ESP32Encoder encoder;

int buttonPin = 14;
int prevButtonRead = 1;

int encoderVal = 0;



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
  sensor_setup();

}

void loop(){
    sensor_loop();
}


void sensor_setup(){


    pinMode(buttonPin, INPUT_PULLUP);

	// Enable the weak pull up resistors
	ESP32Encoder::useInternalWeakPullResistors=puType::up;
	encoder.attachHalfQuad(19, 18);
	// clear the encoder's raw count and set the tracked count to zero
    encoder.clearCount();

}

void sensor_loop(){
  static int oldEncoder=-32000;
  int encoder1=encoder.getCount();
  encoder1 = encoder1 / 2;
  if(encoder1 != oldEncoder) {
    oldEncoder=encoder1;
    Serial.println(encoder1);  
    if(encoder1 < 0){
      encoder1 = commandsLen -1;
    }
    encoder1 = encoder1 % commandsLen;

    encoderVal = encoder1;
    Serial.print("encoderVal ");
    Serial.println(encoderVal);

     sendMessage("/sayperformance",arguments[encoderVal] );

	  delay(100);
  }

  int buttonRead = digitalRead(buttonPin);
  // 0 is pressed, 1 is not pressed
  if(buttonRead != prevButtonRead){
    Serial.println(buttonRead);
    if(buttonRead == 0){
      Serial.println("pressed!");    
      sendMessage("/performance",arguments[encoderVal] );

    }
    prevButtonRead = buttonRead;
  }
}


void sendMessage(String command, String argument){
  char command_buffer[command.length() + 1];
  command.toCharArray(command_buffer, command.length() + 1);
  char argument_buffer[argument.length() + 1];
  argument.toCharArray(argument_buffer, argument.length() + 1);

  OSCMessage oscmsg(command_buffer);  
  oscmsg.add(argument_buffer);  //MULTIVALUE UPDATE REQUIRED
  //   udp.beginPacket(UDPReceiverIP, UDPPort);
  udp.beginPacket(UDPReceiverIP, UDPOutPort); // this needs to get set in a config somehwere...

  // udp.beginMulticastPacket(UDPReceiverIP, UDPPort, WiFi.localIP());
  //  udp.write(buffer, msg.length()+1);
  oscmsg.send(udp);
  udp.endPacket();
  oscmsg.empty();  

}