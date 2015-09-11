'use strict';

/**
 * const and let support is still kind of shaky on client side, thus the
 * usage of var
 */

// Timeout between print of rows (milliseconds)
var rowTimeout = 40;

/**
 * Number of messages that will be processed and printed
 * per loop in consumeMsgQueue
 */
var msgsPerQueue = 3;

// Queue of all the message objects that will be handled and printed
var msgQueue;

/**
 * Shorter queue of messages that will be processed this loop. Length is
 * based on msgsPerQueue variable
 */
var shortMsgQueue;

var cmdQueue;

// True if messages are being processed and printed right now
var printing = false;

// Used to block repeat of some key presses
var keyPressed = false;

// Used for Android full screen to change CSS layout
var clicked = false;

// Char that is prepended on commands in chat mode
var commandChars = ['-', '/'];

/**
 * Focus can sometimes trigger twice, which is used to check if a reconnection
 * is needed. This flag will be set to true while it is reconnecting to
 * block the second attempt
 */
var reconnecting = false;

// Interval/timeout times in milliseconds
var printIntervalTime = 200;
var screenOffIntervalTime = 1000;
var watchPositionTime = 15000;
var pausePositionTime = 40000;

/**
 * DOM element init
 * Initiation of DOM elements has to be done here.
 * Android 4.1.* would otherwise give JS errors
 */
var mainFeed = document.getElementById('mainFeed');
var marker = document.getElementById('marker');
var leftText = document.getElementById('leftText');
var rightText = document.getElementById('rightText');
var inputStart = document.getElementById('inputStart');
var modeField = document.getElementById('mode');
var spacer = document.getElementById('spacer');

// Socket.io
var socket;

// Is geolocation tracking on?
var tracking = true;
var positions = [];
var watchId = null;

// Queue of all the sounds that will be handled and played
var soundQueue = [];
var audioCtx;
var oscillator;
var gainNode;
var soundTimeout = 0;

var previousCommandPointer;

var commandTime = 1000;
var commandUsed = false;
var commandTimeout;

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
var razLogo = {
  text : [
    ' ',
    '   ####',
    '###############',
    ' #####  #########                                     ' +
    '      ####',
    '  ####     #######  ########     ###########    ####  ' +
    '   ###########',
    '  ####    ######      #######   ####   #####  ########' +
    '    ####   #####',
    '  ####  ###         ####  ####        ####  ###    ###' +
    '### ####   #####',
    '  #########        ####    ####     ####   #####     #' +
    '#############',
    '  #### ######     ####     #####  ####     #######   #' +
    '##  ########',
    '  ####   ######  ##### #### #### ############  #######' +
    '    ####   ###',
    ' ######    #############    ################     ###  ' +
    '    ####    #####',
    '########     ########         ###                     ' +
    '   ######      #####   ##',
    '               ###########        ##                  ' +
    '                  ###### ',
    '                    ###############',
    '                         #####   demos - warez - honey',
    ' '
  ],
  extraClass : 'logo'
};
var logo = {
  text : [
    '                          ####',
    '                ####    #########    ####',
    '               ###########################',
    '              #############################',
    '            #######        ##   #  ##########',
    '      ##########           ##    #  ###  ##########',
    '     #########             #########   #   #########',
    '       #####               ##     ########   #####',
    '     #####                 ##     ##     ##########',
    '     ####                  ##      ##     #   ######',
    ' #######                   ##########     ##    ########',
    '########      Organica     ##       ########     ########',
    ' ######      Oracle        ##       #      #############',
    '   ####     Operations     ##       #      ##     ####',
    '   ####     Center         ##       #      ##    #####',
    '   ####      Razor         ##       #      ###########',
    '########      Edition      ##       #########    ########',
    '########                   ##########      #    #########',
    ' ########                  ##      ##     ## ###########',
    '     #####                 ##      ##     ### #####',
    '       #####               ##     ########   #####',
    '      #######              ##########   #  ########',
    '     ###########           ##    ##    # ###########',
    '      #############        ##    #   #############',
    '            ################################',
    '              ############################',
    '              #######  ##########  #######',
    '                ###      ######      ###',
    '                          ####'
  ],
  extraClass : 'logo'
};

/**
 * Stores everything related to the map area
 * The map area will be separated into grids
 * The size of each grid is dependent of the map size
 * (which is set with coordinates) and max amount of X and Y grids
 */
var mapHelper = {
  leftLong : 15.1857261,
  rightLong : 15.2045467,
  topLat : 59.7609695,
  bottomLat : 59.7465301,
  xGridsMax : 24,
  yGridsMax : 36,
  xSize : 0,
  ySize : 0,
  xGrids : {},
  yGrids : {}
};

var commandFailText = { text : ['command not found'] };

var cmdHelper = {
  maxSteps : 0,
  onStep : 0,
  command : null,
  keyboardBlocked : false,
  data : null
};

var platformCmds = {
  setLocalVal : function(name, item) {
    localStorage.setItem(name, item);
  },
  getLocalVal : function(name) {
    return localStorage.getItem(name);
  },
  removeLocalVal : function(name) {
    localStorage.removeItem(name);
  },
  isTextAllowed : function(text) {
    return /^[a-zA-Z0-9]+$/g.test(text);
  },
  queueMessage : function(message) {
    msgQueue.push(message);
  },
  resetAllLocalVals : function() {
    platformCmds.removeLocalVal('cmdHistory');
    platformCmds.removeLocalVal('room');
    platformCmds.removeLocalVal('user');
    platformCmds.setAccessLevel(0);

    previousCommandPointer = 0;
    platformCmds.setInputStart('RAZCMD');
  },
  getAccessLevel : function() {
    return parseInt(platformCmds.getLocalVal('accessLevel'));
  },
  setAccessLevel : function(accessLevel) {
    platformCmds.setLocalVal('accessLevel', accessLevel);
  },
  getCommands : function() {
    return validCmds;
  },
  getUser : function() {
    return platformCmds.getLocalVal('user');
  },
  setUser : function(user) {
    platformCmds.setLocalVal('user', user);
  },
  getCommandChars : function() {
    return commandChars;
  },
  getFeed : function() {
    return mainFeed;
  },
  // TODO: Change name to setModeText or similar
  setModeText : function(text) {
    modeField.textContent = text;
  },
  // TODO: Change name to setModeText or similar
  getModeText : function() {
    return modeField.textContent; // String
  },
  setMode : function(mode) {
    platformCmds.setLocalVal('mode', mode);
  },
  getMode : function() {
    return platformCmds.getLocalVal('mode');
  },
  isTracking : function() {
    return tracking;
  },
  // TODO: Change name to setInputStartText or similar
  setInputStart : function(text) {
    inputStart.textContent = text;
  },
  getCmdHelper : function() {
    return cmdHelper;
  },
  resetCommand : function(aborted) {
    var cmdObj = platformCmds.getCmdHelper();

    cmdObj.command = null;
    cmdObj.onStep = 0;
    cmdObj.maxSteps = 0;
    cmdObj.keyboardBlocked = false;
    cmdObj.data = null;
    platformCmds.setInputStart(platformCmds.getLocalVal('room'));

    if (aborted) {
      platformCmds.queueMessage({
        text : ['Aborting command']
      });
    }
  },
  refreshApp : function() {
    window.location.reload();
  },
  queueCommand : function(command, data, cmdMsg) {
    cmdQueue.push({
      command : command,
      data : data,
      cmdMsg : cmdMsg
    });
  }
};

/**
 * Used by isScreenOff() to force reconnect when phone screen is off
 * for a longer period of time
 */
var lastScreenOff = (new Date()).getTime();

// Object containing all running intervals
var intervals = {
  tracking : null,
  printText : null,
  isScreenOff : null
};

var validCmds = {
  help : {
    func : function(phrases) {
      function capitalizeString(text) {
        return text.charAt(0).toUpperCase() + text.slice(1);
      }

      function getCommands(group) {
        var commands = platformCmds.getCommands();
        //TODO Change from Object.keys for compatibility with older Android
        var keys = Object.keys(commands).sort();
        var commandStrings = [];

        if (group !== undefined) {
          commandStrings.push(capitalizeString(group) + ' commands:');
        }

        for (var i = 0; i < keys.length; i++) {
          var command = commands[keys[i]];
          var commandAccessLevel = command.accessLevel;

          if ((isNaN(commandAccessLevel) ||
               platformCmds.getAccessLevel() >= commandAccessLevel) &&
              (group === undefined || command.category === group)) {
            var msg = '  ';

            msg += keys[i];

            commandStrings.push(msg);
          }
        }

        return commandStrings;
      }

      function getAll() {
        var loginCmds = getCommands('login');
        var basicCmds = getCommands('basic');
        var advancedCmds = getCommands('advanced');
        var hackingCmds = getCommands('hacking');
        var adminCmds = getCommands('admin');

        if (platformCmds.getUser() === null) {
          platformCmds.queueMessage({
            text : [
              '------------------------------------------------',
              'Use register to register a new user',
              'Use login to log in to an existing user',
              'You have to log in to access most of the system',
              '------------------------------------------------'
            ]
          });
          platformCmds.queueMessage({
            text : loginCmds
          });
        }

        if (basicCmds.length > 1) {
          platformCmds.queueMessage({
            text : basicCmds
          });
        }

        if (advancedCmds.length > 1) {
          platformCmds.queueMessage({
            text : advancedCmds
          });
        }

        if (hackingCmds.length > 1) {
          platformCmds.queueMessage({
            text : hackingCmds
          });
        }

        if (adminCmds.length > 1) {
          platformCmds.queueMessage({
            text : adminCmds
          });
        }
      }

      if (phrases === undefined || phrases.length === 0) {
        var cmdChars = platformCmds.getCommandChars();

        platformCmds.queueMessage({
          text : [
            '--------',
            '  Help',
            '--------',
            'Instructions',
            '  You have to prepend commands with "' + cmdChars.join('" or "') +
            '" in chat mode. ' + 'Example: ' + cmdChars[0] +
            'enterroom',
            '  Add -help after a command to get instructions' +
            ' on how to use it. Example: ' + cmdChars[0] +
            'uploadkey -help',
            'Shortcuts',
            '  Use page up/down to scroll the view',
            '  Press arrow up/down to go through your previous used commands',
            '  Pressing tab or space twice will auto-complete any ' +
            'command you have begun writing.',
            '  Example: "he" and a tab / double space ' +
            'will automatically turn into "help"'
          ]
        });

        getAll();
      } else {
        getAll();
      }
    },
    help : [
      'Shows a list of available commands',
      'The set of commands shown is the basic set',
      'Add "all" to show all commands available to you. Example: ' +
      'help all'
    ],
    instructions : [
      ' Usage:',
      '  help *optional all*',
      ' Example:',
      '  help',
      '  help all'
    ],
    accessLevel : 1,
    category : 'basic'
  },
  clear : {
    func : function() {
      var feed = platformCmds.getFeed();

      while (feed.childNodes.length > 1) {
        feed.removeChild(feed.lastChild);
      }
    },
    help : ['Clears the terminal view'],
    clearAfterUse : true,
    accessLevel : 13,
    category : 'basic'
  },
  whoami : {
    func : function() {
      platformCmds.queueMessage({
        text : [
          '----------',
          '  Whoami',
          '----------',
          'User name: ' + platformCmds.getUser(),
          'Access level: ' + platformCmds.getAccessLevel(),
          'Device ID: ' + platformCmds.getLocalVal('deviceId')
        ]
      });
    },
    help : ['Shows the current user'],
    accessLevel : 13,
    category : 'basic'
  },
  msg : {
    func : function(phrases) {
      if (phrases && phrases.length > 0) {
        var writtenMsg = phrases.join(' ');

        socket.emit('chatMsg', {
          message : {
            text : [writtenMsg],
            user : platformCmds.getUser()
          },
          roomName : platformCmds.getLocalVal('room')
        });
      } else {
        platformCmds.queueMessage({
          text : ['You forgot to write the message!']
        });
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
    clearAfterUse : true,
    accessLevel : 13,
    category : 'advanced'
  },
  broadcast : {
    func : function() {
      var data = {};

      data.text = [];
      platformCmds.getCmdHelper().data = data;

      platformCmds.queueMessage({
        text : [
          'Who is the broadcast from?',
          'You can also leave it empty and just press enter'
        ]
      });
      platformCmds.queueMessage({
        text : [
          'You can cancel out of the command by typing ' +
          '"exit" or "abort"'
        ]
      });
      platformCmds.setInputStart('broadcast');
    },
    steps : [
      function(phrases) {
        if (phrases.length > 0 && phrases[0] !== '') {
          var phrase = phrases.join(' ');

          cmdHelper.data.text.push('--- BROADCAST FROM: ' + phrase + ' ---');
        } else {
          cmdHelper.data.text.push('--- BROADCAST ---');
        }

        platformCmds.queueMessage({
          text : [
            'Write a line and press enter',
            'Press enter without any input when you are done ' +
            'with the message'
          ]
        });
        cmdHelper.onStep++;
      },
      function(phrases) {
        if (phrases.length > 0 && phrases[0] !== '') {
          var phrase = phrases.join(' ');

          cmdHelper.data.text.push(phrase);
        } else {
          var dataText;

          cmdHelper.data.text.push('--- END BROADCAST ---');
          dataText = cmdHelper.data.text !== null ?
                         JSON.parse(JSON.stringify(cmdHelper.data.text)) : '';

          cmdHelper.onStep++;

          platformCmds.queueMessage({
            text : ['Preview of the message:']
          });
          platformCmds.queueMessage({
            text : dataText
          });
          platformCmds.queueMessage({
            text : ['Is this OK? "yes" to accept the message']
          });
        }
      },
      function(phrases) {
        if (phrases.length > 0 && phrases[0].toLowerCase() === 'yes') {
          socket.emit('broadcastMsg', cmdHelper.data);
          platformCmds.resetCommand();
        } else {
          platformCmds.resetCommand(true);
        }
      }
    ],
    help : [
      'Sends a message to all users in all rooms',
      'It will prepend the message with "[ALL]"'
    ],
    instructions : [
      'Follow the on-screen instructions'
    ],
    accessLevel : 13,
    clearAfterUse : true,
    category : 'admin'
  },
  enterroom : {
    func : function(phrases) {
      if (phrases.length > 0) {
        var room = {};
        var roomName = phrases[0].toLowerCase();
        var oldRoomName = platformCmds.getLocalVal('room');
        var password = '';

        if (phrases.length > 1) {
          password = phrases[1];
        }

        if (roomName) {
          var oldRoom = { roomName : oldRoomName };

          room.roomName = roomName;
          room.password = password;
          // Flag that will be used in .on function locally to
          // show user they have entered
          room.entered = true;

          validCmds.clear.func();

          if (oldRoomName !== roomName) {
            socket.emit('unfollow', oldRoom);
          }

          socket.emit('follow', room);
        }
      } else {
        platformCmds.queueMessage({
          text : ['You have to specify which room to enter']
        });
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
    ],
    accessLevel : 13,
    category : 'basic'
  },
  follow : {
    func : function(phrases) {
      if (phrases.length > 0) {
        var room = {};
        room.roomName = phrases[0].toLowerCase();
        room.password = phrases[1];

        socket.emit('follow', room);
      } else {
        platformCmds.queueMessage({
          text : [
            'You have to specify which room to follow and a' +
            'password (if it is protected)'
          ]
        });
      }
    },
    help : [
      'Follows a room and shows you all messages posted in it.',
      'You will get the messages from this room even if it isn\'t' +
      'your currently selected one'
    ],
    instructions : [
      ' Usage:',
      '  follow *room name* *optional password*',
      ' Example:',
      '  follow room1 banana'
    ],
    accessLevel : 13,
    category : 'advanced'
  },
  unfollow : {
    func : function(phrases) {
      if (phrases.length > 0) {
        var room = {};
        var roomName = phrases[0].toLowerCase();

        if (roomName === platformCmds.getLocalVal('room')) {
          room.exited = true;
        }

        room.roomName = roomName;

        socket.emit('unfollow', room);
      } else {
        platformCmds.queueMessage({
          text : ['You have to specify which room to unfollow']
        });
      }
    },
    help : ['Stops following a room.'],
    instructions : [
      ' Usage:',
      '  unfollow *room name*',
      ' Example:',
      '  unfollow roomname'
    ],
    accessLevel : 13,
    category : 'advanced'
  },
  list : {
    func : function(phrases) {
      if (phrases.length > 0) {
        var listOption = phrases[0].toLowerCase();
        if (listOption === 'rooms') {
          socket.emit('listRooms');
        } else if (listOption === 'users') {
          socket.emit('listUsers');
        } else if (listOption === 'devices') {
          socket.emit('listDevices');
        } else {
          platformCmds.queueMessage({
            text : [listOption + 'is not a valid option']
          });
        }
      } else {
        platformCmds.queueMessage({
          text : [
            'You have to input which option you want to list',
            'Available options: users, rooms, devices',
            'Example: list rooms'
          ]
        });
      }
    },
    help : [
      'Shows a list of users, rooms or devices which you are allowed to see',
      'You have to input which option you want to list'
    ],
    instructions : [
      ' Usage:',
      '  list *option*',
      ' Example',
      '  list rooms',
      '  list users',
      '  list devices'
    ],
    accessLevel : 13,
    category : 'basic'
  },
  mode : {
    func : function(phrases, verbose) {
      if (phrases.length > 0) {
        var newMode = phrases[0].toLowerCase();
        var cmdChars = platformCmds.getCommandChars();

        if (newMode === 'chat') {
          platformCmds.setMode('chat');
          platformCmds.setModeText('[CHAT]');

          if (verbose === undefined || verbose) {
            platformCmds.queueMessage({
              text : [
                '-----------------------',
                '  Chat mode activated',
                '-----------------------',
                'Prepend commands with "' + cmdChars.join('" or "') +
                '", e.g. ' + '"' + cmdChars[0] +
                'uploadkey"',
                'Everything else written and sent ' +
                'will be intepreted' +
                'as a chat message'
              ]
            });
          }
        } else if (newMode === 'cmd') {
          platformCmds.setMode('cmd');
          platformCmds.setModeText('[CMD]');

          if (verbose === undefined || verbose) {
            platformCmds.queueMessage({
              text : [
                '--------------------------',
                '  Command mode activated',
                '--------------------------',
                'Commands can be used without "' +
                cmdChars[0] + '"',
                'You have to use command "msg" ' +
                'to send messages'
              ]
            });
          }
        } else {
          platformCmds.queueMessage({
            text : [newMode + 'is not a valid mode']
          });
        }
      } else {
        platformCmds.queueMessage({
          text : [
            'Current mode: ' + platformCmds.getMode()
          ]
        });
      }
    },
    help : [
      'Change the input mode. The options are chat or cmd',
      '--Chat mode--',
      'Everything written will be interpreted as chat messages',
      'All commands have to be prepended with "' +
      commandChars.join('" or "') + '" ' +
      'Example: ' + commandChars[0] + 'uploadkey',
      '--Cmd mode--',
      'Text written will not be automatically be intepreted as ' +
      'chat messages',
      'You have to use "msg" command to write messages ' +
      'Example: msg hello',
      'Commands do not have to be prepended with anything. ' +
      'Example: uploadkey'
    ],
    instructions : [
      ' Usage:',
      '  mode *mode*',
      ' Example:',
      '  mode chat',
      '  mode cmd'
    ],
    accessLevel : 13,
    category : 'advanced'
  },
  register : {
    func : function(phrases) {
      if (platformCmds.getLocalVal('user') === null) {
        var errorMsg = {
          text : [
            'Name has to be 3 to 6 characters long',
            'Password has to be at least 4 characters',
            'The name and password can only contain letters ' +
            'and numbers (a-z, 0-9. Password can mix upper and lowercase)',
            'Don\'t use whitespace in your name or password!',
            'e.g. register myname apple1'
          ]
        };

        if (phrases.length > 1) {
          var user = {};
          var userName = phrases[0].toLowerCase();
          var password = phrases[1];

          if (userName.length >= 3 && userName.length <= 6 &&
              password.length >= 4 &&
              platformCmds.isTextAllowed(userName) &&
              platformCmds.isTextAllowed(password)) {
            user.userName = userName;
            user.registerDevice = platformCmds.getLocalVal('deviceId');
            user.password = password;
            socket.emit('register', user);
          } else {
            platformCmds.queueMessage(errorMsg);
          }
        } else {
          platformCmds.queueMessage(errorMsg);
        }
      } else {
        platformCmds.queueMessage({
          text : [
            'You have already registered a user',
            platformCmds.getLocalVal('user') +
            ' is registered to this device'
          ]
        });
      }
    },
    help : [
      'Registers your user name on the server and connects it ' +
      'to your device',
      'This user name will be your identity in the system',
      'The name can only contain letters and numbers (a-z, 0-9)',
      'Don\'t use whitespaces in your name or password!'
    ],
    instructions : [
      ' Usage:',
      '  register *user name* *password*',
      ' Example:',
      '  register myname secure1'
    ],
    clearAfterUse : true,
    accessLevel : 0,
    category : 'login'
  },
  createroom : {
    func : function(phrases) {
      var errorMsg = {
        text : [
          'Failed to create room.',
          'Room name has to be 1 to 6 characters long',
          'The room name and password can only contain letters and numbers ' +
          '(a-z, 0-9. Password can mix upper and lowercase)',
          'e.g. createroom myroom'
        ]
      };

      if (phrases.length > 0) {
        var roomName = phrases[0].toLowerCase();
        var password = phrases[1];

        if (roomName.length > 0 && roomName.length < 7 &&
            platformCmds.isTextAllowed(roomName) &&
            platformCmds.isTextAllowed(password)) {
          var room = {};

          room.roomName = roomName;
          room.password = password;
          room.owner = platformCmds.getUser();

          socket.emit('createRoom', room);
        } else {
          platformCmds.queueMessage(errorMsg);
        }
      } else {
        platformCmds.queueMessage(errorMsg);
      }
    },
    help : [
      'Creates a chat room',
      'The rooms name has to be 1 to 6 characters long',
      'The password is optional, but if set it has to be 4 to 10 ' +
      'characters',
      'The name can only contain letters and numbers (a-z, 0-9)'
    ],
    instructions : [
      ' Usage:',
      '  createroom *room name* *optional password*',
      ' Example:',
      '  createroom myroom banana'
    ],
    accessLevel : 13,
    category : 'advanced'
  },
  myrooms : {
    func : function() {
      var data = {};

      data.userName = platformCmds.getUser();
      data.device = platformCmds.getLocalVal('deviceId');

      socket.emit('myRooms', data);
    },
    help : ['Shows a list of all rooms you are following'],
    accessLevel : 13,
    category : 'advanced'
  },
  login : {
    func : function(phrases) {
      if (platformCmds.getUser() !== null) {
        platformCmds.queueMessage({
          text : [
            'You are already logged in',
            'You have to be logged out to log in'
          ]
        });
      } else if (phrases.length > 1) {
        var user = {};
        user.userName = phrases[0].toLowerCase();
        user.password = phrases[1];

        socket.emit('login', user);
      } else {
        platformCmds.queueMessage({
          text : [
            'You need to input a user name and password',
            'Example: login bestname secretpassword'
          ]
        });
      }
    },
    help : [
      'Logs in as a user on this device',
      'You have to be logged out to login as another user'
    ],
    instructions : [
      ' Usage:',
      '  login *user name* *password',
      ' Example:',
      '  login user11 banana'
    ],
    clearAfterUse : true,
    accessLevel : 0,
    category : 'login'
  },
  time : {
    func : function() {
      socket.emit('time');
    },
    help : ['Shows the current time'],
    accessLevel : 13,
    category : 'basic'
  },
  locate : {
    func : function(phrases) {
      if (!platformCmds.isTracking()) {
        platformCmds.queueMessage({
          text : [
            'Tracking not available',
            'You are not connected to the satellites'
          ]
        });
      } else if (phrases.length > 0) {
        var userName = phrases[0].toLowerCase();

        socket.emit('locate', userName);
      } else {
        socket.emit('locate', platformCmds.getUser());
      }
    },
    help : [
      'Shows the last known location of the user',
      '* is a shortcut for all users. Example: locate *',
      'Just writing the command without a user name will show your ' +
      'current location. Example: locate',
      'You need to be connected to the satellites to access this command'
    ],
    instructions : [
      ' Usage:',
      '  locate *optional user name OR "*"*',
      ' Example:',
      '  locate user1',
      '  locate *',
      '  locate'
    ],
    accessLevel : 13,
    category : 'advanced'
  },
  uploadkey : {
    func : function() {
      var razLogoToPrint = razLogo !== null ?
                           JSON.parse(JSON.stringify(razLogo)) : { text : ['']};

      // TODO: razLogo should be move to DB or other place
      platformCmds.queueMessage(razLogoToPrint);
      platformCmds.queueMessage({
        text : [
          'Razor proudly presents:',
          'Entity Hacking Access! (EHA)',
          'AAAB3NzaC1yc2EAAAADAQABAAABAQDHS//2a/B',
          'D6Rsc8OO/6wFUVDdpdAItvSCLCrc/dcJE/ybEV',
          'w3OtlVFnfNkOVAvhObuWO/6wFUVDdkr2YTaDEt',
          'i5mxEFD1zslvhObuWr6QKLvfZVczAxPFKLvfZV',
          'dK2zXrxGOmOFllxiCbpGOmOFlcJyiCbp0mA4ca',
          'MFvEEiKXrxGlxiCbp0miONA3EscgY/yujOMJHa',
          'Q1uy6yEZOmOFl/yujOMJHa881DVwWl6lsjHvSi',
          'wDDVwWl6el88/x1j5C+k/atg1lcvcz7Tdtve4q',
          'VTVz0HIhxv595Xqw2qrv6GrdX/FrhObuWr6QKL',
          ' ',
          'Please wait.......',
          'Command interception.........ACTIVATED',
          'Oracle defense systems........DISABLED',
          'Overriding locks..................DONE',
          'Connecting to entity database.....DONE',
          ' ',
          'You can cancel out of the command by typing "exit" ' +
          'or "abort"'
        ]
      });
      platformCmds.setInputStart('Enter encryption key');
      socket.emit('entities');
    },
    steps : [
      function(phrases, socket) {
        var cmdObj = platformCmds.getCmdHelper();
        var phrase = phrases.join(' ');

        socket.emit('verifyKey', phrase.toLowerCase());
        platformCmds.queueMessage({
          text : [
            'Verifying key. Please wait...'
          ]
        });
        cmdObj.keyboardBlocked = true;
        platformCmds.setInputStart('Verifying...');
      },
      function(data, socket) {
        if (data.keyData !== null) {
          if (data.keyData.reusable || !data.keyData.used) {
            var cmdObj = platformCmds.getCmdHelper();

            platformCmds.queueMessage({
              text : ['Key has been verified. Proceeding']
            });
            cmdObj.onStep++;
            cmdObj.data = data;
            platformCmds.getCommands()[cmdObj.command].steps[cmdObj.onStep](
              socket);
          } else {
            platformCmds.queueMessage({
              text : ['Key has already been used. Aborting']
            });
            platformCmds.resetCommand(true);
          }
        } else {
          platformCmds.queueMessage({
            text : ['The key is invalid. Aborting']
          });
          platformCmds.resetCommand(true);
        }
      },
      function() {
        var cmdObj = platformCmds.getCmdHelper();

        platformCmds.setInputStart('Enter entity name');
        cmdObj.keyboardBlocked = false;
        cmdObj.onStep++;
      },
      function(phrases, socket) {
        var cmdObj = platformCmds.getCmdHelper();
        var data = cmdObj.data;
        var phrase = phrases.join(' ');

        data.entityName = phrase.toLowerCase();
        data.userName = platformCmds.getUser();
        socket.emit('unlockEntity', data);
        platformCmds.queueMessage({
          text : [
            'Unlocking entity. Please wait...'
          ]
        });
        cmdObj.keyboardBlocked = true;
      },
      function(entity) {
        if (entity !== null) {
          platformCmds.queueMessage({
            text : [
              'Confirmed. Encryption key has been used on ' +
              'the entity',
              entity.entityName + ' now has ' +
              (entity.keys.length + 1) + ' unlocks',
              'Thank you for using EHA'
            ]
          });
        } else {
          platformCmds.queueMessage({
            text : [
              'Failed',
              'Encryption key could not be used on entity.',
              'Aborting'
            ]
          });
        }

        platformCmds.resetCommand(true);
      }
    ],
    help : [
      'ERROR. UNAUTHORIZED COMMAND...AUTHORIZATION OVERRIDDEN. ' +
      'PRINTING INSTRUCTIONS',
      'Allows you to input an encryption key and use it to unlock ' +
      'an entity',
      'You can cancel out of the command by typing "exit" or "abort"'
    ],
    instructions : [
      'Follow the on-screen instructions'
    ],
    clearBeforeUse : true,
    accessLevel : 13,
    category : 'basic'
  },
  history : {
    func : function(phrases) {
      var data = {};

      data.lines = phrases[0];
      data.device = platformCmds.getLocalVal('deviceId');

      socket.emit('history', data);
    },
    help : [
      'Clears the screen and retrieves chat messages from server',
      'The amount you send with the command is the amount of messages ' +
      'that will be returned from each room you follow'
    ],
    instructions : [
      ' Usage:',
      '  history *optional number*',
      ' Example:',
      '  history',
      '  history 25'
    ],
    clearAfterUse : true,
    clearBeforeUse : true,
    accessLevel : 1,
    category : 'advanced'
  },
  morse : {
    func : function(phrases, local) {
      if (phrases && phrases.length > 0) {
        var filteredText = phrases.join(' ').toLowerCase();
        var morseCodeText = '';

        filteredText = filteredText.replace(/[åä]/g, 'a');
        filteredText = filteredText.replace(/[ö]/g, 'o');
        filteredText = filteredText.replace(/\s/g, '#');
        filteredText = filteredText.replace(/[^a-z0-9#]/g, '');

        for (var i = 0; i < filteredText.length; i++) {
          var morseCode = morseCodes[filteredText.charAt(i)];

          for (var j = 0; j < morseCode.length; j++) {
            morseCodeText += morseCode[j] + ' ';
          }

          morseCodeText += '   ';
        }

        if (morseCodeText.length > 0) {
          socket.emit('morse', {
            morseCode : morseCodeText,
            local : local
          });
        }
      }
    },
    help : [
      'Sends a morse encoded message (sound) to everyone in the room'
    ],
    instructions : [
      ' Usage:',
      '  morse *message*',
      ' Example:',
      '  morse sos'
    ],
    accessLevel : 13,
    category : 'admin'
  },
  password : {
    func : function(phrases) {
      if (phrases && phrases.length > 1) {
        var data = {};
        data.oldPassword = phrases[0];
        data.newPassword = phrases[1];
        data.userName = platformCmds.getUser();

        if (data.newPassword.length >= 4 &&
            data.newPassword.length <= 10) {
          socket.emit('changePassword', data);
        } else {
          platformCmds.queueMessage({
            text : [
              'You have to input the old and new password of ' +
              'the user',
              'Example: password old1 new1'
            ]
          });
        }
      } else {
        platformCmds.queueMessage({
          text : [
            'You have to input the old and new password of the ' +
            'user',
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
    ],
    accessLevel : 13,
    category : 'basic'
  },
  logout : {
    func : function() {
      socket.emit('logout');
    },
    help : ['Logs out from the current user'],
    accessLevel : 13,
    category : 'basic',
    clearAfterUse : true
  },
  reboot : {
    func : function() {
      platformCmds.refreshApp();
    },
    help : ['Reboots terminal'],
    accessLevel : 1,
    category : 'basic'
  },
  verifyuser : {
    func : function(phrases) {
      if (phrases.length > 0) {
        var userName = phrases[0].toLowerCase();

        if (userName === '*') {
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
      'verifyuser without any additional input will show a list of ' +
      'all unverified users',
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
    ],
    accessLevel : 13,
    category : 'admin'
  },
  banuser : {
    func : function(phrases) {
      if (phrases.length > 0) {
        var userName = phrases[0].toLowerCase();

        socket.emit('ban', userName);
      } else {
        socket.emit('bannedUsers');
      }
    },
    help : [
      'Bans a user and disconnects it from the system',
      'The user will not be able to log on again'
    ],
    instructions : [
      ' Usage:',
      '  banuser *username*',
      ' Example:',
      '  banuser evil1'
    ],
    accessLevel : 13,
    category : 'admin'
  },
  unbanuser : {
    func : function(phrases) {
      if (phrases.length > 0) {
        var userName = phrases[0].toLowerCase();

        socket.emit('unban', userName);
      } else {
        socket.emit('bannedUsers');
      }
    },
    help : [
      'Removes ban on user',
      'The user will be able to log on again',
      'ubanuser without any additional input will show a list of all ' +
      'banned users'
    ],
    instructions : [
      ' Usage:',
      '  unbanuser',
      '  unbanuser *username*',
      ' Example:',
      '  unbanuser',
      '  unbanuser evil1'
    ],
    accessLevel : 13,
    category : 'admin'
  },
  whisper : {
    func : function(phrases) {
      if (phrases.length > 1) {
        var data = {};

        data.message = {};
        data.roomName = phrases[0].toLowerCase();
        data.message.text = [phrases.slice(1).join(' ')];
        data.message.user = platformCmds.getUser();
        data.message.whisper = true;

        socket.emit('chatMsg', data);
      } else {
        platformCmds.queueMessage({
          text : ['You forgot to write the message!']
        });
      }
    },
    help : [
      'Send a private message to a specific user',
      'The first word that you write will be interpreted as a user name',
      'The rest of the input will be sent to only that user'
    ],
    instructions : [
      ' Usage:',
      '  whisper *user name* *message*',
      ' Example:',
      '  whisper adam hello, adam!',
      '  whisper user1 sounds good!'
    ],
    clearAfterUse : true,
    accessLevel : 13,
    category : 'basic'
  },
  hackroom : {
    func : function(phrases) {
      var data = {};

      if (phrases.length > 0) {
        var razLogoToPrint = razLogo !== null ?
                             JSON.parse(JSON.stringify(razLogo)) : { text : ['']};

        data.roomName = phrases[0].toLowerCase();
        data.timesCracked = 0;
        data.timesRequired = 3;
        data.randomizer = function(length) {
          var randomString = '23456789abcdefghijkmnpqrstuvwxyz';
          var randomLength = randomString.length;
          var code = '';

          for (var i = 0; i < length; i++) {
            var randomVal = Math.random() * (randomLength - 1);

            code += randomString[Math.round(randomVal)];
          }

          return code.toUpperCase();
        };
        platformCmds.getCmdHelper().data = data;

        // TODO: razLogo should be moved to DB or other place
        platformCmds.queueMessage(razLogoToPrint);
        // TODO: Message about abort should be sent from a common
        // function for all commands
        platformCmds.queueMessage({
          text : [
            'Razor proudly presents:',
            'Room Access Hacking! (RAH)',
            '/8iybEVaC1yc2EAAAADAQABAAABAQDS//2ag4/',
            'D6Rsc8OO/6wFUVDdpdAItvSCLCrc/dcE/8iybE',
            'w3OtlVFnfNkOVAvhObuWO/6wFUVDdkr2yYTaDE',
            'i5mB3Nz1aC1yc2buWr6QKLvfZVczAxAHPKLvfZ',
            'dK2zXrxGOmOFllxiCbpGOmOFlcJy1/iCbpmA4c',
            'MFvEEiKXrxGlxiCbp0miONAAvhObuWO/6ujMJH',
            'JHa88/x1DVOFl/yujOMJHa88/x1DVwWl6lsjvS',
            'wDDVwWl6el88/x1j5C+k/aadtg1lcvcz7Tdtve',
            'k/aadtghxv595Xqw2qrvyp6GrdX/FrhObuWr6Q',
            ' ',
            'Please wait.......',
            'Command interception.........ACTIVATED',
            'Oracle defense systems.......DISABLED',
            'Overriding locks.............DONE',
            'Connecting to database ......DONE',
            ' ',
            'You can cancel out of the command by typing ' +
            '"exit" or "abort"',
            'Press enter to continue'
          ]
        });

        platformCmds.setInputStart('Start');
      } else {
        platformCmds.queueMessage({
          text : ['You forgot to input the room name!']
        });
        platformCmds.resetCommand(true);
      }
    },
    steps : [
      function() {
        platformCmds.queueMessage({
          text : ['Checking room access...']
        });
        socket.emit('roomHackable', platformCmds.getCmdHelper().data.roomName);
      },
      function() {
        var cmdObj = platformCmds.getCmdHelper();
        var timeout = 18000;
        var timerEnded = function() {
          platformCmds.queueMessage({
            text : [
              'Your hacking attempt has been detected',
              'Users of the room have been notified of your intrusion'
            ]
          });
          socket.emit('chatMsg', {
            message : {
              text : [
                'WARNING! Intrustion attempt detected!',
                'User ' + platformCmds.getUser() + ' tried breaking in'
              ],
              user : 'SYSTEM'
            },
            roomName : cmdObj.data.roomName,
            skipSelfMsg : true
          });
          platformCmds.resetCommand(true);
        };

        platformCmds.queueMessage({
          text : [
            'Activating cracking bot....',
            'Warning. Intrusion defense system activated',
            'Time until detection: ' + (timeout / 1000) + ' seconds',
            'You will need 3 successful sequences to succeed'
          ]
        });
        platformCmds.setInputStart('Verify seq');
        cmdObj.data.code = cmdObj.data.randomizer(10);
        cmdObj.data.timer = setTimeout(timerEnded, timeout);
        cmdObj.onStep++;
        platformCmds.queueMessage({
          text : ['Sequence: ' + cmdObj.data.code]
        });
      },
      function(phrases) {
        var cmdObj = platformCmds.getCmdHelper();
        var phrase = phrases.join(' ').trim();

        if (phrase.toUpperCase() === cmdObj.data.code) {
          platformCmds.queueMessage({ text : ['Sequence accepted'] });
          cmdObj.data.timesCracked++;
        } else {
          platformCmds.queueMessage({
            text : [
              'Incorrect sequence. Counter measures have been ' +
              'released'
            ]
          });
        }

        if (cmdObj.data.timesCracked <
            cmdObj.data.timesRequired) {
          cmdObj.data.code = cmdObj.data.randomizer(10);
          platformCmds.queueMessage({
            text : ['Sequence: ' + cmdObj.data.code]
          });
        } else {
          var data = {
            userName : platformCmds.getUser(),
            roomName : cmdObj.data.roomName
          };

          clearTimeout(cmdObj.data.timer);
          socket.emit('hackRoom', data);
          platformCmds.queueMessage(({
            text : [
              'Cracking complete',
              'Intrusion defense system disabled',
              'Suppressing notification and following room',
              'Thank you for using RAH'
            ]
          }));
          platformCmds.resetCommand();
        }
      }
    ],
    abortFunc : function() {
      clearTimeout(platformCmds.getCmdHelper().data.timer);
    },
    help : [
      'ERROR. UNAUTHORIZED COMMAND...AUTHORIZATION OVERRIDDEN. ' +
      'PRINTING INSTRUCTIONS',
      'This command lets you follow a room without knowing the password',
      'It will also supress the following notification',
      'Failing the hack will warn everyone in the room'
    ],
    instructions : [
      ' Usage:',
      '  hackroom *room name*',
      ' Example:',
      '  hackroom secret'
    ],
    clearBeforeUse : true,
    accessLevel : 13,
    category : 'hacking'
  },
  importantmsg : {
    func : function() {
      var data = {};

      data.text = [];
      platformCmds.getCmdHelper().data = data;

      platformCmds.queueMessage({
        text : [
          'You can cancel out of the command by typing ' +
          '"exit" or "abort"'
        ]
      });
      platformCmds.queueMessage({
        text : [
          'Do you want to send it to a specific device?',
          'Enter the device ID or alias to send it to a specific device',
          'Leave it empty and press enter if you want to send it to ' +
          'all users'
        ]
      });
      platformCmds.setInputStart('imprtntMsg');
    },
    steps : [
      function(phrases) {
        if (phrases.length > 0) {
          var device = phrases[0];

          if (device.length > 0) {
            cmdHelper.data.device = device;
            platformCmds.queueMessage({
              text : ['Searching for device...']
            });
            socket.emit('verifyDevice', cmdHelper.data);
          } else {
            cmdHelper.onStep++;
            validCmds[cmdHelper.command].steps[cmdHelper.onStep]();
          }
        }
      },
      function() {
        cmdHelper.onStep++;
        platformCmds.queueMessage({
          text : [
            'Write a line and press enter',
            'Press enter without any input when you are done ' +
            'with the message',
            'Try to keep the first line short if you want to send it as morse'
          ]
        });
      },
      function(phrases) {
        if (phrases.length > 0 && phrases[0] !== '') {
          var phrase = phrases.join(' ');

          cmdHelper.data.text.push(phrase);
        } else {
          var dataText = dataText !== null ?
                         JSON.parse(JSON.stringify(cmdHelper.data.text)) : '';

          cmdHelper.onStep++;

          platformCmds.queueMessage({
            text : ['Preview of the message:']
          });
          platformCmds.queueMessage({
            text : dataText,
            extraClass : 'importantMsg'
          });
          platformCmds.queueMessage({
            text : ['Is this OK? "yes" to accept the message']
          });
        }
      },
      function(phrases) {
        if (phrases.length > 0) {
          if (phrases[0].toLowerCase() === 'yes') {
            cmdHelper.onStep++;

            platformCmds.queueMessage({
              text : [
                'Do you want to send it as morse code too? ' +
                '"yes" to send it as morse too',
                'Note! Only the first line will be sent as morse'
              ]
            });
          } else {
            platformCmds.resetCommand(true);
          }
        }
      },
      function(phrases) {
        if (phrases.length > 0) {
          if (phrases[0].toLowerCase() === 'yes') {
            cmdHelper.data.morse = { local : true };
          }

          socket.emit('importantMsg', cmdHelper.data);
          platformCmds.resetCommand();
        }
      }
    ],
    help : [
      'Send an important message to a single device or all users'
    ],
    instructions : [
      'Follow the on-screen instructions',
      'Note! Only the first line can be sent as morse code (optional)'
    ],
    accessLevel : 13,
    category : 'admin'
  },
  chipper : {
    func : function() {
      var data = {};

      data.randomizer = function(length) {
        var randomString = '01';
        var randomLength = randomString.length;
        var code = '';

        for (var i = 0; i < length; i++) {
          var randomVal = Math.random() * (randomLength - 1);

          code += randomString[Math.round(randomVal)];
        }

        return code;
      };
      platformCmds.getCmdHelper().data = data;

      platformCmds.queueMessage({
        text : [
          '--------------',
          '- DEACTIVATE -',
          '--------------'
        ],
        extraClass : 'importantMsg large'
      });
      platformCmds.queueMessage({
        text : [
          'CONTROL WORD SENT',
          'AWAITING CONFIRMATION'
        ],
        extraClass : 'importantMsg'
      });
      platformCmds.queueMessage({
        text : [
          'You can cancel out of the command by typing ' +
          '"exit" or "abort"',
          'Press enter to continue'
        ]
      });
      platformCmds.setInputStart('Chipper');
    },
    steps : [
      function() {
        var cmdObj = platformCmds.getCmdHelper();

        cmdObj.onStep++;
        platformCmds.queueMessage({
          text : [
            'Chipper has been activated',
            'Connecting to ECU.........'
          ]
        });
        setTimeout(
          validCmds[cmdObj.command].steps[cmdObj.onStep], 2000);
      },
      function() {
        var stopFunc = function() {
          platformCmds.queueMessage({
            text : [
              'WARNING',
              'CONTROL IS BEING RELEASED',
              'CHIPPER POWERING DOWN'
            ],
            extraClass : 'importantMsg'
          });

          validCmds[cmdObj.command].abortFunc();
        };
        var cmdObj = platformCmds.getCmdHelper();

        if (cmdObj.data.timer === undefined) {
          cmdObj.data.timer =
            setTimeout(stopFunc, 300000, false);
        }

        platformCmds.queueMessage({
          text : [cmdObj.data.randomizer(36)]
        });

        cmdObj.data.printTimer = setTimeout(
          validCmds[cmdObj.command].steps[cmdObj.onStep], 250);
      }
    ],
    abortFunc : function() {
      var cmdObj = platformCmds.getCmdHelper();

      clearTimeout(cmdObj.data.printTimer);
      clearTimeout(cmdObj.data.timer);
      validCmds.clear.func();
      platformCmds.queueMessage({
        text : [
          'Chipper has powered down',
          'Control has been released'
        ]
      });
      platformCmds.resetCommand();
    },
    help : [
      'Activate chipper function',
      'Press enter when you have retrieved confirmation from the ECU'
    ],
    instructions : [
      'Follow the instructions on the screen',
      'The chipper will shutdown and release control after 5 minutes'
    ],
    accessLevel : 13,
    category : 'hacking',
    clearBeforeUse : true
  },
  switchroom : {
    func : function(phrases) {
      if (phrases.length > 0) {
        var room = {};
        var roomName = phrases[0].toLowerCase();

        if (roomName) {
          room.roomName = roomName;

          /**
           * Flag that will be used in .on function locally to
           * show user they have entered
           */
          room.entered = true;

          socket.emit('switchRoom', room);
        }
      } else {
        platformCmds.queueMessage({
          text : ['You have to specify which room to switch to']
        });
      }
    },
    help : [
      'Switches your current room to another',
      'You have to already be following the room to switch to it'
    ],
    instructions : [
      ' Usage:',
      '  switchroom *room you are following*',
      ' Example:',
      '  switchroom room1'
    ],
    accessLevel : 13,
    category : 'advanced'
  },
  removeroom : {
    func : function(phrases) {
      if (phrases.length > 0) {
        var data = {};

        data.roomName = phrases[0].toLowerCase();
        platformCmds.getCmdHelper().data = data;

        platformCmds.queueMessage({
          text : [
            'Do you really want to remove the room?',
            'Confirm by writing "yes"'
          ]
        });

        platformCmds.setInputStart('removeroom');
      } else {
        platformCmds.resetCommand(true);

        platformCmds.queueMessage({
          text : ['You forgot to input the room name']
        });
      }
    },
    steps : [
      function(phrases) {
        if (phrases[0].toLowerCase() === 'yes') {
          socket.emit('removeRoom', platformCmds.getCmdHelper().data.roomName);
        }

        platformCmds.resetCommand();
      }
    ],
    help : [
      'Removes a room',
      'You have to be either the owner or an admin of the room to remove it'
    ],
    instructions : [
      ' Usage:',
      '  removeroom *room name*',
      '  *Follow the instructions*',
      ' Example:',
      '  removeroom room1',
      '  *Follow the instructions*'
    ],
    accessLevel : 13,
    category : 'advanced'
  },
  updateuser : {
    func : function(phrases) {
      if(phrases.length > 2) {
        var data = {};
        data.user = phrases[0];
        data.field = phrases[1];
        data.value = phrases[2];

        socket.emit('updateUser', data);
      } else {
        platformCmds.queueMessage({
          text : [
            'You need to write a user name, field name and value',
            'Example: updateuser user1 accesslevel 3'
          ]
        });
      }
    },
    help : [
      'Change fields on a user',
      'You can change visibility, accesslevel, password or add/remove a group',
      'Valid fields: visibility, accesslevel, addgroup, removegroup, password'
    ],
    instructions : [
      ' Usage:',
      '  updateuser *user name* *field name* *value*',
      ' Example:',
      '  updateuser user1 accesslevel 3',
      '  updateuser user1 group hackers'
    ],
    accessLevel : 13,
    category : 'admin'
  },
  updatecommand : {
    func : function(phrases) {
      if(phrases.length > 2) {
        var data = {};
        data.cmdName = phrases[0];
        data.field = phrases[1];
        data.value = phrases[2];

        socket.emit('updateCommand', data);
      } else {
        platformCmds.queueMessage({
          text : [
            'You need to write a command name, field name and value',
            'Example: updatecommand help accesslevel 3'
          ]
        });
      }
    },
    help : [
      'Change fields on a command',
      'You can currently change visibility or accesslevel'
    ],
    instructions : [
      ' Usage:',
      '  updatecommand *command name* *field name* *value*',
      ' Example:',
      '  updatecommand help accesslevel 3',
      '  updatecommand help visibility 6'
    ],
    accessLevel : 13,
    category : 'admin'
  },
  updateroom : {
    func : function(phrases) {
      if(phrases.length > 2) {
        var data = {};
        data.room = phrases[0];
        data.field = phrases[1];
        data.value = phrases[2];

        socket.emit('updateRoom', data);
      } else {
        platformCmds.queueMessage({
          text : [
            'You need to write a room name, field name and value',
            'Example: updateroom room1 accesslevel 3'
          ]
        });
      }
    },
    help : [
      'Change fields on a room',
      'You can change visibility, accesslevel',
      'Valid fields: visibility, accesslevel'
    ],
    instructions : [
      ' Usage:',
      '  updateroom *room name* *field name* *value*',
      ' Example:',
      '  updateroom user1 accesslevel 3'
    ],
    accessLevel : 13,
    category : 'admin'
  },
  addencryptionkeys : {
    func : function() {
      var data = {};

      data.keys = [];
      cmdHelper.data = data;

      platformCmds.queueMessage({
        text : [
          '-----------------------',
          '  Add encryption keys',
          '-----------------------',
          'You can add more than one key',
          'Press enter without any input when you are done',
          'You can cancel out of the command by typing ' +
          '"exit" or "abort"',
          'Input an encryption key:'
        ]
      });
      platformCmds.setInputStart('Input key');
    },
    steps : [
      function(phrases) {
        if (phrases.length > 0 && phrases[0] !== '') {
          var keyObj = {};

          keyObj.key = phrases[0];

          if (phrases[1] && phrases[1].toLowerCase() === 'reusable') {
            keyObj.reusable = true;
          }

          cmdHelper.data.keys.push(keyObj);
        } else {
          platformCmds.queueMessage({
            text : [
              'Are you sure you want to add the keys?',
              'Write "yes" to accept'
            ]
          });
          cmdHelper.onStep++;
        }
      },
      function(phrases) {
        if (phrases[0].toLowerCase() === 'yes') {
          platformCmds.queueMessage({
            text : ['Uploading new keys...']
          });
          socket.emit('addKeys', cmdHelper.data.keys);
          platformCmds.resetCommand();
        } else {
          platformCmds.queueMessage({
            text : ['The keys will not be uploaded']
          });
          platformCmds.resetCommand(true);
        }
      }
    ],
    help : [
      'Add one or more encryption keys to the database'
    ],
    instructions : [
      ' Usage:',
      '  Follow the instructions'
    ],
    accessLevel : 13,
    category : 'admin',
    clearBeforeUse : true
  },
  addentities : {
    func : function() {
      var data = {};

      data.entities = [];
      cmdHelper.data = data;

      platformCmds.queueMessage({
        text : [
          '-----------------------',
          '  Add entities',
          '-----------------------',
          'You can add more than one entity',
          'Press enter without any input when you are done',
          'You can cancel out of the command by typing ' +
          '"exit" or "abort"',
          'Input an entity:'
        ]
      });
      platformCmds.setInputStart('Input entity');
    },
    steps : [
      function(phrases) {
        if (phrases.length > 0 && phrases[0] !== '') {
          var entityObj = {};

          entityObj.entityName = phrases[0];

          cmdHelper.data.entities.push(entityObj);
        } else {
          platformCmds.queueMessage({
            text : [
              'Are you sure you want to add the entities?',
              'Write "yes" to accept'
            ]
          });
          cmdHelper.onStep++;
        }
      },
      function(phrases) {
        if (phrases[0].toLowerCase() === 'yes') {
          platformCmds.queueMessage({
            text : ['Uploading new entities...']
          });
          socket.emit('addEntities', cmdHelper.data.entities);
          platformCmds.resetCommand();
        } else {
          platformCmds.queueMessage({
            text : ['The entities will not be uploaded']
          });
          platformCmds.resetCommand(true);
        }
      }
    ],
    help : [
      'Add one or more entities to the database'
    ],
    instructions : [
      ' Usage:',
      '  Follow the instructions'
    ],
    accessLevel : 13,
    category : 'admin',
    clearBeforeUse : true
  },
  weather : {
    func : function() {
      socket.emit('weather');
    },
    accessLevel : 1,
    category : 'basic'
  },
  updatedevice : {
    func : function(phrases) {
      if(phrases.length > 2) {
        var data = {};
        data.deviceId = phrases[0];
        data.field = phrases[1];
        data.value = phrases[2];

        socket.emit('updateDevice', data);
      } else {
        platformCmds.queueMessage({
          text : [
            'You need to write a device Id, field name and value',
            'Example: updatedevice 11jfej433 id betteralias'
          ]
        });
      }
    },
    help : [
      'Change fields on a device',
      'You can currently change the alias',
      'Valid fields: alias'
    ],
    instructions : [
      ' Usage:',
      '  updatedevice *device ID* *field name* *value*',
      ' Example:',
      '  updatedevice 32r23rj alias betteralias'
    ],
    accessLevel : 13,
    category : 'admin'
  },
  moduleraid : {
    func : function() {
      var data = {};

      data.text = [];
      platformCmds.getCmdHelper().data = data;

      platformCmds.queueMessage({
        text : [
          'Write a coordinate and press enter',
          'Press enter without any input when you are done ' +
          'with the message'
        ]
      });
      platformCmds.queueMessage({
        text : [
          'You can cancel out of the command by typing ' +
          '"exit" or "abort"'
        ]
      });
      platformCmds.setInputStart('moduleraid');
    },
    steps : [
      function(phrases) {
        if (phrases.length > 0 && phrases[0] !== '') {
          var phrase = phrases.join(' ');

          cmdHelper.data.text.push(phrase);
        } else {
          var startText = [
            'Celestial activity detected!',
            'Satellite have visual confirmation of active modules',
            'Sending Organica retrieval squads to the following coordinates:'
          ];
          var text = [];

          cmdHelper.data.text = text.concat(startText, cmdHelper.data.text);
          text = cmdHelper.data.text !== null ?
                 JSON.parse(JSON.stringify(cmdHelper.data.text)) : [];

          cmdHelper.onStep++;

          platformCmds.queueMessage({
            text : ['Preview of the message:']
          });
          platformCmds.queueMessage({
            text : text,
            extraClass : 'importantMsg'
          });
          platformCmds.queueMessage({
            text : ['Is this OK? "yes" to accept the message']
          });
        }
      },
      function(phrases) {
        if (phrases.length > 0 && phrases[0].toLowerCase() === 'yes') {
          cmdHelper.data.morse = { local : true };
          socket.emit('importantMsg', cmdHelper.data);
          platformCmds.resetCommand();
        } else {
          platformCmds.resetCommand(true);
        }
      }
    ],
    help : [
      'Send a module raid message to all users',
      'It will look like an important message'
    ],
    instructions : [
      'Follow the on-screen instructions'
    ],
    accessLevel : 13,
    clearAfterUse : true,
    category : 'admin'
  },
};

function getCmdHistory() {
  var cmdHistory = platformCmds.getLocalVal('cmdHistory');

  if (cmdHistory !== null) {
    return JSON.parse(platformCmds.getLocalVal('cmdHistory'));
  }

  return [];
}

function pushCmdHistory(cmd) {
  var cmdHistory = platformCmds.getLocalVal('cmdHistory') !== null ?
                   JSON.parse(platformCmds.getLocalVal('cmdHistory')) : [];

  cmdHistory.push(cmd);
  platformCmds.setLocalVal('cmdHistory', JSON.stringify(cmdHistory));
}

function resetPrevCmdPointer() {
  var cmdHistory = getCmdHistory();

  previousCommandPointer =
    cmdHistory ? cmdHistory.length : 0;
}

// Needed for Android 2.1. trim() is not supported
function trimSpace(sentText) {
  return sentText.replace(/^\s+|\s+$/g, '');
}

function setGain(value) {
  gainNode.gain.value = value;
}

function playMorse(morseCode) {
  function finishSoundQueue(timeouts, morseCode) {
    var cleanMorse = morseCode.replace(/#/g, '');

    soundQueue.splice(0, timeouts);
    platformCmds.queueMessage({
      text : ['Morse code message received:  ' + cleanMorse]
    });
  }

  if (soundQueue.length === 0) {
    soundTimeout = 0;
  }

  for (var i = 0; i < morseCode.length; i++) {
    var duration = 0;
    var shouldPlay = false;

    if (morseCode[i] === '.') {
      duration = 50;
      shouldPlay = true;
    } else if (morseCode[i] === '-') {
      duration = 150;
      shouldPlay = true;
    } else if (morseCode[i] === '#') {
      duration = 50;
    } else {
      duration = 75;
    }

    if (shouldPlay) {
      soundQueue.push(setTimeout(setGain, soundTimeout, 1));
      soundQueue.push(setTimeout(setGain, soundTimeout + duration, 0));
    }

    soundTimeout += duration;
  }

  setTimeout(finishSoundQueue, soundTimeout, (2 * morseCode.length),
    morseCode);
}

/**
 * Taken from http://stackoverflow.com/questions/639695/
 * how-to-convert-latitude-or-longitude-to-meters/11172685#11172685
 * generally used geo measurement function
 */
function measureDistance(lat1, lon1, lat2, lon2) {

  // Radius of earth in KM
  var R = 6378.137;
  var dLat = (lat2 - lat1) * Math.PI / 180;
  var dLon = (lon2 - lon1) * Math.PI / 180;
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return d * 1000; // meters
}

function generateMap() {
  var letter = 'A';

  mapHelper.xSize = (mapHelper.rightLong - mapHelper.leftLong) /
                    parseFloat(mapHelper.xGridsMax);
  mapHelper.ySize = (mapHelper.topLat - mapHelper.bottomLat) /
                    parseFloat(mapHelper.yGridsMax);

  for (var xGrid = 0; xGrid < mapHelper.xGridsMax; xGrid++) {
    var currentChar = String.fromCharCode(letter.charCodeAt(0) + xGrid);

    //TODO Remove ugly hack necessary for BBR specific map
    if (currentChar === 'W') {
      currentChar = 'X';
    } else if (currentChar === 'X') {
      currentChar = 'Y';
    }

    mapHelper.xGrids[currentChar] =
      mapHelper.leftLong + parseFloat(mapHelper.xSize * xGrid);
  }

  for (var yGrid = 0; yGrid < mapHelper.yGridsMax; yGrid++) {
    mapHelper.yGrids[yGrid] =
      mapHelper.topLat - parseFloat(mapHelper.ySize * yGrid);
  }
}

function locateOnMap(latitude, longitude) {
  //TODO Change from Object.keys for compatibility with older Android
  var xKeys = Object.keys(mapHelper.xGrids);
  var yKeys = Object.keys(mapHelper.yGrids);
  var x;
  var y;

  if (longitude >= mapHelper.leftLong && longitude <= mapHelper.rightLong &&
      latitude <= mapHelper.topLat && latitude >= mapHelper.bottomLat) {

    for (var xGrid = 0; xGrid < xKeys.length; xGrid++) {
      var nextXGrid = mapHelper.xGrids[xKeys[xGrid + 1]];

      if (longitude < nextXGrid) {
        x = xKeys[xGrid];
        break;
      } else if (longitude ===
                 (nextXGrid + parseFloat(mapHelper.xSize))) {
        x = xKeys[xGrid + 1];
        break;
      }
    }

    for (var yGrid = 0; yGrid < yKeys.length; yGrid++) {
      var nextYGrid = mapHelper.yGrids[yKeys[yGrid + 1]];

      if (latitude > nextYGrid) {
        y = yKeys[yGrid];
        break;
      } else if (latitude === (nextYGrid - parseFloat(mapHelper.ySize))) {
        y = yKeys[yGrid + 1];
        break;
      }
    }
  }

  if (x !== undefined && y !== undefined) {
    return x + '' + y;
  } else {
    return '---';
  }
}

function reconnect() {
  if (!reconnecting) {
    var user = platformCmds.getUser();

    reconnecting = true;

    socket.disconnect();
    socket.connect({ forceNew : true });

    if (user) {
      socket.emit('updateId', { userName : user });
    }
  }
}

/**
 * Geolocation object is empty when sent through Socket.IO
 * This is a fix for that
 */
function preparePositionData(position) {
  var preparedPosition = {};

  preparedPosition.latitude = position.coords.latitude;
  preparedPosition.longitude = position.coords.longitude;
  preparedPosition.speed = position.coords.speed;
  preparedPosition.accuracy = position.coords.accuracy;
  preparedPosition.heading = position.coords.heading;
  preparedPosition.timestamp = position.timestamp;

  return preparedPosition; // geolocation
}

function sendLocationData() {
  function retrievePosition() {
    var clearingWatch = function() {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
      intervals.tracking = setTimeout(sendLocationData, pausePositionTime);
    };

    watchId = navigator.geolocation.watchPosition(function(position) {
      if (position !== undefined) {
        positions.push(position);
      }
    }, function(err) {
      if (err.code === err.PERMISSION_DENIED) {
        tracking = false;
        clearTimeout(intervals.tracking);
        platformCmds.queueMessage({
          text : [
            'Unable to connect to the tracking satellites',
            'Turning off tracking is a major offense',
            'Organica Re-Education Squads have been ' +
            'sent to scour the area'
          ], extraClass : 'importantMsg'
        });
      } else {
        console.log(err);
      }
    }, { enableHighAccuracy : true });

    if (tracking) {
      intervals.tracking = setTimeout(clearingWatch, watchPositionTime);
    }
  }

  if (platformCmds.getUser() !== null && positions.length > 0) {
    var mostAccuratePos = positions[positions.length - 1];

    for (var i = positions.length - 2; i >= 0; i--) {
      var position = positions[i];
      var accuracy = positions[i].coords.accuracy;

      if (mostAccuratePos.coords.accuracy > accuracy) {
        mostAccuratePos = position;
      }
    }

    positions = [];
    socket.emit('updateLocation', preparePositionData(mostAccuratePos));
  }

  retrievePosition();
}

/**
 * Some devices disable Javascript when screen is off (iOS)
 * They also fail to notice that they have been disconnected
 * We check the time between heartbeats and if the time i
 * over 10 seconds (e.g. when screen is turned off and then on)
 * we force them to reconnect
 */
function isScreenOff() {
  var now = (new Date()).getTime();
  var diff = now - lastScreenOff;
  var offBy = diff - 1000;

  lastScreenOff = now;

  if (offBy > 10000) {
    reconnect();
  }
}

/**
 * Set intervals at boot and recreate them when the window is focused
 * This is to make sure that nothing has been killed in the background
 */
function setIntervals() {
  if (intervals.printText !== null) {
    clearInterval(intervals.printText);
  }

  if (intervals.tracking !== null) {
    clearTimeout(intervals.tracking);
  }

  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
  }

  // Prints messages from the queue
  intervals.printText = setInterval(
    consumeMsgQueue, printIntervalTime, msgQueue);

  if (tracking) {
    // Gets new geolocation data
    sendLocationData();
  }

  // Should not be recreated on focus
  if (intervals.isScreenOff === null) {

    /**
     * Checks time between when JS stopped and started working again
     * This will be most frequently triggered when a user turns off the
     * screen on their phone and turns it back on
     */
    intervals.isScreenOff = setInterval(isScreenOff, screenOffIntervalTime);
  }
}

function startAudio() {
  // Not supported in Spartan nor IE11 or lower
  if (window.AudioContext || window.webkitAudioContext) {
    if (window.AudioContext) {
      audioCtx = new window.AudioContext();
    } else if (window.webkitAudioContext) {
      audioCtx = new window.webkitAudioContext();
    }

    oscillator = audioCtx.createOscillator();
    gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    gainNode.gain.value = 0;
    oscillator.type = 'sine';
    oscillator.frequency.value = '440';
    // oscillator.type = 'square';
    // oscillator.frequency.value = '300';

    oscillator.start(0);
  }
}

function getLeftText(marker) {
  return marker.parentElement.childNodes[0].textContent;
}

function getRightText(marker) {
  return marker.parentElement.childNodes[2].textContent;
}

function getInputText() {
  return leftText.textContent + marker.value + rightText.textContent;
}

function setLeftText(text) {
  marker.parentElement.childNodes[0].textContent = text;
}

function appendToLeftText(text) {
  var textNode = document.createTextNode(text);

  document.createTextNode(
    marker.parentElement.childNodes[0].appendChild(textNode));
}

function setRightText(text) {
  marker.parentElement.childNodes[2].textContent = text;
}

function prependToRightText(sentText) {
  marker.parentElement.childNodes[2].textContent =
    sentText + marker.parentElement.childNodes[2].textContent;
}

function setMarkerText(text) {
  marker.value = text;
}

function getInputStart() {
  return inputStart.textContent;
}

function clearInput() {
  setLeftText('');
  setRightText('');
  // Fix for blinking marker
  setMarkerText(' ');
}

function triggerAutoComplete(text) {
  if (text.charAt(text.length - 1) === ' ' &&
      text.charAt(text.length - 2) === ' ') {
    setLeftText(trimSpace(text));

    return true;
  }

  return false;
}

function setCommandUsed(used) {
  commandUsed = used;
}

function consumeCmdQueue() {
  if (cmdQueue.length > 0) {
    var storedCmd = cmdQueue.shift();
    var command = storedCmd.command;
    var data = storedCmd.data;
    var cmdMsg = storedCmd.cmdMsg;

    if(cmdMsg !== undefined) {
      platformCmds.queueMessage(cmdMsg);
    }

    setCommandUsed(true);
    command(data);
    commandTimeout = setTimeout(consumeCmdQueue, commandTime);
  } else {
    setCommandUsed(false);
  }
}

function startCmdQueue() {
  if (!commandUsed) {
    consumeCmdQueue();
  }
}

function autoComplete() {
  var phrases = trimSpace(getInputText().toLowerCase()).split(' ');
  var partialCommand = phrases[0];
  //TODO Change from Object.keys for compatibility with older Android
  var commands = Object.keys(platformCmds.getCommands());
  var matched = [];
  var sign = partialCommand.charAt(0);
  var cmdChars = platformCmds.getCommandChars();

  /**
   * Auto-complete should only trigger when one phrase is in the input
   * It will not auto-complete flags
   * If chat mode and the command is prepended or normal mode
   */
  if (phrases.length === 1 && partialCommand.length > 0 &&
      (cmdChars.indexOf(sign) >= 0 ||
       (platformCmds.getLocalVal('mode') === 'cmd') ||
       platformCmds.getUser() === null)) {

    // Removes prepend sign
    if (cmdChars.indexOf(sign) >= 0) {
      partialCommand = partialCommand.slice(1);
    }

    for (var i = 0; i < commands.length; i++) {
      var matches = false;

      for (var j = 0; j < partialCommand.length; j++) {
        var commandAccessLevel =
          platformCmds.getCommands()[commands[i]].accessLevel;

        if ((isNaN(commandAccessLevel) ||
             platformCmds.getAccessLevel() >= commandAccessLevel) &&
            partialCommand.charAt(j) === commands[i].charAt(j)) {
          matches = true;
        } else {
          matches = false;

          break;
        }
      }

      if (matches) {
        matched.push(commands[i]);
      }
    }

    if (matched.length === 1) {
      var newText = '';
      var cmdIndex = cmdChars.indexOf(sign);

      if (cmdIndex >= 0) {
        newText += cmdChars[cmdIndex];
      }

      newText += matched[0] + ' ';

      clearInput();
      setLeftText(newText);
    } else if (matched.length > 0) {
      var msg = '';

      matched.sort();

      for (var cmdMatched = 0; cmdMatched <
                               matched.length; cmdMatched++) {
        msg += matched[cmdMatched] + '\t';
      }

      platformCmds.queueMessage({ text : [msg] });
    }

    // No input? Show all available commands
  } else if (partialCommand.length === 0) {
    validCmds.help.func();
  }
}

// Needed for arrow and delete keys. They are not detected with keypress
function specialKeyPress(event) {
  var keyCode = (typeof event.which === 'number') ? event.which :
                event.keyCode;

  if (!keyPressed) {
    var cmdHistory;

    switch (keyCode) {

      // Backspace
      case 8:

        // Remove character to the left of the marker
        if (getLeftText(marker)) {
          setLeftText(getLeftText(marker).slice(0, -1));
        }

        event.preventDefault();

        break;

      // Tab
      case 9:
        keyPressed = true;

        if (!cmdHelper.keyboardBlocked &&
            cmdHelper.command === null) {
          autoComplete();
        }

        event.preventDefault();

        break;
      // Enter
      case 13:
        var cmdObj = platformCmds.getCmdHelper();

        keyPressed = true;

        if (!cmdObj.keyboardBlocked) {
          var commands = platformCmds.getCommands();
          var inputText;
          var phrases;

          if (cmdObj.command !== null) {
            inputText = getInputText();
            phrases = trimSpace(inputText).split(' ');

            if (phrases[0] === 'exit' || phrases[0] === 'abort') {
              if (commands[cmdObj.command].abortFunc) {
                commands[cmdObj.command].abortFunc();
              }

              platformCmds.resetCommand(true);
            } else {
              platformCmds.queueMessage({
                text : [inputText]
              });

              commands[cmdObj.command].steps[cmdObj.onStep](
                phrases, socket
              );
            }
          } else {
            inputText = getInputText();
            phrases = trimSpace(inputText).split(' ');
            var command = null;
            var commandName;

            if (phrases[0].length > 0) {
              var user = platformCmds.getUser();
              var sign = phrases[0].charAt(0);

              if (commandChars.indexOf(sign) >= 0) {
                commandName = phrases[0].slice(1).toLowerCase();
                command = commands[commandName];
              } else if (platformCmds.getLocalVal('mode') ===
                         'cmd' || user === null) {
                commandName = phrases[0].toLowerCase();
                command = commands[commandName];
              }

              if (command && (isNaN(command.accessLevel) ||
                   platformCmds.getAccessLevel() >= command.accessLevel)) {
                var cmdUsedMsg;

                // Store the command for usage with up/down arrows
                pushCmdHistory(phrases.join(' '));

                /**
                 * Print input if the command shouldn't clear
                 * after use
                 */
                if (!command.clearAfterUse) {
                  cmdUsedMsg = {
                    text : [
                      getInputStart() + platformCmds.getModeText() + '$ ' +
                      inputText
                    ]
                  };
                }

                /**
                 * Print the help and instruction parts of
                 * the command
                 */
                if (phrases[1] === '-help') {
                  var helpMsg = { text : [] };

                  if (command.help) {
                    helpMsg.text =
                      helpMsg.text.concat(command.help);
                  }

                  if (command.instructions) {
                    helpMsg.text =
                      helpMsg.text.concat(
                        command.instructions
                      );
                  }

                  if (helpMsg.text.length > 0) {
                    platformCmds.queueMessage(helpMsg);
                  }
                } else {
                  if (command.steps) {
                    cmdObj.command = commandName;
                    cmdObj.maxSteps =
                      command.steps.length;
                  }

                  if (command.clearBeforeUse) {
                    validCmds.clear.func();
                  }

                  platformCmds.queueCommand(
                    command.func, phrases.splice(1), cmdUsedMsg);
                  startCmdQueue();
                }
              /**
               * User is logged in and in chat mode
               */
              } else if (user !== null && platformCmds.getLocalVal('mode') ===
                                          'chat' && phrases[0].length > 0) {
                if (commandChars.indexOf(phrases[0].charAt(0)) < 0) {
                  platformCmds.queueCommand(commands.msg.func, phrases);
                  startCmdQueue();

                /**
                 * User input commandChar but didn\'t write
                 * a proper command
                 */
                } else {
                  platformCmds.queueMessage({
                    text : [
                      phrases[0] + ': ' +
                      commandFailText.text
                    ]
                  });
                }
              } else if (user === null) {
                platformCmds.queueMessage({ text : [phrases.toString()] });
                platformCmds.queueMessage({
                  text : [
                    'You must register a new user or login ' +
                    'with an existing user to gain access to more commands',
                    'Use command register or login',
                    'e.g. register myname 1135',
                    'or login myname 1135'
                  ]
                });

                /**
                 * Sent command was not found.
                 * Print the failed input
                 */
              } else if (commandName.length > 0) {
                platformCmds.queueMessage({
                  text : ['- ' + phrases[0] + ': ' +
                          commandFailText.text]
                });
              }
            }
          }
        }

        resetPrevCmdPointer();
        clearInput();

        event.preventDefault();

        break;
      // Delete
      case 46:

        // Remove character from marker and move it right
        if (getRightText(marker)) {
          setMarkerText(getRightText(marker)[0]);
          setRightText(getRightText(marker).slice(1));
        } else {
          setMarkerText(' ');
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
        if (getLeftText(marker)) {
          prependToRightText(marker.value);
          setMarkerText(getLeftText(marker).slice(-1));
          setLeftText(getLeftText(marker).slice(0, -1));
        }

        event.preventDefault();

        break;

      // Right arrow
      case 39:

        // Moves marker one step to the right
        if (getRightText(marker)) {
          appendToLeftText(marker.value);
          setMarkerText(getRightText(marker)[0]);
          setRightText(getRightText(marker).slice(1));
        }

        event.preventDefault();

        break;

      // Up arrow
      case 38:
        cmdHistory = getCmdHistory();

        keyPressed = true;

        if (!cmdHelper.keyboardBlocked &&
            cmdHelper.command === null) {
          if (previousCommandPointer > 0) {
            clearInput();
            previousCommandPointer--;
            appendToLeftText(cmdHistory[previousCommandPointer]);
          }
        }

        event.preventDefault();

        break;

      // Down arrow
      case 40:
        cmdHistory = getCmdHistory();

        keyPressed = true;

        if (!cmdHelper.keyboardBlocked &&
            cmdHelper.command === null) {
          if (previousCommandPointer < cmdHistory.length - 1) {
            clearInput();
            previousCommandPointer++;
            appendToLeftText(cmdHistory[previousCommandPointer]);
          } else if (previousCommandPointer ===
                     cmdHistory.length - 1) {
            clearInput();
            previousCommandPointer++;
          } else {
            clearInput();
          }
        }

        event.preventDefault();

        break;
    }
  } else {
    event.preventDefault();
  }
}

function keyPress(event) {
  var keyCode = (typeof event.which === 'number') ? event.which :
                event.keyCode;
  var markerParentsChildren = marker.parentElement.childNodes;
  var markerLocation;

  if (!keyPressed) {
    for (var i = 0; i < markerParentsChildren.length; i++) {
      if (markerParentsChildren[i] === marker) {
        markerLocation = i;
        break;
      }
    }

    switch (keyCode) {
      default:
        var textChar = String.fromCharCode(keyCode);

        if (textChar) {
          appendToLeftText(textChar);
        }

        if (triggerAutoComplete(getLeftText(marker)) &&
            platformCmds.getCmdHelper().command === null) {
          autoComplete();
        }

        break;
    }

    event.preventDefault();
  } else {
    event.preventDefault();
  }
}

function setRoom(roomName) {
  platformCmds.setLocalVal('room', roomName);
  platformCmds.setInputStart(roomName);
  platformCmds.queueMessage({ text : ['Entered ' + roomName] });
}

function scrollView() {
  spacer.scrollIntoView(false);

  // Compatibility fix for Android 2.*
  //window.scrollTo(0, document.body.scrollHeight);
}

// Takes date and returns shorter readable time
function generateTimeStamp(date, full) {
  var newDate = new Date(date);

  // Splitting of date is a fix for NaN on Android 2.*
  if (isNaN(newDate.getMinutes)) {
    var splitDate = date.split(/[-T:\.]+/);
    newDate = new Date(
      Date.UTC(splitDate[0],
        splitDate[1], splitDate[2], splitDate[3],
        splitDate[4], splitDate[5])
    );
  }

  var minutes = (newDate.getMinutes() < 10 ? '0' : '') + newDate.getMinutes();
  var hours = (newDate.getHours() < 10 ? '0' : '') + newDate.getHours();

  if (full) {
    var month = (newDate.getMonth() < 10 ?
                 '0' : '') + newDate.getMonth();
    var day = (newDate.getDate() < 10 ? '0' : '') + newDate.getDate();

    return day + '/' + month + ' ' + hours + ':' + minutes + ' ';
  }

  return hours + ':' + minutes + ' ';
}

// Adds time stamp and room name to a string from a message if they are set
function generateFullText(sentText, message) {
  var text = '';

  if (message.time && !message.skipTime) {
    text += generateTimeStamp(message.time);
  }
  if (message.roomName) {
    text += message.roomName !== platformCmds.getLocalVal('room') ?
            '[' + message.roomName + '] ' : '';
  }
  if (message.user) {
    text += message.user + ': ';
  }

  text += sentText;

  return text;
}

function consumeMsgShortQueue() {
  if (shortMsgQueue.length > 0) {
    var message = shortMsgQueue.shift();

    printRow(message);
  } else {
    printing = false;
  }
}

// Prints messages from the queue
function consumeMsgQueue(messageQueue) {
  if (!printing && messageQueue.length > 0) {
    shortMsgQueue = messageQueue.splice(0, msgsPerQueue);
    printing = true;
    consumeMsgShortQueue();
  }
}

function printRow(message) {
  if (message.text.length > 0) {
    var text = message.text.shift();
    var fullText = generateFullText(text, message);

    var row = document.createElement('li');
    var span = document.createElement('span');
    var textNode = document.createTextNode(fullText);

    if (message.extraClass) {

      /**
       * classList doesn't work on older devices,
       * thus the usage of className
       */
      row.className += ' ' + message.extraClass;
    }

    span.appendChild(textNode);
    row.appendChild(span);
    mainFeed.appendChild(row);

    scrollView();

    setTimeout(printRow, rowTimeout, message);
  } else {
    consumeMsgShortQueue();
  }
}

function convertWhisperRoom(roomName) {
  var convertedRoom = roomName.indexOf('-whisper') >= 0 ? 'WHISPER' : roomName;

  return convertedRoom;
}

function convertDeviceRoom(roomName) {
  var convertedRoom = roomName.indexOf('-device') >= 0 ? 'DEVICE' : roomName;

  return convertedRoom;
}

function convertImportantRoom(roomName) {
  var convertedRoom = roomName === 'important' ? 'IMPRTNT' : roomName;

  return convertedRoom;
}

function convertBroadcastRoom(roomName) {
  var convertedRoom = roomName === 'broadcast' ? 'BRODCST' : roomName;

  return convertedRoom;
}

function printWelcomeMsg() {
  var logoToPrint = logo !== null ?
                    JSON.parse(JSON.stringify(logo)) : { text : [''] };
  var razLogoToPrint = razLogo !== null ?
                       JSON.parse(JSON.stringify(razLogo)) : { text : [''] };

  platformCmds.queueMessage(logoToPrint);
  platformCmds.queueMessage({
    text : [
      'Welcome, employee ' + platformCmds.getUser(),
      'Did you know that you can auto-complete ' +
      'commands by using ' +
      'the tab button or writing double spaces?',
      'Learn this valuable skill to increase ' +
      'your productivity!',
      'May you have a productive day',
      '## This terminal has been cracked by your friendly ' +
      'Razor team. Enjoy! ##'
    ]
  });
  platformCmds.queueMessage(razLogoToPrint);
  platformCmds.queueMessage({
    text : [
      '## This terminal has been cracked by your friendly ' +
      'Razor team. Enjoy! ##'
    ]
  });
}

function printImportantMsg(msg) {
  var message = msg;

  message.extraClass = 'importantMsg';
  message.skipTime = true;

  platformCmds.queueMessage(message);

  if (message.morse) {
    validCmds.morse.func(message.text.slice(0, 1), message.morse.local);
  }
}

function startSocketListeners() {
  if (socket) {
    socket.on('chatMsg', function(message) {
      if (message.roomName) {
        message.roomName = convertWhisperRoom(message.roomName);
      }

      platformCmds.queueMessage(message);
    });

    socket.on('message', function(message) {
      platformCmds.queueMessage(message);
    });

    socket.on('broadcastMsg', function(message) {
      message.extraClass = 'bold';

      platformCmds.queueMessage(message);
    });

    socket.on('importantMsg', printImportantMsg);

    socket.on('multiMsg', function(messages) {
      for (var i = 0; i < messages.length; i++) {
        var message = messages[i];

        message.roomName = convertWhisperRoom(message.roomName);
        message.roomName = convertDeviceRoom(message.roomName);
        message.roomName = convertImportantRoom(message.roomName);
        message.roomName = convertBroadcastRoom(message.roomName);

        platformCmds.queueMessage(message);
      }
    });

    // Triggers when the connection is lost and then re-established
    socket.on('reconnect', reconnect);

    socket.on('disconnect', function() {
      platformCmds.queueMessage({
        text : ['Lost connection'],
        extraClass : 'importantMsg'
      });
    });

    socket.on('follow', function(room) {
      if (room.entered) {
        setRoom(room.roomName);
      } else {
        platformCmds.queueMessage({
          text : ['Following ' + room.roomName]
        });
      }
    });

    socket.on('unfollow', function(room) {
      platformCmds.queueMessage({
        text : ['Stopped following ' + room.roomName]
      });

      if (room.exited) {
        platformCmds.setInputStart('public');
        platformCmds.setLocalVal('room', 'public');
        socket.emit('follow', { roomName : 'public', entered : true });
      }
    });

    socket.on('login', function(user) {
      var mode = platformCmds.getMode();

      validCmds.clear.func();

      platformCmds.setUser(user.userName);
      platformCmds.setAccessLevel(user.accessLevel);
      platformCmds.queueMessage({
        text : ['Successfully logged in as ' + user.userName]
      });
      printWelcomeMsg();

      //TODO Duplicate code
      if (mode) {
        platformCmds.getCommands().mode.func([mode]);
      } else {
        platformCmds.getCommands().mode.func(['chat']);
      }

      socket.emit('updateDeviceSocketId', {
        deviceId : platformCmds.getLocalVal('deviceId'),
        socketId : socket.id,
        user : platformCmds.getUser()
      });

      socket.emit('follow', { roomName : 'public', entered : true });
    });

    socket.on('commandSuccess', function(data) {
      cmdHelper.onStep++;
      validCmds[cmdHelper.command].steps[cmdHelper.onStep](data, socket);
    });

    socket.on('commandFail', function() {
      platformCmds.resetCommand(true);
    });

    socket.on('reconnectSuccess', function(data) {
      var mode = platformCmds.getMode();

      //TODO Duplicate code
      if (mode) {
        platformCmds.getCommands().mode.func([mode], false);
      } else {
        platformCmds.getCommands().mode.func(['cmd'], false);
      }

      platformCmds.setAccessLevel(data.user.accessLevel);

      socket.emit('updateDeviceSocketId', {
        deviceId : platformCmds.getLocalVal('deviceId'),
        socketId : socket.id,
        user : platformCmds.getUser()
      });

      if (!data.firstConnection) {
        platformCmds.queueMessage({
          text : ['Re-established connection'],
          extraClass : 'importantMsg'
        });
      } else {
        printWelcomeMsg();

        if (platformCmds.getLocalVal('room')) {
          var room = platformCmds.getLocalVal('room');
          validCmds.enterroom.func([room]);
        }
      }

      platformCmds.queueMessage({
        text : ['Retrieving missed messages (if any)']
      });

      reconnecting = false;
    });

    socket.on('disconnectUser', function() {
      var currentUser = platformCmds.getLocalVal('user');

      // There is no saved local user. We don't need to print this
      if (currentUser !== null) {
        platformCmds.queueMessage({
          text : [
            'Didn\'t find user ' +
            platformCmds.getLocalVal('user') +
            ' in database',
            'Resetting local configuration'
          ]
        });
      }

      platformCmds.resetAllLocalVals();
    });

    socket.on('morse', function(morseCode) {
      playMorse(morseCode);
    });

    socket.on('time', function(time) {
      platformCmds.queueMessage({
        text : ['Time: ' + generateTimeStamp(time, true)]
      });
    });

    socket.on('locationMsg', function(locationData) {
      //TODO Change from Object.keys for compatibility with older Android
      var locationKeys = Object.keys(locationData);

      for (var i = 0; i < locationKeys.length; i++) {
        var user = locationKeys[i];

        if (locationData[user].coords) {
          var userLoc = locationData[user];
          var latitude = userLoc.coords.latitude.toFixed(6);
          var longitude = userLoc.coords.longitude.toFixed(6);
          var heading = userLoc.coords.heading !== null ?
                        Math.round(userLoc.coords.heading) : null;
          var accuracy = userLoc.accuracy < 1000 ?
                         Math.ceil(userLoc.accuracy) : 'BAD';
          var text = '';
          var mapLoc = locateOnMap(latitude, longitude);

          text += 'User: ' + user + '\t';
          text +=
            'Time: ' + generateTimeStamp(userLoc.locTime, true) + '\t';
          text += 'Location: ' +
                  mapLoc + '\t';

          if (mapLoc !== '---') {
            text += 'Accuracy: ' + accuracy + ' meters\t';

            text += 'Coordinates: ' + latitude + ', ' + longitude + '\t';

            if (heading !== null) {
              text += 'Heading: ' + heading + ' deg.';
            }
          }

          platformCmds.queueMessage({ text : [text] });
        }
      }
    });

    socket.on('ban', function() {
      platformCmds.queueMessage({
        text : [
          'You have been banned from the system',
          'Contact your nearest Organica IT Support ' +
          'Center for re-education',
          '## or your nearest friendly Razor member. ' +
          'Bring a huge bribe ##'
        ],
        extraClass : 'importantMsg'
      });
      platformCmds.resetAllLocalVals();
    });

    socket.on('logout', function() {
      platformCmds.getCommands().clear.func();
      platformCmds.resetAllLocalVals();
      socket.emit('followPublic');
    });

    socket.on('updateCommands', function(commands) {
      if (commands) {
        for (var i = 0; i < commands.length; i++) {
          var newCommand = commands[i];
          var oldCommand = validCmds[newCommand.commandName];

          if (oldCommand) {
            oldCommand.accessLevel = newCommand.accessLevel;
            oldCommand.category = newCommand.category;
            oldCommand.visibility = newCommand.visibility;
            oldCommand.authGroup = newCommand.authGroup;
          }
        }
      }
    });

    socket.on('weather', function(report) {
      var weather = [];

      for (var i = 0; i < report.length; i++) {
        var weatherInst = report[i];
        var weatherString = '';
        var time = new Date(weatherInst.time);
        var hours = time.getHours() > 9 ?
                    time.getHours() : '0' + time.getHours();
        var day = time.getDate() > 9 ? time.getDate() : '0' + time.getDate();
        var month = time.getMonth() > 9 ?
                    (time.getMonth() + 1) : '0' + (time.getMonth() + 1);
        var precipType;
        var temperature = Math.round(weatherInst.temperature);
        var windSpeed = Math.round(weatherInst.gust);
        var precip = weatherInst.precipitation === 0 ?
                     '0.1< ' : weatherInst.precipitation + 'mm ';
        var coverage;

        switch (weatherInst.precipType) {
          // No
          case 0:
            break;
          // Snow
          case 1:
            precipType = 'snow';
            break;
          // Snow + rain
          case 2:
            precipType = 'snow and rain';
            break;
          // Rain
          case 3:
            precipType = 'acid rain';
            break;
          // Drizzle
          case 4:
            precipType = 'drizzle';
            break;
          // Freezing rain
          case 5:
            precipType = 'freezing rain';
            break;
          // Freezing drizzle
          case 6:
            precipType = 'freezing drizzle';
            break;
        }

        switch (weatherInst.cloud) {
          case 0:
          case 1:
          case 2:
          case 3:
            coverage = 'Light';

            break;
          case 4:
          case 5:
          case 6:
            coverage = 'Moderate';

            break;
          case 7:
          case 8:
          case 9:
            coverage = 'High';

            break;
        }

        weatherString += day + '/' + month + ' ' +
                         hours + ':00' + '\t';
        weatherString += 'Temperature: ' + temperature + '\xB0C\t';
        weatherString += 'Visibility: ' + weatherInst.visibility + 'km \t';
        weatherString +=
          'Wind direction: ' + weatherInst.windDirection + '\xB0\t';
        weatherString += 'Wind speed: ' + windSpeed + 'm/s\t';
        weatherString += 'Blowout risk: ' + weatherInst.thunder + '%\t';
        weatherString += 'Pollution coverage: ' + coverage + '\t';

        if (precipType) {
          weatherString += precip;
          weatherString += precipType;
        }

        weather.push(weatherString);
      }

      platformCmds.queueMessage({ text : weather });
    });

    socket.on('updateDeviceId', function(newId) {
      platformCmds.setLocalVal('deviceId', newId);
    });
  }
}

function keyReleased() {
  keyPressed = false;
}

function isFullscreen() {
  return (!window.screenTop && !window.screenY);
}

/**
 * Goes into full screen with sent element
 * This is not supported in iOS Safari
 * @param element
 */
function goFullScreen(element) {
  if (element.requestFullscreen) {
    element.requestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
  } else if (element.mozRequestFullScreen) {
    element.mozRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
  }
}

function fullscreenResize(keyboardShown) {

  /**
   * Used for Android when it shows/hides the keyboard
   * The soft keyboard will block part of the site without this fix
   */
  if (isFullscreen() && navigator.userAgent.match(/Android/i)) {
    var background = document.getElementById('background');

    if (keyboardShown) {
      background.classList.add('fullscreenKeyboardFix');
      background.classList.remove('fullscreenFix');
    } else {
      background.classList.remove('fullscreenKeyboardFix');
      background.classList.add('fullscreenFix');
    }

    scrollView();
  }
}

function generateDeviceId() {
  var randomString = '0123456789abcdefghijkmnopqrstuvwxyz' +
                     'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var randomLength = randomString.length;
  var deviceId = '';

  for (var i = 0; i < 15; i++) {
    var randomVal = Math.random() * (randomLength - 1);

    deviceId += randomString[Math.round(randomVal)];
  }

  return deviceId;
}

// Sets everything relevant when a user enters the site
function startBoot() {
  var background = document.getElementById('background');

  msgQueue = [];
  cmdQueue = [];
  socket = io();

  socket.emit('getCommands');

  // TODO: Move this
  if (!platformCmds.getLocalVal('deviceId')) {
    platformCmds.setLocalVal('deviceId', generateDeviceId());
  }

  background.addEventListener('click', function(event) {
    clicked = !clicked;

    if (clicked) {
      marker.focus();
    } else {
      marker.blur();
    }

    // Set whole document to full screen
    goFullScreen(document.documentElement);
    fullscreenResize(clicked);

    event.preventDefault();
  });

  startSocketListeners();
  addEventListener('keypress', keyPress);

  // Needed for some special keys. They are not detected with keypress
  addEventListener('keydown', specialKeyPress);
  addEventListener('keyup', keyReleased);
  window.addEventListener('focus', setIntervals);

  resetPrevCmdPointer();
  generateMap();
  setIntervals();
  startAudio();

  // TODO: Move this
  if (!platformCmds.getAccessLevel()) {
    platformCmds.setAccessLevel(0);
  }

  if (!platformCmds.getUser()) {
    platformCmds.setInputStart('RAZCMD');
    socket.emit('updateDeviceSocketId', {
      deviceId : platformCmds.getLocalVal('deviceId'),
      socketId : socket.id,
      user : 'NO_USER_LOGGED_IN'
    });
  }

  socket.emit('updateId', {
    userName : platformCmds.getUser(),
    firstConnection : true,
    device : platformCmds.getLocalVal('deviceId')
  });
}

startBoot();