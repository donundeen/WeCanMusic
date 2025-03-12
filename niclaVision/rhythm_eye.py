import sensor, image, time, math

# Configuration
N = 36  # Number of steps for the triangle sweep (360/N degrees)
X = 1000  # Time in milliseconds to wait between sweeps

# Initialize the camera
sensor.reset()
sensor.set_pixformat(sensor.RGB565)
sensor.set_framesize(sensor.QVGA)
sensor.skip_frames(time=2000)

# Function to draw a triangle
def draw_triangle(img, angle):
    # Calculate triangle points based on the angle
    center_x = img.width() // 2
    center_y = img.height() // 2
    size = min(center_x, center_y)

    print(center_x, center_y, size)
    points = [
        (center_x, center_y - size),  # Top point
        (center_x - size, center_y + size),  # Bottom left
        (center_x + size, center_y + size)   # Bottom right
    ]

    print(points)
    # Rotate points based on the angle
    rotated_points = []
    for point in points:
        x = point[0] - center_x
        y = point[1] - center_y
        rotated_x = int(x * math.cos(math.radians(angle)) - y * math.sin(math.radians(angle))) + center_x
        rotated_y = int(x * math.sin(math.radians(angle)) + y * math.cos(math.radians(angle))) + center_y
        rotated_points.append((rotated_x, rotated_y))

    # Draw the triangle using lines
    img.draw_line(rotated_points[0][0], rotated_points[0][1], rotated_points[1][0], rotated_points[1][1], color=(255, 0, 0))
    img.draw_line(rotated_points[1][0], rotated_points[1][1], rotated_points[2][0], rotated_points[2][1], color=(255, 0, 0))
    img.draw_line(rotated_points[2][0], rotated_points[2][1], rotated_points[0][0], rotated_points[0][1], color=(255, 0, 0))


img = sensor.snapshot()
angle = (360 / N) * 1
draw_triangle(img, angle)
time.sleep(X / 1000)
angle = (360 / N) * 2
draw_triangle(img, angle)

# Main loop
while True:
    for i in range(N):
        img = sensor.snapshot()

        angle = (360 / N) * i
        draw_triangle(img, angle)

        # Detect shapes in the image
        #blobs = img.find_blobs([(0, 100, 0, 255, 0, 255)], merge=True)  # Example for green color
        #for blob in blobs:
            # Check if the blob intersects with the triangle (implement intersection logic)
            # This is a placeholder for your intersection logic
            #if True:  # Replace with actual intersection check
             #   img.draw_rectangle(blob.rect(), color=(0, 255, 0))  # Draw detected shape

        time.sleep(X / 1000)  # Wait for X seconds
