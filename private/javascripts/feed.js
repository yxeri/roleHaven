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
var platformCommands = {
    setLocally : function(name, item) {
        localStorage.setItem(name, item);
    },
    getLocally : function(name) {
        return localStorage.getItem(name);
    }
};
var previousCommands = platformCommands.getLocally('previousCommands') ? JSON.parse(platformCommands.getLocally('previousCommands')) : [];
var previousCommandPointer = previousCommands.length > 0 ? previousCommands.length : 0;
var currentUser = platformCommands.getLocally('user');
var validCommands = {
    help : {
        func : function() {
            messageQueue.push({ text : ['Add --help after a command (with whitespace in between) to get instructions on how to use it'] });
            messageQueue.push({ text : getAvailableCommands() });
        },
        help : ['Shows a list of available commands']
    },
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
        func : function(phrases) {
            if(phrases.length > 0) {
                var message = phrases.join(' ');
                var user = '<' + currentUser + '> ';

                socket.emit('chatMsg', {
                    text : user + message,
                    room : platformCommands.getLocally('room')
                });
            } else {
                messageQueue.push({ text : ['You forgot to write the message!'] });
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
        ],
        usageTime : true
    },
    enterroom : {
        func : function(phrases) {
            if(phrases.length > 0) {
                var room = {};
                var roomName = phrases[0];
                var password = '';

                if(phrases.length > 1) {
                    password = phrases[1];
                }

                if(roomName) {
                    room.roomName = roomName;
                    room.password = password;
                    // Flag that will be used in .on function locally to show user they have entered
                    room.entered = true;
                    socket.emit('follow', room);
                }
            } else {
                messageQueue.push({ text : ['You have to specify which room to follow'] });
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
            if(platformCommands.getLocally('room') !== 'public') {
                var room = {}

                room.roomName = platformCommands.getLocally('room');
                // Flag that will be used in .on function locally to show user they have exited
                room.exited = true;
                socket.emit('unfollow', room);
            }
        },
        help : ['Leaves the chat room you are in, if you are in one.']
    },
    follow : {
        func : function(phrases) {
            if(phrases.length > 1) {
                var room = {};
                room.roomName = phrases[0];
                room.password = phrases[1];

                socket.emit('follow', room);
            } else {
                messageQueue.push({ text : ['You have to specify which room to follow and a password (if it is protected)'] });
            }
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
        func : function(phrases) {
            if(phrases.length > 0) {
                var room = {};
                var roomName = phrases[0];

                if(roomName === platformCommands.getLocally('room')) {
                    room.exited = true;
                }

                socket.emit('unfollow', roomName);
            } else {
                messageQueue.push({ text : ['You have to specify which room to unfollow '] });
            }
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
            platformCommands.setLocally('mode', 'chatmode');
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
            platformCommands.setLocally('mode', 'normalmode');
            messageQueue.push({ text : ['Normal mode activated'] });
        },
        help : [
            'Sets mode to normal',
            'This is the default mode',
            'You have to use "msg" command to write messages'
        ]
    },
    register : {
        func : function(phrases) {
            if(platformCommands.getLocally('user') === null) {
                var errorMsg = {
                    text : [
                        'Name has to be 3 to 6 characters long',
                        'Don\'t use whitespace in your name or password!',
                        'Password has to be 4 to 10 characters',
                        'e.g. register myname banana1'
                    ]
                };

                if(phrases.length > 1) {
                    var user = {};
                    var userName = phrases[0];
                    var password = phrases[1];

                    if(userName.length >= 3 && userName.length <= 6 &&
                        password.length >= 4 && password.length <= 10) {
                        user.userName = userName;
                        // Check for empty!
                        user.password = password;
                        socket.emit('register', user);
                    } else {
                        messageQueue.push(errorMsg);
                    }
                } else {
                    messageQueue.push(errorMsg);
                }
            } else {
                messageQueue.push({ text : [
                    'You have already registered a user',
                    platformCommands.getLocally('user') + ' is registered to this device'
                ] })
            }
        },
        help : [
            'Registers your user name on the server and connects it to your device',
            'This user name will be your identity in the system',
            'Don\'t use whitespaces in your name or password!'
        ],
        instructions : [
            ' Usage:',
            '  register *user name* *password*',
            ' Example:',
            '  register myname secure1'
        ],
        clearAfterUse : true
    },
    listusers : {
        func : function() {
            socket.emit('listUsers');
        }
    },
    createroom : {
        func : function(phrases) {
            if(phrases.length > 0) {
                var roomName = phrases[0];

                var errorMsg = {
                    text : [
                        'Failed to create room.',
                        'Room name has to be 1 to 6 characters long',
                        'e.g. createroom myroom'
                    ]
                }

                if(roomName.length > 0 && roomName.length < 7) {
                    var room = {};

                    room.roomName = roomName;

                    socket.emit('createRoom', room);
                    socket.emit('follow', room);
                } else {
                    messageQueue.push(errorMsg);
                }
            } else {
                messageQueue.push(errorMsg);
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
        help : ['Shows a list of all rooms you are following']
    },
    login : {
        func : function(phrases) {
            var user = {};
            user.userName = phrases[0];
            user.password = phrases[1];

            socket.emit('login', user);
        },
        help : ['Logs in as a user on this device'],
        instructions : [
            ' Usage:',
            '  login *user name* *password',
            ' Example:',
            '  login user11 banana'
        ],
        clearAfterUse : true
    },
    time : {
        func : function() {
            var date = new Date();
            var seconds = (date.getSeconds() < 10 ? '0' : '') + date.getSeconds();
            var minutes = (date.getMinutes() < 10 ? '0' : '') + date.getMinutes();
            var hours = (date.getHours() < 10 ? '0' : '') + date.getHours();

            messageQueue.push({ text : ['Time: ' + hours + ':' + minutes + ':' + seconds] });
        },
        help : ['Shows the current time']
    }
};

socket.on('chatMsg', function(msg) {
    var roomTag = msg.room && msg.room !== platformCommands.getLocally('room') ? '[' + msg.room + '] ' : '';

    messageQueue.push({ 
        timestamp : true,
        text : [roomTag + msg.text]
    });
});

socket.on('message', function(msg) {
    messageQueue.push(msg);
});

socket.on('importantMsg', function(msg) {
    var message = msg;
    message.extraClass = 'important';

    messageQueue.push(message);
});

// Triggers when the connection is lost and then re-established
socket.on('reconnect', function() {
    if(currentUser) {
        socket.emit('updateId', currentUser);
    }
});

socket.on('disconnect', function() {
    messageQueue.push({ 
        text : ['Lost connection'],
        extraClass : 'important'
    });
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
        platformCommands.setLocally('room', 'public');
        socket.emit('follow', { roomName : 'public', entered : true });
    }
});

socket.on('login', function(userName) {
    platformCommands.setLocally('user', userName);
    currentUser = userName;
    messageQueue.push({ text : ['Successfully logged in as ' + userName] });
});

function startBoot() {
    // Disable left mouse clicks
    document.onmousedown = function() {
        marker.focus();
        return false;
    };

    document.getElementById('main').addEventListener('click', function(event) {
        marker.focus();
        event.preventDefault();
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
                'Did you know that you can auto-complete commands by using the tab button or writing double spaces?',
                'Learn this valuable skill to increase your productivity!',
                'May you have a productive day'
            ] 
        });
    }

    if(platformCommands.getLocally('mode') === null) {
        validCommands.normalmode.func();
    } else {
        var mode = platformCommands.getLocally('mode');

        validCommands[mode].func();
    }

    if(platformCommands.getLocally('room')) {
        validCommands.enterroom.func([platformCommands.getLocally('room')]);
    } else {
        validCommands.enterroom.func(['public']);
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
    platformCommands.setLocally('room', roomName);
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

function autoComplete() {
    var phrases = getInputText().toLowerCase().trim().split(' ');
    var partialCommand = phrases[0];
    var commands = Object.keys(validCommands);
    var matched = [];

    // Auto-complete should only trigger when one phrase is in the input
    // It will not auto-complete flags
    // If chat mode and the command is prepended or normal mode
    if(phrases.length === 1 && partialCommand.length > 0 &&
        ((platformCommands.getLocally('mode') === 'chatmode' && partialCommand.charAt(0) === '-') ||
            (platformCommands.getLocally('mode') === 'normalmode'))) {
        // Removes prepend sign, which is required for commands in chat mode
        if(platformCommands.getLocally('mode') === 'chatmode') {
            partialCommand = partialCommand.slice(1);
        }

        for(var i = 0; i < commands.length; i++) {
            var matches = false;

            for(var j = 0; j < partialCommand.length; j++) {
                if(partialCommand.charAt(j) === commands[i].charAt(j)) {
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
            var newText = '';

            if(platformCommands.getLocally('mode') === 'chatmode') { newText += '-'; }

            newText += matched[0] + ' ';

            clearInput();
            setLeftText(newText);
        } else if(matched.length > 0) {
            var msg = '';

            matched.sort();

            for(var i = 0; i < matched.length; i++) {
                msg += matched[i] + '\t';
            }

            messageQueue.push({ text : [msg] });
        }
    // No input? Show all available commands
    } else if(partialCommand.length === 0) {
        validCommands.help.func();
    }

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
            autoComplete();

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
            // Index 0 is the command part
            var phrases = getInputText().toLowerCase().trim().split(' ');
            var command = null;

            if(platformCommands.getLocally('mode') === 'normalmode') {
                command = validCommands[phrases[0]];
            } else {
                var sign = phrases[0].charAt(0);

                if(sign === '-') {
                    command = validCommands[phrases[0].slice(1)];
                }
            }

            if(currentUser !== null && command) {
                // Store the command for usage with up/down arrows
                previousCommands.push(phrases.join(' '));
                previousCommandPointer++;
                platformCommands.setLocally('previousCommands', JSON.stringify(previousCommands));

                // Print input if the command shouldn't clear after use
                if(!command.clearAfterUse) {
                    var message = { text : [getInputStart() + getInputText()] };

                    if(command.usageTime) { message.timestamp = true; }

                    messageQueue.push(message);
                }

                // Print the help and instruction parts of the command
                if(phrases[1] === '--help') {
                    var message = { text : [] };

                    if(command.help) { message.text = message.text.concat(command.help); }

                    if(command.instructions) { message.text = message.text.concat(command.instructions); }

                    if(message.text.length > 0) { messageQueue.push(message); }
                } else {
                    command.func(phrases.splice(1));
                }
            // A user who is not logged in will have access to register and login commands
            } else if(command && (phrases[0] === 'register' || phrases[0] === 'login')) {
                messageQueue.push({ text : [getInputStart() + getInputText()] });
                command.func(phrases.splice(1));
            } else if(platformCommands.getLocally('mode') === 'chatmode') {
                var combinedText = phrases.join(' ');
                var message = {
                    text : [getInputStart() + getInputText()],
                    timestamp : true
                };

                messageQueue.push(message);
                validCommands.msg.func([combinedText]);
            } else if(currentUser === null) {
                messageQueue.push({ 
                    text : [
                        'You must register a new user or login with an existing user', 
                        'Use command "register" or "login"',
                        'e.g. register myname 1135',
                        'or login myname 1135'
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

            if(triggerAutoComplete(getLeftText(marker))) {
                autoComplete();
            }

            break;
    }

    event.preventDefault();
}

function triggerAutoComplete(text) {
    if(text.charAt(text.length - 1) === ' ' && text.charAt(text.length - 2) === ' ') {
        setLeftText(text.trim());  

        return true;  
    }

    return false;
}

// Prints messages from the queue
// It will not continue if a print is already in progress,
// which is indicated by charsInProgress being > 0
function printText(messageQueue) {
    if(charsInProgress === 0) {
        // Amount of time (milliseconds) for a row to finish printing
        var nextTimeout = 0;
        charsInProgress = countTotalCharacters(messageQueue);

        if(charsInProgress > 0) {
            while(messageQueue.length > 0) {
                var message = messageQueue.shift();

                while(message.text.length > 0) {
                    var text = message.text.shift();
                    var speed = message.speed;

                    setTimeout(addRow, nextTimeout, text, nextTimeout, speed, message.extraClass, message.timestamp);

                    nextTimeout += calculateTimer(text, speed);
                }
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
function calculateNow() {
    var date = new Date();
    var minutes = (date.getMinutes() < 10 ? '0' : '') + date.getMinutes();
    var hours = (date.getHours() < 10 ? '0' : '') + date.getHours();

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