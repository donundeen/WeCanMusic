
/////////// MIDI DEFINITIONS /////////////////////
// Solder closed jumper on bottom!

#define VS1053_BANK_DEFAULT 0x00
#define VS1053_BANK_DRUMS1 0x78
#define VS1053_BANK_DRUMS2 0x7F
#define VS1053_BANK_MELODY 0x79

#define MIDI_NOTE_ON  0x90
#define MIDI_NOTE_OFF 0x80
#define MIDI_CHAN_MSG 0xB0
#define MIDI_CHAN_BANK 0x00
#define MIDI_CHAN_VOLUME 0x07
#define MIDI_CHAN_PROGRAM 0xC0


#if defined(ESP8266) || defined(__AVR_ATmega328__) || defined(__AVR_ATmega328P__)
  #define VS1053_MIDI Serial
#else
  // anything else? use the hardware serial1 port
  #define VS1053_MIDI Serial1
#endif
///  END MIDI DEFINITIONS
/////////////////////////////////////////


////////////////////////////
// MIDI FUNCTIONS
void midi_setup(){
  VS1053_MIDI.begin(31250); // MIDI uses a 'strange baud rate'
  for(int vindex = 0; vindex < NUM_MULTIVALUES; vindex++){
    midi_setup(vindex);
  }
}

void midi_setup(int vindex){

  midiSetChannelVolume(vindex, 127);

  try{
    midiSetChannelBank(vindex, midi_bank[vindex]);  
    midiSetChannelProgram(vindex, midi_program[vindex]);  //
  }catch(const char* error){
    Serial.println("unable to set stored bank and program");
    midiSetChannelBank(vindex, VS1053_BANK_MELODY);
    midiSetChannelProgram(vindex, 0);
  }
}

// Makenote: pith, velocity, duration
void midiMakeNote(int vindex, int pitch, int vel, int durationms){
  /*
  Serial.print("MKNOTE: ");
  Serial.print(pitch);
  Serial.print(" : ");
  Serial.print(vel);
  Serial.print(" : ");
  Serial.println(durationms);
  */
  midiNoteOn(0, pitch, vel);
   
 // int innerpitch = pitch;
  t.setTimeout([pitch, vel]() {
    midiNoteOff(0, pitch, vel);
  }, durationms);
}

void midiSetChannelBank(uint8_t chan, uint8_t bank) {
  if (chan > 15) return;
  if (bank > 127) return;
  
  VS1053_MIDI.write(MIDI_CHAN_MSG | chan);
  VS1053_MIDI.write((uint8_t)MIDI_CHAN_BANK);
  VS1053_MIDI.write(bank);
}

// changed from midiSetInstrument
void midiSetChannelProgram(uint8_t chan, uint8_t program) {
  if (chan > 15) return;
  program --; // page 32 has instruments starting with 1 not 0 :(
  if (program > 127) return;
  
  VS1053_MIDI.write(MIDI_CHAN_PROGRAM | chan);  
  delay(10);
  VS1053_MIDI.write(program);
  delay(10);
}

void midiSetChannelVolume(uint8_t chan, uint8_t vol) {
  if (chan > 15) return;
  if (vol > 127) return;
  
  VS1053_MIDI.write(MIDI_CHAN_MSG | chan);
  VS1053_MIDI.write(MIDI_CHAN_VOLUME);
  VS1053_MIDI.write(vol);
}



void midiNoteOn(uint8_t chan, uint8_t n, uint8_t vel) {
  if (chan > 15) return;
  if (n > 127) return;
  if (vel > 127) return;
  
  VS1053_MIDI.write(MIDI_NOTE_ON | chan);
  VS1053_MIDI.write(n);
  VS1053_MIDI.write(vel);
}

void midiNoteOff(uint8_t chan, uint8_t n, uint8_t vel) {
  if (chan > 15) return;
  if (n > 127) return;
  if (vel > 127) return;
  
  VS1053_MIDI.write(MIDI_NOTE_OFF | chan);
  VS1053_MIDI.write(n);
  VS1053_MIDI.write(vel);
}
// END MIDI FUNCTIONS
//////////////////////////
