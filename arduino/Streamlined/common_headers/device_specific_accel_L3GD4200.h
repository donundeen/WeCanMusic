#pragma once

#include "device_config.h"

////////////////////////////////////
// SENSOR INCLUDES
//gyro code:
// https://www.adafruit.com/product/1032 
// https://github.com/adafruit/Adafruit_L3GD20_U 
/*
 * Libraries to install (include dependencies)
 * OSC
 * Adafruit  L3GD20_U
 * Adafruit_Sensor
 */

#include <Wire.h>
#include <L3G.h>


// END SENSOR INCLUDES  
/////////////////////////////////////////
#include <PeakDetection.h> // import peak/bounce detection lib

PeakDetection peakDetections_l3gd4200[6]; 


////////////////////////////////
// SENSOR OBJECT CREATION
/* Assign a unique ID to this sensor at the same time */
L3G gyro_l3gd4200;
// END OBJECT CREATION
///////////////////////

///////////////////////////
// DEVICE CONFIGS
// set the accelerometer value to use afor the pitch
// one of:
//    case "gyro.x":
//    case "gyro.y":
//    case "gyro.z":
//    case "accel.x":
//    case "accel.y":
//    case "accel.z":
//    case "mag.x":
//    case "mag.y":
//    case "mag.z":
const int L3GD4200_GYROX = 1;
const int L3GD4200_GYROY = 2;
const int L3GD4200_GYROZ = 3;
const int L3GD4200_ACCELX = 4;
const int L3GD4200_ACCELY = 5;
const int L3GD4200_ACCELZ = 6;
const int L3GD4200_MAGX = 7;
const int L3GD4200_MAGY = 8;
const int L3GD4200_MAGZ = 9;
int AccelPitchVal_l3gd4200[6] = {L3GD4200_GYROX, L3GD4200_GYROY, L3GD4200_GYROZ, L3GD4200_ACCELX, L3GD4200_ACCELY, L3GD4200_ACCELZ}; 
//int AccelPitchVal_l3gd4200[6] = {L3GD4200_MAGX, L3GD4200_MAGY, L3GD4200_MAGZ, L3GD4200_ACCELX, L3GD4200_ACCELY, L3GD4200_ACCELZ}; 


////////////////////////////////////////////////////
/////////////////////////////
// DEVICE SPECIFIC FUNCTIONS
void peak_setup_l3gd4200(){
  for(int vindex = 0; vindex < NUM_MULTIVALUES; vindex++){  
//  peakDetections_l3gd4200[vindex].begin(32, 4, 0.3);               // sets the lag, threshold and influence
    peakDetections_l3gd4200[vindex].begin(48, 3, 0.4);               // sets the lag, threshold and influence
  }
}


void sensor_setup_device_l3gd4200(){

  delay(1000);
  Serial.println("setup");

 // peak_setup();

  pinMode(BUILTIN_LED, OUTPUT);


  Wire.begin();
  /* Initialise the sensor */
  if (!gyro_l3gd4200.init(L3G::deviceType::device_4200D))
  {
    /* There was a problem detecting the L3GD20 ... check your connections */
    Serial.println("Ooops, no L3GD42000 detected ... Check your wiring!");
    while(1);
  }
  gyro_l3gd4200.enableDefault();

  /* Display some basic information on this sensor */
}




// sensor_loop must:
// - set ADCRaw[vindex] with the read sensor value
// - set firstSense[vindex] to true

void sensor_loop_l3gd4200(int vindex){

  gyro_l3gd4200.read();
//  sendOSCUDP(gyro.gyro.x, gyro.gyro.y, gyro.gyro.z, accel.acceleration.x, accel.acceleration.y, accel.acceleration.z, mag.magnetic.x,mag.magnetic.y,mag.magnetic.z, sensorVal);

  float val = 0.0f;
  switch(AccelPitchVal_l3gd4200[vindex]){  //MULTIVALUE UPDATE REQUIRED
    case L3GD4200_GYROX:
      val = gyro_l3gd4200.g.x;
      break;
    case L3GD4200_GYROY:
      val = gyro_l3gd4200.g.y;
      break;
    case L3GD4200_GYROZ:
      val = gyro_l3gd4200.g.z;
      break;
  }
  if(!IS_SENTINEL_RAW(val)){
    ADCRaw[vindex] = val;
  }
 // this is useful to see, but creates a lot of output that makes it hard to see other messages.
//  Serial.println("read value");
//  Serial.println(ADCRaw[vindex]);  //MULTIVALUE UPDATE REQUIRED


  firstSense[vindex] = true;   //MULTIVALUE UPDATE REQUIRED

  //peak_loop(vindex);
  /*
  if(!no_network){
    sendOSCUDP(ADCRaw);
  }
  */
  // should be 10
  //delay(10); // removing when using timeouts
}

void peak_loop_l3gd4200(int vindex){
  // peak detection
  peakDetections_l3gd4200[vindex].add(ADCRaw[vindex]);           // adds a new data point
  peaks[vindex] = peakDetections_l3gd4200[vindex].getPeak();  
  /*        // 0, 1 or -1
  if(peaks[vindex] == prevpeaks[vindex]){
    prevpeaks[vindex] = peaks[vindex];
    peaks[vindex] = 0;
  }else{
    prevpeaks[vindex] = peaks[vindex];
  }
  */
  double filtered = peakDetections_l3gd4200[vindex].getFilt();   // moving average
//  if(peaks[vindex] != 0){
    Serial.print(ADCRaw[vindex]);
    Serial.print(",");
    Serial.print(peaks[vindex]);                          // print peak status
    Serial.print(",");
    Serial.println(filtered);
  //}
//  ADCRaw[vindex] = ADCRaw[vindex] * (float)peak;
//  Serial.println(ADCRaw[vindex]);

}

// END DEVICE SPECIFIC FUNCTIONS
/////////////////////////////



int get_num_multivalues_l3gd4200(){
    return 3;
}
