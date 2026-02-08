#pragma once

//////////////////////////////
// DEVICE CONFIGURATION
// Change DEVICE_TYPE below to switch sensor behavior for this unified sketch.

// Supported device types
#define DEVICE_CAPACITIVE 1
#define DEVICE_RESISTIVE 2
#define DEVICE_ACCEL_L3GD20H 3
#define DEVICE_ACCEL_L3GD4200 4
#define DEVICE_ACCEL_LSM 5

// Pick one device type
#define DEVICE_TYPE DEVICE_ACCEL_L3GD20H

// Defaults shared across device types
#define DEVICE_DEFAULT_WIFI_SSID "icanmusic"
#define DEVICE_DEFAULT_WIFI_PASSWORD ""
#define DEVICE_PRESET_IP "10.0.0.255"

// Per-device defaults
#if DEVICE_TYPE == DEVICE_CAPACITIVE
  #define DEVICE_NUM_MULTIVALUES 1
#elif DEVICE_TYPE == DEVICE_RESISTIVE
  #define DEVICE_NUM_MULTIVALUES 1
#elif DEVICE_TYPE == DEVICE_ACCEL_L3GD20H
  #define DEVICE_NUM_MULTIVALUES 3
#elif DEVICE_TYPE == DEVICE_ACCEL_L3GD4200
  #define DEVICE_NUM_MULTIVALUES 3
#elif DEVICE_TYPE == DEVICE_ACCEL_LSM
  #define DEVICE_NUM_MULTIVALUES 3
#else
  #error "Unknown DEVICE_TYPE. Update device_config.h."
#endif
