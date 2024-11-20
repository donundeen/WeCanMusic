

//////////////////////////////////
// MUSIC PERFORMANCE FUNCTIONS

void setNotelist(int* newlist, int* curlist, int size){
  Serial.println("new notelist");
  Serial.println(sizeof(newlist[0])*size);
  notelistlength = size;
  memcpy(curlist, newlist, sizeof(newlist[0])*size);
}

void setRoot(int vindex, int root){  //MULTIVALUE UPDATE REQUIRED
  rootMidi[vindex] = root;   //MULTIVALUE UPDATE REQUIRED
}

int noteFromFloat(int vindex, double value, int min, int max){
  makeworkinglist(vindex, min, max);  //MULTIVALUE UPDATE REQUIRED
  //Serial.print("note from value ");
  //Serial.println(value);
  //Serial.println(workinglistlength);
	int index = floor((double)workinglistlength[vindex] * value);
  //Serial.println(index);
	int note  = workinglist[vindex][index];// % workingList.length]
  //Serial.println(note);
  return note;
}

int fixedNoteFromFloat(int vindex, float value, int min, int max){ //MULTIVALUE UPDATE REQUIRED
// in a "fixed" setup, the same float value should result in the same midi note (octave may vary), regardless of scale
// - map the float across FULL range, from min to max
// - move resulting value DOWN to the closest note in the scale
  makeworkinglist(vindex, min, max); //MULTIVALUE UPDATE REQUIRED
	int range = max - min;
	int initial = min + floor(range * value);
	while(indexOf(initial, workinglist[vindex], workinglistlength[vindex]) < 0){  //MULTIVALUE UPDATE REQUIRED
		initial--;
	}
	return initial;
}

int getRootedBestNoteFromFloat(int vindex, int value, int min, int max){  //MULTIVALUE UPDATE REQUIRED
	// for a "rooted" scale/chord, expand the min and max so that both min and max are the root
	min = moveMinMax(vindex, rootMidi[vindex], min);  //MULTIVALUE UPDATE REQUIRED
	max = moveMinMax(vindex, rootMidi[vindex], max);   //MULTIVALUE UPDATE REQUIRED

	int note = noteFromFloat(vindex, value, min, max);  //MULTIVALUE UPDATE REQUIRED
	if(!note){
		return false;
	}
	return note;
}

int moveMinMax(int vindex, int root, int minmax){  
	// for a "rooted" scale/chord, expand the min and max so that both min and max are the root
	//		maxApi.post("getChordNoteFromFloat "+labelid + ", " + value);
	//		maxApi.post(chordNoteSetMidi);
	int orig = minmax;
	int mindiff = (minmax % 12) - (root % 12);
	int minmove = abs(6 - mindiff);

	if(mindiff == 0){
		// do nothing
	}
  else if (mindiff < -6){
		mindiff = -12 - mindiff;
		minmax = minmax - mindiff;
		//big distance, go opposite way around
	}
  else if (mindiff < 0){
		// small different, go toward
		minmax = minmax - mindiff;
	}
  else if(mindiff < 6){
		minmax = minmax - mindiff;
	}
  else if (mindiff < 12){
		mindiff = 12 - mindiff;
		minmax = minmax + mindiff;
	}
	return minmax;

}


// Make a new array that's a subset of the notelist, with min and max values
void makeworkinglist(int vindex, int minval, int maxval){  //MULTIVALUE UPDATE REQUIRED
  int wi = -1;
  for(int i = 0; i < notelistlength; i ++){
    if(notelist[i] >= minval && notelist[i] <= maxval){
      wi++;
      workinglist[vindex][wi] = notelist[i];   //MULTIVALUE UPDATE REQUIRED
    }
  }
  workinglistlength[vindex] = wi + 1;  //MULTIVALUE UPDATE REQUIRED
}
// END MUSIC PERFORMANCE FUNCTIONS
/////////////////////////////////





