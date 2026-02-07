/*
this script will copy the soundfonts from the usb drive to the soundfonts directory
usb files will be in the USB drive at /media/pi/USBDRIVE/wecanmusic/server/soundfonts
and will coopy to the soundfonts directory specified in the config file
*/

const config = require("./configs/conductor.config.js");
const fs = require("fs");
const path = require("path");


// is USBDRIVE the name for the usb drive?
// let's assume name of drive is WECANMUSIC

const usbSoundfontsDir = path.join("/media/pi/WECANMUSIC/wecanmusic/server/soundfonts");
const soundfontsDir = config.soundfontDir;

fs.readdir(usbSoundfontsDir, (err, files) => {
    if (err) {
        console.error("Error reading usb soundfonts directory:", err);

        return;
    }

    files.forEach(file => {
        const sourcePath = path.join(usbSoundfontsDir, file);
        const destPath = path.join(soundfontsDir, file);

        fs.copyFile(sourcePath, destPath, (err) => {
            if (err) {
                console.error("Error copying file:", err);
                return;
            }

            console.log("Copied file:", file);
        });
    });
});

console.log("Copied soundfonts from usb to:", soundfontsDir);