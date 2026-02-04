#pragma once

#include "device_config.h"

//////////////////////////////
// DEVICE-SPECIFIC CONFIG VARS
// MULTIVALUE SETUP

// sensor config vars - pins
// Just test touch pin - Touch0 is T0 which is on GPIO 4.
// using 32 - This is GPIO #32 and also an analog input A7 on ADC #1
int inputPin_resistive[] = {A2, A3, A4, A4, A5, A6}; // 
//int inputPin[] = {T0, T6, T9,T8,T4, T5}; //15;
//int inputPin[] = {T4, T6, T9,T8,T4, T5}; //15;
// t9 is pin 32
// T0 is A5

// END DEVICE-SPECIFIC CONFIG VARS
//////////////////////////////


////////////////////////////////////////////////////
/////////////////////////////
// DEVICE SPECIFIC FUNCTIONS
void sensor_setup_device_resistive(){
  // nothing device-specific to do here
}

// sensor_loop must:
// - set ADCRaw[vindex] with the read sensor value
// - set firstSense[vindex] to true
void sensor_loop_resistive(int vindex){
  float r = (float)analogRead(inputPin_resistive[vindex]);
  if(!IS_SENTINEL_RAW(r)){
    ADCRaw[vindex] = r;
  }
  firstSense[vindex] = true;   
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


int get_num_multivalues_resistive(){
    return 1;
}

