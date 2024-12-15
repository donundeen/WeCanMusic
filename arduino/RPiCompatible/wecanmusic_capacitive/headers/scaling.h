/////////////////////////////
// Sensor scaling variables
float minVal[6] = {100000.0, 100000.0, 100000.0, 100000.0, 100000.0, 100000.0}; //
float maxVal[6] = {-1.0, -1.0, -1.0, -1.0, -1.0, -1.0};    //
float changeMin[6] = {10000.0, 10000.0, 10000.0, 10000.0, 10000.0, 10000.0};  //
float changeMax[6] = {-1.0, -1.0, -1.0, -1.0, -1.0, -1.0}; //


void reset_minmax(int vindex){  //
  minVal[vindex] = 100000.0; //
  maxVal[vindex] = -1.0;      //
  changeMin[vindex] = 10000.0;  //
  changeMax[vindex] = -1.0;     //
}

float floatmap(float in, float inmin, float inmax, float outmin, float outmax){
  // assume all values are 0-1
  float inrange = inmax - inmin;
  float outrange = outmax - outmin;
  float ratio = outrange / inrange;
  float inflat = in - inmin;
  float outflat = inflat * ratio;
  float out = outmin + outflat;
  return out;
}


float dyn_rescale(float inval, float *minVal, float *maxVal, float tomin, float tomax){
  char pbuf[100];
  if(inval < *minVal){
    *minVal = inval;
  }
  if(inval > *maxVal){
    *maxVal = inval;
  }

  float mapped = constrain(floatmap(inval, *minVal, *maxVal, tomin, tomax), tomin, tomax);
  sprintf(pbuf, "dyn: in:%f min:%f max:%f tomin:%f tomax:%f out:%f", inval, *minVal, *maxVal, tomin, tomax, mapped);
 // Serial.println(pbuf);
  if(mapped == -1){

  }
  return mapped;
}


