$(function() {
    console.log("starting");
    const ws = new WebSocket('ws://localhost:8080');

    if (typeof DeviceMotionEvent.requestPermission === 'function') {
        DeviceMotionEvent.requestPermission()
            .then(response => {
                if (response === 'granted') {
                    // Start listening to motion events
                    startListeningToMotion();
                } else {
                    $("#debug").html("Permission denied for DeviceMotion.");
                    console.log("Permission denied for DeviceMotion.");
                }
            })
            .catch(console.error);
    } else {
        // Fallback for browsers that do not require permission
        startListeningToMotion();
    }


    function startListeningToMotion() {
        window.addEventListener('devicemotion', function(event) {
            const acceleration = event.acceleration;
            console.log('Acceleration along X: ' + acceleration.x);
            console.log('Acceleration along Y: ' + acceleration.y);
            console.log('Acceleration along Z: ' + acceleration.z);
            $("#acceleration").html("Acceleration along X: " + acceleration.x + "<br>Acceleration along Y: " + acceleration.y + "<br>Acceleration along Z: " + acceleration.z);
            $("#rotation").html("Rotation along X: " + rotation.x + "<br>Rotation along Y: " + rotation.y + "<br>Rotation along Z: " + rotation.z);
            $("#gravity").html("Gravity along X: " + gravity.x + "<br>Gravity along Y: " + gravity.y + "<br>Gravity along Z: " + gravity.z);
        }, false);
    }

});