"use strict";

var mainFeed = document.getElementById('mainFeed');
var marker = document.getElementById('marker');
var inputText = document.getElementById('inputText');
var input = document.getElementById('input');
var inputStart = document.getElementById('inputStart');
var socket = io();
// Timeout for print of a character (milliseconds)
var charTimeout = 20;
// Timeout between print of rows (milliseconds)
var timeoutBuffer = 100;
// Queue of all the message objects that will be handled and printed
var messageQueue = [];
// Characters left to print during one call to printText().
// It has to be zero before another group of messages can be printed.
var charsInProgress = 0;
var previousCommands = localStorage.getItem('previousCommands') ? JSON.parse(localStorage.getItem('previousCommands')) : [];
var previousCommandPointer = previousCommands.length > 0 ? previousCommands.length : 0;
var currentUser = 'user1117';
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
    timestamp : true,
    text : [
        'Initiating connection to HQ',
        'Syncing data',
        'Welcome, esteemed employee #166584',
        'WEATHER WARNING: High amount of acid rain predicted. Strong winds. Solar flares. Happy things',
        'RECOMMENDATION: Stay indoors',
        'Have a productive day!'
    ]
};
var commandFailText = { text : ['command not found'] };
var shellText = { text : ['3OC-3.2$ '] };
var validCommands = {
    // ls : {
    //     func : function() { console.log('ls'); },
    //     help : ['Shows a list of files and directories in the directory.'],
    //     instructions : [
    //         ' Usage:',
    //         '  ls *directory*',
    //         '  ls',
    //         ' Example:',
    //         '  ls /usr/bin'
    //     ]
    // },
    // cd : {
    //     func : function() { console.log('cd'); },
    //     help : ['Move to sent directory.'],
    //     instructions : [
    //         ' Usage:',
    //         '  cd *directory*',
    //         ' Example:',
    //         '  cd /usr/bin'
    //     ]
    // },
    help : {
        func : function() {
            messageQueue.push({ text : 'Add --help after a command (with whitespace in between) to get instructions on how to use it' });
            messageQueue.push({ text : getAvailableCommands() });
        },
        help : ['Shows a list of available commands']
    },
    // pwd : {
    //     func : function() { console.log('pwd'); },
    //     help : ['Shows the current directory']
    // },
    clear : {
        func : function() {
            while(mainFeed.childNodes.length > 1) {
                mainFeed.removeChild(mainFeed.lastChild);
            }
        },
        help : ['Clears the terminal view'],
        clearAfterUse : true
    },
    whoami : {
        func : function() {
            messageQueue.push({ text : [socket.id.substr(0, 6)] });
        },
        help : ['Shows the current user']
    },
    msg : {
        func : function() {
            var phrases = getInputText().toLowerCase().trim().split(' ');
            var message = '';
            var user = '<' + socket.id.substr(0, 6) + '> ';

            // Removing command part from the message
            phrases = phrases.slice(1);
            message = phrases.join(' ');

            // Send message to the room
            if(localStorage.getItem('room')) {
                socket.emit('roomMsg', user + message);
            } else {
                socket.emit('message', user + message);
            }
        },
        help : [
            'Sends a message to your current room',
            'The room you are in is written out to the left of the marker'
        ],
        instructions : [
            ' Usage:',
            '  msg *message*',
            ' Example:',
            '  msg Hello!'
        ]
    },
    broadcast : {
        func : function() {
            var phrases = getInputText().toLowerCase().trim().split(' ');
            var message = '';
            var user = '<' + socket.id.substr(0, 6) + '> ';

            // Removing command part from the message
            phrases = phrases.slice(1);
            message = phrases.join(' ');

            socket.emit('broadcastMsg', user + message);
        },
        help : ['Sends a message to everyone connected'],
        instructions : [
            ' Usage:',
            '  broadcast *message*',
            ' Example:',
            '  broadcast Hello!'
        ]
    },
    joinroom : {
        func : function(room) {
            var phrases = getInputText().toLowerCase().trim().split(' ');
            var room = room ? room : phrases[1];

            if(room.length > 0 && room.length <= 6) {
                socket.emit('joinRoom', room);
                localStorage.setItem('room', room);   
                // This should really verify if it has joined the room
                setInputStart(room + '$ ');
            } else {
                messageQueue.push({
                    text : [
                        'The name ' + room + ' is not allowed',
                        'The name of the room has to be 1 to 6 characters',
                        'E.g. room1'
                    ] 
                });
            }
        },
        help : [
            'Joins a group chat room.',
            'You will be prompted for a password if needed.',
            'The room you are in is written out to the left of the marker.',
            'The name of the chat room has a maximum of 6 letters.'
        ],
        instructions : [
            ' Usage:',
            '  join *room name* *optionalPassword*',
            ' Example:',
            '  join sector5'
        ]
    },
    exitroom : {
        func : function() {
            // This should really verify if it has exited the room
            setInputStart(shellText.text[0]);
            socket.emit('exitRoom');
            localStorage.removeItem('room');
        }
    }
};

socket.on('message', function(msg) {
    messageQueue.push({ 
        timestamp : true,
        text : [msg],
    });
});

socket.on('roomMsg', function(msg) {
    messageQueue.push({
        timestamp : true,
        text : ['[' + localStorage.getItem('room') + '] ' + msg]
    });
});

function startBoot() {
    setInputStart(shellText.text[0]);

    // Disable left mouse clicks
    document.onmousedown = function() {
        marker.focus();
        return false;
    };

    document.getElementById('main').addEventListener('click', function(event) {
        marker.focus();
    });
    addEventListener('keypress', keyPress);
    // Needed for some special keys. They are not detected with keypress
    addEventListener('keydown', specialKeyPress);
    
    // Tries to print messages from the queue every second
    setInterval(printText, 100, messageQueue);

    messageQueue.push(bootText);
    messageQueue.push(logo);

    if(localStorage.getItem('room')) {
        validCommands.joinroom.func(localStorage.getItem('room'));
    }
}

startBoot();

function getLeftText(marker) { return marker.parentElement.childNodes[0].textContent; }

function getRightText(marker) { return marker.parentElement.childNodes[2].textContent; }

function getInputText() { return inputText.textContent; }

function setLeftText(text) { marker.parentElement.childNodes[0].textContent = text; }

function appendToLeftText(text) { marker.parentElement.childNodes[0].textContent += text; }

function setRightText(text) { marker.parentElement.childNodes[2].textContent = text; }

function prependToRightText(sentText) { marker.parentElement.childNodes[2].textContent = sentText + marker.parentElement.childNodes[2].textContent; }

function setMarkerText(text) { marker.textContent = text; }

function setInputStart(text) { inputStart.textContent = text; }

function getInputStart() { return inputStart.textContent; }

function clearInput() {
    setLeftText('');
    setRightText('');
    // Fix for blinking marker
    setMarkerText(' ');
}

function getAvailableCommands () {
    var keys = Object.keys(validCommands);
    keys.sort();
    var commands = [];
    var arrayIndex = 0;

    for(var i = 0; i < keys.length; i++) {
        var msg = '';

        if(i > 0) {
            if(i % 3 === 0) {
                arrayIndex++; 
            } else {
                msg += '\t';
            }
        }

        if(!commands[arrayIndex]) { commands[arrayIndex] = ''; }

        msg += keys[i];
        commands[arrayIndex] += msg;
    }

    return commands;
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
        // Tab
        case 9:
            var phrases = getInputText().toLowerCase().trim().split(' ');
            var commands = Object.keys(validCommands);
            var matched = [];

            // Auto-complete should only trigger when one phrase is in the input
            // It will not auto-complete flags
            if(phrases.length === 1 && phrases[0].length > 0) {
                for(var i = 0; i < commands.length; i++) {
                    var matches = false;

                    for(var j = 0; j < phrases[0].length; j++) {
                        if(phrases[0].charAt(j) === commands[i].charAt(j)) {
                            matches = true;
                        } else {
                            matches = false;

                            break;
                        }
                    }

                    if(matches) {
                        matched.push(commands[i]);
                    }
                }

                if(matched.length === 1) {
                    clearInput();
                    setLeftText(matched[0] + ' ');
                } else if(matched.length > 0) {
                    var msg = '';

                    matched.sort();

                    for(var i = 0; i < matched.length; i++) {
                        msg += matched[i] + '\t';
                    }

                    messageQueue.push({ text : [msg] });
                }
            // No input? Show all available commands
            } else {
                messageQueue.push({ text : getAvailableCommands() });
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
            if(previousCommandPointer > 0) {
                clearInput();
                previousCommandPointer--;
                appendToLeftText(previousCommands[previousCommandPointer]);
            }

            event.preventDefault();

            break;
        // Down arrow
        case 40:
            if(previousCommandPointer < previousCommands.length - 1) {
                clearInput();
                previousCommandPointer++;
                appendToLeftText(previousCommands[previousCommandPointer]);
            } else if(previousCommandPointer === previousCommands.length - 1) {
                clearInput();
                previousCommandPointer++
            } else {
                clearInput();
            }

            event.preventDefault();

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
        // Enter
        case 13:
            var phrases = getInputText().toLowerCase().trim().split(' ');
            var command = validCommands[phrases[0]];

            if(command) {
                // Store the command for usage with up/down arrows
                previousCommands.push(getInputText());
                previousCommandPointer++;
                localStorage.setItem('previousCommands', JSON.stringify(previousCommands));

                // Print input if the command shouldn't clear after use
                if(!command.clearAfterUse) {
                    messageQueue.push({ text : [getInputStart() + getInputText()] });
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

            if(textChar) { appendToLeftText(textChar); }

            break;
    }

    event.preventDefault();
}

// Prints messages from the queue
// It will not continue if a print is already in progress,
// which is indicated by charsInProgress being > 0
function printText(messageQueue) {
    if(charsInProgress === 0) {
        // Amount of time (milliseconds) for a row to finish printing
        var nextTimeout = 0;
        charsInProgress = countTotalCharacters(messageQueue);

        while(messageQueue.length !== 0) {
            var message = messageQueue.shift();

            while(message.text.length !== 0) {
                var text = message.text.shift();
                var speed = message.speed;

                setTimeout(addRow, nextTimeout, text, nextTimeout, speed, message.extraClass, message.timestamp);

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

// Gets the current date and time
function calculateNow(day, month, year) {
    var date = new Date();
    var minutes = (date.getMinutes() < 10 ? '0' : '') + date.getMinutes();
    var hours = (date.getHours() < 10 ? '0' : '') + date.getHours();
    // year = year ? year : (date.getFullYear().toString().substr(2));
    // month = (date.getMonth() < 10 ? '0' : '') + (month ? month : (date.getMonth() + 1));
    // day = (date.getDate() < 10 ? '0' : '') + (day ? day : date.getDate());

    return '[' + hours + ':' + minutes + '] ';
}

// Calculates amount of time to print text (speed times amount of characters plus buffer)
function calculateTimer(text, speed) {
    var timeout = speed ? speed : charTimeout;

    return (text.length * timeout) + timeoutBuffer;
}

function addRow(text, timeout, speed, extraClass, timestamp) {
    var row = document.createElement('li');
    var span = document.createElement('span');

    if(extraClass) {
        // classList doesn't work on older devices, thus the usage of className
        row.className += ' ' + extraClass;
    }

    if(timestamp) {
        var timeSpan = document.createElement('span');
        timeSpan.innerHTML = calculateNow();
        row.appendChild(timeSpan);
    }

    row.appendChild(span);
    mainFeed.appendChild(row);
    addLetters(span, text, speed);
    scrollView(row);
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
function printLetter(span, character) {
    span.innerHTML += character;
    charsInProgress--;
}

function scrollView(element) {
    element.scrollIntoView();
    // Compatibility fix
    window.scrollTo(0, document.body.scrollHeight);
}