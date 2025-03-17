import sensor, image, time, math
import network  # Import network library for Wi-Fi
#import usocket as socket  # Import socket library for UDP
from uosc.client import Bundle, Client, create_message
import json

# image library: https://docs.openmv.io/library/omv.image.html#
# Sensor library: https://docs.openmv.io/library/omv.sensor.html

# Configuration
#
bars_per_cycle = 8
pulse_per_bar = 8 # quantitze to 8th notes
N = bars_per_cycle * pulse_per_bar  # Number of steps for the triangle sweep (360/N degrees)
angle_per_pulse = 360 / N
X = 125  # Time in milliseconds to wait between sweeps

circle_rhythm_hash = {}

draw_results = True

max_x = 0
max_y = 0
screen_width = 240
screen_height = 160

# Initialize the camera
sensor.reset()
sensor.set_pixformat(sensor.RGB565)
sensor.set_framesize(sensor.HVGA)
sensor.skip_frames(time=2000)

sensor.set_windowing(screen_width, screen_height)
sensor.set_auto_whitebal(False)  # must be turned off for color tracking

print(screen_width)
print(screen_height)

draw_center_x = screen_width / 4
draw_center_y = screen_height / 4
draw_center_point = (draw_center_x, draw_center_y)

measure_center_x = screen_width / 2
measure_center_y = screen_height / 2
measure_center_point = (measure_center_x, measure_center_y)

# Wi-Fi Configuration
SSID = 'JJandJsKewlPad'  # Replace with your Wi-Fi SSID
PASSWORD = 'WeL0veLettuce'  # Replace with your Wi-Fi password
SERVER_IP = '10.0.0.174'
SERVER_PORT = 7005

if True:
    SSID = 'wecanmusic_friends'  # Replace with your Wi-Fi SSID
    PASSWORD = False  # Replace with your Wi-Fi password
    SERVER_IP = '192.168.4.1'

# Initialize Wi-Fi
print("connecting to ", SSID, " with " , PASSWORD)
wlan = network.WLAN(network.STA_IF)
wlan.active(True)
if PASSWORD:
    wlan.connect(SSID, PASSWORD)
else:
    wlan.connect(SSID)

# Wait for connection
while not wlan.isconnected():
    print("not connecteD")
    time.sleep(1)
print("Connected to Wi-Fi:", wlan.ifconfig())

# Set up UDP socket
#udp_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
#udp_address = ('10.0.0.174', 7005)  # Replace with the destination IP and port
osc = Client(SERVER_IP, SERVER_PORT)

osc.send('/announceCircleRhythmInstrument', "circleRhythm")



def find_lines(img):
    lines = img.find_line_segments()
    print("finding lines")
    print(len(lines))
    if draw_results:
        for line in lines:
            print(line)
            img.draw_line(line.line(), color=(0, 0, 255))
    return lines

def get_angle(line):
    return get_angle_between_points((line.x1(), line.y1()), (line.x2(), line.y2()))

def get_length(line):
    return get_distance_between_points((line.x1(), line.y1()), (line.x2(), line.y2()))

def get_distance_from_center(point):
    result = get_distance_between_points(point, (measure_center_x, measure_center_y))
    return result

def get_angle_from_center(point):
    return get_angle_between_points((measure_center_x, measure_center_y), point)

def get_distance_between_points(point1, point2):
    return math.sqrt((point1[0] - point2[0])**2 + (point1[1] - point2[1])**2)

def get_angle_between_points(point1, point2):
    """Calculate the angle of the line segment from p1 to p2."""
    delta_y = point2[1] - point1[1]
    delta_x = point2[0] - point1[0]
    return math.degrees(math.atan2(delta_y, delta_x))  # Convert radians to degrees

def get_pulse_from_angle(angle):
    # given a circle divived into N segments, return the number of the segment that corresponts to this angle
    # the segments are numbered 0 to N-1
    # the angle is the angle of the line segment from the center of the circle to the point
    # the angle is in degrees
    # the segments are in the range of 0 to N-1
    return round(angle / (360 / N)) % N


def get_second_line_point(point1, length, angle):
    # given an initial point, a length, and an angle, return the second point
    # the angle is the angle of the line segment from the center of the circle to the point
    # the angle is in degrees
    # the segments are in the range of 0 to N-1
    # round the returned point to the nearest integer
    # (𝑥2,𝑦2)=(𝑥1+𝑙⋅cos(𝑎),𝑦1+𝑙⋅sin(𝑎)).
    return (round(point1[0] + length * math.cos(math.radians(angle))), round(point1[1] + length * math.sin(math.radians(angle))))


while True:
    circle_rhythm_hash = {}

    img = sensor.snapshot()  # Move snapshot inside the loop
    img.crop(x_scale=.5, y_scale=.5)

    line_segments = find_lines(img)

        # for each line:
    for line in line_segments:
        print("line")
        print(line)
        img.draw_line(line.line(), color=(0, 0, 255))
        length = get_length(line)
        endpoint1 = (line.x1(), line.y1())
        endpoint2 = (line.x2(), line.y2())
        p1_line_angle = get_angle_between_points(endpoint1, endpoint2)
        p1_distance_from_center = get_distance_from_center(endpoint1)
        p1_distance_from_center_scaled = p1_distance_from_center / (screen_width / 2)
        p1_angle_from_center = get_angle_from_center(endpoint1)
        p1_rounded_angle_from_center = round(p1_angle_from_center / (360 / N)) * (360 / N)
        pulse_number = get_pulse_from_angle(p1_rounded_angle_from_center)
        recalculated_point = get_second_line_point(measure_center_point, p1_distance_from_center, p1_angle_from_center)

        note_hash_1 = {
            "endpoint": endpoint1,
#            "other_endpoint": endpoint2,
#            "center_point": measure_center_point,
            "distance_from_center": p1_distance_from_center,
            "distance_from_center_scaled": p1_distance_from_center_scaled,
 #           "angle_from_center": p1_angle_from_center,
 #           "rounded_angle_from_center": p1_rounded_angle_from_center,
            "length": length,
            "line_angle" : p1_line_angle,
            "pulse" : pulse_number,
#            "recalculated_point": recalculated_point
        }
        if not pulse_number in circle_rhythm_hash:
            circle_rhythm_hash[pulse_number] = []
        circle_rhythm_hash[pulse_number].append(note_hash_1)

        p2_distance_from_center = get_distance_from_center(endpoint2)
        p2_distance_from_center_scaled = p2_distance_from_center / (screen_width / 2)
        p2_line_angle = get_angle_between_points(endpoint2, endpoint1)
        p2_angle_from_center = get_angle_from_center(endpoint2)
        p2_rounded_angle_from_center = round(p2_angle_from_center / (360 / N)) * (360 / N)
        pulse_number = get_pulse_from_angle(p2_rounded_angle_from_center)
        recalculated_point = get_second_line_point(measure_center_point, p2_distance_from_center, p2_angle_from_center)

        note_hash_2 = {
            "endpoint": endpoint2,
#            "other_endpoint": endpoint1,
#            "center_point": measure_center_point,
            "distance_from_center": p2_distance_from_center,
            "distance_from_center_scaled": p2_distance_from_center_scaled,
#            "angle_from_center": p2_angle_from_center,
#            "rounded_angle_from_center": p2_rounded_angle_from_center,
            "length": length,
            "line_angle" : p2_line_angle,
            "pulse" : pulse_number,
#            "recalculated_point": recalculated_point
        }
        if not pulse_number in circle_rhythm_hash:
            circle_rhythm_hash[pulse_number] = []
        circle_rhythm_hash[pulse_number].append(note_hash_2)


    line_count = 0
    done = False
    showpoint1 = draw_center_point
    showpoint2 = measure_center_point

    img.draw_line(round(showpoint1[0]), round(showpoint1[1]), round(showpoint2[0]), round(showpoint2[1]), color=(255, 255, 0))

    img.draw_circle(round(draw_center_x), round(draw_center_y), 10, color=(0,255,0))

    # SHOW RESULTS ON IMAGE
    if False:
        # count up to N
        for i in range(N):
            #print(i)
            if i in circle_rhythm_hash:
                # loop through the notes in the hash
                for note in circle_rhythm_hash[i]:
                    print(note)
                    second_point = get_second_line_point(measure_center_point, note["distance_from_center"], note["angle_from_center"])
                    print(second_point)
                    showpoint2 = second_point
                    line_count += 1
                    img.draw_line(round(draw_center_x), round(draw_center_y), round(second_point[0]), round(second_point[1]), color=(0, 255, 0))
                    #break out of the loop
                    #done = True
                    #break
                    # create a line from the center, with the rounded angle from center, and the length
                    #img.draw_line(center_point, (center_point[0] + note["length"] * math.cos(note["rounded_angle_from_center"]), center_point[1] + note["length"] * math.sin(note["rounded_angle_from_center"])), color=(0, 255, 0))
                    #img = sensor.snapshot()  # another snapshot to display the image in opemmv.


        img = sensor.snapshot()  # Move snapshot inside the loop
        img.crop(x_scale=.5, y_scale=.5)

    #img.draw_line(showpoint1, showpoint2, color=(0, 255, 0))

    #img = sensor.snapshot()  # another snapshot to display the image in opemmv.

    # - get the angle of the line
    # - for each point in the line:
    # -- get the distance from the point to the center of the image
    # -- get the angle of the point from the center of the image, rounded to the nearest 360/N
    osc.send('/circleRhythmClear',"clear")

    print(circle_rhythm_hash)
    # Send circle_rhythm_hash as OSC messages
    for pulse_number, notes in circle_rhythm_hash.items():
        for note in notes:
            # Create a smaller OSC message with only essential data
            osc.send('/circleRhythm', json.dumps(note))

    time.sleep(5)
