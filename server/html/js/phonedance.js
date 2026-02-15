let USE_HTTPS = false;
let WEBSOCKET_PORT = 80;
let WEBSOCKET_PROTOCOL = "ws://";
if(USE_HTTPS){
    WEBSOCKET_PORT = 443;
    WEBSOCKET_PROTOCOL = "wss://";
}
let ws = null;
$(function() {
    console.log("starting");
    $("#debug").append(" starting");

    let host =  window.location.host;
    host = host.replace(/:[0-9]+/,"");
    // remove port
    console.log(host);

    let websocketurl = WEBSOCKET_PROTOCOL+host+':'+WEBSOCKET_PORT;
    console.log("trying to start websocket server ", websocketurl);
    ws = new WebSocket(websocketurl);

    $("#startmotion").click(function(){
        startMotionInteraction();
        setInterval(updateMotion, 10);

    });


});


let collectingMotion = false;
let latestEvent = null;
function updateMotion(){
    if(collectingMotion && latestEvent){
        console.log("latest event", latestEvent);

        try{
            const acceleration = latestEvent.acceleration;
            const rotation = latestEvent.rotationRate;
            const gravity = latestEvent.accelerationIncludingGravity;
            const interval = latestEvent.interval;
            console.log('Acceleration along X: ' + acceleration.x);
            console.log('Acceleration along Y: ' + acceleration.y);
            console.log('Acceleration along Z: ' + acceleration.z);
            $("#acceleration").html("Acceleration along X: " + acceleration.x + "<br>Acceleration along Y: " + acceleration.y + "<br>Acceleration along Z: " + acceleration.z);
            if(rotation){
    //                        $("#rotation").html("Rotation along alpha: " + rotation.alpha + "<br>Rotation along beta: " + rotation.beta + "<br>Rotation along gamma: " + rotation.gamma);
                $("#rotation").html("Rotation along alpha: " + rotation.alpha + "<br>Rotation along beta: " + rotation.beta + "<br>Rotation along gamma: " + rotation.gamma);
            }
            if(gravity){
                $("#gravity").html("Gravity along X: " + gravity.x + "<br>Gravity along Y: " + gravity.y + "<br>Gravity along Z: " + gravity.z);
            }
            if(interval){
                $("#interval").html("Interval: " + interval);
            }
            motionData = {acceleration: acceleration, rotation: rotation, gravity: gravity, interval: interval};
            sendMotion(motionData);
            latestEvent = null;

        }catch(e){
            $("#debug").append("error accessing motion event: "+e);
        }
    }
}

function sendMotion(event){
    let msg = {address : "/devmotion",
        data: event}; 

    console.log("sending motion", event);
    ws.send(JSON.stringify(msg));
}

function startMotionInteraction(){
    $("#debug").append("starting listening to motion");


    if (typeof DeviceMotionEvent.requestPermission === 'function') {
        DeviceMotionEvent.requestPermission()
            .then(response => {
                if (response === 'granted') {
                    // Start listening to motion events
                    startListeningToMotion();
                } else {
                    collectingMotion = false;
                    $("#debug").append("Permission denied for DeviceMotion.");
                    console.log("Permission denied for DeviceMotion.");
                }
            })
            .catch(function(e){
                $("#debug").append("error requesting permission for DeviceMotion: "+e);
            });
    } else {
        // Fallback for browsers that do not require permission
        startListeningToMotion();
    }


    function startListeningToMotion() {
        $("#debug").append("starting listening to motion");
        try{
            window.addEventListener('devicemotion', function(event) {
                console.log("motion event");
                latestEvent = event;
            }, false);
            collectingMotion = true;
        }catch(e){
            $("#debug").append("error starting listening to motion: "+e);
        }
    }    
}