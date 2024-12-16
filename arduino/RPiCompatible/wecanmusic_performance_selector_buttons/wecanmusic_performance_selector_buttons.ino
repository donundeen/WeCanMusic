// ESP32encoder https://www.arduino.cc/reference/en/libraries/esp32encoder/
// documentation https://madhephaestus.github.io/ESP32Encoder/classESP32Encoder.html


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
    pinMode(start_button_pin, INPUT_PULLUP);
    pinMode(select_button_pin, INPUT_PULLUP);

}


// Button state variables
bool selectButton_last = HIGH;
bool selectButton_state;
unsigned long lastPressSelect = HIGH; // Last press time for button A

bool startButton_last = HIGH;
bool startButton_state;
unsigned long lastPressStart = HIGH; // Last press time for button A


void sensor_loop(){
  // Read button states (buttons are active LOW due to pullup)
  unsigned long currentTime = millis(); // Get current time


  bool readingSelectButton_state = !digitalRead(select_button_pin);

  if(readingSelectButton_state != selectButton_last){
    lastPressSelect = currentTime;
  }
  if((currentTime - lastPressSelect) > DEBOUNCE_MS){
    if(readingSelectButton_state != selectButton_state){
      selectButton_state = readingSelectButton_state;
      Serial.println("changed");
      if(selectButton_state){
        handleSelectButton();
      }else{
        Serial.println("button off");
      }
    }
  }
  selectButton_last = readingSelectButton_state;


  bool readingStartButton_state = !digitalRead(start_button_pin);

  if(readingStartButton_state != startButton_last){
    lastPressStart = currentTime;
  }
  if((currentTime - lastPressStart) > DEBOUNCE_MS){
    if(readingStartButton_state != startButton_state){
      startButton_state = readingStartButton_state;
      Serial.println("changed");
      if(startButton_state){
        handleStartButton();
      }else{
        Serial.println("button off");
      }
    }
  }
  startButton_last = readingStartButton_state;
  delay(10);
}

void handleStartButton(){
    Serial.println("start");
    sendMessage("/performance", arguments[encoderVal]);
}

void handleSelectButton(){
    encoderVal++;
    encoderVal = (encoderVal % commandsLen);
    Serial.println("Select button pressed!");    
    Serial.print("encoderVal ");
    Serial.println(encoderVal);
    sendMessage("/sayperformance", arguments[encoderVal]);
}


void announcePerformanceSelector(){
       sendMessage("/announceperformanceselector","true");
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