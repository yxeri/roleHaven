"use strict";

var main = document.getElementById('main');
var mainFeed = document.getElementById('mainFeed');
var charTimeout = 20;
var timeoutBuffer = 100;
var timeouts = new Array();
var messageQueue = new Array();
var charsInProgress = 0;
//TODO Move to database
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
// var interruptionSound = new Audio('sounds/interruption.mp3');
// interruptionSound.play();

main.addEventListener('click', function() {
	messageQueue.push({text : ['BLIRP BLORP']});
});

messageQueue.push(logo);
messageQueue.push(bootText);

setInterval(printText, 1000, messageQueue);

function printText(messageQueue) {
	console.log(charsInProgress);
	if(charsInProgress == 0) {
		var nextTimeout = 0;
		charsInProgress = countTotalCharacters(messageQueue);

		while(messageQueue.length != 0) {
			var message = messageQueue.shift();

			while(message.text.length != 0) {
				var text = message.text.shift();
				var speed = message.speed;

				setTimeout(addRow, nextTimeout, text, speed, message.extraClass);

				nextTimeout += calculateTimer(text, speed);
			}
		}
	}
}

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

function calculateTimer(text, speed) {
	var timeout = speed ? speed : charTimeout

	return (text.length * timeout) + timeoutBuffer;
}

//TODO text should not be an array
function addRow(text, speed, extraClass) {
	var row = document.createElement('li');
	var span = document.createElement('span');

	if(extraClass) {
		row.classList.add(extraClass);
	}

	row.appendChild(span);
	mainFeed.appendChild(row);
	addLetters(span, text, speed);
	setTimeout(scrollView, calculateTimer(text), row);
}

function addLetters(span, text, speed) {
	var lastTimeout = 0;
	var timeout = speed ? speed : charTimeout;

	for(var i = 0; i < text.length; i++) {
		setTimeout(printLetter, timeout + lastTimeout, span, text.charAt(i));

		lastTimeout += timeout;
	}

}

function printLetter(span, char) {
	span.innerHTML += char;
	charsInProgress--;
}

function scrollView(element) {
	element.scrollIntoView();
}