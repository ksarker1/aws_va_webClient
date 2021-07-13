console.log("Hello World!");

console.log(navigator.getUserMedia);
if (!navigator.mediaDevices.getUserMedia){
  console.log("No getUserMedia?")
  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia || navigator.msGetUserMedia || navigator.mediaDevices.getUserMedia;
  }

if (navigator.getUserMedia) {
  navigator.getUserMedia({audio:true}, success, function(e) {
    alert('Error capturing audio.');
    });
  } else alert('getUserMedia not supported in this browser.');


function success(e){
  console.log("Event occured", e);

}
