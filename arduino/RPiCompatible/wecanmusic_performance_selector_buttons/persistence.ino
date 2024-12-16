// handling the saving and retrieval of values that need to persist
/*
persistent variables:

char wecanmusic_server_ip[40] = "10.0.0.255";
char wecanmusic_port[6] = "7005";
char this_device_name[34] = "thread32";
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


    /***********************************************
    SAVE CONFIG VARIABLES INTO JSON HERE
    ************************************************/

    Serial.println("saving config.json");
    serializeJson(json_config, Serial); // this jsut writes the json to Serial out
    serializeJson(json_config, configFile);
    configFile.close();
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
