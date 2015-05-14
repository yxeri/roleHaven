"use strict";

var main = document.getElementById('main');
var mainFeed = document.getElementById('mainFeed');
var lastTimeout;
var timeout = 100;
var timeouts = new Array();
//TODO Move to database
var bootText = [
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
// 'Initiating connection to HQ',
// 'Syncing data',
// 'Welcome, esteemed employee #166584',
// 'WEATHER WARNING: High amount of acid rain predicted',
// 'RECOMMENDATION: Stay indoors.',
// 'Have a productive day!',
// 'WEATHER WARNING: High amount of acid rain predicted. For real. WEATHER WARNING: High amount of acid rain predicted. For real',
];
var words = {
	'connected' : 'Connected',
	'done' : 'Done',
	'loadingMarker' : '.'
}
// var interruptionSound = new Audio('sounds/interruption.mp3');
// interruptionSound.play();

main.addEventListener('click', function() {
	addRow();
});

printBootText();

function printBootText() {
	for(var i = 0; i < bootText.length; i++) {
		if (i > 28) {	
			setTimeout(addRow, timeout * i, bootText[i], false);
		} else {
			setTimeout(addRow, timeout * i, bootText[i], true, 'logo');
		}
		console.log(timeout * i);
	}
}

function addRow(text, keepWhiteSpace, extraClass) {
	var row = document.createElement('li');
	var span = document.createElement('span');
	var text = document.createTextNode(text);

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

	// Add text to span element
	span.appendChild(text);
	// Add li element to ul element
	mainFeed.appendChild(row);
	setTimeout(scrollView, timeout, row);
}

function scrollView(element) {
	element.scrollIntoView();
}