"use strict";

var main = document.getElementById('main');
var mainFeed = document.getElementById('mainFeed');
var input = document.getElementById('input');
var marker = document.getElementById('marker');
// Timeout for print of a character (milliseconds)
var charTimeout = 20;
// Timeout between print of rows (milliseconds)
var timeoutBuffer = 100;
// Queue of all the message objects that will be handled and printed
var messageQueue = [];
// Characters left to print during one call to printText().
// It has to be zero before another group of messages can be printed.
var charsInProgress = 0;
var previousCommands = ['ls moo/blah', 'cd fake/dir'];
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
	'  ######                    ##       #      #############',
	'    ####                    ##       #      ##     ####',
	'    ####                    ##       #      ##    #####',
	'    ####                    ##       #      ###########',
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
		':D'
	]
}
var commandFailText = {	text : ['command not found'] }
var shellText = { text : ['bush-3.2$ '] }
var validCommands = {
	ls : {
		func : function() {console.log('ls')},
		help : ['Shows a list of files and directories in the diretory.'],
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
		func : function() {console.log('help')},
		help : 'Shows a list of available commands'
	},
	pwd : {
		func : function() {console.log('pwd')},
		help: 'Shows the current directory'
	}
};

// var interruptionSound = new Audio('sounds/interruption.mp3');
// interruptionSound.play();

// Disable left mouse clicks
document.onmousedown = function() {
	return false;
};

main.addEventListener('click', function() {
	marker.focus();
});

addEventListener('keypress', keyPress, true);
// Needed for arrow keys. They are not detected with keypress
addEventListener('keydown', specialKeyPress, true);

// Needed for arrow and delete keys. They are not detected with keypress
function specialKeyPress(event) {
	var keyCode = event.keyCode;
	var markerParentsChildren = marker.parentElement.childNodes;
	var markerLocation;

	for(var i = 0; i < markerParentsChildren.length; i++) {
		if(markerParentsChildren[i] === marker) {
			markerLocation = i;
			break;
		}
	}

	console.log("special", keyCode);

	switch(keyCode) {
		// Backspace
		case 8:
			// Remove character to the left of the marker
			if(markerParentsChildren[markerLocation - 1] && markerParentsChildren[markerLocation - 1].textContent) {
				console.log("Content to be removed: ", markerParentsChildren[markerLocation - 1].textContent);
				console.log("Content in marker: ", marker.textContent);
				console.log("Slice: ", markerParentsChildren[markerLocation - 1].textContent.slice(0, -1))
				markerParentsChildren[markerLocation - 1].textContent = markerParentsChildren[markerLocation - 1].textContent.slice(0, -1);
			}

			break;
		// Delete
		case 46:
			// Remove character from marker and move it right
			if(markerParentsChildren[markerLocation + 1].textContent) {
				var rightText = markerParentsChildren[markerLocation + 1].textContent;
				var textChar = rightText[0];
				markerParentsChildren[markerLocation + 1].textContent = rightText.slice(1);
				marker.textContent = textChar;
			} else {
				marker.textContent = " ";
			}

			break;
		// Left arrow
		case 37:
			if(markerParentsChildren[0].textContent) {
				var leftText = markerParentsChildren[markerLocation - 1].textContent;
				var textChar = leftText[leftText.length - 1];

				console.log("Left: ", leftText, ". Char: ", textChar);
				markerParentsChildren[markerLocation + 1].textContent = marker.textContent + markerParentsChildren[markerLocation + 1].textContent;
				markerParentsChildren[markerLocation - 1].textContent = leftText.slice(0, -1);
				marker.textContent = textChar;
			}

			break;
		// Right arrow
		case 39:
			if(markerParentsChildren[markerParentsChildren.length - 1].textContent) {
				var rightText = markerParentsChildren[markerLocation + 1].textContent;
				var textChar = rightText[0];
				
				markerParentsChildren[markerLocation - 1].textContent = markerParentsChildren[markerLocation - 1].textContent + marker.textContent;
				markerParentsChildren[markerLocation + 1].textContent = rightText.slice(1);
				marker.textContent = textChar;
			}

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
	var keyCode = event.keyCode;
	var markerParentsChildren = marker.parentElement.childNodes;
	var markerLocation;

	for(var i = 0; i < markerParentsChildren.length; i++) {
		if(markerParentsChildren[i] === marker) {
			markerLocation = i;
			break;
		}
	}

	console.log('keypress', keyCode);

	switch(keyCode) {
		// Enter
		case 13:
			var message = { text : [shellText.text + marker.parentElement.textContent] };
			var phrases = marker.parentElement.textContent.toLowerCase().trim().split(' ');

			console.log(phrases);

			if(phrases[0] in validCommands) {
				if(phrases[1] === '--help') {
					message.text = message.text.concat(validCommands[phrases[0]].help);
					message.text = message.text.concat(validCommands[phrases[0]].instructions);
					console.log(message.text);
				} else {
					console.log('Couldnt match help');
					validCommands[phrases[0]].func();
				}

				messageQueue.push(message);				
			} else {
				message.text.push('- ' + phrases[0] + ': ' + commandFailText.text);
				messageQueue.push(message);
			}

			for(var i = 0; i < markerParentsChildren.length; i++) {
				markerParentsChildren[i].textContent = '';
			}

			// Fix for blinking marker
			marker.textContent = ' ';

			break;
		default:
			var textChar = String.fromCharCode(keyCode);

			if(textChar) {
				var leftText = markerParentsChildren[markerLocation - 1].textContent;

				markerParentsChildren[markerLocation - 1].textContent += textChar;
			}

			break;
	}

	event.preventDefault();
};

messageQueue.push(logo);
messageQueue.push(bootText);

// Tries to print messages from the queue every second
setInterval(printText, 600, messageQueue);

// Prints messages from the queue
// It will not continue if a print is already in progress,
// which is indicated by charsInProgress being > 0
function printText(messageQueue) {
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
		row.classList.add(extraClass);
	}

	row.appendChild(span);
	mainFeed.appendChild(row);
	addLetters(span, text, speed);
	setTimeout(scrollView, timeout - 20, row);
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
}