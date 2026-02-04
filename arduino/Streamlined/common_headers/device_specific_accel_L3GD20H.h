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
#include <Adafruit_Sensor.h>
#include <Adafruit_L3GD20_U.h>


// END SENSOR INCLUDES  
/////////////////////////////////////////
#include <PeakDetection.h> // import peak/bounce detection lib

PeakDetection peakDetections_l3gd20h[6]; 


////////////////////////////////
// SENSOR OBJECT CREATION
/* Assign a unique ID to this sensor at the same time */
Adafruit_L3GD20_Unified gyro_l3gd20h = Adafruit_L3GD20_Unified(20);
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
const int L3GD20H_GYROX = 1;
const int L3GD20H_GYROY = 2;
const int L3GD20H_GYROZ = 3;
const int L3GD20H_ACCELX = 4;
const int L3GD20H_ACCELY = 5;
const int L3GD20H_ACCELZ = 6;
const int L3GD20H_MAGX = 7;
const int L3GD20H_MAGY = 8;
const int L3GD20H_MAGZ = 9;
int AccelPitchVal_l3gd20h[6] = {L3GD20H_GYROX, L3GD20H_GYROY, L3GD20H_GYROZ, L3GD20H_ACCELX, L3GD20H_ACCELY, L3GD20H_ACCELZ}; 
//int AccelPitchVal_l3gd20h[6] = {L3GD20H_MAGX, L3GD20H_MAGY, L3GD20H_MAGZ, L3GD20H_ACCELX, L3GD20H_ACCELY, L3GD20H_ACCELZ}; 


////////////////////////////////////////////////////
/////////////////////////////
// DEVICE SPECIFIC FUNCTIONS
void displaySensorDetails_l3gd20h(void);

void peak_setup_l3gd20h(){
  for(int vindex = 0; vindex < NUM_MULTIVALUES; vindex++){  
//  peakDetections_l3gd20h[vindex].begin(32, 4, 0.3);               // sets the lag, threshold and influence
    peakDetections_l3gd20h[vindex].begin(48, 3, 0.4);               // sets the lag, threshold and influence
  }
}


void sensor_setup_device_l3gd20h(){

  delay(1000);
  Serial.println("setup");

 // peak_setup();

  pinMode(BUILTIN_LED, OUTPUT);

  /* Enable auto-ranging */
  gyro_l3gd20h.enableAutoRange(true);
  
  /* Initialise the sensor */
  if(!gyro_l3gd20h.begin())
  {
    /* There was a problem detecting the L3GD20 ... check your connections */
    Serial.println("Ooops, no L3GD20 detected ... Check your wiring!");
    while(1);
  }

  /* Display some basic information on this sensor */
  displaySensorDetails_l3gd20h();  
}


void displaySensorDetails_l3gd20h(void)
{
  sensor_t sensor;
  gyro_l3gd20h.getSensor(&sensor);
  Serial.println("------------------------------------");
  Serial.print  ("Sensor:       "); Serial.println(sensor.name);
  Serial.print  ("Driver Ver:   "); Serial.println(sensor.version);
  Serial.print  ("Unique ID:    "); Serial.println(sensor.sensor_id);
  Serial.print  ("Max Value:    "); Serial.print(sensor.max_value); Serial.println(" rad/s");
  Serial.print  ("Min Value:    "); Serial.print(sensor.min_value); Serial.println(" rad/s");
  Serial.print  ("Resolution:   "); Serial.print(sensor.resolution); Serial.println(" rad/s");  
  Serial.println("------------------------------------");
  Serial.println("");
  delay(500);
}

// sensor_loop must:
// - set ADCRaw[vindex] with the read sensor value
// - set firstSense[vindex] to true

void sensor_loop_l3gd20h(int vindex){

  sensors_event_t event; 
  gyro_l3gd20h.getEvent(&event);
 
//  sendOSCUDP(gyro.gyro.x, gyro.gyro.y, gyro.gyro.z, accel.acceleration.x, accel.acceleration.y, accel.acceleration.z, mag.magnetic.x,mag.magnetic.y,mag.magnetic.z, sensorVal);

  float val = 0.0f;
  switch(AccelPitchVal_l3gd20h[vindex]){  //MULTIVALUE UPDATE REQUIRED
    case L3GD20H_GYROX:
      val = event.gyro.x;
      break;
    case L3GD20H_GYROY:
      val = event.gyro.y;
      break;
    case L3GD20H_GYROZ:
      val = event.gyro.z;
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

void peak_loop_l3gd20h(int vindex){
  // peak detection
  peakDetections_l3gd20h[vindex].add(ADCRaw[vindex]);           // adds a new data point
  peaks[vindex] = peakDetections_l3gd20h[vindex].getPeak();  
  /*        // 0, 1 or -1
  if(peaks[vindex] == prevpeaks[vindex]){
    prevpeaks[vindex] = peaks[vindex];
    peaks[vindex] = 0;
  }else{
    prevpeaks[vindex] = peaks[vindex];
  }
  */
  double filtered = peakDetections_l3gd20h[vindex].getFilt();   // moving average
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



int get_num_multivalues_l3gd20h(){
    return 3;
}
