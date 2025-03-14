import sensor, image, time, math

# image library: https://docs.openmv.io/library/omv.image.html#
# Sensor library: https://docs.openmv.io/library/omv.sensor.html

# Configuration
N = 36  # Number of steps for the triangle sweep (360/N degrees)
X = 125  # Time in milliseconds to wait between sweeps

screen_width = 320
screen_height = 240

# Initialize the camera
sensor.reset()
sensor.set_pixformat(sensor.RGB565)
sensor.set_framesize(sensor.HVGA)
sensor.skip_frames(time=2000)
sensor.set_windowing((screen_width, screen_height))
sensor.set_auto_whitebal(False)  # must be turned off for color tracking

# Function to check if two line segments intersect
def line_intersects_segment(p1, p2, p3, p4):
    def ccw(a, b, c):
        return (c[1] - a[1]) * (b[0] - a[0]) > (b[1] - a[1]) * (c[0] - a[0])

    return ccw(p1, p3, p4) != ccw(p2, p3, p4) and ccw(p1, p2, p3) != ccw(p1, p2, p4)

# Function to check if a line segment intersects with the triangle
def line_intersects_triangle(line_segment, triangle):
    tip, left_base, right_base = triangle
    # Check intersection with each edge of the triangle
    return (line_intersects_segment(line_segment[0:2], line_segment[2:4], tip, left_base) or
            line_intersects_segment(line_segment[0:2], line_segment[2:4], left_base, right_base) or
            line_intersects_segment(line_segment[0:2], line_segment[2:4], right_base, tip))

# Function to draw a triangle
def draw_triangle(img, angle):
    (tip, left_base, right_base) = get_triangle_coords(img, angle)
    # Draw the triangle using lines, converting coordinates to integers
    img.draw_line(int(tip[0]), int(tip[1]), int(left_base[0]), int(left_base[1]), color=(255, 0, 0))
    img.draw_line(int(left_base[0]), int(left_base[1]), int(right_base[0]), int(right_base[1]), color=(255, 0, 0))
    img.draw_line(int(right_base[0]), int(right_base[1]), int(tip[0]), int(tip[1]), color=(255, 0, 0))



def get_triangle_coords(img, angle):
    # Calculate triangle points based on the angle
    center_x = img.width() // 2
    center_y = img.height() // 2
    size = 40  # Length from tip to base
    height = min(img.width() // 2, img.height() // 2)  # Height of the triangle

    # Calculate the vertices of the triangle
    tip = (center_x, center_y)  # Tip of the triangle (narrow point)
    left_base = (center_x + height * math.cos(math.radians(angle + 180 / N)), 
                 center_y + height * math.sin(math.radians(angle + 180 / N)))  # Bottom left
    right_base = (center_x + height * math.cos(math.radians(angle - 180 / N)), 
                  center_y + height * math.sin(math.radians(angle - 180 / N)))  # Bottom right
    return (tip, left_base, right_base)

def find_circles(img):
    circles = img.find_circles(
        threshold=3500,
        x_margin=10,
        y_margin=10,
        r_margin=10,
        r_min=5,
        r_max=100,
        r_step=2)
    print("finding circles")
    print(len(circles))
    for circle in circles:
        print("printing circle")
        img.draw_circle(circle.x(), circle.y(), circle.r(), color=(0, 255, 0))
    print("returning")
    return circles

def find_lines(img):
    lines = img.find_line_segments()
    print("finding lines")
    print(len(lines))
    for line in lines:
        img.draw_line(line.line(), color=(0, 0, 255))
    return lines

while False:
    img = sensor.snapshot()
    img.crop(x_scale=.5, y_scale=.5)
    circles = find_circles(img)
    lines = find_lines(img)
    print("returned, waiting");
    time.sleep(1)

# Main loop
while True:
    for i in range(N):
        angle = (360 / N) * i
        img = sensor.snapshot()  # Move snapshot inside the loop
        img.crop(x_scale=.5, y_scale=.5)

        triangle = get_triangle_coords(img, angle)
        line_segments = find_lines(img)
        for line in line_segments:
            if line_intersects_triangle(line, triangle):
                print("line intersects triangle")
                img.draw_line(line.line(), color=(0, 255, 0))
        draw_triangle(img, angle)
        time.sleep(X / 1000)  # Wait for X seconds



