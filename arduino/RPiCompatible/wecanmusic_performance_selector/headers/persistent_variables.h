/////////////// PERSISTENT, STORABLE VARIABLES
/*
These are all the variables that get stored in the arduino's SPIFFS file, config.json.
Also there will be documentation on all the places you nee to change the code 
whenever you want to add a new variable.

most are edited via the conductor.html web interface
but a few get edited in the arduino's own AP mode web page

When you are adding a new variables you want to control from conductor.html, you'll need to edit:
server side:
- server/html/conductor.hml
- server/html/conductor.js
= server/conductor.node.js
- server/modules/udpinstrument.module.js
- server/modules/localinstrument.module.js
arduino:
- persistence.ino
- usp_osc_functions.ino

and if you are adding new variables to change from the arduino's AP mode web page, you need to edit:
- persistence.ino
- config_webpage.ino
*/


///////////////////////////////////
// Variables edited in Arduino's AP mode web page
char wecanmusic_server_ip[40] = "10.0.0.255";
char wecanmusic_port[6] = "7005";
char this_device_name[34] = "thread32";