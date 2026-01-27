/////////////////////////////////
/// functions that handle sensor streaming
/// debounce, smoothing, downsample, quantize, and feature extraction

// Forward declarations for functions used before their definitions.
void sensor_loop();
void sensor_loop(int vindex);
void sensor_process_loop();
void post_sensor_sample(int vindex);
float update_debounced(int vindex, float raw, unsigned long now);
float update_smoothed(int vindex, float debounced);
void update_features(int vindex, float smoothed, unsigned long now);
float normalize_with_minmax(float val, float *minValPtr, float *maxValPtr);
int quantize_norm(float norm);
void sendSensorPacket(int vindex, int raw_q, int smooth_q, int rms_q, int peak_q, int vel_q);

void sensor_setup(){
  // Device-specific sensor init, then schedule sampling + network send loops.
  sensor_setup_device();
  t.setInterval(sensor_loop, sensor_loop_rate);

  // Downsample network send loop to a stable rate.
  int send_interval_ms = 10;
  if(sensor_send_rate_hz > 0){
    send_interval_ms = max(1, 1000 / sensor_send_rate_hz);
  }
  t.setInterval(sensor_process_loop, send_interval_ms);

  // Prime loops so first packet isn't delayed.
  sensor_loop();
  sensor_process_loop();
}

void sensor_loop(){
  // Read each sensor, then update debounce/smoothing/feature state.
  for(int vindex = 0 ; vindex < NUM_MULTIVALUES; vindex++){
    sensor_loop(vindex);
    post_sensor_sample(vindex);
  }
}

void post_sensor_sample(int vindex){
  if(!firstSense[vindex]){
    return;
  }
  // Use raw sample to update debounce, smoothing, and feature state.
  unsigned long now = millis();
  float raw = ADCRaw[vindex];

  float debounced = update_debounced(vindex, raw, now);
  float smoothed = update_smoothed(vindex, debounced);
  update_features(vindex, smoothed, now);
}

float update_debounced(int vindex, float raw, unsigned long now){
  // Basic debounce: accept new value if it changes enough or time has elapsed.
  if(debouncedVal[vindex] < 0){
    debouncedVal[vindex] = raw;
    lastDebounceTime[vindex] = now;
    return debouncedVal[vindex];
  }

  float diff = abs(raw - debouncedVal[vindex]);
  if(diff >= sensor_debounce_delta || (now - lastDebounceTime[vindex]) >= (unsigned long)sensor_debounce_ms){
    debouncedVal[vindex] = raw;
    lastDebounceTime[vindex] = now;
  }
  return debouncedVal[vindex];
}

float update_smoothed(int vindex, float debounced){
  // 1‑pole low‑pass (EMA) smoothing.
  if(smoothedVal[vindex] < 0){
    smoothedVal[vindex] = debounced;
    return smoothedVal[vindex];
  }
  smoothedVal[vindex] = smoothedVal[vindex] + sensor_ema_alpha * (debounced - smoothedVal[vindex]);
  return smoothedVal[vindex];
}

void update_features(int vindex, float smoothed, unsigned long now){
  // Accumulate windowed RMS and peak, plus a simple velocity estimate.
  rmsAccum[vindex] += smoothed * smoothed;
  rmsCount[vindex] += 1;

  float absval = abs(smoothed);
  if(absval > peakAbs[vindex]){
    peakAbs[vindex] = absval;
  }

  if(lastVelocityTime[vindex] == 0){
    lastVelocityTime[vindex] = now;
    lastVelocityRaw[vindex] = smoothed;
    velocityVal[vindex] = 0;
    return;
  }

  unsigned long dt = max((unsigned long)1, now - lastVelocityTime[vindex]);
  float delta = smoothed - lastVelocityRaw[vindex];
  // Velocity: absolute delta per millisecond.
  velocityVal[vindex] = abs(delta) / (float)dt;
  lastVelocityRaw[vindex] = smoothed;
  lastVelocityTime[vindex] = now;
}

void sensor_process_loop(){
  // Periodic network send loop: normalize, quantize, and ship features.
  for(int vindex = 0 ; vindex < NUM_MULTIVALUES; vindex++){
    if(!firstSense[vindex]){
      continue;
    }

    float raw = debouncedVal[vindex];
    float smoothed = smoothedVal[vindex];
    // Keep min/max dynamic for raw channel.
    float raw_norm = normalize_with_minmax(raw, &minVal[vindex], &maxVal[vindex]);

    float smoothed_norm = floatmap(smoothed, minVal[vindex], maxVal[vindex], 0.0, 1.0);
    smoothed_norm = constrain(smoothed_norm, 0.0, 1.0);

    float rms_raw = 0.0;
    if(rmsCount[vindex] > 0){
      rms_raw = sqrt(rmsAccum[vindex] / (float)rmsCount[vindex]);
    }
    float peak_raw = peakAbs[vindex];

    float rms_norm = floatmap(rms_raw, minVal[vindex], maxVal[vindex], 0.0, 1.0);
    rms_norm = constrain(rms_norm, 0.0, 1.0);

    float peak_norm = floatmap(peak_raw, minVal[vindex], maxVal[vindex], 0.0, 1.0);
    peak_norm = constrain(peak_norm, 0.0, 1.0);

    // Velocity gets its own dynamic scaling window.
    float vel_norm = dyn_rescale(velocityVal[vindex], &changeMin[vindex], &changeMax[vindex], 0.0, 1.0);
    vel_norm = constrain(vel_norm, 0.0, 1.0);

    int raw_q = quantize_norm(raw_norm);
    int smooth_q = quantize_norm(smoothed_norm);
    int rms_q = quantize_norm(rms_norm);
    int peak_q = quantize_norm(peak_norm);
    int vel_q = quantize_norm(vel_norm);

    // Ship quantized values over OSC.
    sendSensorPacket(vindex, raw_q, smooth_q, rms_q, peak_q, vel_q);

    // Reset windowed features after each send interval.
    rmsAccum[vindex] = 0;
    rmsCount[vindex] = 0;
    peakAbs[vindex] = 0;
  }
}

float normalize_with_minmax(float val, float *minValPtr, float *maxValPtr){
  // Dynamic min/max normalization to 0..1.
  return dyn_rescale(val, minValPtr, maxValPtr, 0.0, 1.0);
}

int quantize_norm(float norm){
  // Quantize normalized value to 12-bit or 16-bit integer range.
  norm = constrain(norm, 0.0, 1.0);
  if(sensor_quantize_bits <= 12){
    return (int)round(norm * 4095.0);
  }
  return (int)round(norm * 32767.0);
}
