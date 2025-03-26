import sensor, image, time, math
import network  # Import network library for Wi-Fi
#import usocket as socket  # Import socket library for UDP
from uosc.client import Bundle, Client, create_message
import json
from machine import Pin
button_read_pin = "A0"


print(Pin.IN)
print(Pin.PULL_UP)

mode = Pin.IN
pull = Pin.PULL_UP



# Initialize the button pin with internal pull-up resistor
# the code only runs when the button is pressed
button = Pin(button_read_pin, mode, pull)  # Replace 14 with your input pin number

while True:
    button_state = button.value()
    if button_state == 0:
        print("Button Pressed")
    else:
        print("Button Released")
    time.sleep(0.1)
