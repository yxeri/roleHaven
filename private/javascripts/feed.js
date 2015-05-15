"use strict";

var main = document.getElementById('main');
var mainFeed = document.getElementById('mainFeed');
var charTimeout = 20;
var timeoutBuffer = 200;
var timeouts = new Array();
var messageQueue = new Array();
//TODO Move to database
var logo = {
	speed : 2,
	text : [
	' ',
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
	' ',
	' '
	]
};
var bootText = {
	text : [
		'Initiating connection to HQ',
		'Syncing data',
		'Welcome, esteemed employee #166584',
		'WEATHER WARNING: High amount of acid rain predicted',
		'RECOMMENDATION: Stay indoors',
		'Have a productive day!'
	]
}
// var interruptionSound = new Audio('sounds/interruption.mp3');
// interruptionSound.play();

main.addEventListener('click', function() {
	messageQueue.push({text : 'BLIRP BLORP'});
	console.log(messageQueue);
});

messageQueue.push(logo);
messageQueue.push(bootText);
printText(messageQueue);

function printText(messageQueue) {
	var lastTimeout = 0;

	while(messageQueue.length != 0) {
		var message = messageQueue.shift();

		while(message.text.length != 0) {
			var text = message.text.shift();
			var speed = message.speed;

			setTimeout(addRow, calculateTimer(text, speed) + lastTimeout, text, speed, true, 'logo');
			lastTimeout += calculateTimer(text, speed);
		}
	}
}

function calculateTimer(text, speed) {
	var timeout = speed ? speed : charTimeout;
	return (text.length * timeout) + timeoutBuffer;
}

function calculateCharTimer(speed) {
	var timeout = speed ? speed : charTimeout;
	return timeout;
}

//TODO text should not be an array
function addRow(text, speed, keepWhiteSpace, extraClass) {
	var row = document.createElement('li');
	var span = document.createElement('span');

	if(keepWhiteSpace) {
		var pre = document.createElement('pre');
		// Add pre element around span to keep whitespace intact
		pre.appendChild(span);
		// Add pre element to li element
		row.appendChild(pre);
	} else {
		row.appendChild(span);
	}

	if(extraClass) {
		row.classList.add(extraClass);
	}

	// Add li element to ul element
	mainFeed.appendChild(row);
	addLetters(span, text, speed);
	setTimeout(scrollView, calculateTimer(text, speed), row);
}

function addLetters(span, text, speed) {
	var lastTimeout = 0;

	for(var i = 0; i < text.length; i++) {
		setTimeout(printLetter, calculateCharTimer(speed) + lastTimeout, span, text.charAt(i));
		lastTimeout += calculateCharTimer(speed);
	}

}

function printLetter(span, char) {
	span.innerHTML += char;
}

function scrollView(element) {
	element.scrollIntoView();
}