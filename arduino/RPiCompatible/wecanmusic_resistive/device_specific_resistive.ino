
//////////////////////////////
// DEVICE-SPECIFIC CONFIG VARS
// MULTIVALUE SETUP
const int DEVICE_NUM_MULTIVALUES = 1;

// sensor config vars - pins
int inputPin[] = {A2, A0, A1, A3, A4, A5}; // Flex Sensor is connected to this pin

// END DEVICE-SPECIFIC CONFIG VARS
//////////////////////////////


////////////////////////////////////////////////////
/////////////////////////////
// DEVICE SPECIFIC FUNCTIONS

// sensor_setup 
void sensor_setup_device(){
  // nothing device-specific to setup
}


// sensor_loop must:
// - set ADCRaw[vindex] with the read sensor value
// - set firstSense[vindex] to true
void sensor_loop(int vindex){

  // use capacative inputPin
  ADCRaw[vindex] = touchRead(inputPin[vindex]);
  //ADCRaw = analogRead(sensorPin);

  Serial.println("read value");
  Serial.println(ADCRaw[vindex]);

  firstSense[vindex] = true;   //MULTIVALUE UPDATE REQUIRED
  /*
  if(!no_network){
    sendOSCUDP(ADCRaw);
  }
  */
  // should be 10
  //delay(10); // removing when using timeouts
}
// END DEVICE SPECIFIC FUNCTIONS
/////////////////////////////

int get_num_multivalues(){
    return DEVICE_NUM_MULTIVALUES;
}
