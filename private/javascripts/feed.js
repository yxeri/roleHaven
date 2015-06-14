"use strict";

var mainFeed = document.getElementById('mainFeed');
var marker = document.getElementById('marker');
var inputText = document.getElementById('inputText');
var inputStart = document.getElementById('inputStart');
var modeField = document.getElementById('mode');
var socket = io();
// Timeout for print of a character (milliseconds)
var charTimeout = 2;
// Timeout between print of rows (milliseconds)
var rowTimeout = 5;
// Queue of all the message objects that will be handled and printed
var messageQueue = [];
// Characters left to print during one call to printText().
// It has to be zero before another group of messages can be printed.
var charsInProgress = 0;

var tracking = true;

// Queue of all the sounds that will be handled and played
var soundQueue = [];
var audioCtx;
var oscillator;
var gainNode;
var soundTimeout = 0;

var morseCodes = {
    'a' : '.-',
    'b' : '-...',
    'c' : '-.-.',
    'd' : '-..',
    'e' : '.',
    'f' : '..-.',
    'g' : '--.',
    'h' : '....',
    'i' : '..',
    'j' : '.---',
    'k' : '-.-',
    'l' : '.-..',
    'm' : '--',
    'n' : '-.',
    'o' : '---',
    'p' : '.--.',
    'q' : '--.-',
    'r' : '.-.',
    's' : '...',
    't' : '-',
    'u' : '..-',
    'v' : '...-',
    'w' : '.--',
    'x' : '-..-',
    'y' : '-.--',
    'z' : '--..',
    '1' : '.----',
    '2' : '..---',
    '3' : '...--',
    '4' : '....-',
    '5' : '.....',
    '6' : '-....',
    '7' : '--...',
    '8' : '---..',
    '9' : '----.',
    '0' : '-----',
    // Symbolizes space betwen words
    '#' : '#'
};
var logo = {
    speed : 0.5,
    extraClass : 'logo',
    text : [
        // ' ',
        // '                          ####',
        // '                ####    #########    ####',
        // '               ###########################',
        // '              #############################',
        // '            #######        ##   #  ##########',
        // '      ##########           ##    #  ###  ##########',
        // '     #########             #########   #   #########',
        // '       #####               ##     ########   #####',
        // '     #####                 ##     ##     ##########',
        // '     ####                  ##      ##     #   ######',
        // ' #######                   ##########     ##    ########',
        // '########                   ##       ########     ########',
        // ' ######      Organica      ##       #      #############',
        // '   ####     Oracle         ##       #      ##     ####',
        // '   ####     Operations     ##       #      ##    #####',
        // '   ####      Center        ##       #      ###########',
        // '########      Razor1911    ##       #########    ########',
        // '########       Edition     ##########      #    #########',
        // ' ########                  ##      ##     ## ###########',
        // '     #####                 ##      ##     ### #####',
        // '       #####               ##     ########   #####',
        // '      #######              ##########   #  ########',
        // '     ###########           ##    ##    # ###########',
        // '      #############        ##    #   #############',
        // '            ################################',
        // '              ############################',
        // '              #######  ##########  #######',
        // '                ###      ######      ###',
        // '                          ####',
        ' ',
        '[Developer\'s note:] NOTE! THIS IS A DEV SERVER!',
        'EVERYTHING MAY BE DELETED AT ANY TIME. THERE WILL BE BUGS!'
    ]
};

var mapHelper = {
    leftLong : 17.7992307,
    rightLong : 18.1828902,
    topLat : 59.4463469,
    bottomLat : 59.2818812,
    xGridsMax : 23,
    yGridsMax : 36,
    xSize : 0,
    ySize : 0,
    xGrids : {},
    yGrids : {}
};

var commandFailText = { text : ['command not found'] };
var platformCommands = {
    setLocally : function(name, item) {
        localStorage.setItem(name, item);
    },
    getLocally : function(name) {
        return localStorage.getItem(name);
    },
    removeLocally : function(name) {
        localStorage.removeItem(name);
    },
    isTextAllowed : function(text) {
        return /^[a-zA-Z0-9]+$/g.test(text);
    },
    queueMessage : function(message) {
        messageQueue.push(message);
    },
    resetAllLocally : function() {
        localStorage.removeItem('previousCommands');
        previousCommands = [];
        previousCommandPointer = 0;
        localStorage.removeItem('user');
        currentUser = null;
        localStorage.removeItem('room');
        localStorage.setItem('mode', 'normalmode');
        setInputStart('RAZ-CMD');
    }
};
var previousCommands = platformCommands.getLocally('previousCommands') ?
    JSON.parse(platformCommands.getLocally('previousCommands')) : [];
var previousCommandPointer = previousCommands.length > 0 ? previousCommands.length : 0;
var currentUser = platformCommands.getLocally('user');
var oldPosition = {};
var currentPosition = {};

var commandHelper = {
    maxSteps : 0,
    currentStep : 0,
    command : null,
    keyboardBlocked : false,
    data : null
};
// Used by isScreenOff() to force reconnect when phone screen is off for a longer period of time
var lastInterval = (new Date()).getTime();

// Object containing all running intervals
var interval = {
    tracking : null,
    printText : null,
    isScreenOff : null
};
var validCommands = {
    help : {
        func : function() {
            platformCommands.queueMessage({
                text : [
                    'Add --help after a command (with whitespace in between) to get instructions on how to use it'
                ]
            });
            platformCommands.queueMessage({ text : getAvailableCommands() });
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
            platformCommands.queueMessage({ text : [currentUser] });
        },
        help : ['Shows the current user']
    },
    msg : {
        func : function(phrases) {
            if(phrases && phrases.length > 0) {
                var writtenMsg = phrases.join(' ');

                socket.emit('chatMsg', {
                    message : {
                        text : [writtenMsg],
                        user : currentUser
                    },
                    roomName : platformCommands.getLocally('room')
                });
            } else {
                platformCommands.queueMessage({ text : ['You forgot to write the message!'] });
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
        clearAfterUse : true
    },
    broadcast : {
        func : function(phrases) {
            if(phrases && phrases.length > 0) {
                var writtenMsg = phrases.join(' ');

                socket.emit('broadcastMsg', {
                    message : {
                        text : [writtenMsg],
                        user : currentUser
                    },
                    roomName : 'ALL'
                });
            } else {
                platformCommands.queueMessage({ text : ['You forgot to write the message!'] });
            }
        },
        help : [
            'Sends a message to all users in all rooms',
            'It will prepend the message with "[ALL]"'
        ],
        instructions : [
            ' Usage:',
            '  broadcast *message*',
            ' Example:',
            '  broadcast Hello!'
        ],
        clearAfterUse : true,
        accessLevel : 11
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
                platformCommands.queueMessage({ text : ['You have to specify which room to follow'] });
            }
        },
        help : [
            'Enters a chat room.',
            'The room has to exist for you to enter it'
        ],
        instructions : [
            ' Usage:',
            '  enterroom *room name* *optional password*',
            ' Example:',
            '  enterroom sector5 banana'
        ]
    },
    exitroom : {
        func : function() {
            if(platformCommands.getLocally('room') !== 'public') {
                var room = {};

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
            if(phrases.length > 0) {
                var room = {};
                room.roomName = phrases[0];
                room.password = phrases[1];

                socket.emit('follow', room);
            } else {
                platformCommands.queueMessage({
                    text : [
                        'You have to specify which room to follow and a password (if it is protected)'
                    ]
                });
            }
        },
        help : [
            'Follows a room and shows you all messages posted in it.',
            'You will get the messages from this room even if it isn\'t your currently selected one'
        ],
        instructions : [
            ' Usage:',
            '  follow *room name* *optional password*',
            ' Example:',
            '  follow room1 banana'
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

                room.roomName = roomName;

                socket.emit('unfollow', room);
            } else {
                platformCommands.queueMessage({ text : ['You have to specify which room to unfollow '] });
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
            setMode('[CHAT]');
            platformCommands.queueMessage({ text : ['Chat mode activated', 'Prepend commands with "-", e.g. "-normalmode"'] });
        },
        help : [
            'Sets mode to chat',
            'Everything written will be interpreted as chat messages',
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
            setMode('');
            platformCommands.queueMessage({ text : ['Normal mode activated'] });
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
                        'The name can only contain letters and numbers (a-z, 0-9)',
                        'Password has to be 4 to 10 characters',
                        'Don\'t use whitespace in your name or password!',
                        'e.g. register myname apple1'
                    ]
                };

                if(phrases.length > 1) {
                    var user = {};
                    var userName = phrases[0];
                    var password = phrases[1];

                    if(userName.length >= 3 && userName.length <= 6 &&
                        password.length >= 4 && password.length <= 10 &&
                        platformCommands.isTextAllowed(userName)) {
                        user.userName = userName;
                        // Check for empty!
                        user.password = password;
                        socket.emit('register', user);
                    } else {
                        platformCommands.queueMessage(errorMsg);
                    }
                } else {
                    platformCommands.queueMessage(errorMsg);
                }
            } else {
                platformCommands.queueMessage({
                    text : [
                        'You have already registered a user',
                        platformCommands.getLocally('user') + ' is registered to this device'
                    ]
                })
            }
        },
        help : [
            'Registers your user name on the server and connects it to your device',
            'This user name will be your identity in the system',
            'The name can only contain letters and numbers (a-z, 0-9)',
            'Don\'t use whitespaces in your name or password!',
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
            var errorMsg = {
                text : [
                    'Failed to create room.',
                    'Room name has to be 1 to 6 characters long',
                    'The room name can only contain letters and numbers (a-z, 0-9)',
                    'e.g. createroom myroom'
                ]
            };

            if(phrases.length > 0) {
                var roomName = phrases[0];
                var password = phrases[1];

                if(roomName.length > 0 && roomName.length < 7 && platformCommands.isTextAllowed(roomName)) {
                    var room = {};

                    room.roomName = roomName;
                    room.password = password;

                    socket.emit('createRoom', room);
                } else {
                    platformCommands.queueMessage(errorMsg);
                }
            } else {
                platformCommands.queueMessage(errorMsg);
            }
        },
        help : [
            'Creates a chat room',
            'The rooms name has to be 1 to 6 characters long',
            'The password is optional, but if set it has to be 4 to 10 characters',
            'The name can only contain letters and numbers (a-z, 0-9)',
        ],
        instructions : [
            ' Usage:',
            '  createroom *room name* *optional password*',
            ' Example:',
            '  createroom myroom banana',
        ],
        accessLevel : 3
    },
    myrooms : {
        func : function() {
            socket.emit('myRooms');
        },
        help : ['Shows a list of all rooms you are following']
    },
    login : {
        func : function(phrases) {
            if(phrases.length > 1) {
                var user = {};
                user.userName = phrases[0];
                user.password = phrases[1];

                socket.emit('login', user);
            }
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
            socket.emit('time');
        },
        help : ['Shows the current time']
    },
    locate : {
        func : function(phrases) {
            if(!tracking) {
                platformCommands.queueMessage({ text : ['Tracking not available', 'You are not connected to the satellites'] });
            } else if(phrases.length > 0) {
                var userName = phrases[0];

                socket.emit('locate', userName)
            }
        },
        help : [
            'Shows the last known location of the user', '* is a shortcut for all users',
            'You need to be connected to the satellites to access this command'
        ],
        instructions : [
            ' Usage:',
            '  locate *user name OR "*"*',
            ' Example:',
            '  locate user1',
            '  locate *'
        ]
    },
    decryptmodule : {
        func : function() {
            platformCommands.queueMessage({
                text : [
                    '   ####',
                    '###############',
                    ' #####  #########                                           ####',
                    '  ####     #######  ########     ###########    ####     ###########',
                    '  ####    ######      #######   ####   #####  ########    ####   #####',
                    '  ####  ###         ####  ####        ####  ###    ###### ####   #####',
                    '  #########        ####    ####     ####   #####     ##############',
                    '  #### ######     ####     #####  ####     #######   ###  ########',
                    '  ####   ######  ##### #### #### ############  #######    ####   ###',
                    ' ######    #############    ################     ###      ####    #####',
                    '########     ########         ###                        ######      #####   ##',
                    '               ###########        ##                                    ###### ',
                    '                    ###############    Razor1911',
                    '                         #####   demos - warez - honey',
                    ' '
                ],
                extraClass : 'logo',
                speed : 10
            });
            platformCommands.queueMessage({
                text : [
                    'Razor1911 proudly presents:',
                    'Entity Hacking Access! (EHA)',
                    'AAAB3NzaC1yc2EAAAADAQABAAABAQDHS//2ag4/B',
                    'D6Rsc8OO/6wFUVDdpdAItvSCLCrc/dcJE/8iybEV',
                    'w3OtlVFnfNkOVAvhObuWO/6wFUVDdkr2/yYTaDEt',
                    'i5mxEFD1zslvhObuWr6QKLvfZVczAxAHPFKLvfZV',
                    'dK2zXrxGOmOFllxiCbpGOmOFlcJy1/iCbp0mA4ca',
                    'MFvEEiKXrxGlxiCbp0miONA3EsqTcgY/yujOMJHa',
                    'Q1uy6yEZOmOFl/yujOMJHa88/x1DVwWl6lsjHvSi',
                    'wDDVwWl6el88/x1j5C+k/aadtg1lcvcz7Tdtve4q',
                    'VTVz0HIhxv595Xqw2qrvyp6GrdX/FrhObuWr6QKL',
                    ' ',
                    'Please wait.......',
                    'Command interception...........ACTIVATED',
                    'Oracle defense systems......... DISABLED',
                    'Overriding locks....................DONE',
                    'Connecting to entity database.......DONE',
                    ' ',
                    'You can cancel out of the command by typing "exit" or "abort"'
                ],
                speed : 10
            });
            setInputStart('Enter encryption key:');
            socket.emit('entities');
        },
        steps : [
            function(phrase, socket) {
                socket.emit('verifyKey', phrase);
                platformCommands.queueMessage({
                    text : [
                        'Verifying key. Please wait...'
                    ]
                });
                commandHelper.keyboardBlocked = true;
                setInputStart('Verifying...');
            },
            function(data, socket) {
                if(data.keyData !== null) {
                    if(!data.keyData.used) {
                        platformCommands.queueMessage({ text : ['Key has been verified. Proceeding'] });
                        commandHelper.currentStep++;
                        commandHelper.data = data;
                        validCommands[commandHelper.command].steps[commandHelper.currentStep](socket);
                    } else {
                        platformCommands.queueMessage({ text : ['Key has already been used. Aborting'] });
                        setCommand(null);
                    }
                } else {
                    platformCommands.queueMessage({ text : ['The key is invalid. Aborting'] });
                    setCommand(null);
                }
            },
            function() {
                setInputStart('Enter entity name:');
                commandHelper.keyboardBlocked = false;
                commandHelper.currentStep++;
            },
            function(phrase, socket) {
                var data = commandHelper.data;

                data.entityName = phrase;
                socket.emit('unlockEntity', data);
                platformCommands.queueMessage({
                    text : [
                        'Unlocking entity. Please wait...'
                    ]
                });
                commandHelper.keyboardBlocked = true;
            },
            function(entity) {
                if(entity !== null) {
                    platformCommands.queueMessage({
                        text : [
                            'Confirmed. Encryption key has been used on the entity',
                            entity.entityName + ' now has ' + (entity.keys.length + 1) + ' unlocks'
                        ]
                    });
                    setCommand(null);
                } else {
                    platformCommands.queueMessage({ text : ['Failed. Encryption key could not be used on entity. Aborting'] });
                    setCommand(null);
                }
            }
        ],
        help : [
            'ERROR. UNAUTHORIZED COMMAND...AUTHORIZATION OVERRIDDEN. PRINTING INSTRUCTIONS',
            'Allows you to input an encryption key and use it to unlock an entity',
            'You can cancel out of the command by typing "exit" or "abort"'
        ],
        instructions : [
            'Follow the on-screen instructions'
        ]
    },
    history : {
        func : function(phrases) {
            var maxLines = phrases[0];

            validCommands.clear.func();
            socket.emit('history', maxLines);
        },
        help : [
            'Clears the screen and retrieves chat messages from server',
            'The amount you send with the command is the amount of messages that will be returned from each room you follow'
        ],
        instructions : [
            ' Usage:',
            '  history *optional number*',
            ' Example:',
            '  history',
            '  history 25'
        ],
        clearAfterUse : true
    },
    morse : {
        func : function(phrases) {
            if(phrases && phrases.length > 0) {
                var text = phrases.join(' ').toLowerCase();
                var filteredText = text;
                var morseCodeText = '';

                filteredText = filteredText.replace(/[åä]/g, 'a');
                filteredText = filteredText.replace(/[ö]/g, 'o');
                filteredText = filteredText.replace(/\s/g, '#');
                filteredText = filteredText.replace(/[^a-z0-9#]/g, '');

                for(var i = 0; i < filteredText.length; i++) {
                    var morseCode = morseCodes[filteredText.charAt(i)];

                    for(var j = 0; j < morseCode.length; j++) {
                        morseCodeText += morseCode[j] + ' ';
                    }

                    morseCodeText += '   ';
                }

                if(morseCodeText.length > 0) {
                    socket.emit('morse', {
                        roomName : platformCommands.getLocally('room'),
                        morseCode : morseCodeText
                    });
                }
            }
        },
        help : ['Sends a morse encoded message (sound) to everyone in the room'],
        instructions : [
            ' Usage:',
            '  morse *message*',
            ' Example:',
            '  morse sos'
        ],
        accessLevel : 11
    },
    password : {
        func : function(phrases) {
            if(phrases && phrases.length > 1) {
                var data = {}
                data.oldPassword = phrases[0];
                data.newPassword = phrases[1];
                data.userName = currentUser;

                if(data.newPassword.length >= 4 && data.newPassword.length <= 10) {
                    socket.emit('changePassword', data);
                } else {
                    platformCommands.queueMessage({
                        text : [
                            'You have to input the old and new password of the user',
                            'Example: password old1 new1'
                        ]
                    });
                }
            } else {
                platformCommands.queueMessage({
                    text : [
                        'You have to input the old and new password of the user',
                        'Example: password old1 new1'
                    ]
                });
            }
        },
        help : [
            'Allows you to change the user password',
            'Password has to be 4 to 10 characters',
            'Don\'t use whitespace in your name or password!'
        ],
        instructions : [
            ' Usage:',
            '  password *oldpassword* *newpassword*',
            ' Example:',
            '  password old1 new1'
        ]
    },
    logout : {
        func : function() {
            socket.emit('logout', currentUser);
            platformCommands.resetAllLocally();
        },
        help : ['Logs out from the current user']
    },
    reboot : {
        func : function() {
            window.location.reload();
        },
        help : ['Reboots terminal']
    },
    verifyuser : {
        func : function(phrases) {
            if(phrases.length > 0) {
                var userName = phrases[0];

                if(userName === '*') {
                    socket.emit('verifyAllUsers');
                } else {
                    socket.emit('verifyUser', userName);
                }
            } else {
                socket.emit('unverifiedUsers');
            }
        },
        help : [
            'Verifies a user and allows it to connect to the system',
            'verifyuser without any addition will show a list of all unverified users',
            'Use "*" to verify everyone in the list'
        ],
        instructions : [
            ' Usage:',
            '  verifyuser',
            '  verifyuser *username*',
            '  verifyuser *',
            ' Example:',
            '  verifyuser',
            '  verifyuser appl1',
            '  verifyuser *'
        ]
    }
};

socket.on('chatMsg', function(message) {
    platformCommands.queueMessage(message);
});

socket.on('message', function(message) {
    platformCommands.queueMessage(message);
});

socket.on('broadcastMsg', function(message) {
    platformCommands.queueMessage(message);
});

socket.on('importantMsg', function(msg) {
    var message = msg;

    message.extraClass = 'importantMsg';
    validCommands.morse.func(message.text);

    platformCommands.queueMessage(message);
});

socket.on('multiMsg', function(messages) {
    for(var i = 0; i < messages.length; i++) {
        platformCommands.queueMessage(messages[i]);
    }
});

// Triggers when the connection is lost and then re-established
socket.on('reconnect', reconnect);

socket.on('disconnect', function() {
    platformCommands.queueMessage({
        text : ['Lost connection'],
        extraClass : 'importantMsg'
    });
});

socket.on('follow', function(room) {
    if(room.entered) {
        setCurrentRoom(room.roomName);
    } else {
        platformCommands.queueMessage({ text : ['Following ' + room.roomName] });
    }
});

socket.on('unfollow', function(room) {
    platformCommands.queueMessage({ text : ['Stopped following ' + room.roomName] });

    if(room.exited) {
        setInputStart('public');
        platformCommands.setLocally('room', 'public');
        socket.emit('follow', { roomName : 'public', entered : true });
    }
});

socket.on('login', function(userName) {
    platformCommands.setLocally('user', userName);
    currentUser = userName;
    platformCommands.queueMessage({ text : ['Successfully logged in as ' + userName] });
    socket.emit('follow', { roomName : 'public', entered : true });
});

socket.on('commandSuccess', function(data) {
    commandHelper.currentStep++;
    validCommands[commandHelper.command].steps[commandHelper.currentStep](data, socket);
});

socket.on('commandFail', function() {
    setCommand(null);
});

socket.on('reconnectSuccess', function(firstConnection) {
    if(!firstConnection) {
        platformCommands.queueMessage({ text : ['Re-established connection'], extraClass : 'importantMsg' });
        platformCommands.queueMessage({ text : ['Retrieving missed messages (if any)'] });
    } else {
        platformCommands.queueMessage({
            text : [
                'Welcome, employee ' + currentUser,
                'Did you know that you can auto-complete commands by using the tab button or writing double spaces?',
                'Learn this valuable skill to increase your productivity!',
                'May you have a productive day',
                '## This terminal has been cracked by your friendly Razor1911 team. Enjoy! ##'
            ]
        });

        if(platformCommands.getLocally('room')) {
            validCommands.enterroom.func([platformCommands.getLocally('room')]);
        }
    }

    if(platformCommands.getLocally('mode') === null) {
        validCommands.normalmode.func();
    } else {
        var mode = platformCommands.getLocally('mode');

        validCommands[mode].func();
    }

    locationData();
});

socket.on('disconnectUser', function() {
    var currentUser = platformCommands.getLocally('user');

    // There is no saved local user. We don't need to print this
    if(currentUser !== null) {
        platformCommands.queueMessage({
            text : [
                'Didn\'t find user ' + platformCommands.getLocally('user') + ' in database',
                'Resetting local configuration'
            ]
        });
    }

    platformCommands.removeLocally('user');
    platformCommands.removeLocally('room');
    platformCommands.setLocally('mode', 'normalmode');
    setInputStart('RAZ-CMD');
});

socket.on('morse', function(morseCode) {
    playMorseSignal(morseCode);
});

socket.on('time', function(time) {
    platformCommands.queueMessage({ text : ['Time: ' + time] });
});

socket.on('locationMsg', function(locationData) {
    var locationKeys = Object.keys(locationData);

    for(var i = 0; i < locationKeys.length; i++) {
        var user = locationKeys[i];

        if(locationData[user].coords) {
            var latitude = locationData[user].coords.latitude;
            var longitude = locationData[user].coords.longitude;
            var heading = locationData[user].coords.heading !== null ? Math.round(locationData[user].coords.heading) : null;
            var text = '';

            text += 'User: ' + user + ' - ';
            text += 'Last seen: ' + generateShortTime(locationData[user].lastSeen) + '- ';
            text += 'Location: ' + locateOnMap(latitude, longitude) + ' - ';
            if(heading !== null) {
                text += 'Heading: ' + heading + ' deg. - '
            }
            text += 'Coordinates: ' + latitude + ', ' + longitude;

            platformCommands.queueMessage({ text : [text] });
        }
    }
});

function playMorseSignal(morseCode) {
    function clearSoundQueue(timeouts) {
        soundQueue.splice(0, timeouts);
    }

    if(soundQueue.length === 0) {
        soundTimeout = 0;
    }

    for(var i = 0; i < morseCode.length; i++) {
        var duration = 0;
        var shouldPlay = false;

        if(morseCode[i] === '.') {
            duration = 100;
            shouldPlay = true;
        } else if(morseCode[i] === '-') {
            duration = 300;
            shouldPlay = true;
        } else if(morseCode[i] === '#') {
            duration = 100;
        } else {
            duration = 150;
        }

        if(shouldPlay) {
            soundQueue.push(setTimeout(setGain, soundTimeout, 1));
            soundQueue.push(setTimeout(setGain, soundTimeout + duration, 0));
        }

        soundTimeout += duration;
    }

    setTimeout(clearSoundQueue, soundTimeout, (2 * morseCode.length));
}

function generateMap() {
    var letter = 'B';

    mapHelper.xSize = (mapHelper.rightLong - mapHelper.leftLong) / parseFloat(mapHelper.xGridsMax);
    mapHelper.ySize = (mapHelper.topLat - mapHelper.bottomLat) / parseFloat(mapHelper.yGridsMax);

    for(var i = 0; i < mapHelper.xGridsMax; i++) {
        var char = String.fromCharCode(letter.charCodeAt(0) + i);
        mapHelper.xGrids[char] = mapHelper.leftLong + parseFloat(mapHelper.xSize * i);
    }

    for(var i = 0; i < mapHelper.yGridsMax; i++) {
        mapHelper.yGrids[i] = mapHelper.topLat - parseFloat(mapHelper.ySize * i);
    }
}

function locateOnMap(latitude, longitude) {
    var xKeys = Object.keys(mapHelper.xGrids);
    var yKeys = Object.keys(mapHelper.yGrids);
    var x;
    var y;

    for(var i = 0; i < xKeys.length; i++) {
        var nextGrid = mapHelper.xGrids[xKeys[i + 1]];

        if(longitude < nextGrid) {
            x = xKeys[i];
            break;
        } else if(longitude === (nextGrid + parseFloat(mapHelper.xSize))) {
            x = xKeys[i + 1];
            break;
        }
    }

    for(var i = 0; i < yKeys.length; i++) {
        var nextGrid = mapHelper.yGrids[yKeys[i + 1]];

        if(latitude > nextGrid) {
            y = yKeys[i];
            break;
        } else if(latitude === (nextGrid - parseFloat(mapHelper.ySize))) {
            y = yKeys[i + 1];
            break;
        }
    }

    if(x !== undefined && y !== undefined) {
        return x + '' + y;
    } else {
        return 'Out of area';
    }
}

function setGain(value) {
    gainNode.gain.value = value;
}

function reconnect() {
    socket.disconnect();
    socket.connect({ forceNew : true });

    if(currentUser) {
        socket.emit('updateId', { userName : currentUser });
    }
}

// Some devices disable Javascript when screen is off (iOS)
// They also fail to notice that they have been disconnected
// We check the time between heartbeats and if the time is
// over 10 seconds (e.g. when screen is turned off and then on)
// we force them to reconnect
function isScreenOff() {
    var now = (new Date()).getTime();
    var diff = now - lastInterval;
    var offBy = diff - 1000;
    lastInterval = now;

    if(offBy > 10000) {
        reconnect();
    }
}

function setIntervals() {
    if(interval.printText !== undefined) {
        clearInterval(interval.printText);
    }
    if(interval.tracking !== undefined) {
        clearInterval(interval.tracking);
    }

    // Tries to print messages from the queue
    interval.printText = setInterval(printText, 200, messageQueue);

    if(tracking) {
        interval.tracking = setInterval(sendLocationData, 4000);
    }

    // Should not be recreated on focus
    if(interval.isScreenOff === undefined) {
        interval.isScreenOff = setInterval(isScreenOff, 1000);
    }
}

function startAudio() {
    // Not supported in Spartan nor IE11 or lower
    if(window.AudioContext || window.webkitAudioContext) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        oscillator = audioCtx.createOscillator();
        gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        gainNode.gain.value = 0;
        oscillator.type = 'sine';
        oscillator.frequency.value = '440';

        oscillator.start(0);
    }
}

function startBoot() {
    document.getElementById('background').addEventListener('click', function(event) {
        marker.focus();

        event.preventDefault();
    });
    addEventListener('keypress', keyPress);
    // Needed for some special keys. They are not detected with keypress
    addEventListener('keydown', specialKeyPress);

    addEventListener('focus', setIntervals);

    generateMap();

    setIntervals();

    startAudio();

    platformCommands.queueMessage(logo);

    socket.emit('updateId', { userName : currentUser, firstConnection : true });
}

startBoot();

function getLeftText(marker) {
    return marker.parentElement.childNodes[0].textContent;
}

function getRightText(marker) {
    return marker.parentElement.childNodes[2].textContent;
}

function getInputText() {
    return inputText.textContent;
}

function setLeftText(text) {
    marker.parentElement.childNodes[0].textContent = text;
}

function appendToLeftText(text) {
    marker.parentElement.childNodes[0].textContent += text;
}

function setRightText(text) {
    marker.parentElement.childNodes[2].textContent = text;
}

function prependToRightText(sentText) {
    marker.parentElement.childNodes[2].textContent = sentText + marker.parentElement.childNodes[2].textContent;
}

function setMarkerText(text) {
    marker.value = text;
}

function setInputStart(text) {
    inputStart.textContent = text;
}

function getInputStart() {
    return inputStart.textContent;
}

function setCurrentRoom(roomName) {
    platformCommands.setLocally('room', roomName);
    setInputStart(roomName);
    platformCommands.queueMessage({ text : ['Entered ' + roomName] });
}

function setCommand(sentCommand) {
    commandHelper.command = sentCommand;

    if(sentCommand === null) {
        commandHelper.currentStep = 0;
        commandHelper.maxSteps = 0;
        setInputStart(platformCommands.getLocally('room'));
        commandHelper.keyboardBlocked = false;
    }
}

function setMode(text) {
    modeField.textContent = text;
}

function getMode() {
    return modeField.textContent;
}

function clearInput() {
    setLeftText('');
    setRightText('');
    // Fix for blinking marker
    setMarkerText(' ');
}

function locationData() {
    if('geolocation' in navigator) {
        navigator.geolocation.watchPosition(function(position) {
            if(position !== undefined) {
                // Geolocation object is empty when sent through Socket.IO
                // This is a fix for that
                var tempPosition = {};
                tempPosition.latitude = position.coords.latitude;
                tempPosition.longitude = position.coords.longitude;
                tempPosition.speed = position.coords.speed;
                tempPosition.accuracy = position.coords.accuracy;
                tempPosition.heading = position.coords.heading;
                tempPosition.timestamp = position.timestamp;

                oldPosition = currentPosition;
                currentPosition = position;
            }
        }, function() {
            tracking = false;
            clearInterval(interval.tracking);
            platformCommands.queueMessage({
                text : [
                    'Unable to connect to the tracking satellites',
                    'Turning off tracking is a major offense',
                    'Organica Death Squads have been sent to scour the area'
                ], extraClass : 'importantMsg'
            });
        });
    }
}

function sendLocationData() {
    if(currentPosition !== oldPosition) {
        // Geolocation object is empty when sent through Socket.IO
        // This is a fix for that
        var tempPosition = {};
        tempPosition.latitude = currentPosition.coords.latitude;
        tempPosition.longitude = currentPosition.coords.longitude;
        tempPosition.speed = currentPosition.coords.speed;
        tempPosition.accuracy = currentPosition.coords.accuracy;
        tempPosition.heading = currentPosition.coords.heading;
        tempPosition.timestamp = currentPosition.timestamp;

        oldPosition = currentPosition;

        socket.emit('updateLocation', tempPosition);
    }
}

function getAvailableCommands() {
    var keys = Object.keys(validCommands).sort();
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
    var phrases = trimWhitespaces(getInputText().toLowerCase()).split(' ');
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

            if(platformCommands.getLocally('mode') === 'chatmode') {
                newText += '-';
            }

            newText += matched[0] + ' ';

            clearInput();
            setLeftText(newText);
        } else if(matched.length > 0) {
            var msg = '';

            matched.sort();

            for(var i = 0; i < matched.length; i++) {
                msg += matched[i] + '\t';
            }

            platformCommands.queueMessage({ text : [msg] });
        }
        // No input? Show all available commands
    } else if(partialCommand.length === 0) {
        validCommands.help.func();
    }

}

// Needed for arrow and delete keys. They are not detected with keypress
function specialKeyPress(event) {
    var keyCode = (typeof event.which === 'number') ? event.which : event.keyCode;

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
            if(!commandHelper.keyboardBlocked && commandHelper.command === null) {
                autoComplete();
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
        // Page up
        case 33:
            window.scrollBy(0, -window.innerHeight);

            event.preventDefault();

            break;
        //Page down
        case 34:
            window.scrollBy(0, window.innerHeight);

            event.preventDefault();

            break;
        // Left arrow
        case 37:
            // Moves the marker one step to the left
            if(getLeftText(marker)) {
                prependToRightText(marker.value);
                setMarkerText(getLeftText(marker).slice(-1));
                setLeftText(getLeftText(marker).slice(0, -1));
            }

            event.preventDefault();

            break;
        // Right arrow
        case 39:
            // Moves marker one step to the right
            if(getRightText(marker)) {
                appendToLeftText(marker.value);
                setMarkerText(getRightText(marker)[0]);
                setRightText(getRightText(marker).slice(1));
            }

            event.preventDefault();

            break;
        // Up arrow
        case 38:
            console.log('before', previousCommandPointer);
            if(!commandHelper.keyboardBlocked && commandHelper.command === null) {
                if(previousCommandPointer > 0) {
                    clearInput();
                    previousCommandPointer--;
                    appendToLeftText(previousCommands[previousCommandPointer]);
                }
            }
            console.log('after', previousCommandPointer);

            event.preventDefault();

            break;
        // Down arrow
        case 40:
            console.log('before', previousCommandPointer);
            if(!commandHelper.keyboardBlocked && commandHelper.command === null) {
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
            }
            console.log('after', previousCommandPointer);

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
            if(!commandHelper.keyboardBlocked) {
                if(commandHelper.command !== null) {
                    var phrase = trimWhitespaces(getInputText().toLowerCase());

                    if(phrase === 'exit' || phrase === 'abort') {
                        setCommand(null);
                        platformCommands.queueMessage({ text : ['Aborting command'] });
                    } else {
                        platformCommands.queueMessage({ text : [phrase] });

                        validCommands[commandHelper.command].steps[commandHelper.currentStep](phrase, socket);
                    }
                } else {
                    // Index 0 is the command part
                    var phrases = trimWhitespaces(getInputText().toLowerCase()).split(' ');
                    var command = null;
                    var commandName;

                    if(phrases[0].length > 0) {
                        if(platformCommands.getLocally('mode') === 'normalmode') {
                            commandName = phrases[0];
                            command = validCommands[commandName];
                        } else {
                            var sign = phrases[0].charAt(0);

                            if(sign === '-') {
                                commandName = phrases[0].slice(1);
                                command = validCommands[commandName];
                            }
                        }

                        if(currentUser !== null && command) {
                            // Store the command for usage with up/down arrows
                            previousCommands.push(phrases.join(' '));
                            previousCommandPointer++;
                            platformCommands.setLocally('previousCommands', JSON.stringify(previousCommands));

                            if(command.steps) {
                                commandHelper.command = commandName;
                                commandHelper.maxSteps = command.steps.length;
                            }

                            // Print input if the command shouldn't clear after use
                            if(!command.clearAfterUse) {
                                var message = { text : [getInputStart() + getMode() + '$ ' + getInputText()] };

                                if(command.usageTime) {
                                    message.timestamp = true;
                                }

                                platformCommands.queueMessage(message);
                            }

                            // Print the help and instruction parts of the command
                            if(phrases[1] === '--help') {
                                var message = { text : [] };

                                if(command.help) {
                                    message.text = message.text.concat(command.help);
                                }

                                if(command.instructions) {
                                    message.text = message.text.concat(command.instructions);
                                }

                                if(message.text.length > 0) {
                                    platformCommands.queueMessage(message);
                                }
                            } else {
                                command.func(phrases.splice(1));
                            }
                            // A user who is not logged in will have access to register and login commands
                        } else if(command && (commandName === 'register' || commandName === 'login')) {
                            platformCommands.queueMessage({ text : [getInputStart() + getInputText()] });
                            command.func(phrases.splice(1));
                        } else if(platformCommands.getLocally('mode') === 'chatmode' && phrases[0].length > 0) {
                            validCommands.msg.func(phrases);
                        } else if(currentUser === null) {
                            platformCommands.queueMessage({
                                text : [
                                    'You must register a new user or login with an existing user',
                                    'Use command "register" or "login"',
                                    'e.g. register myname 1135',
                                    'or login myname 1135'
                                ]
                            });
                            // Sent command was not found. Print the failed input
                        } else if(commandName.length > 0) {
                            platformCommands.queueMessage({ text : ['- ' + phrases[0] + ': ' + commandFailText.text] });
                        }
                    }
                }
            }

            clearInput();

            break;
        default:
            var textChar = String.fromCharCode(keyCode);

            if(isAllowedChar(textChar)) {
                if(textChar) {
                    appendToLeftText(textChar);
                }

                if(triggerAutoComplete(getLeftText(marker)) && commandHelper.command === null) {
                    autoComplete();
                }
            }

            break;
    }

    event.preventDefault();
}

function isAllowedChar(text) {
    return /^[a-zA-Z0-9åäöÅÄÖ/\s\-\_\.\,\;\:\!\"\*\'\?\+\=\/\&\)\(\^\[\]]+$/g.test(text);
}

// Needed for Android 2.1. trim() is not supported
function trimWhitespaces(sentText) {
    return sentText.replace(/^\s+|\s+$/g, '');
}

function triggerAutoComplete(text) {
    if(text.charAt(text.length - 1) === ' ' && text.charAt(text.length - 2) === ' ') {
        setLeftText(trimWhitespaces(text));

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
        var shortQueue = messageQueue.splice(0, 3);

        charsInProgress = countTotalCharacters(shortQueue);

        if(charsInProgress > 0) {
            while(shortQueue.length > 0) {
                var message = shortQueue.shift();
                var speed = message.speed;

                if(message.text != null) {
                    while(message.text.length > 0) {
                        var text = message.text.shift();
                        var fullText = generateFullText(text, message);

                        setTimeout(addRow, nextTimeout, fullText, speed, message.extraClass);

                        nextTimeout += calculateTimer(fullText, speed);
                    }
                }
            }
        }
    }
}

// Adds time stamp and room name to a string from a message if they are set
function generateFullText(sentText, message) {
    var text = '';

    if(message.time) {
        text += generateShortTime(message.time);
    }
    if(message.roomName) {
        text += message.roomName !== platformCommands.getLocally('room') ? '[' + message.roomName + '] ' : '';
    }
    if(message.user) {
        text += message.user + ': ';
    }

    text += sentText;

    return text;
}

// Counts all characters in the message array and returns it
function countTotalCharacters(messageQueue) {
    var total = 0;

    for(var i = 0; i < messageQueue.length; i++) {
        var message = messageQueue[i];

        for(var j = 0; j < message.text.length; j++) {
            var text = generateFullText(message.text[j], message);
            total += text.length;
        }
    }

    return total;
}

// Calculates amount of time to print text (speed times amount of characters plus buffer)
function calculateTimer(text, speed) {
    var timeout = isNaN(speed) ? charTimeout : speed;

    return (text.length * timeout) + rowTimeout;
}

function addRow(text, speed, extraClass) {
    var row = document.createElement('li');
    var span = document.createElement('span');

    if(extraClass) {
        // classList doesn't work on older devices, thus the usage of className
        row.className += ' ' + extraClass;
    }

    row.appendChild(span);
    mainFeed.appendChild(row);

    if(isNaN(speed) || speed > 0) {
        addLetters(span, text, speed);
    } else {
        var textNode = document.createTextNode(text);

        span.appendChild(textNode);
        charsInProgress -= text.length;
    }

    scrollView(row);
}

function addLetters(span, text, speed) {
    var lastTimeout = 0;
    var timeout = isNaN(speed) ? charTimeout : speed;

    for(var i = 0; i < text.length; i++) {
        setTimeout(printLetter, timeout + lastTimeout, span, text.charAt(i));

        lastTimeout += timeout;
    }
}

// Prints one letter and decreases in progress tracker
function printLetter(span, character) {
    var textNode = document.createTextNode(character);
    span.appendChild(textNode);
    charsInProgress--;
}

function scrollView(element) {
    element.scrollIntoView();
}

// Takes date and returns shorter readable time
function generateShortTime(date) {
    var newDate = new Date(date);
    var minutes = (newDate.getMinutes() < 10 ? '0' : '') + newDate.getMinutes();
    var hours = (newDate.getHours() < 10 ? '0' : '') + newDate.getHours();

    return hours + ':' + minutes + ' ';
}

// Taken from http://stackoverflow.com/questions/639695/how-to-convert-latitude-or-longitude-to-meters/11172685#11172685
function measureDistance(lat1, lon1, lat2, lon2) {  // generally used geo measurement function
    var R = 6378.137; // Radius of earth in KM
    var dLat = (lat2 - lat1) * Math.PI / 180;
    var dLon = (lon2 - lon1) * Math.PI / 180;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    return d * 1000; // meters
}