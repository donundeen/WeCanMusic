# ALSA MIDI on Raspberry Pi – fix "Cannot allocate memory"

When you see:
`ALSA lib seq_hw.c:466:(snd_seq_hw_open) open /dev/snd/seq failed: Cannot allocate memory`

the kernel has run out of **sequencer client slots** (not RAM). Each process that opens `/dev/snd/seq` uses one.

---

## 1. Free slots: stop other processes using ALSA MIDI

On the Pi, run:

```bash
# See what’s using the sequencer (often nothing shows; still try stopping known users)
lsof /dev/snd/seq 2>/dev/null || true
```

Stop common MIDI/JACK users so they release their client:

```bash
# If you use JACK + a2jmidid (Jack–ALSA MIDI bridge)
sudo systemctl stop a2jmidid 2>/dev/null || true
sudo killall a2jmidid 2>/dev/null || true

# If you use QjackCtl or JACK
killall jackd 2>/dev/null || true
killall qjackctl 2>/dev/null || true

# Any other app that might have opened MIDI (e.g. FluidSynth, other node scripts)
# Restart wecanmusic after stopping them
sudo systemctl restart wecanmusic
```

Rebooting also frees all sequencer clients.

---

## 2. (Optional) Try raising the sequencer client limit

On many kernels the limit is fixed at 256 and **cannot** be changed. You can still try:

**2a. See if the module has a parameter**

```bash
modinfo snd_seq | grep -i parm
```

If you see something like `max_client` or `max_clients`, note the name.

**2b. Add a modprobe config (only if 2a shows a parameter)**

```bash
sudo nano /etc/modprobe.d/alsa-sequencer.conf
```

Add one line (use the parameter name from 2a; this is an example):

```
options snd_seq max_client_connections=256
```

Save, then reload the module (requires unloading any process using ALSA sequencer first, or reboot):

```bash
sudo modprobe -r snd_seq
sudo modprobe snd_seq
```

Or just **reboot** so the new modprobe.d is applied.

---

## 3. If MIDI is not needed

WeCanMusic can run without hardware MIDI (e.g. using only FluidSynth). The server will start even when ALSA sequencer fails; you just won’t have real MIDI ports. No extra steps needed.
