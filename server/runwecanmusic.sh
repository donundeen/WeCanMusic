#!/bin/bash

cd /home/pi/wecanmusic/server
/home/pi/wecanmusic/server/hotspotup.sh
/usr/bin/node /home/pi/wecanmusic/server/conductor.node.js
