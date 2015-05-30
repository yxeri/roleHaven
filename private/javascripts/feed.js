"use strict";

var mainFeed = document.getElementById('mainFeed');
var marker = document.getElementById('marker');
var inputText = document.getElementById('inputText');
var input = document.getElementById('input');
var inputStart = document.getElementById('inputStart');
var socket = io();
// Timeout for print of a character (milliseconds)
var charTimeout = 10;
// Timeout between print of rows (milliseconds)
var timeoutBuffer = 100;
// Queue of all the message objects that will be handled and printed
var messageQueue = [];
// Characters left to print during one call to printText().
// It has to be zero before another group of messages can be printed.
var charsInProgress = 0;
var previousCommands = localStorage.getItem('previousCommands') ? JSON.parse(localStorage.getItem('previousCommands')) : [];
var previousCommandPointer = previousCommands.length > 0 ? previousCommands.length : 0;
var currentUser = localStorage.getItem('user');
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
    '  ######      Organica      ##       #      #############',
    '    ####     Oracle         ##       #      ##     ####',
    '    ####     Operations     ##       #      ##    #####',
    '    ####      Center        ##       #      ###########',
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
    '                 ###      ######      ###',
    '                           ####',
    ' '
    ]
};
var commandFailText = { text : ['command not found'] };
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
            messageQueue.push({ text : ['Add --help after a command (with whitespace in between) to get instructions on how to use it'] });
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
            messageQueue.push({ text : [currentUser] });
        },
        help : ['Shows the current user']
    },
    msg : {
        func : function(message) {
            var user = '<' + currentUser + '> ';

            if(typeof message === undefined) {
                var phrases = getInputText().toLowerCase().trim().split(' ');
                var message = '';

                // Removing command part from the message
                phrases = phrases.slice(1);
                message = phrases.join(' ');
            }

            socket.emit('chatMsg', {
                msg : user + message,
                room : localStorage.getItem('room')
            });
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
    // broadcast : {
    //     func : function() {
    //         var phrases = getInputText().toLowerCase().trim().split(' ');
    //         var message = '';
    //         var user = '<' + currentUser + '> ';

    //         // Removing command part from the message
    //         phrases = phrases.slice(1);
    //         message = phrases.join(' ');

    //         socket.emit('broadcastMsg', { msg : user + message });
    //     },
    //     accessLevel : 7,
    //     help : ['Sends a message to everyone connected, even those outside of your room'],
    //     instructions : [
    //         ' Usage:',
    //         '  broadcast *message*',
    //         ' Example:',
    //         '  broadcast Hello!'
    //     ]
    // },
    // This should check if the room already exists
    enterroom : {
        func : function(roomName, password) {
            var room = {};

            if(roomName) {
                room.roomName = roomName;
                // Flag that will be used in .on function locally to show user they have entered
                room.entered = true;
                socket.emit('follow', room);
            }
        },
        help : [
            'Enters a chat room.',
            'The room has to exist for you to enter it'
        ],
        instructions : [
            ' Usage:',
            '  enterroom *room name*',
            ' Example:',
            '  enterroom sector5'
        ]
    },
    exitroom : {
        func : function() {
            if(localStorage.getItem('room') !== 'public') {
                var room = {}

                room.roomName = localStorage.getItem('room');
                // Flag that will be used in .on function locally to show user they have exited
                room.exited = true;
                socket.emit('unfollow', room);
            }
        },
        help : ['Leaves the chat room you are in, if you are in one.']
    },
    follow : {
        func : function(roomName, password) {
            var room = {};
            room.roomName = roomName;
            room.password = password;

            socket.emit('follow', room);
        },
        help : [
            'Follows a room and shows you all messages posted in it.',
            'You will get the messages from this room even if it isn\'t your currently selected one'
        ],
        instructions : [
            ' Usage:',
            '  follow *room name*',
            ' Example:',
            '  follow roomname'
        ]
    },
    unfollow : {
        func : function(roomName) {
            var room = {};

            if(roomName === localStorage.getItem('room')) {
                room.exited = true;
            }

            socket.emit('unfollow', roomName);
        },
        help : ['Stops following a room.'],
        instructions : [
            ' Usage:',
            '  unfollow *room name*',
            ' Example:',
            '  unfollow roomname'
        ]
    },
    listrooms : {
        func : function() {
            socket.emit('listRooms');
        },
        help : [
            'Shows all the rooms you are following.',
            'public is the room that all users automatically join.'
        ]
    },
    chatmode : {
        func : function() {
            localStorage.setItem('mode', 'chat');
            messageQueue.push({ text : ['Chat mode activated'] });
        },
        help : [
            'Sets mode to chat',
            'Everything written will be intepreted as chat messages',
            'You will not need to use "msg" command to write messages',
            'Use command "normalmode" to exit out of chat mode'
        ],
        instructions : [
            'If you want to use a command in chatmode it has to be prepended with "-"',
            'Example: ',
            ' -normalmode'
        ]
    },
    normalmode : {
        func : function() {
            localStorage.setItem('mode', 'normal');
            messageQueue.push({ text : ['Normal mode activated'] });
        },
        help : [
            'Sets mode to normal',
            'This is the default mode',
            'You have to use "msg" command to write messages'
        ]
    },
    register : {
        func : function(userName, password) {
            var user = {};
            var trimmedUserName = userName.trim();

            var errorMsg = {
                text : [
                    'Name has to be 3 to 6 characters long',
                    'e.g. register myname'
                ]
            };

            if(userName && trimmedUserName.length > 2 && trimmedUserName.length < 7) {
                user.userName = userName;
                socket.emit('register', user);
            } else {
                messageQueue.push(errorMsg);
            }
        },
        help : [
            'Registers your user name on the server and connects it to your device',
            'This user name will be your identity in the system'
        ],
        instructions : [
            ' Usage:',
            '  register *user name*',
            ' Example:',
            '  register myname'
        ]
    },
    listusers : {
        func : function() {
            socket.emit('listUsers');
        }
    },
    createroom : {
        func : function(roomName) {
            if(roomName.length > 0 && roomName.length < 7) {
                var room = {};

                room.roomName = roomName;

                socket.emit('createRoom', room);
                socket.emit('follow', room);
            } else {
                messageQueue.push({ text : [
                        'Failed to create room.',
                        'Room name has to be 1 to 6 characters long',
                        'e.g. createroom myroom'
                    ] 
                });
            }
        },
        help : [
            'Creates a chat room',
            'The rooms name has to be 1 to 6 characters long'
        ],
        instructions : [
            ' Usage:',
            '  createroom *room name*',
            ' Example:',
            '  createroom myroom'
        ]
    },
    myrooms : {
        func : function() {
            socket.emit('myRooms');
        },
        help : [ 'Shows a list of all rooms you are following']
    }
};

socket.on('chatMsg', function(msg) {
    var roomTag = msg.room && msg.room !== localStorage.getItem('room') ? '[' + msg.room + '] ' : '';
    messageQueue.push({ 
        timestamp : true,
        text : [roomTag + msg.msg]
    });
});

socket.on('message', function(msg) {
    messageQueue.push({ text : [msg.msg] });
});

socket.on('importantMsg', function() {
    messageQueue.push({
        extraClass: 'important',
        text : [msg.msg] 
    });
});

// Triggers when the connection is lost and then re-established
socket.on('reconnect', function() {
    console.log('reconnect');
    if(currentUser) {
        socket.emit('updateUser', currentUser);
    }
});

socket.on('follow', function(room) {
    if(room.entered) {
        setCurrentRoom(room.roomName);
    } else {
        messageQueue.push({ text : ['Following ' + room.roomName] });
    }
});

socket.on('unfollow', function(room) {
    if(room.exited) {
        messageQueue.push({ text : ['Stopped following ' + room.roomName] });
        setInputStart('public$ ');
        localStorage.setItem('room', 'public');
        socket.emit('follow', { roomName : 'public', entered : true });
    }
});

socket.on('register', function(userName) {
    localStorage.setItem('user', userName);
    currentUser = userName;
});

function startBoot() {
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

    messageQueue.push(logo);

    if(currentUser) {
        socket.emit('updateUser', currentUser);

        messageQueue.push({
            text : [
                'Welcome, employee ' + currentUser,
                'May you have a productive day'
            ] 
        });
    }

    if(localStorage.getItem('mode') === null) { localStorage.setItem('mode', 'normal') }

    if(localStorage.getItem('room')) {
        validCommands.enterroom.func(localStorage.getItem('room'));
    } else {
        validCommands.enterroom.func('public');
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

function setCurrentRoom(roomName) {
    localStorage.setItem('room', roomName);
    setInputStart(roomName + '$ ');
    messageQueue.push({ text : ['Entered ' + roomName] });
}

function clearInput() {
    setLeftText('');
    setRightText('');
    // Fix for blinking marker
    setMarkerText(' ');
}

function getAvailableCommands () {
    var keys = Object.keys(validCommands);
    keys.sort();
    var commands = [''];

    for(var i = 0; i < keys.length; i++) {
        var msg = '';

        msg += keys[i];

        if(i !== keys.length - 1) {
            msg += ' | ';
        }

        commands[0] += msg;
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
            if(localStorage.getItem('mode') === 'chat') {  }
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
            } else if(phrases[1] === undefined) {
                validCommands.help.func();
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
            var command = null;

            if(localStorage.getItem('mode') === 'normal') {
                command = validCommands[phrases[0]];
            } else {
                var sign = phrases[0].charAt(0);

                if(sign === '-') {
                    command = validCommands[phrases[0].slice(1)];
                }
            }

            if(currentUser !== null && command) {
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
                    command.func(phrases[1]);
                }
            } else if(command && phrases[0] === 'register') {
                messageQueue.push({ text : [getInputStart() + getInputText()] });
                command.func(phrases[1]);
            } else if(localStorage.getItem('mode') === 'chat') {
                var combinedText = phrases.join(' ');

                messageQueue.push({ text : [getInputStart() + getInputText()] });
                validCommands.msg.func(combinedText);
            } else if(currentUser === null) {
                messageQueue.push({ 
                    text : [
                        'You must register', 
                        'Use command "register"',
                        'e.g. register myname'
                    ] 
                });
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
    element.scrollIntoView(element);
    // Compatibility fix
    window.scrollTo(0, document.body.scrollHeight);
}