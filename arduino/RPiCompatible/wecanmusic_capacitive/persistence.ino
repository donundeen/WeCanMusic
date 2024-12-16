// handling the saving and retrieval of values that need to persist
/*
persistent variables:

char wecanmusic_server_ip[40] = "10.0.0.255";
char wecanmusic_port[6] = "7005";
char this_device_name[34] = "thread32";
int midi_bank[6] = {0,0,0,0,0,0}; //
int midi_program[6] = {1,1,1,1,1,1}; //
int midimin[6] = {32,32,32,32,32,32};  //
int midimax[6] = {100,100,100,100,100,100}; //
int midi_notelength[6] = {7,7,7,7,7,7}; // these ints poin tot positions in the notelengths array
int midi_vol[6] = {200,200,200,200,200,200};

*/



void persistence_setup()
{
    if (!SPIFFS.begin(true))
    {
        Serial.println("SPIFFS Mount Failed");
        return;
    }
    load_persistent_values();
}

void load_persistent_values()
{
    if (SPIFFS.exists("/config.json"))
    {
        // file exists, reading and loading
        Serial.println("reading config file");
        File configFile = SPIFFS.open("/config.json", "r");
        if (configFile)
        {
            Serial.println("opened config file");
            size_t size = configFile.size();
            // Allocate a buffer to store contents of the file.
            std::unique_ptr<char[]> buf(new char[size]);

            configFile.readBytes(buf.get(), size);
            DynamicJsonDocument json_config(2048);
            auto deserializeError = deserializeJson(json_config, buf.get());
            serializeJson(json_config, Serial); // this just prints to serial
            if (!deserializeError)
            {
                Serial.println("\nparsed json");
            }
            else
            {
                Serial.println("failed to load json config");
            }

            /***********************************************
            LOAD CONFIG VARIABLES INTO THE GLOBALS HERE
            ************************************************/
            // load parsed JSON values into global variables
            if (!json_config["wecanmusic_server_ip"].isNull())
            {
                String tmp = json_config["wecanmusic_server_ip"].as<String>();
                tmp.toCharArray(wecanmusic_server_ip, 40);
            }
            else
            {
                Serial.println("don't have wecanmusic_server_ip yet");
            }
            if (!json_config["wecanmusic_port"].isNull())
            {
                String tmp = json_config["wecanmusic_port"].as<String>();
                tmp.toCharArray(wecanmusic_port, 6);
            }
            else
            {
                Serial.println("don't have wecanmusic_port yet");
            }
            if (!json_config["this_device_name"].isNull())
            {
                String tmp = json_config["this_device_name"].as<String>();
                tmp.toCharArray(this_device_name, 34);
            }
            else
            {
                Serial.println("don't have this_device_name yet");
            }
            /*
            // int example
            if(!json_config["channel"].isNull()){
              channel = json_config["channel"];
            }else{
              Serial.println("don't have channel yet");
            }
            */

            // HANDLE ARRAYS LIKE THIS
            // midi_bank
            if (!json_config["midi_bank"].isNull())
            {
                JsonArray mappingArray = json_config["midi_bank"].as<JsonArray>();
                int i = 0;
                for (JsonVariant value : mappingArray)
                {
                    midi_bank[i] = value;
                    i += 1;
                }
            }
            else
            {
                Serial.println("don't have midi_bank yet");
            }
            // midi_program
            if (!json_config["midi_program"].isNull())
            {
                JsonArray mappingArray = json_config["midi_program"].as<JsonArray>();
                int i = 0;
                for (JsonVariant value : mappingArray)
                {
                    midi_program[i] = value;
                    i += 1;
                }
            }
            else
            {
                Serial.println("don't have midi_program yet");
            }
            // midimin
            if (!json_config["midimin"].isNull())
            {
                JsonArray mappingArray = json_config["midimin"].as<JsonArray>();
                int i = 0;
                for (JsonVariant value : mappingArray)
                {
                    midimin[i] = value;
                    i += 1;
                }
            }
            else
            {
                Serial.println("don't have midimin yet");
            }
            // midimax
            if (!json_config["midimax"].isNull())
            {
                JsonArray mappingArray = json_config["midimax"].as<JsonArray>();
                int i = 0;
                for (JsonVariant value : mappingArray)
                {
                    midimax[i] = value;
                    i += 1;
                }
            }
            else
            {
                Serial.println("don't have midimax yet");
            }
            // midi_notelength
            if (!json_config["midi_notelength"].isNull())
            {
                JsonArray mappingArray = json_config["midi_notelength"].as<JsonArray>();
                int i = 0;
                for (JsonVariant value : mappingArray)
                {
                    midi_notelength[i] = value;
                    i += 1;
                }
            }
            else
            {
                Serial.println("don't have midi_notelength yet");
            }
            // midi_vol
            if (!json_config["midi_vol"].isNull())
            {
                JsonArray mappingArray = json_config["midi_vol"].as<JsonArray>();
                int i = 0;
                for (JsonVariant value : mappingArray)
                {
                    midi_vol[i] = value;
                    i += 1;
                }
            }
            else
            {
                Serial.println("don't have midi_notelength yet");
            }
            // END ARRAY HANDLING EXAMPLE
            /***********************************************
            END LOAD CONFIG VARIABLES INTO THE GLOBALS HERE
            ************************************************/

            serializeJson(json_config, Serial); // this just prints to serial
            configFile.close();
        }
    }
    else
    {
        Serial.println("no config.json file found for reading");
    }
}

void save_persistent_values()
{

  Serial.println("save_persistent_values");
    int MAX_NUM_VOICES = 6;
    File configFile = SPIFFS.open("/config.json", "w");
    if (!configFile)
    {
        Serial.println("no config file found for writing");
    }
    DynamicJsonDocument json_config(2048);

    /***********************************************
    SAVE CONFIG VARIABLES INTO JSON HERE
    ************************************************/

    json_config["this_device_name"] = String(this_device_name);
    json_config["wecanmusic_port"] = String(wecanmusic_port);
    json_config["wecanmusic_server_ip"] = String(wecanmusic_server_ip);

    // HANDLE ARRAYS LIKE THIS

    // midi_bank
    json_config["midi_bank"].clear();
    JsonDocument midi_bankdoc;
    JsonArray midi_bankpoints = midi_bankdoc.to<JsonArray>();
    for (int i = 0; i < MAX_NUM_VOICES; i++)
    {
        midi_bankpoints.add(midi_bank[i]);
    }
    json_config["midi_bank"] = midi_bankpoints;

    // midi_program
    json_config["midi_program"].clear();
    JsonDocument midi_programdoc;
    JsonArray midi_programpoints = midi_programdoc.to<JsonArray>();
    for (int i = 0; i < MAX_NUM_VOICES; i++)
    {
        midi_programpoints.add(midi_program[i]);
    }
    json_config["midi_program"] = midi_programpoints;   

    // midimin
    json_config["midimin"].clear();
    JsonDocument midimindoc;
    JsonArray midiminpoints = midimindoc.to<JsonArray>();
    for (int i = 0; i < MAX_NUM_VOICES; i++)
    {
        midiminpoints.add(midimin[i]);
    }
    json_config["midimin"] = midiminpoints;   

    // midimax
    json_config["midimax"].clear();
    JsonDocument midimaxdoc;
    JsonArray midimaxpoints = midimaxdoc.to<JsonArray>();
    for (int i = 0; i < MAX_NUM_VOICES; i++)
    {
        midimaxpoints.add(midimax[i]);
    }
    json_config["midimax"] = midimaxpoints; 

    // midi_notelength
    json_config["midi_notelength"].clear();
    JsonDocument midi_notelengthdoc;
    JsonArray midi_notelengthpoints = midi_notelengthdoc.to<JsonArray>();
    for (int i = 0; i < MAX_NUM_VOICES; i++)
    {
        midi_notelengthpoints.add(midi_notelength[i]);
    }
    json_config["midi_notelength"] = midi_notelengthpoints; 

    // midi_vol
    json_config["midi_vol"].clear();
    JsonDocument midi_voldoc;
    JsonArray midi_volpoints = midi_voldoc.to<JsonArray>();
    for (int i = 0; i < MAX_NUM_VOICES; i++)
    {
        midi_volpoints.add(midi_vol[i]);
    }
    json_config["midi_vol"] = midi_volpoints; 
     
    // END ARRAY HANDLING EXAMPLE

    /***********************************************
    SAVE CONFIG VARIABLES INTO JSON HERE
    ************************************************/

    Serial.println("saving config.json");
    serializeJson(json_config, Serial); // this jsut writes the json to Serial out
    serializeJson(json_config, configFile);
    configFile.close();
    Serial.println("configfileclosed");
}

void delete_config_file(){
  if(resetConfigFile){
    Serial.println("deleting all stored SSID credentials");
    if (!SPIFFS.begin(true)) {
      Serial.println("An Error has occurred while mounting SPIFFS");
      return;
    }  
    SPIFFS.remove("/config.json");
  }
}
