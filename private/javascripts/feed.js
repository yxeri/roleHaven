"use strict";

var main = document.getElementById('main');
var mainFeed = document.getElementById('mainFeed');
var timeouts = new Array();
var orgLogo = [
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
'                           ####'
];

for(var i = 0; i < orgLogo.length; i++) {
	setTimeout(addRow, 50 * i, orgLogo[i], true);
}

main.addEventListener('click', function() {
	addRow();
});

function addRow(text, keepWhiteSpace) {
	var elem = document.createElement('li');
	var text = document.createTextNode(text);

	if(keepWhiteSpace) {
		var pre = document.createElement('pre');
		pre.appendChild(text);
		elem.appendChild(pre);

	} else {
		elem.appendChild(text);
	}

	mainFeed.appendChild(elem);
	setTimeout(scrollToBottom, 50);
}

function scrollToBottom() {
	document.body.scrollTop = document.body.scrollHeight;
}