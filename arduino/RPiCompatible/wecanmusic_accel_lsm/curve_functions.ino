

//////////////////////////////
// CURVE VARIABLES
// initial velocity curve is a straight line, extra -1.0 variables are for when we want to make it longer
//float velocitycurve[] = {0., 0.0, 0., 1.0, 1.0, 0.0, -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 };
float velocitycurve[][42] = {
  {0., 0., 0., 1., 1., -0.65, 1., 1., -0.65, -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 },
  {0., 0., 0., 1., 1., -0.65, 1., 1., -0.65, -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 },
  {0., 0., 0., 1., 1., -0.65, 1., 1., -0.65, -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 },
  {0., 0., 0., 1., 1., -0.65, 1., 1., -0.65, -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 },
  {0., 0., 0., 1., 1., -0.65, 1., 1., -0.65, -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 },
  {0., 0., 0., 1., 1., -0.65, 1., 1., -0.65, -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 }
};
float velocitycurvelength[] = {6,6,6,6,6,6}; 
String velocitycurvename[6] = {"curve_logup","curve_logup","curve_logup","curve_logup","curve_logup","curve_logup"};

// a collection of useful curves:
float curve_str8up[]       = {0., 0., 0., 1., 1., 0.};
float curve_str8dn[]       = {0., 1., 0., 1., 0., 0.};
float curve_logup[]        = {0., 0., 0., 1., 1., -0.65};
float curve_logdn[]        = {0., 1., 0., 1., 0., -0.65}; // not sure if this is right
float curve_expup[]        = {0., 0., 0., 1., 1., 0.65};
float curve_expdn[]        = {0., 1., 0., 1., 0., 0.65}; // not sure if this is right
float curve_str8upthresh[] = {0., 0., 0., 0.05, 0., 0., 1., 1., 0.};
float curve_str8dnthresh[] = {0., 1., 0., 0.95, 0., 0., 1., 0., 0., 1., 0., 0.};
float curve_logupthresh[]  = {0., 0., 0., 0.05, 0., 0., 1., 1., -0.65};
float curve_logdnthresh[]  = {0., 1., 0., 0.95, 0., -0.65, 1., 0., -0.65};
// END CURVE VARIABLES
//////////////////////////////

//////////////////////////////////////
// CURVE FUNCTIONS


float functioncurve(float x, float curvelist[] , int length){
  // where is x in the curvelist?
  int xindex = 0;
  while(xindex < length){
    float curx = curvelist[xindex];
    float nextx = curvelist[xindex + 3];
    if(x >= curx && x <= nextx ){
      break;
    }
    xindex = xindex + 3;
  }
  float minx = curvelist[xindex];
  float maxx = curvelist[xindex + 3];
  float miny = curvelist[xindex+1];
  float maxy = curvelist[xindex + 4];
  float curve = curvelist[xindex + 5];
  if(x == minx){
    return miny;
  }
  if(x == maxx){
    return maxy;
  }
  return curvescale(x, minx, maxx, miny, maxy, curve);

}

float curvescale(float x , float inmin, float inmax, float outmin, float outmax, float curve ){
  // treat input and output like it's scaled 0-1, then do the curve on it, then scale back to the output scaling
  float inscaled = floatmap(x, inmin, inmax, 0.0, 1.0);
  float outscaled = inscaled;
  if(curve < 0){
    outscaled = logscale(inscaled, curve);
  }else if (curve > 0){
    outscaled = expscale(inscaled, curve);
  }
  outscaled = floatmap(outscaled, 0.0, 1.0, outmin, outmax);
  return outscaled;
}



float e = 2.71828; 
float logscale(float x, float curve){
  // assume input is 0-1.0
  float innerpow = (1 / (1+curve)) - 1;
  float pow1 =  pow(e, -1 * x * innerpow) ;
  float pow2 = pow(e, -1 * innerpow);
  float y = (1 - pow1) / (1 - pow2 );  
  return y;
}

float expscale(float x, float curve){
  // assume input is 0-1.0
  float innerpow = (1 / (1-curve)) - 1;
  float pow1 =  pow(e, x * innerpow) ;
  float pow2 = pow(e, innerpow);
  float y = (1 - pow1) / (1 - pow2 );  
  return y;
}


