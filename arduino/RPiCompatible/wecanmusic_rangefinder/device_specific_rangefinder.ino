///////////////////////////////////
// SENSOR LIBS
#include <SoftwareSerial.h>
// END SENSOR LIBS
//////////////////////////////////

//////////////////////////////
// DEVICE-SPECIFIC CONFIG VARS
// MULTIVALUE SETUP
const int DEVICE_NUM_MULTIVALUES = 1;

///////////////////////////
// SENSOR CONFIGS
const int US100_TX = 4; /// brown
const int US100_RX = 5; // white

SoftwareSerial US100Serial(US100_RX, US100_TX);
 
unsigned int MSByteDist = 0;
unsigned int LSByteDist = 0;
unsigned int mmDist = 0;
int temp = 0;


// END DEVICE-SPECIFIC CONFIG VARS
//////////////////////////////


////////////////////////////////////////////////////
/////////////////////////////
// DEVICE SPECIFIC FUNCTIONS
void sensor_setup_device(){
    US100Serial.begin(9600);
}

// sensor_loop must:
// - set ADCRaw[vindex] with the read sensor value
// - set firstSense[vindex] to true

void sensor_loop(int vindex){

  US100Serial.flush();
  US100Serial.write(0x55); 

  delay(10);

  if(US100Serial.available() >= 2) 
  {
      MSByteDist = US100Serial.read(); 
      LSByteDist = US100Serial.read();
      mmDist  = MSByteDist * 256 + LSByteDist; 
      if((mmDist > 1) && (mmDist < 10000)) 
      {
        ADCRaw[vindex] = mmDist;
      }
  }

  Serial.println("read value");
  Serial.println(ADCRaw[vindex]);
  /*
  if(!no_network){
    sendOSCUDP(ADCRaw);
  }
  */
  // should be 10
  //delay(10); // removing when using timeouts
  firstSense[vindex] = true;   //MULTIVALUE UPDATE REQUIRED

}

// END DEVICE SPECIFIC FUNCTIONS
/////////////////////////////



int get_num_multivalues(){
    return DEVICE_NUM_MULTIVALUES;
}
