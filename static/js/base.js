var recording = false;
//document.getElementById('next').disabled = true;
async function startCall(){
	//playAll_files();
			document.getElementById('call').disabled = true;
			playAll('phone-calling.mp3', 0.5);
			test();
			
			var socket = new WebSocket('wss://www.smartVirtualAssistant.net/ws/');
			console.log(socket)
			socket.onopen = function (event) {
  				socket.send("Client connected");
  				initiateRecording(socket);
  				start();
				};
			socket.onmessage = function(event){
				var data = event.data;
				console.log(data)
				if (data == 'end'){
					//document.querySelector('outputFromServer').innerText = "Call Ended";
					stop();
					//document.getElementById('next').disabled = false;
					socket.close();
				}
				else{
					var voiceFile = String(data);
					playAll(voiceFile, 0.5);
				}
			}
			/*
			socket.onmessage = function(event){
				var data = JSON.parse(event.data);
				if (data.message == 'pause'){
					console.log("paused ");
					//if (recording == true){
					//	stop();
					//}
					//console.log(recordAudio.state);
				} else if (data.message == 'unpause') {
					//initiateRecording();
					//start();
					console.log("unpaused ");
				}
				else{
					var voiceFile = String(data.message);
					//var fileNo = Math.floor(Math.random() * 4)+1
					//var voiceFile = 'SmartVAstatements/hold/voice_'+fileNo+'.flac';
					//var audio = new Audio(data.message);
					playAll(voiceFile, 0.5);
					//console.log("static/"+voiceFile);
					document.querySelector('outputFromServer').innerText = "static/"+data.message;
				}
				
			}
			, function(error) {
		    console.log(JSON.stringify(error));
			}
			*/

}

function next(){
	document.getElementById('call').disabled = false;
	//document.getElementById('next').disabled = true;
}

function test(){
	playAll('announce.flac');
	playAll('forward.flac');
	playAll('thank_4_hold.flac');
	playAll('purpose.flac');
	playAll('voice_mail.flac');
	var i;
	for (i = 1; i < 6; i++) {
	  	//var fileNo = Math.floor(Math.random() * 4)+1
		playAll('SmartVAstatements/hold/voice_'+i+'.flac');
		playAll('SmartVAstatements/name/voice_'+i+'.flac');
		playAll('SmartVAstatements/help/voice_'+i+'.flac');
		playAll('SmartVAstatements/repeat/voice_'+i+'.flac');
	}
	for (i = 1; i < 5; i++) {
	  	//var fileNo = Math.floor(Math.random() * 4)+1
		playAll('SmartVAstatements/how_are_you/voice_'+i+'.flac');
		playAll('SmartVAstatements/right_name/voice_'+i+'.flac');
		playAll('SmartVAstatements/wrong_name/voice_'+i+'.flac');
	}
	for (i = 1; i < 4; i++) {
	  	//var fileNo = Math.floor(Math.random() * 4)+1
		playAll('SmartVAstatements/weather/voice_'+i+'.flac');
		playAll('SmartVAstatements/more/voice_'+i+'.flac');
		playAll('SmartVAstatements/speak_up/speak_up_'+i+'.flac');
	}
	
}
function playAll(path, vol = 0.0){
	var voiceFile = path;
		//var audio = new Audio(data.message);
		//console.log("static/"+voiceFile);
		var audio = new Audio("static/"+voiceFile); 
		audio.volume = vol;
		audio.crossOrigin = 'anonymous';
		var playPromise = audio.play();
		setInterval(function(){
			if(audio.currentTime>8){
				audio.pause();
					}
				},10);
		
		if (playPromise) {
		        playPromise.catch((e) => {
		            if (e.name === 'NotAllowedError' ||
		                e.name === 'NotSupportedError') {
		                console.log(e.name);
		            }
		        });
		    }
}

function testMic() {
	// Create an Audio input
	navigator.getUserMedia({
		    audio: true
		}, function(stream) {
		        recordAudio = RecordRTC(stream, {
		        type: 'audio',
		        mimeType: 'audio/webm',
		        sampleRate: 44100, // this sampleRate should be the same in your server code

		        // MediaStreamRecorder, StereoAudioRecorder, WebAssemblyRecorder
		        // CanvasRecorder, GifRecorder, WhammyRecorder
		        recorderType: StereoAudioRecorder,

		        // Dialogflow / STT requires mono audio
		        numberOfAudioChannels: 1,

		        // get intervals based blobs
		        // value in milliseconds
		        // as you might not want to make detect calls every seconds
		        timeSlice: 1000,

		        // only for audio track
		        // audioBitsPerSecond: 128000,

		        // used by StereoAudioRecorder
		        // the range 22050 to 96000.
		        // let us force 16khz recording:
		        desiredSampRate: 16000,

		        //2)
                // as soon as the stream is available
                ondataavailable: function(blob) {
                	
                	window.Stream = client.createStream();
                	window.Stream.write(convertoFloat32ToInt16(blob));
                },
		    });

		    recordAudio.startRecording();
		    
		}, function(error) {
		    console.error(JSON.stringify(error));
		});
}

function convertoFloat32ToInt16(buffer) {
	var l = buffer.length;
	var buf = new Int16Array(l)

	while (l--) {
		buf[l] = buffer[l]*0xFFFF;    //convert to 16 bit
	}
	return buf.buffer
}

function initializeRecorder(stream) {
	var audioContext = window.AudioContext;
	var context = new audioContext();
	var audioInput = context.createMediaStreamSource(stream);
	var bufferSize = 2048;
	// create a javascript node
	var recorder = context.createJavaScriptNode(bufferSize, 1, 1);
	// specify the processing function
	recorder.onaudioprocess = recorderProcess;
	// connect stream to our recorder
	audioInput.connect(recorder);
	// connect our recorder to the previous destination
	recorder.connect(context.destination);
}

function initiateRecording(sock){
	console.log("Initializing recording.")
	console.log("Client open.");
  if (!navigator.getUserMedia)
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia || navigator.msGetUserMedia;

  if (navigator.getUserMedia) {
    navigator.getUserMedia({audio:true}, success, function(e) {
      alert('Error capturing audio.');
    });
  } else alert('getUserMedia not supported in this browser.');


	function success(e) {
		audioContext = AudioContext || webkitAudioContext;
		context = new audioContext();
		context.sampleRate = 16000;
		compressor = context.createDynamicsCompressor();
        compressor.threshold.value = -50;
        compressor.knee.value = 40;
        compressor.ratio.value = 12;
        compressor.reduction.value = -20;
        compressor.attack.value = 0;
        compressor.release.value = 0.25;

        filter = context.createBiquadFilter();
        filter.Q.value = 8.30;
        filter.frequency.value = 355;
        filter.gain.value = 3.0;
        filter.type = 'bandpass';
        filter.connect(compressor);

		// the sample rate is in context.sampleRate
		audioInput = context.createMediaStreamSource(e);

		var bufferSize = 1024;
		recorder = context.createScriptProcessor(bufferSize, 1, 1);

		recorder.onaudioprocess = function(e){
			if(!recording) {
				return;
			}
			//console.log ('recording');
			var left = e.inputBuffer.getChannelData(0);
			sock.send(convertoFloat32ToInt16(left));
		}
		recorder.connect(filter);
		audioInput.connect(recorder);
		compressor.connect(context.destination);
        filter.connect(context.destination);
		recorder.connect(context.destination); 
	}

	//});
	
}
function start() {
  recording = true;
}

function stop() {
  recording = false;
  
}