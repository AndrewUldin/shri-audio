var holder = document.getElementById('holder'), // placeholder for files
	state = document.getElementById('status'), // status for webapi check message
	playlist = [], // global array for uploaded files
	playlistDiv = document.getElementById("playlist"), // placeholder for playlist
	currentIndex = false; // current song

window.addEventListener('load', initFileUpload, false);

function initFileUpload() {

// can i use file api?
if (typeof window.FileReader === 'undefined') {
	state.className = 'fail';
	state.innerHTML = 'File API & FileReader unavailable';
	holder.style.display = 'none';
} else {
	state.className = 'success';
}
// can i use file api?


/**
* This function add sond line to playlist
* should be used after file upload
*/
function pushToPlaylist(uploadedFile, index) {

	// create song line in playlist div
	var songDiv = document.createElement('div');
	songDiv.id = 'song-'+index;
	songDiv.className = 'song';
	songDiv.innerHTML = uploadedFile.name;

	// click event for play file
	songDiv.addEventListener('click', setFileInPlayer);

	// append song line to playlist div
	playlistDiv.appendChild(songDiv);

	return true;
}


// default event listeners for file upload holder
holder.ondragover = function () { this.className = 'hover'; return false; };
holder.ondragleave = function () { this.className = ''; return false; };
holder.ondragend = function () { this.className = ''; return false; };

/**
* This function catch files list, try to parse and push to global playlist array
* If actions ends success — call pushToPlayList function
*/
holder.ondrop = function (e) {
	this.className = '';
	e.preventDefault(); // prevent default action (by default browser try to open the file)

	var uploadedFiles = e.dataTransfer.files; // get all dropped files
	var imageType = /audio.*/; // file mime type mask

	for (var i = 0, file; file = uploadedFiles[i]; i++) { // for each try to process

		if (file.type.match(imageType)) { // check for filetype


		var reader = new FileReader(); // create new filereader

		reader.onload = (function(theFile) { // will be called after file processing. It will be async action thats why function must be anonymous

			var audioFile = { // collect information about file
				fileInfo: theFile,
				fileData: reader
			}
			var index = playlist.push(audioFile) - 1; // This is not much good method. If you will delete some element from array index can be not unique. That's why I generate index of element by myself

			// var index = Math.floor(Math.random() * 1000001);
			// playlist[index] = audioFile; // push to playlist
			pushToPlaylist(theFile, index); // just draw song line in playlist

		})(file); // transfer file to function in THIS moment

		reader.readAsArrayBuffer(file);

		document.querySelectorAll(".player")[0].style.display = 'block';

		} else { // check for filetype
			console.log("File not supported!");
		} // check for filetype
	}

	return false;
}; // holder.ondrop

function setFileInPlayer() {
	Player.todeck(parseInt(this.id.replace("song-", "")));
}

}