// ESP32encoder https://www.arduino.cc/reference/en/libraries/esp32encoder/
// documentation https://madhephaestus.github.io/ESP32Encoder/classESP32Encoder.html

#include <ESP32Encoder.h>

ESP32Encoder encoder;

int buttonPin = 14;
int prevButtonRead = 1;

void setup(){
	Serial.begin(115200);

  pinMode(buttonPin, INPUT_PULLUP);

	// Enable the weak pull up resistors
	ESP32Encoder::useInternalWeakPullResistors=puType::up;
	encoder.attachHalfQuad(19, 18);
	// clear the encoder's raw count and set the tracked count to zero
	encoder.clearCount();
}

void loop(){
  static int oldEncoder=-32000;
  int encoder1=encoder.getCount();
  if(encoder1 != oldEncoder) {
         oldEncoder=encoder1;
    
	  Serial.println("Encoder count = "  + String((int32_t)encoder1 / 2));
	  //delay(100);
  }

  int buttonRead = digitalRead(buttonPin);
  // 0 is pressed, 1 is not pressed
  if(buttonRead != prevButtonRead){
    Serial.println(buttonRead);
    if(buttonRead == 0){
      Serial.println("pressed!");    
    }
    prevButtonRead = buttonRead;
  }

}