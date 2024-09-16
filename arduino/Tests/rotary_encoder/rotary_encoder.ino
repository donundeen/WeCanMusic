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
WiFiUDP udp;




bool wifi_connected =false;
char *UDPReceiverIP = "10.0.0.255"; // ip where UDP messages are going
char *presetip = "10.0.0.255"; // in case we just want to force it for testing
int UDPOutPort = 7005; // the UDP port that Max is listening on
int UDPINPort = 7004; // the UDP port that Max is listening on
bool WIFI_MODE_ON = true;
// END NETWORK CONFIGS


#define ARRAYSIZE 10
String commands[ARRAYSIZE] = { "/performance", "/performance", "/performance" };
String arguments[ARRAYSIZE] = {"cheeseblues","veryspooky","perf1"};
int commandsLen = 3;
int commandIndex = 0;

const char* ssid = "icanmusic";
const char* password =  "";



ESP32Encoder encoder;

int buttonPin = 14;
int prevButtonRead = 1;

int encoderVal = 0;

void setup(){
	Serial.begin(115200);

  pinMode(buttonPin, INPUT_PULLUP);

	// Enable the weak pull up resistors
	ESP32Encoder::useInternalWeakPullResistors=puType::up;
	encoder.attachHalfQuad(19, 18);
	// clear the encoder's raw count and set the tracked count to zero
	encoder.clearCount();


  // Set WiFi to station mode and disconnect from an AP if it was previously connected
  WiFi.mode(WIFI_STA);

  WiFi.disconnect();
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
      delay(100);
      Serial.print(".");
//        WiFi.begin(ssid, password);
  //    WiFi.begin(ssid, password);
  }
  Serial.println("Connected to WiFi, configUdp ...");

  configUdp();

}

void loop(){
  static int oldEncoder=-32000;
  int encoder1=encoder.getCount();
  encoder1 = encoder1 / 2;
Serial.println(encoder1);  
  if(encoder1 != oldEncoder) {
         oldEncoder=encoder1;
    if(encoder1 < 0){
      encoder1 = commandsLen -1;
    }
    encoder1 = encoder1 % commandsLen;
    
    encoderVal = encoder1;
    Serial.print("encoderVal ");
    Serial.println(encoderVal);

    sendMessage("/sayperformance",arguments[encoderVal] );

	  //delay(100);
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



/*
 * connecting to UDP port on laptop runnin Max (or otherwise sending/recieving UDP data)
 */
void configUdp(){
  udp.begin(UDPINPort);
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