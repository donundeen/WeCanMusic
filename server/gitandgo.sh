#!/bin/bash

systemctl --user stop  wecanmusic.service; git pull;  systemctl restart fluidsynth.service; systemctl start wecanmusic.service