#include "rpcWiFi.h"
#include"TFT_eSPI.h"
#include"Free_Fonts.h" //include the header file
TFT_eSPI tft;


#define ARRAYSIZE 10
String commands[ARRAYSIZE] = { "/xyz", "/performance", "/performance" };
String arguments[ARRAYSIZE] = {"1","2","3"};
int commandsLen = 3;
int commandIndex = 0;

const char* ssid = "icanmusic";
const char* password =  "";

int prevUP = HIGH;
int prevDOWN = HIGH;
int prevLEFT = HIGH;
int prevRIGHT = HIGH;
int prevBUTTON = HIGH;


void setup() {
    Serial.begin(115200);
    while(!Serial); // Wait for Serial to be ready

    pinMode(WIO_5S_UP, INPUT_PULLUP);
    pinMode(WIO_5S_DOWN, INPUT_PULLUP);
    pinMode(WIO_5S_LEFT, INPUT_PULLUP);
    pinMode(WIO_5S_RIGHT, INPUT_PULLUP);
    pinMode(WIO_5S_PRESS, INPUT_PULLUP);

    tft.begin();
    tft.setRotation(3);
    tft.fillScreen(TFT_RED); // fills entire the screen with colour red
    tft.setFreeFont(&FreeSansBoldOblique12pt7b); //select Free, Sans, Bold, Oblique, 12pt.
    tft.drawString("Connecting to WiFi...",10,10);//prints string at (70,80)


    // Set WiFi to station mode and disconnect from an AP if it was previously connected
    WiFi.mode(WIFI_STA);
    WiFi.disconnect();

    Serial.println("Connecting to WiFi..");
    WiFi.begin(ssid, password);

    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.println("Connecting to WiFi..");
        tft.drawString("still waiting for wifi",10,10);//prints string at (70,80)
//        WiFi.begin(ssid, password);
        WiFi.begin(ssid);
    }
    tft.fillScreen(TFT_BLACK); // fills entire the screen with colour red

    tft.drawString("Connected to the WiFi!",10,10);//prints string at (70,80)
    tft.drawString(WiFi.localIP().toString(),10,40);//prints string at (70,80)
    displayCommand();
    
    Serial.println("Connected to the WiFi network");
    Serial.print("IP Address: ");
    Serial.println (WiFi.localIP()); // prints out the device's IP address

/*
    tft.setFreeFont(&FreeSansBoldOblique12pt7b); //select Free, Sans, Bold, Oblique, 12pt.
    tft.drawString("Sans Serif 12pt",70,80);//prints string at (70,80)

    tft.setFreeFont(FF10); //select Free, Mono, Oblique, 12pt.
    tft.drawString("Mono 12pt",70,110);//prints string at (70,110)

    tft.setFreeFont(FS12); //select Free, Serif, 12pt.
    tft.drawString("Serif 12pt",70,140);//prints string at (70,140)   
    */ 
}

void loop() {

  //  tft.fillScreen(TFT_RED);
   if (digitalRead(WIO_5S_UP) == LOW) {
    Serial.println("5 Way Up");
    commandIndex++;
    commandIndex = commandIndex % commandsLen;
    displayCommand();
   }
   else if (digitalRead(WIO_5S_DOWN) == LOW) {
    Serial.println("5 Way Down");
    commandIndex--;
    if(commandIndex < 0){
      commandIndex = commandsLen - 1;
    }
    commandIndex = commandIndex % commandsLen;
    displayCommand();
   }
   else if (digitalRead(WIO_5S_LEFT) == LOW) {
    Serial.println("5 Way Left");
   }
   else if (digitalRead(WIO_5S_RIGHT) == LOW) {
    Serial.println("5 Way Right");
   }
   else if (digitalRead(WIO_5S_PRESS) == LOW) {
    Serial.println("5 Way Press");
    displaySent();    
   }
    delay(200);
    // Turning off the LCD backlight
    //digitalWrite(LCD_BACKLIGHT, LOW);
}



void displayCommand(){
    tft.drawString("                        ",10,110);//prints string at (70,110)
    tft.drawString(commands[commandIndex] + " " + arguments[commandIndex],10,110);//prints string at (70,110)
}

void displaySent(){
      tft.drawString("sent", 10, 140);
      tft.drawString("                        ",60,170);//prints string at (70,110)
      tft.drawString(commands[commandIndex] + " " + arguments[commandIndex],60,170);//prints string at (70,110)
}


