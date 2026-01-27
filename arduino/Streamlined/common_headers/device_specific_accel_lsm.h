#pragma once

#include "device_config.h"

////////////////////////////////////
// SENSOR INCLUDES
//gyro code:
// * LSM6DSOX + LIS3MDL FeatherWing : https://www.adafruit.com/product/4565
// * ISM330DHCX + LIS3MDL FeatherWing https://www.adafruit.com/product/4569
// * LSM6DSOX + LIS3MDL Breakout : https://www.adafruit.com/product/4517
// * LSM6DS33 + LIS3MDL Breakout Lhttps://www.adafruit.com/product/4485
// see here: https://learn.adafruit.com/st-9-dof-combo/ard/Users/donundeen/Downloads/TCS3200D/color/color.pdeuino 
/*
 * Libraries to install (include dependencies)
 * OSC
 * Adafruit LSM6DS 
 * Adafruit LIS3MDL
 * AutoConnect (see https://hieromon.github.io/AutoConnect/#installation)
 * 
 */
// SENSOR LIBS/Users/donundeen/Downloads/TCS3200D/TCS3200D/TCS3200D.pde
#include <Adafruit_LSM6DSOX.h>
#include <Adafruit_LIS3MDL.h>
// END SENSOR INCLUDES  
/////////////////////////////////////////
#include <PeakDetection.h> // import peak/bounce detection lib, install fromhttps://github.com/leandcesar/PeakDetection

PeakDetection peakDetections_lsm[6]; 


////////////////////////////////
// SENSOR OBJECT CREATION
//Adafruit_LSM6DSOX lsm6ds_lsm;
Adafruit_LSM6DSOX lsm6ds_lsm;
Adafruit_LIS3MDL lis3mdl_lsm;
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
const int LSM_GYROX = 1;
const int LSM_GYROY = 2;
const int LSM_GYROZ = 3;
const int LSM_ACCELX = 4;
const int LSM_ACCELY = 5;
const int LSM_ACCELZ = 6;
const int LSM_MAGX = 7;
const int LSM_MAGY = 8;
const int LSM_MAGZ = 9;
int AccelPitchVal_lsm[6] = {LSM_GYROX, LSM_GYROY, LSM_GYROZ, LSM_ACCELX, LSM_ACCELY, LSM_ACCELZ}; 
//int AccelPitchVal_lsm[6] = {LSM_MAGX, LSM_MAGY, LSM_MAGZ, LSM_ACCELX, LSM_ACCELY, LSM_ACCELZ}; 


////////////////////////////////////////////////////
/////////////////////////////
// DEVICE SPECIFIC FUNCTIONS
void peak_setup_lsm(){
  for(int vindex = 0; vindex < NUM_MULTIVALUES; vindex++){  
//  peakDetections_lsm[vindex].begin(32, 4, 0.3);               // sets the lag, threshold and influence
    peakDetections_lsm[vindex].begin(48, 3, 0.4);               // sets the lag, threshold and influence
  }
}


void sensor_setup_device_lsm(){

  delay(1000);
  Serial.println("setup");

 // peak_setup();

  pinMode(BUILTIN_LED, OUTPUT);

  // gyro/accel stuff
  bool lsm6ds_success, lis3mdl_success;

  // hardware I2C mode, can pass in address & alt Wire

  lsm6ds_success = lsm6ds_lsm.begin_I2C();
  lis3mdl_success = lis3mdl_lsm.begin_I2C();

  if (!lsm6ds_success){
    Serial.println("Failed to find LSM6DS chip");
  }
  if (!lis3mdl_success){
    Serial.println("Failed to find LIS3MDL chip");
  }
  if (!(lsm6ds_success && lis3mdl_success)) {
    while (1) {
      delay(10);
    }
  }

  Serial.println("LSM6DS and LIS3MDL Found!");

  // lsm6ds_lsm.setAccelRange(LSM6DS_ACCEL_RANGE_2_G);
  Serial.print("Accelerometer range set to: ");
  switch (lsm6ds_lsm.getAccelRange()) {
  case LSM6DS_ACCEL_RANGE_2_G:
    Serial.println("+-2G");
    break;
  case LSM6DS_ACCEL_RANGE_4_G:
    Serial.println("+-4G");
    break;
  case LSM6DS_ACCEL_RANGE_8_G:
    Serial.println("+-8G");
    break;
  case LSM6DS_ACCEL_RANGE_16_G:
    Serial.println("+-16G");
    break;
  }

  // lsm6ds_lsm.setAccelDataRate(LSM6DS_RATE_12_5_HZ);
  Serial.print("Accelerometer data rate set to: ");
  switch (lsm6ds_lsm.getAccelDataRate()) {
  case LSM6DS_RATE_SHUTDOWN:
    Serial.println("0 Hz");
    break;
  case LSM6DS_RATE_12_5_HZ:
    Serial.println("12.5 Hz");
    break;
  case LSM6DS_RATE_26_HZ:
    Serial.println("26 Hz");
    break;
  case LSM6DS_RATE_52_HZ:
    Serial.println("52 Hz");
    break;
  case LSM6DS_RATE_104_HZ:
    Serial.println("104 Hz");
    break;
  case LSM6DS_RATE_208_HZ:
    Serial.println("208 Hz");
    break;
  case LSM6DS_RATE_416_HZ:
    Serial.println("416 Hz");
    break;
  case LSM6DS_RATE_833_HZ:
    Serial.println("833 Hz");
    break;
  case LSM6DS_RATE_1_66K_HZ:
    Serial.println("1.66 KHz");
    break;
  case LSM6DS_RATE_3_33K_HZ:
    Serial.println("3.33 KHz");
    break;
  case LSM6DS_RATE_6_66K_HZ:
    Serial.println("6.66 KHz");
    break;
  }

  // lsm6ds_lsm.setGyroRange(LSM6DS_GYRO_RANGE_250_DPS );
  Serial.print("Gyro range set to: ");
  switch (lsm6ds_lsm.getGyroRange()) {
  case LSM6DS_GYRO_RANGE_125_DPS:
    Serial.println("125 degrees/s");
    break;
  case LSM6DS_GYRO_RANGE_250_DPS:
    Serial.println("250 degrees/s");
    break;
  case LSM6DS_GYRO_RANGE_500_DPS:
    Serial.println("500 degrees/s");
    break;
  case LSM6DS_GYRO_RANGE_1000_DPS:
    Serial.println("1000 degrees/s");
    break;
  case LSM6DS_GYRO_RANGE_2000_DPS:
    Serial.println("2000 degrees/s");
    break;
  case ISM330DHCX_GYRO_RANGE_4000_DPS:
    Serial.println("4000 degrees/s");
    break;
  }
  // lsm6ds_lsm.setGyroDataRate(LSM6DS_RATE_12_5_HZ);
  Serial.print("Gyro data rate set to: ");
  switch (lsm6ds_lsm.getGyroDataRate()) {
  case LSM6DS_RATE_SHUTDOWN:
    Serial.println("0 Hz");
    break;
  case LSM6DS_RATE_12_5_HZ:
    Serial.println("12.5 Hz");
    break;
  case LSM6DS_RATE_26_HZ:
    Serial.println("26 Hz");
    break;
  case LSM6DS_RATE_52_HZ:
    Serial.println("52 Hz");
    break;
  case LSM6DS_RATE_104_HZ:
    Serial.println("104 Hz");
    break;
  case LSM6DS_RATE_208_HZ:
    Serial.println("208 Hz");
    break;
  case LSM6DS_RATE_416_HZ:
    Serial.println("416 Hz");
    break;
  case LSM6DS_RATE_833_HZ:
    Serial.println("833 Hz");
    break;
  case LSM6DS_RATE_1_66K_HZ:
    Serial.println("1.66 KHz");
    break;
  case LSM6DS_RATE_3_33K_HZ:
    Serial.println("3.33 KHz");
    break;
  case LSM6DS_RATE_6_66K_HZ:
    Serial.println("6.66 KHz");
    break;
  }

  lis3mdl_lsm.setDataRate(LIS3MDL_DATARATE_155_HZ);
  // You can check the datarate by looking at the frequency of the DRDY pin
  Serial.print("Magnetometer data rate set to: ");
  switch (lis3mdl_lsm.getDataRate()) {
    case LIS3MDL_DATARATE_0_625_HZ: Serial.println("0.625 Hz"); break;
    case LIS3MDL_DATARATE_1_25_HZ: Serial.println("1.25 Hz"); break;
    case LIS3MDL_DATARATE_2_5_HZ: Serial.println("2.5 Hz"); break;
    case LIS3MDL_DATARATE_5_HZ: Serial.println("5 Hz"); break;
    case LIS3MDL_DATARATE_10_HZ: Serial.println("10 Hz"); break;
    case LIS3MDL_DATARATE_20_HZ: Serial.println("20 Hz"); break;
    case LIS3MDL_DATARATE_40_HZ: Serial.println("40 Hz"); break;
    case LIS3MDL_DATARATE_80_HZ: Serial.println("80 Hz"); break;
    case LIS3MDL_DATARATE_155_HZ: Serial.println("155 Hz"); break;
    case LIS3MDL_DATARATE_300_HZ: Serial.println("300 Hz"); break;
    case LIS3MDL_DATARATE_560_HZ: Serial.println("560 Hz"); break;
    case LIS3MDL_DATARATE_1000_HZ: Serial.println("1000 Hz"); break;
  }

  lis3mdl_lsm.setRange(LIS3MDL_RANGE_4_GAUSS);
  Serial.print("Range set to: ");
  switch (lis3mdl_lsm.getRange()) {
    case LIS3MDL_RANGE_4_GAUSS: Serial.println("+-4 gauss"); break;
    case LIS3MDL_RANGE_8_GAUSS: Serial.println("+-8 gauss"); break;
    case LIS3MDL_RANGE_12_GAUSS: Serial.println("+-12 gauss"); break;
    case LIS3MDL_RANGE_16_GAUSS: Serial.println("+-16 gauss"); break;
  }

  lis3mdl_lsm.setPerformanceMode(LIS3MDL_MEDIUMMODE);
  Serial.print("Magnetometer performance mode set to: ");
  switch (lis3mdl_lsm.getPerformanceMode()) {
    case LIS3MDL_LOWPOWERMODE: Serial.println("Low"); break;
    case LIS3MDL_MEDIUMMODE: Serial.println("Medium"); break;
    case LIS3MDL_HIGHMODE: Serial.println("High"); break;
    case LIS3MDL_ULTRAHIGHMODE: Serial.println("Ultra-High"); break;
  }

  lis3mdl_lsm.setOperationMode(LIS3MDL_CONTINUOUSMODE);
  Serial.print("Magnetometer operation mode set to: ");
  // Single shot mode will complete conversion and go into power down
  switch (lis3mdl_lsm.getOperationMode()) {
    case LIS3MDL_CONTINUOUSMODE: Serial.println("Continuous"); break;
    case LIS3MDL_SINGLEMODE: Serial.println("Single mode"); break;
    case LIS3MDL_POWERDOWNMODE: Serial.println("Power-down"); break;
  }

  lis3mdl_lsm.setIntThreshold(500);
  lis3mdl_lsm.configInterrupt(false, false, true, // enable z axis
                          true, // polarity
                          false, // don't latch
                          true); // enabled!
}

// sensor_loop must:
// - set ADCRaw[vindex] with the read sensor value
// - set firstSense[vindex] to true

void sensor_loop_lsm(int vindex){

  sensors_event_t accel, gyro, mag, temp;

  //  /* Get new normalized sensor events */
  lsm6ds_lsm.getEvent(&accel, &gyro, &temp);
  lis3mdl_lsm.getEvent(&mag);

  /* Display the results (acceleration is measured in m/s^2) */
  /*
  Serial.print("\t\tAccel X: ");
  Serial.print(accel.acceleration.x, 4);
  Serial.print(" \tY: ");
  Serial.print(accel.acceleration.y, 4);
  Serial.print(" \tZ: ");
  Serial.print(accel.acceleration.z, 4);
  Serial.println(" \tm/s^2 ");
  */

  /* Display the results (rotation is measured in rad/s) */
  /*
  Serial.print("\t\tGyro  X: ");
  Serial.print(gyro.gyro.x, 4);
  Serial.print(" \tY: ");
  Serial.print(gyro.gyro.y, 4);
  Serial.print(" \tZ: ");
  Serial.print(gyro.gyro.z, 4);
  Serial.println(" \tradians/s ");
  */
 /* Display the results (magnetic field is measured in uTesla) */
 /*
  Serial.print(" \t\tMag   X: ");
  Serial.print(mag.magnetic.x, 4);
  Serial.print(" \tY: ");
  Serial.print(mag.magnetic.y, 4);
  Serial.print(" \tZ: ");
  Serial.print(mag.magnetic.z, 4);
  Serial.println(" \tuTesla ");
  */

//  sendOSCUDP(gyro.gyro.x, gyro.gyro.y, gyro.gyro.z, accel.acceleration.x, accel.acceleration.y, accel.acceleration.z, mag.magnetic.x,mag.magnetic.y,mag.magnetic.z, sensorVal);

  switch(AccelPitchVal_lsm[vindex]){  //MULTIVALUE UPDATE REQUIRED
    case LSM_GYROX:
      ADCRaw[vindex] = gyro.gyro.x;
      break;
    case LSM_GYROY:
      ADCRaw[vindex] = gyro.gyro.y;
      break;
    case LSM_GYROZ:
      ADCRaw[vindex] = gyro.gyro.z;
      break;
    case LSM_ACCELX:
      ADCRaw[vindex] = accel.acceleration.x;
      break;
    case LSM_ACCELY:
      ADCRaw[vindex] = accel.acceleration.y;
      break;      
    case LSM_ACCELZ:
      ADCRaw[vindex] = accel.acceleration.z;
      break;
    case LSM_MAGX:
      ADCRaw[vindex] = mag.magnetic.x;
      break;
    case LSM_MAGY:
      ADCRaw[vindex] = mag.magnetic.y;
      break;            
    case LSM_MAGZ:
      ADCRaw[vindex] = mag.magnetic.z;
      break;               
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

void peak_loop_lsm(int vindex){
  // peak detection
  peakDetections_lsm[vindex].add(ADCRaw[vindex]);           // adds a new data point
  peaks[vindex] = peakDetections_lsm[vindex].getPeak();  
  /*        // 0, 1 or -1
  if(peaks[vindex] == prevpeaks[vindex]){
    prevpeaks[vindex] = peaks[vindex];
    peaks[vindex] = 0;
  }else{
    prevpeaks[vindex] = peaks[vindex];
  }
  */
  double filtered = peakDetections_lsm[vindex].getFilt();   // moving average
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



int get_num_multivalues_lsm(){
    return 3;
}
