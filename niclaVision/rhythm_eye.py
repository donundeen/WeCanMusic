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
    size = 40  # Length from tip to base
    height = min(img.width() // 2, img.height() // 2)  # Height of the triangle

    # Calculate the vertices of the triangle
    tip = (center_x, center_y)  # Tip of the triangle (narrow point)
    left_base = (center_x + height * math.cos(math.radians(angle + 180 / N)), 
                 center_y + height * math.sin(math.radians(angle + 180 / N)))  # Bottom left
    right_base = (center_x + height * math.cos(math.radians(angle - 180 / N)), 
                  center_y + height * math.sin(math.radians(angle - 180 / N)))  # Bottom right
    
    # Draw the triangle using lines, converting coordinates to integers
    img.draw_line(int(tip[0]), int(tip[1]), int(left_base[0]), int(left_base[1]), color=(255, 0, 0))
    img.draw_line(int(left_base[0]), int(left_base[1]), int(right_base[0]), int(right_base[1]), color=(255, 0, 0))
    img.draw_line(int(right_base[0]), int(right_base[1]), int(tip[0]), int(tip[1]), color=(255, 0, 0))

# Main loop
while True:
    for i in range(N):
        img = sensor.snapshot()  # Move snapshot inside the loop
        angle = (360 / N) * i
        draw_triangle(img, angle)
        
        # Detect shapes in the image
        blobs = img.find_blobs([(0, 100, 0, 255, 0, 255)], merge=True)  # Example for green color
        for blob in blobs:
            # Check if the blob intersects with the triangle (implement intersection logic)
            # This is a placeholder for your intersection logic
            if True:  # Replace with actual intersection check
                img.draw_rectangle(blob.rect(), color=(0, 255, 0))  # Draw detected shape
        
        time.sleep(X / 1000)  # Wait for X seconds
