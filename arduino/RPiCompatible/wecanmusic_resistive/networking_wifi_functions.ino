
////////////////////////////////
// NETWORKING FUNCTIONS
void network_setup() {

  delay(1000);
  Serial.println("setup");

  // for incoming UDP
//  SLIPSerial.begin(115200);
  pinMode(21, INPUT_PULLUP);

  pinMode(BUILTIN_LED, OUTPUT);

  Serial.print("ESP Board MAC Address:  ");
  Serial.println(WiFi.macAddress());

  thisarduinomac = WiFi.macAddress();

  if(WIFI_MODE_ON){
 
      // wifi config business

    if(HARDCODE_SSID){
      Serial.println("connecting to hardcoded SSID");
      Serial.println(WIFI_SSID);
      Serial.println(WIFI_PASSWORD);
      
      WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
      while (WiFi.status() != WL_CONNECTED) {
        // wifi status codes: https://realglitch.com/2018/07/arduino-wifi-status-codes/
        delay(1000);
        Serial.print(".");
        Serial.print(WiFi.status());
        if(WiFi.status() == WL_CONNECTED){
          Serial.print("WL_CONNECTED");
        }
        if(WiFi.status() == WL_IDLE_STATUS){
          Serial.print("WL_IDLE_STATUS");
        }
        if(WiFi.status() == WL_CONNECT_FAILED){
          Serial.print("WL_CONNECT_FAILED");
        }
        if(WiFi.status() == WL_NO_SSID_AVAIL){
          Serial.print("WL_NO_SSID_AVAIL");
        }
        if(WiFi.status() == WL_SCAN_COMPLETED){
          Serial.print("WL_SCAN_COMPLETED");
        }
        if(WiFi.status() == WL_CONNECT_FAILED){
          Serial.print("WL_CONNECT_FAILED");
        }
        if(WiFi.status() == WL_CONNECTION_LOST){
          Serial.print("WL_CONNECTION_LOST");
        }
        if(WiFi.status() == WL_DISCONNECTED){
          Serial.print("WL_DISCONNECTED");
        }
      }
    }else{
      config_webpage_setup();
    }
  }
}




// END NETWORKING FUNCTIONS
////////////////////////////////





