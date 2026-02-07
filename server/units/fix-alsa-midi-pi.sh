#!/bin/bash
# Run on the Raspberry Pi to free ALSA sequencer clients and optionally add modprobe config.
# Usage: sudo ./fix-alsa-midi-pi.sh

set -e

echo "=== Processes using ALSA sequencer ==="
lsof /dev/snd/seq 2>/dev/null || echo "(none or no permission)"

echo ""
echo "=== Stopping common ALSA MIDI users ==="
systemctl stop a2jmidid 2>/dev/null && echo "Stopped a2jmidid" || true
killall a2jmidid 2>/dev/null && echo "Killed a2jmidid" || true
killall jackd 2>/dev/null && echo "Killed jackd" || true
killall qjackctl 2>/dev/null && echo "Killed qjackctl" || true

echo ""
echo "=== snd_seq module parameters (to see if limit is configurable) ==="
modinfo snd_seq 2>/dev/null | grep -i parm || echo "No parameters or modinfo not found"

echo ""
echo "=== Optional: add modprobe config ==="
CONF="/etc/modprobe.d/alsa-sequencer-wecanmusic.conf"
if [ ! -f "$CONF" ]; then
  echo "options snd_seq max_client_connections=256" | sudo tee "$CONF"
  echo "Created $CONF – reboot (or reload snd_seq) to apply."
else
  echo "Already exists: $CONF"
fi

echo ""
echo "Restart wecanmusic: sudo systemctl restart wecanmusic"
