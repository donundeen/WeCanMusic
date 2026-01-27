#pragma once

#include "device_config.h"

// Include the correct device-specific sensor implementation.
#if DEVICE_TYPE == DEVICE_CAPACITIVE
  #include "device_specific_capacitive.h"
#elif DEVICE_TYPE == DEVICE_RESISTIVE
  #include "device_specific_resistive.h"
#elif DEVICE_TYPE == DEVICE_ACCEL_L3GD20H
  #include "device_specific_accel_L3GD20H.h"
#elif DEVICE_TYPE == DEVICE_ACCEL_L3GD4200
  #include "device_specific_accel_L3GD4200.h"
#elif DEVICE_TYPE == DEVICE_ACCEL_LSM
  #include "device_specific_accel_lsm.h"
#else
  #error "Unknown DEVICE_TYPE. Update device_config.h."
#endif
