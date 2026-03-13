#pragma once

#include "device_config.h"

////////////////////////////////////

//
//  |ADS1220 pin label| Pin Function         |Arduino Connection|
//  |-----------------|:--------------------:|-----------------:|
//  | DRDY            | Data ready Output pin|  D2              |
//  | MISO            | Slave Out            |  MISO             |
//  | MOSI            | Slave In             |  MOSI             |
//  | SCLK            | Serial Clock         |  5             |
//  | CS              | Chip Select          |  D15               |
//  | DVDD            | Digital VDD          |  3.3V              |
//  | DGND            | Digital Gnd          |  Gnd              |
//  | AN0-AN3         | Analog Input         |  to the thing we're measuring      |
//  | AVDD            | Analog VDD           |  -                |
//  | AGND            | Analog Gnd           |  -                |

// SENSOR INCLUDES
// ADS1220 code:
// https://www.adafruit.com/product/1032 
// https://github.com/adafruit/Adafruit_L3GD20_U 


#include "Protocentral_ADS1220.h"
#include <SPI.h>

#define PGA          1                 // Programmable Gain = 1
#define VREF         2.048            // Internal reference of 2.048V
#define VFSR         VREF/PGA
#define FULL_SCALE   (((long int)1<<23)-1)

#define ADS1220_CS_PIN    15
#define ADS1220_DRDY_PIN  A5

Protocentral_ADS1220 pc_ads1220;
int32_t adc_data;
volatile bool drdyIntrFlag = false;

void drdyInterruptHndlr(){
  drdyIntrFlag = true;
}

void enableInterruptPin(){

  attachInterrupt(digitalPinToInterrupt(ADS1220_DRDY_PIN), drdyInterruptHndlr, FALLING);
}

void sensor_setup_device_ads1220(){
    pc_ads1220.begin(ADS1220_CS_PIN,ADS1220_DRDY_PIN);

    pc_ads1220.set_data_rate(DR_330SPS);
    pc_ads1220.set_pga_gain(PGA_GAIN_1);

    pc_ads1220.set_conv_mode_single_shot(); //Set Single shot mode
}

void sensor_loop_ads1220(int vindex){

    adc_data=pc_ads1220.Read_SingleShot_SingleEnded_WaitForData(MUX_SE_CH0);
    ADCRaw[vindex] = adc_data;
    firstSense[vindex] = true;
}