# Raspberry Pi Server

The Raspberry Pi Server does these things:

- Runs a WiFI access point which all devices can connect to, so an internet connection isn't needed
- Sends out Note List information to all the devices, so they play from the same selection of notes. This note list can come from a score that plays on its own, or from a web app where the use can trigger chord changes in real time
- Run a Web Server, which provides

  - score editing and playing interface
  - live chord change selection
  - control configuration of individual devices.
- Runs a local MIDI synth, which can play notes sent from networked devices, or can process raw sensor values from devices that can't create their own MIDI notes. These notes can be played from the Rpi's audio out, a USB Midi Cable, or through a bluetooth speaker
- Can send raw MIDI notes to hardware synths connected via USB->MIDI interfaces.

## RPI Setup

- Get a Pi. I use a Pi4, but you can probably use a pi 3

try installing the the latest img file for the WeCanMusic server, here:
https://drive.google.com/file/d/1BpK8xNUTFqRBdYjhz0Nw-2aI-1M7PVTC/view?usp=sharing

If that doesn't work try the instructions below.

Fair warning: getting all the audio/midi synth/systemd/node/npm/etc working is a bit of a pain. I try to keep these instructions up to date, but I'm always learning better ways to set things up.

# Update and upgrade

```
sudo apt update
sudo apt upgrade
```

# All the apt installs together (except node):
```
sudo apt install -y git ca-certificates curl gnupg pulseaudio pulseaudio-module-bluetooth  fluidsynth libcap2-bin
```

# Install Git
```
sudo apt install -y git
```

# PiJuice Setup

Do this only if you're using a PiJuice:

https://www.pishop.ca/product/pijuice-hat-a-portable-power-platform-for-every-raspberry-pi/

`sudo apt-get install -y pijuice-base`


# Install Node & npm

[https://pimylifeup.com/raspberry-pi-nodejs/](https://pimylifeup.com/raspberry-pi-nodejs/)
```

sudo apt install -y ca-certificates curl gnupg

curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /usr/share/keyrings/nodesource.gpg

NODE_MAJOR=20

echo "deb [signed-by=/usr/share/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list

sudo apt update

sudo apt install -y nodejs build-essential
```
# Setup dependencies

```
sudo apt install -y pulseaudio pulseaudio-module-bluetooth`
sudo apt install -y alsa-utils libasound2-plugins
sudo apt install -y libasound2-dev
```
# Set priority level for audio
```
sudo groupadd audio
sudo usermod -a -G audio pi
```
``` sudo nano /etc/security/limits.d/audio.conf```
add lines:
``` 
@audio   -  rtprio     95
@audio   -  memlock    unlimited
```



# Install FluidSynth

```
sudo apt install -y fluidsynth
```

## Make sure the right audio device is selected
```
sudo nano /boot/firmware/config.txt
```
```
[all]
# Some magic to prevent the normal HAT overlay from being loaded
dtoverlay=
# And then choose one of the following, according to the model:
dtoverlay=rpi-codeczero
dtoverlay=rpi-dacplus
dtoverlay=rpi-dacpro
dtoverlay=rpi-digiampplus
```
```
sudo reboot -H now
```
then
```
sudo raspi-config
```
System->Audio -> 2 RPi DigiAMP+


## edit service to tie to pulseaudio:
```
sudo nano /usr/lib/systemd/user/fluidsynth.service

[Unit]
After=pulseaudio.service
PartOf=pulseaudio.service
```

## edit fluidsynth startup settings:
```
sudo nano /etc/default/fluidsynth
```
```
# Mandatory parameters (uncomment and edit)
#SOUND_FONT=/usr/share/sounds/sf3/default-GM.sf3
SOUND_FONT='/home/pi/wecanmusic/server/soundfonts/FluidSynthDefaultSoundfont.sf2'

# Additional optional parameters (may be useful, see 'man fluidsynth' for further info)
#OTHER_OPTS='-a alsa -m alsa_seq -p FluidSynth\ GM -r 48000'
OTHER_OPTS='-a pulseaudio'
```

# reboot and confirm

```
sudo reboot
```

```
systemctl --user status fluidsynth
```

There shouldn't be any error messages.


# now install alsa

```
sudo apt install -y alsa-utils libasound2-plugins libasound2-dev
```

# Clone Repo

pull only, no need to create ssh key
```
git clone https://github.com/donundeen/WeCanMusic.git
```

## Lowercase the name (until I fix a few bugs)

```
mv WeCanMusic wecanmusic
```

# Setup App

```
cd ~/wecanmusic/server
npm install
chmod a+x hotspotup.sh
```


## Create machine-specific config file

```
cd ~/wecanmusic/server
cp env.config.js.template env.config.js
```

## edit env.config.js as appropriate

change env value from “mac” to “rpi”

add line
```
    "scorename" : "simplescore.txt" // default score to start with since this score already exists in the repo
```

# Get Soundfonts
[TBD]

Soundfont files are too large to put in the Repo, so you need to find them and install them separately.

scp the soundfont file from another machine, into the folder `soundfonts`

Whatever soundfont file you want as your operating soundfont file, 
copy it to the filename `FluidSynthDefaultSoundfont.sf2` 

Whenever you change this, you'll need to restart the server (really just Fluidsynth.service then wecanmusic.service, but it's easier to just reboot the machine))



# Fix some permissions

```
sudo apt-get install -y libcap2-bin
sudo setcap cap_net_bind_service=+ep `readlink -f \`which node\`` 
```


# Try Running It
```
sudo reboot
```

```
cd ~/wecanmusic/server
node conductor.node.js
```

should see no errors or anything else.

If fluidsynth is working, it should play a few notes when you run the conductor.node.js command, and whenever you boot the machine.

# Setup networking: hotspot and internet access

The Hotspot mode runs a local wifi access point that all your instruments, and any control interfaces, ipads, etc can connect to. You need it running to run wecanmusic and have it do stuff.

The internet access mode is for getting code updates.

```
sudo nmcli con add con-name hotspot ifname wlan0 type wifi ssid "wecanmusic_friends"
sudo nmcli con modify hotspot wifi-sec.key-mgmt wpa-psk
sudo nmcli con modify hotspot 802-11-wireless.mode ap 802-11-wireless.band bg ipv4.method shared
sudo nmtui
```
change the wecanmusic_friends security to “None” - no password

change IPv4 Configuration:

Shared

addresses: 10.0.0.1/24

change the preconfigured connection name to mediawifi (or whatever you want)

switch back and forth between hotspot and internet access with
note: you might have a different connection name than "mediawifi"
```
# get internet access
nmcli con down hotspot
nmcli con up mediawifi

# run hotspot for wecanmusic
nmcli con down mediawifi
nmcli con up hotspot
```

# Setup Systemd

So wecanmusic runs at startup
```
sudo cp ~/wecanmusic/server/units/wecanmusic.service /lib/systemd/user/
sudo systemctl daemon-reload
systemctl --user enable wecanmusic.service 
```

check if it works:
```
systemctl --user status wecanmusic.service
```
