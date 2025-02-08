/////////////////////////////////
/// functions that handle playing music
/// things like timing, changerate tracking, mapping/scaling sensor data, etc, 

void sensor_setup(){
  sensor_setup_device();
  t.setInterval(sensor_loop, sensor_loop_rate);
  sensor_loop();
//  t.setInterval(changerate_loop, 100);
  changerate_loop();
  note_loop();
}


void note_loop(){
  for (int i = 0 ; i < NUM_MULTIVALUES; i++){
    note_loop(i);
  }

  int rand_notelength = notelength_assortment[random(8)];
//  int note_timeout = pulseToMS(notelengths[rand_notelength]);
  int note_timeout = derive_next_note_time();
  Serial.print("noteloop Rate: ");
  Serial.println(note_timeout);
//  t.setTimeout(note_loop, notelengths[noteloop_rate[0]]); // but changing the mididuration in this function could make notes overlap, so creeat space between notes. Or we make this a sensor-controlled variable as well
  t.setTimeout(note_loop, note_timeout); // but changing the mididuration in this function could make notes overlap, so creeat space between notes. Or we make this a sensor-controlled variable as well
//pulseToMS(notelengths[midi_notelength]);
}

void note_loop(int vindex){
  if(!firstSense[vindex]){   //
    // sensor hasn't sensed yet, skip this
    return;
  }
  changerate_loop(vindex);  //
  char pbuf[100];
//  sprintf(pbuf, "looppre: in:%d  min %f max %f", ADCRaw[vindex], minVal[vindex], maxVal[vindex]);
//  Serial.println(pbuf);
  float value = dyn_rescale(ADCRaw[vindex], &minVal[vindex], &maxVal[vindex], 0.0, 1.0);  //
 // sprintf(pbuf, "loop: in:%d scaled:%f min %f max %f", ADCRaw, value, minVal, maxVal);
//  Serial.println(pbuf);
  int midipitch    = derive_pitch(vindex, value);  //
  int midivelocity = derive_velocity(vindex, ADCRaw[vindex]);  //
  int mididuration = derive_duration(vindex, value);    //
  sprintf(pbuf, "      in:%d scaled:%f p:%d v:%d d:%d", ADCRaw[vindex], value, midipitch, midivelocity, mididuration);
//  Serial.println(pbuf);
  // this will also make it monophonic:
  if(midipitch == 0 || midivelocity == 0 || mididuration == 0){
    return;
  }
  if(localSynth){
    midiMakeNote(vindex, midipitch, midivelocity, mididuration);  //
  }else{
    sendMakeNote(vindex, midipitch, midivelocity, mididuration);  //
  }
}

void sensor_loop(){
  for(int vindex = 0 ; vindex < NUM_MULTIVALUES; vindex++){
    sensor_loop(vindex);
  }
}

void changerate_loop(){
  for(int i = 0; i<NUM_MULTIVALUES; i++){
    changerate_loop(i);
  }
}

void changerate_loop(int vindex){   //
  changerate[vindex] = get_changerate(vindex, ADCRaw[vindex]);  //
}

float get_changerate(int vindex, int ival){   //
  float val = (float)ival;  //
  char pbuf[100];
  int millisr = millis();

  if(prevChangeVal[vindex] == -1){ //
    prevChangeVal[vindex] = val;    //
    prevChangeTime[vindex] = millisr; //
    return 0;
  }

  float ochange = val - prevChangeVal[vindex]; //
  if(ochange == 0){
    return 0;
  }
  int millisd = millisr - prevChangeTime[vindex];   //
  ochange = abs(ochange);
  // divide the change amoutn by the timeframe, so chnages in shorter timeframes count for me.
  ochange = ochange / (float)millisd; 
  float change = dyn_rescale(ochange, &changeMin[vindex], &changeMax[vindex], 0, 1.0);

  // readjust changemin and max based on elasticMinMaxScale
  changeMin[vindex] = changeMin[vindex] + (changeMin[vindex] * elasticMinMaxScale); //
  changeMax[vindex] = changeMax[vindex] - (changeMax[vindex] * elasticMinMaxScale); //

 // Serial.println(pbuf);
  prevChangeVal[vindex] = val;          //
  prevChangeTime[vindex] = millisr;     //
  sprintf(pbuf, "changerate v: %.4f pv: %.4f oc:%.4f c:%.4f minc:%.4f maxc:%.4f", val, prevChangeVal[vindex], ochange, change, changeMin[vindex], changeMax[vindex]);
  //Serial.println(pbuf);
  return change;

}

int derive_pitch(int vindex, float val){   //
  int pitch = noteFromFloat(vindex, val, midimin[vindex], midimax[vindex]);  //
  return pitch;
}

int derive_velocity(int vindex, int val){   //
  int velocity = floor(127.0 * functioncurve(changerate[vindex], velocitycurve[vindex], velocitycurvelength[vindex]));  //
  // intergrate more clever ways of handling volume. peaks? bounce? etc? 
//  velocity = velocity * abs(peaks[vindex]);
  return velocity;

}


int derive_duration(int vindex, float val){  //

 // return pulseToMS(DEFAULT_NOTELENGTH);

  // midi_notelength is an index to a notelength in the array notelengths. 
  // this way if the bpm changes, the notelength changes too 
  // (though we don't actually have code to change bpm on the device )
  return pulseToMS(notelengths[midi_notelength[vindex]]);
//  return pulseToMS(N16);
/*
  unsigned long raw_duration = updateLastNoteTime();
  int duration = quantizeToNoteLength(raw_duration);
  return duration;
*/
}

// return the time from this note to the next note being calculated and triggered.
int derive_next_note_time(){
 //return pulseToMS(notelengths[midi_notelength[0]]  
  return pulseToMS(DEFAULT_NOTELENGTH);
}


unsigned long millisecs = millis();
unsigned long lastNoteTime[6] = {millisecs,millisecs,millisecs,millisecs,millisecs,millisecs};  //
unsigned long updateLastNoteTime(int vindex){  //
  unsigned long now = millis();
  unsigned long raw_duration = now - lastNoteTime[vindex];  //
  lastNoteTime[vindex] = now;   //
  return raw_duration;
}

int quantizeToNoteLength(unsigned long val){
//  int notelengths[] = {DWN, WN, HN, HN3, QN, QN3, N8, N83, N16};
  if(val < ((unsigned long)pulseToMS(N16) +(unsigned long)pulseToMS(N83) ) /  2.0 ){
    return pulseToMS(N16);
  }
  if(val < ((unsigned long)pulseToMS(N83) +(unsigned long)pulseToMS(N8) ) /  2.0 ){
    return pulseToMS(N83);
  }
  if(val < ((unsigned long)pulseToMS(N8) +(unsigned long)pulseToMS(QN3) ) /  2.0 ){
    return pulseToMS(N8);
  }
  if(val < ((unsigned long)pulseToMS(QN3) +(unsigned long)pulseToMS(QN) ) /  2.0 ){
    return pulseToMS(QN3);
  }
  if(val < ((unsigned long)pulseToMS(QN) +(unsigned long)pulseToMS(HN3) ) /  2.0 ){
    return pulseToMS(QN);
  }
  if(val < ((unsigned long)pulseToMS(HN3) +(unsigned long)pulseToMS(HN) ) /  2.0 ){
    return pulseToMS(HN3);
  }
  if(val < ((unsigned long)pulseToMS(HN) +(unsigned long)pulseToMS(WN) ) /  2.0 ){
    return pulseToMS(HN);
  }
  if(val < ((unsigned long)pulseToMS(WN) +(unsigned long)pulseToMS(DWN) ) /  2.0 ){
    return pulseToMS(WN);
  }
  return pulseToMS(DWN);

}

