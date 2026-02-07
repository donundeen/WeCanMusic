#!/bin/bash
# cd into the wecanmusic server directory and run the copy_soundfonts_from_usb.node.js script
set -e

MNT="${1:-/mnt/usb}"

# Optional: only proceed if a folder exists on the USB
if [ ! -d "$MNT/wecanmusic" ]; then
  exit 0
fi

cd /home/pi/wecanmusic/server
node copy_soundfonts_from_usb.node.js
