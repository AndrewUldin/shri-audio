
/* FALLBACK FOR requestAnimationFrame */
(function() {
	var lastTime = 0;
	var vendors = ['ms', 'moz', 'webkit', 'o'];
	for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
		window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
		window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] 
		|| window[vendors[x]+'CancelRequestAnimationFrame'];
	}
	if (!window.requestAnimationFrame)
		window.requestAnimationFrame = function(callback, element) {
			var currTime = new Date().getTime();
			var timeToCall = Math.max(0, 16 - (currTime - lastTime));
			var id = window.setTimeout(function() { callback(currTime + timeToCall); }, timeToCall);
			lastTime = currTime + timeToCall;
			return id;
		};
	if (!window.cancelAnimationFrame)
		window.cancelAnimationFrame = function(id) {
			clearTimeout(id);
		};
}());
/* FALLBACK FOR requestAnimationFrame */


var context;
var contextCanvas;
var currentBufferData = null;
var Player = {};
var update_interval;
var analyzer = null;
var checkSongEnd = null;
var blockProcess = false;
var low;
var middle;
var high;

var filters = {};
filters['none'] = [0, 0, 0];
filters['rock'] = [20, -10, 20];
filters['jazz'] = [-15, 10, 10];
filters['pop'] = [0, 15, 0];
filters['classic'] = [-10, 10, -10];

window.addEventListener('load', initPlayer, false);

function initPlayer() {
	try {
		// Fix up for prefixing
		window.AudioContext = window.AudioContext||window.webkitAudioContext;
		context = new AudioContext();

		// CANVAS
		var newCanvas	 = document.createElement('canvas');
		var canvasWidth = newCanvas.width = 512;
		var canvasHeight = newCanvas.height = 120;
		var bufferLength;
		var dataArray;
		var current_position = 0;

		document.querySelectorAll('.player')[0].appendChild(newCanvas);
		contextCanvas = newCanvas.getContext('2d');

	}
	catch(e) {
		alert('Web Audio API is not supported in this browser');
	}

	Player.play = function() {

		if (!this.playing) {

			var source = context.createBufferSource();	// creates a sound source
			source.buffer = currentBufferData;					// tell the source which sound to play

			analyzer = context.createAnalyser();
			analyzer.fftSize = 256; // 2048-point FFT

			low = context.createBiquadFilter();
			low.type = 'lowshelf';
			low.frequency.value = 320.0;
			low.Q.value = 0.0;

			middle = context.createBiquadFilter();
			middle.type = 'peaking';
			middle.frequency.value = 1000.0;
			middle.Q.value = 0.0;

			high = context.createBiquadFilter();
			high.type = 'highshelf';
			high.frequency.value = 3200.0;
			high.Q.value = 0.0;

			source.connect(low);
			low.connect(middle);
			middle.connect(high);
			high.connect(analyzer);
			analyzer.connect(context.destination);

				if (!source.start)
					source.start = source.noteOn;
				source.start(0);

			setTimeout(function() {

			checkSongEnd = setInterval(function() {
				current_position = current_position + 0.1;
					if (current_position > currentBufferData.duration) {
						Player.next();
					}
				}, 100);
			}, 300); // cheating!

			this.source = source;
			this.playing = true;
			Player.draw();
			Player.loader(false);
			blockProcess = false;
		}

	}

	Player.draw = function() {

		bufferLength = analyzer.frequencyBinCount;
		dataArray = new Uint8Array(bufferLength);

		drawVisual = requestAnimationFrame(Player.draw);

		analyzer.getByteFrequencyData(dataArray);

		contextCanvas.fillStyle = 'rgb(0, 0, 0)';
		contextCanvas.fillRect(0, 0, canvasWidth, canvasHeight);

		var barWidth = (canvasWidth / bufferLength) * 2.5;
		var barHeight;
		var x = 0;

		for(var i = 0; i < bufferLength; i++) {
			barHeight = dataArray[i];

			contextCanvas.fillStyle = 'rgb(' + (barHeight+100) + ',50,50)';
			contextCanvas.fillRect(x,canvasHeight-barHeight/2,barWidth,barHeight/2);

			x += barWidth + 1;
		}

	};

	Player.stop = function() {

		document.getElementById("song-"+currentIndex).className = 'song';
		if (!this.source.stop)
		this.source.stop = source.noteOff;
		this.source.stop(0);
		this.playing = false;
		current_position = 0;
		cancelAnimationFrame(drawVisual);
		contextCanvas.fillStyle = 'rgb(0, 0, 0)';
		contextCanvas.fillRect(0, 0, canvasWidth, canvasHeight);
		clearInterval(checkSongEnd);
	}

	Player.toggle = function() {
		this.playing ? this.stop() : this.play();
		this.playing = !this.playing;
	}

	Player.load = function() {

		if (blockProcess != true) {
			blockProcess = true;
			Player.loader(true);

			if (!currentIndex) {
				currentIndex = 0;
			}

			if (currentIndex > playlist.length - 1) currentIndex = 0; 
			if (currentIndex < 0) currentIndex = playlist.length - 1; 

			var currentSong = playlist[currentIndex];
			// todo: check for correct element

			document.getElementById("meta").innerText = 'No meta';
			id3(currentSong.fileInfo, function(err, tags) {
				console.log(tags);
				document.getElementById("meta").innerText = tags.title + ' - ' + tags.artist;
			});

			document.getElementById("song-"+currentIndex).className = 'song active';
			context.decodeAudioData(currentSong.fileData.result, function(buffer) {
				currentBufferData = buffer;
				document.querySelectorAll(".player")[0].style.display = 'block';
				Player.play();
				document.getElementById("play").style.display = 'none';
				document.getElementById("stop").style.display = 'inline';
			});
		}

	}

	Player.next = function() {

		if (Player.playing) {
			Player.stop();
		}

		if (currentIndex === false) 
			currentIndex = 0;
		else
			currentIndex++;

		clearInterval(checkSongEnd);
		current_position = 0;

		Player.load();

		return false;

	}
	Player.prev = function() {

		if (Player.playing) {
			Player.stop();
		}

		if (currentIndex === false) 
			currentIndex = playlist.length - 1;
		else 
			currentIndex--;

		clearInterval(checkSongEnd);
		current_position = 0;
		
		Player.load();	

		return false;

	}
	Player.todeck = function(index) {

		if (Player.playing) {
			Player.stop();
		}

		currentIndex = index;

		clearInterval(checkSongEnd);
		current_position = 0;
		
		Player.load();

		return false;

	}

	Player.changeeq = function(ftype) {
		low.gain.value = filters[ftype][0];
		middle.gain.value = filters[ftype][1];
		high.gain.value = filters[ftype][2];
	}

	Player.loader = function(action) {
		if (action === true) {
			document.getElementById("loader").style.display = 'block';
		} else {
			document.getElementById("loader").style.display = 'none';
		}
	}

	document.getElementById("play").addEventListener("click", function() {

		Player.load();
		return false;

	});

	document.getElementById("stop").addEventListener("click", function() {

		document.getElementById("play").style.display = 'inline';
		document.getElementById("stop").style.display = 'none';
		Player.stop();
		return false;

	});

	document.getElementById("next").addEventListener("click", function() {

		Player.next();

	});

	document.getElementById("prev").addEventListener("click", function() {

		Player.prev();

	});

	document.getElementById("changeeq").addEventListener("change", function() {

		Player.changeeq(this.value);

	});

}