"use strict";

var mainFeed = document.getElementById('mainFeed');
var marker = document.getElementById('marker');
var inputText = document.getElementById('inputText');
var input = document.getElementById('input');
var inputStart = document.getElementById('inputStart');
// Timeout for print of a character (milliseconds)
var charTimeout = 20;
// Timeout between print of rows (milliseconds)
var timeoutBuffer = 100;
// Queue of all the message objects that will be handled and printed
var messageQueue = [];
// Characters left to print during one call to printText().
// It has to be zero before another group of messages can be printed.
var charsInProgress = 0;
var previousCommands = [];
var currentUser = 'Agent47';
var logo = {
	speed : 2,
	extraClass : 'logo', 
	text : [
	' ',
	'                           ####',
	'                 ####    #########    ####',
	'                ###########################',
	'               #############################',
	'             #######        ##   #  ##########',
	'       ##########           ##    #  ###  ##########',
	'      #########             #########   #   #########',
	'        #####               ##     ########   #####',
	'      #####                 ##     ##     ##########',
	'      ####                  ##      ##     #   ######',
	'  #######                   ##########     ##    ########',
	' ########                   ##       ########     ########',
	'  ######      ORGANICA      ##       #      #############',
	'    ####     ORACLE         ##       #      ##     ####',
	'    ####     OPERATIONS     ##       #      ##    #####',
	'    ####      CENTER        ##       #      ###########',
	' ########                   ##       #########    ########',
	' ########                   ##########      #    #########',
	'  ########                  ##      ##     ## ###########',
	'      #####                 ##      ##     ### #####',
	'        #####               ##     ########   #####',
	'       #######              ##########   #  ########',
	'      ###########           ##    ##    # ###########',
	'       #############        ##    #   #############',
	'             ################################',
	'               ############################',
	'               #######  ##########  #######',
	'                 ###       ####       ###',
	'                           ####',
	' '
	]
};
var bootText = {
	text : [
		'Initiating connection to HQ',
		'Syncing data',
		'Welcome, esteemed employee #166584',
		'WEATHER WARNING: High amount of acid rain predicted. Strong winds. Solar flares. Happy things',
		'RECOMMENDATION: Stay indoors',
		'Have a productive day!',
		'!_!',
		'^_^',
		':D',
		':D',
		':D',
		':D',
		'^_^',
		':D',
		':D',
		':D',
		':D',
		':D',
		'^_^'
	]
}
var commandFailText = {	text : ['command not found'] }
var shellText = { text : ['3OC-3.2$ '] }
var validCommands = {
	ls : {
		func : function() {console.log('ls')},
		help : ['Shows a list of files and directories in the directory.'],
		instructions : [
			' Usage:',
			'  ls *directory*',
			'  ls',
			' Example:',
			'  ls /usr/bin'
		]
	},
	cd : {
		func : function() {console.log('cd')},
		help : ['Move to sent directory.'],
		instructions : [
			' Usage:',
			'  cd *directory*',
			' Example:',
			'  cd /usr/bin'
		]
	},
	help : {
		func : function() {
			var keys = Object.keys(validCommands);
			var messageObj = { text : [] };
			var arrayIndex = 0;

			keys.sort();

			for(var i = 0; i < keys.length; i++) {
				var msg = '';

				if(i > 0) {
					if(i % 3 === 0) {
						arrayIndex++; 
					} else {
						msg += '\t';
					}
				}

				if(!messageObj.text[arrayIndex]) { messageObj.text[arrayIndex] = '' }

				msg += keys[i];
				messageObj.text[arrayIndex] += msg;
			}

			messageQueue.push(messageObj);

			console.log(messageObj);
		},
		help : ['Shows a list of available commands']
	},
	pwd : {
		func : function() {console.log('pwd')},
		help : ['Shows the current directory']
	},
	clear : {
		func : function () {
			while(mainFeed.childNodes.length > 1) {
				mainFeed.removeChild(mainFeed.lastChild);
			}
		},
		help : ['Clears the terminal view'],
		clearAfterUse : true
	},
	whoami : {
		func : function () {
			messageQueue.push({ text : [currentUser] })
		},
		help : ['Shows the current user']
	}
};

function startBoot() {
	inputStart.textContent = shellText.text[0];

	// Disable left mouse clicks
	document.onmousedown = function() {
		marker.focus();
		return false;
	};

	addEventListener('touchstart', function(event) {
		event.preventDefault();
		marker.focus();
		marker.textContent = "touchstart";
	});
	addEventListener('touchmove', function(event) {
		event.preventDefault();
		marker.focus();
		marker.textContent = "touchmove";
	});
	addEventListener('touchend', function(event) {
		event.preventDefault();
		marker.focus();
		marker.textContent = "touchend";
	});
	addEventListener('keypress', keyPress);
	// Needed for some special keys. They are not detected with keypress
	addEventListener('keydown', specialKeyPress);
	// Tries to print messages from the queue every second
	setInterval(printText, 100, messageQueue);
	messageQueue.push(bootText);
	messageQueue.push(logo);
}

startBoot();

function getLeftText(marker) { return marker.parentElement.childNodes[0].textContent; }

function getRightText(marker) {	return marker.parentElement.childNodes[2].textContent; }

function getInputText() { return inputText.textContent; }

function setLeftText(text) { marker.parentElement.childNodes[0].textContent = text; }

function appendToLeftText(text) { marker.parentElement.childNodes[0].textContent += text; }

function setRightText(text) { marker.parentElement.childNodes[2].textContent = text; }

function prependToRightText(sentText) {	marker.parentElement.childNodes[2].textContent = sentText + marker.parentElement.childNodes[2].textContent; }

function setMarkerText(text) { marker.textContent = text; }

function clearInput() {
	setLeftText('');
	setRightText('');
	// Fix for blinking marker
	setMarkerText(' ');
}

// Needed for arrow and delete keys. They are not detected with keypress
function specialKeyPress(event) {
	var keyCode = (typeof event.which === 'number') ? event.which : event.keyCode;
	var markerParentsChildren = marker.parentElement.childNodes;

	switch(keyCode) {
		// Backspace
		case 8:
			// Remove character to the left of the marker
			if(getLeftText(marker)) {
				setLeftText(getLeftText(marker).slice(0, -1));
			}

			event.preventDefault();

			break;
		// Delete
		case 46:
			// Remove character from marker and move it right
			if(getRightText(marker)) {
				setMarkerText(getRightText(marker)[0]);
				setRightText(getRightText(marker).slice(1));
			} else {
				setMarkerText(" ");
			}

			event.preventDefault();

			break;
		// Left arrow
		case 37:
			// Moves the marker one step to the left
			if(getLeftText(marker)) {
				prependToRightText(marker.textContent);
				setMarkerText(getLeftText(marker).slice(-1));
				setLeftText(getLeftText(marker).slice(0, -1));

				console.log("After. Marker: ", marker.textContent);
				console.log("After. Right: ", getRightText(marker));
				console.log(getLeftText(marker));
			}

			event.preventDefault();

			break;
		// Right arrow
		case 39:
			// Moves marker one step to the right
			if(getRightText(marker)) {				
				appendToLeftText(marker.textContent);
				setMarkerText(getRightText(marker)[0]);
				setRightText(getRightText(marker).slice(1));
			}

			event.preventDefault();

			break;
		// Up arrow
		case 38:
			break;
		// Down arrow
		case 40:
			break;
		default:
			break;
	}
}

function keyPress(event) {
	var keyCode = (typeof event.which === 'number') ? event.which : event.keyCode;
	var markerParentsChildren = marker.parentElement.childNodes;
	var markerLocation;

	for(var i = 0; i < markerParentsChildren.length; i++) {
		if(markerParentsChildren[i] === marker) {
			markerLocation = i;
			break;
		}
	}

	switch(keyCode) {
		// Tab
		case 9:
			var phrases = getInputText().toLowerCase().trim().split(' ');

			for(var i = 0; i < phrases.length; i++) {
				var phrase = phrases[i];

				for(var j = 0; j < phrase.length; j++) {
					var phraseChar = phrase[j];
					console.log(phraseChar);

					for(var k = 0; k < validCommands.length; k++) {

					}
				}
			}

			break;
		// Enter
		case 13:
			var phrases = getInputText().toLowerCase().trim().split(' ');
			var command = validCommands[phrases[0]];

			console.log(phrases);

			if(command) {
				// Print input if the command shouldn't clear after use
				if(!command.clearAfterUse) {
					messageQueue.push({ text : [shellText.text + getInputText()] });
				}

				// Print the help and instruction parts of the command
				if(phrases[1] === '--help') {
					var message = { text : [] };

					if(command.help) { message.text = message.text.concat(command.help); }

					if(command.instructions) { message.text = message.text.concat(command.instructions); }

					if(message.text.length > 0) { messageQueue.push(message); }
				} else {
					command.func();
				}
			// Sent command was not found. Print the failed input
			} else if(phrases[0].length > 0) {
				messageQueue.push({ text : ['- ' + phrases[0] + ': ' + commandFailText.text] });
			}

			clearInput();

			break;
		default:
			var textChar = String.fromCharCode(keyCode);

			console.log("Character: ", textChar);

			if(textChar) { appendToLeftText(textChar); }

			break;
	}

	event.preventDefault();
};

// Prints messages from the queue
// It will not continue if a print is already in progress,
// which is indicated by charsInProgress being > 0
function printText(messageQueue) {
	scrollView(input);

	if(charsInProgress === 0) {
		// Amount of time (milliseconds) for a row to finish printing
		var nextTimeout = 0;
		charsInProgress = countTotalCharacters(messageQueue);

		while(messageQueue.length != 0) {
			var message = messageQueue.shift();

			while(message.text.length != 0) {
				var text = message.text.shift();
				var speed = message.speed;

				setTimeout(addRow, nextTimeout, text, nextTimeout, speed, message.extraClass);

				nextTimeout += calculateTimer(text, speed);
			}
		}
	}
}

// Counts all characters in the message array and returns it
function countTotalCharacters(messageQueue) {
	var total = 0;

	for(var i = 0; i < messageQueue.length; i++) {
		var message = messageQueue[i];

		for(var j = 0; j < message.text.length; j++) {
			var text = message.text[j];
			total += text.length;
		}
	}

	return total;
}

// Calculates amount of time to print text (speed times amount of characters plus buffer)
function calculateTimer(text, speed) {
	var timeout = speed ? speed : charTimeout

	return (text.length * timeout) + timeoutBuffer;
}

function addRow(text, timeout, speed, extraClass) {
	var row = document.createElement('li');
	var span = document.createElement('span');

	if(extraClass) {
		// classList doesn't work on older devices, thus the usage of className
		row.className += ' ' + extraClass;
	}

	row.appendChild(span);
	mainFeed.appendChild(row);
	addLetters(span, text, speed);
}

function addLetters(span, text, speed) {
	var lastTimeout = 0;
	var timeout = speed ? speed : charTimeout;

	for(var i = 0; i < text.length; i++) {
		setTimeout(printLetter, timeout + lastTimeout, span, text.charAt(i));

		lastTimeout += timeout;
	}

}

// Prints one letter and decreases in progress tracker
function printLetter(span, char) {
	span.innerHTML += char;
	charsInProgress--;
}

function scrollView(element) {
	element.scrollIntoView();
	// Compatibility fix
	window.scrollTo(0, document.body.scrollHeight);
}