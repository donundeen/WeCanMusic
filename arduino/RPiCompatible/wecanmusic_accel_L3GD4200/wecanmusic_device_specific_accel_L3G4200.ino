
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

PeakDetection peakDetections[6]; 


////////////////////////////////
// SENSOR OBJECT CREATION
/* Assign a unique ID to this sensor at the same time */
L3G gyro;
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
const int _GYROX = 1;
const int _GYROY = 2;
const int _GYROZ = 3;
const int _ACCELX = 4;
const int _ACCELY = 5;
const int _ACCELZ = 6;
const int _MAGX = 7;
const int _MAGY = 8;
const int _MAGZ = 9;
int AccelPitchVal[6] = {_GYROX, _GYROY, _GYROZ, _ACCELX, _ACCELY, _ACCELZ}; 
//int AccelPitchVal[6] = {_MAGX, _MAGY, _MAGZ, _ACCELX, _ACCELY, _ACCELZ}; 


////////////////////////////////////////////////////
/////////////////////////////
// DEVICE SPECIFIC FUNCTIONS
void peak_setup(){
  for(int vindex = 0; vindex < NUM_MULTIVALUES; vindex++){  
//  peakDetections[vindex].begin(32, 4, 0.3);               // sets the lag, threshold and influence
    peakDetections[vindex].begin(48, 3, 0.4);               // sets the lag, threshold and influence
  }
}


void sensor_setup_device(){

  delay(1000);
  Serial.println("setup");

 // peak_setup();

  pinMode(BUILTIN_LED, OUTPUT);


  Wire.begin();
  /* Initialise the sensor */
  if (!gyro.init(L3G::deviceType::device_4200D))
  {
    /* There was a problem detecting the L3GD20 ... check your connections */
    Serial.println("Ooops, no L3GD42000 detected ... Check your wiring!");
    while(1);
  }
  gyro.enableDefault();

  /* Display some basic information on this sensor */
}




// sensor_loop must:
// - set ADCRaw[vindex] with the read sensor value
// - set firstSense[vindex] to true

void sensor_loop(int vindex){

  gyro.read();
//  sendOSCUDP(gyro.gyro.x, gyro.gyro.y, gyro.gyro.z, accel.acceleration.x, accel.acceleration.y, accel.acceleration.z, mag.magnetic.x,mag.magnetic.y,mag.magnetic.z, sensorVal);

  switch(AccelPitchVal[vindex]){  //MULTIVALUE UPDATE REQUIRED
    case _GYROX:
      ADCRaw[vindex] = gyro.g.x;
      break;
    case _GYROY:
      ADCRaw[vindex] = gyro.g.y;
      break;
    case _GYROZ:
      ADCRaw[vindex] = gyro.g.z;
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

void peak_loop(int vindex){
  // peak detection
  peakDetections[vindex].add(ADCRaw[vindex]);           // adds a new data point
  peaks[vindex] = peakDetections[vindex].getPeak();  
  /*        // 0, 1 or -1
  if(peaks[vindex] == prevpeaks[vindex]){
    prevpeaks[vindex] = peaks[vindex];
    peaks[vindex] = 0;
  }else{
    prevpeaks[vindex] = peaks[vindex];
  }
  */
  double filtered = peakDetections[vindex].getFilt();   // moving average
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



int get_num_multivalues(){
    return NUM_MULTIVALUES;
}
