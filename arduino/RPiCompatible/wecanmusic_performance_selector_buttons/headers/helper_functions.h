

////////////////////
// HELPER FUNCTIONS
int indexOf(int value, int searcharray[], int length){
  for (int i = 0; i < length; i++) {
    if (searcharray[i] == value) {
      return i;
    }
  }
  return -1;
}


void digiflash(int pin, int numflash, int delaytime, int endval){
  for(int i = 0; i< numflash; i++){
    digitalWrite(pin, HIGH);
    delay(delaytime);
    digitalWrite(pin, LOW);
    delay(delaytime);
  }
  digitalWrite(pin, endval);
}


// END HELPER FUNCTIONS
/////////////////////////
