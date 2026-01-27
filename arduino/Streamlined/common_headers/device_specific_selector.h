#pragma once

#include "device_config.h"

// Include all device-specific implementations so we can switch at runtime.
#include "device_specific_capacitive.h"
#include "device_specific_resistive.h"
#include "device_specific_accel_L3GD20H.h"
#include "device_specific_accel_L3GD4200.h"
#include "device_specific_accel_lsm.h"

// Read DIP switches (pullups) and map to device_type.
void init_device_type_from_dip(){
  if(!use_device_dip){
    return;
  }
  int dipValue = 0;
  for(int i = 0; i < device_dip_pin_count; i++){
    pinMode(device_dip_pins[i], INPUT_PULLUP);
  }
  for(int i = 0; i < device_dip_pin_count; i++){
    int bit = (digitalRead(device_dip_pins[i]) == LOW) ? 1 : 0;
    dipValue |= (bit << i);
  }
  // Map DIP bits to device_type (1..5). Fall back to compile-time default.
  if(dipValue >= DEVICE_CAPACITIVE && dipValue <= DEVICE_ACCEL_LSM){
    device_type = dipValue;
  }
}

void sensor_setup_device(){
  switch(device_type){
    case DEVICE_CAPACITIVE:
      sensor_setup_device_capacitive();
      break;
    case DEVICE_RESISTIVE:
      sensor_setup_device_resistive();
      break;
    case DEVICE_ACCEL_L3GD20H:
      sensor_setup_device_l3gd20h();
      break;
    case DEVICE_ACCEL_L3GD4200:
      sensor_setup_device_l3gd4200();
      break;
    case DEVICE_ACCEL_LSM:
      sensor_setup_device_lsm();
      break;
    default:
      sensor_setup_device_capacitive();
      break;
  }
}

void sensor_loop(int vindex){
  switch(device_type){
    case DEVICE_CAPACITIVE:
      sensor_loop_capacitive(vindex);
      break;
    case DEVICE_RESISTIVE:
      sensor_loop_resistive(vindex);
      break;
    case DEVICE_ACCEL_L3GD20H:
      sensor_loop_l3gd20h(vindex);
      break;
    case DEVICE_ACCEL_L3GD4200:
      sensor_loop_l3gd4200(vindex);
      break;
    case DEVICE_ACCEL_LSM:
      sensor_loop_lsm(vindex);
      break;
    default:
      sensor_loop_capacitive(vindex);
      break;
  }
}

int get_num_multivalues(){
  switch(device_type){
    case DEVICE_CAPACITIVE:
      return get_num_multivalues_capacitive();
    case DEVICE_RESISTIVE:
      return get_num_multivalues_resistive();
    case DEVICE_ACCEL_L3GD20H:
      return get_num_multivalues_l3gd20h();
    case DEVICE_ACCEL_L3GD4200:
      return get_num_multivalues_l3gd4200();
    case DEVICE_ACCEL_LSM:
      return get_num_multivalues_lsm();
    default:
      return get_num_multivalues_capacitive();
  }
}
