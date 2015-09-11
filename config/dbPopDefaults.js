'use strict';

const config = {};

const generatePass = function() {
  const randomString = '023456789abcdefghijkmnopqrstuvwxyz';
  const randomLength = randomString.length;
  let code = '';

  for (var i = 0; i < 10; i++) {
    const randomVal = Math.random() * (randomLength - 1);

    code += randomString[Math.round(randomVal)];
  }

  return code;
};

/**
 * Users to be created on first run
 * superuser should always be created. The rest are optional
 */
config.users = {

  // Admin users to be used to create the first rooms and verify first users
  superuser : {
    userName : 'superuser',
    password : generatePass(),
    verified : true,
    accessLevel : 12,
    visibility : 12,
    rooms : ['public']
  }
};

/**
 * Rooms to be created on first run
 * important, broadcast, admin should always be created. The rest are optional
 */
config.rooms = {

  // General chat room, available for every user
  public : {
    roomName : 'public',
    visibility : 1,
    accessLevel : 1
  },

  /**
   * Used to store messages labeled as important.
   * Not used as an ordinary chat room
   */
  important : {
    roomName : 'important',
    visibility : 12,
    accessLevel : 12,
    password : generatePass()
  },

  /**
   * Used to store messages labeled as broadcast.
   * Not used as an ordinary chat room
   */
  broadcast : {
    roomName : 'broadcast',
    visibility : 12,
    accessLevel : 12,
    password : generatePass()
  },

  /**
   * Admin related messages will be sent here
   * E.g. when a user needs verification
   */
  admin : {
    roomName : 'hqroom',
    visibility : 11,
    accessLevel : 11
  }
};

/**
 * Appended to the user name to create a room which is used to store private
 * messages sent to a user (e.g user1-whisper)
 */
config.whisper = '-whisper';

/**
 * Appended to device ID to create a room which is used to store messages
 * sent to a device (e.g fe3Liw19Xz-device)
 */
config.device = '-device';

/**
 *
 */
config.commands = {
  help : {
    commandName : 'help',
    accessLevel : 0,
    visibility : 0,
    category : 'basic'
  },
  clear : {
    commandName : 'clear',
    accessLevel : 1,
    visibility : 1,
    category : 'basic'
  },
  whoami : {
    commandName : 'whoami',
    accessLevel : 1,
    visibility : 1,
    category : 'basic'
  },
  msg : {
    commandName : 'msg',
    accessLevel : 1,
    visibility : 1,
    category : 'advanced'
  },
  broadcast : {
    commandName : 'broadcast',
    accessLevel : 9,
    visibility : 9,
    category : 'advanced'
  },
  enterroom : {
    commandName : 'enterroom',
    accessLevel : 1,
    visibility : 1,
    category : 'basic'
  },
  follow : {
    commandName : 'follow',
    accessLevel : 1,
    visibility : 1,
    category : 'advanced'
  },
  unfollow : {
    commandName : 'unfollow',
    accessLevel : 1,
    visibility : 1,
    category : 'advanced'
  },
  list : {
    commandName : 'list',
    accessLevel : 1,
    visibility : 1,
    category : 'basic'
  },
  mode : {
    commandName : 'mode',
    accessLevel : 1,
    visibility : 1,
    category : 'advanced'
  },
  register : {
    commandName : 'register',
    accessLevel : 0,
    visibility : 0,
    category : 'login'
  },
  createroom : {
    commandName : 'createroom',
    accessLevel : 1,
    visibility : 1,
    category : 'advanced'
  },
  myrooms : {
    commandName : 'myrooms',
    accessLevel : 1,
    visibility : 1,
    category : 'advanced'
  },
  login : {
    commandName : 'login',
    accessLevel : 0,
    visibility : 0,
    category : 'login'
  },
  time : {
    commandName : 'time',
    accessLevel : 0,
    visibility : 0,
    category : 'basic'
  },
  locate : {
    commandName : 'locate',
    accessLevel : 1,
    visibility : 1,
    category : 'advanced'
  },
  uploadkey : {
    commandName : 'uploadkey',
    accessLevel : 1,
    visibility : 1,
    category : 'basic'
  },
  history : {
    commandName : 'history',
    accessLevel : 1,
    visibility : 1,
    category : 'advanced'
  },
  morse : {
    commandName : 'morse',
    accessLevel : 11,
    visibility : 11,
    category : 'admin'
  },
  password : {
    commandName : 'password',
    accessLevel : 1,
    visibility : 1,
    category : 'basic'
  },
  logout : {
    commandName : 'logout',
    accessLevel : 1,
    visibility : 1,
    category : 'basic'
  },
  reboot : {
    commandName : 'reboot',
    accessLevel : 0,
    visibility : 0,
    category : 'login'
  },
  verifyuser : {
    commandName : 'verifyuser',
    accessLevel : 11,
    visibility : 11,
    category : 'admin'
  },
  banuser : {
    commandName : 'banuser',
    accessLevel : 11,
    visibility : 11,
    category : 'admin'
  },
  unbanuser : {
    commandName : 'unbanuser',
    accessLevel : 11,
    visibility : 11,
    category : 'admin'
  },
  whisper : {
    commandName : 'whisper',
    accessLevel : 1,
    visibility : 1,
    category : 'basic'
  },
  hackroom : {
    commandName : 'hackroom',
    accessLevel : 1,
    visibility : 1,
    category : 'hacking'
  },
  importantmsg : {
    commandName : 'importantmsg',
    accessLevel : 11,
    visibility : 11,
    category : 'admin'
  },
  chipper : {
    commandName : 'chipper',
    accessLevel : 1,
    visibility : 1,
    category : 'hacking',
    authGroup : 'hackers'
  },
  switchroom : {
    commandName : 'switchroom',
    accessLevel : 1,
    visibility : 1,
    category : 'advanced'
  },
  removeroom : {
    commandName : 'removeroom',
    accessLevel : 1,
    visibility : 1,
    category : 'admin'
  },
  updateuser : {
    commandName : 'updateuser',
    accessLevel : 11,
    visibility : 11,
    category : 'admin'
  },
  updatecommand : {
    commandName : 'updatecommand',
    accessLevel : 11,
    visibility : 11,
    category : 'admin'
  },
  addentities : {
    commandName : 'addentities',
    accessLevel : 11,
    visibility : 11,
    category : 'admin'
  },
  addencryptionkeys : {
    commandName : 'addencryptionkeys',
    accessLevel : 11,
    visibility : 11,
    category : 'admin'
  },
  weather : {
    commandName : 'weather',
    accessLevel : 0,
    visibility : 0,
    category : 'basic'
  },
  updatedevice : {
    commandName : 'updatedevice',
    accessLevel : 11,
    visibility : 11,
    category : 'admin'
  },
  updateroom : {
    commandName : 'updateroom',
    accessLevel : 11,
    visibility : 11,
    category : 'admin'
  },
  moduleraid : {
    commandName : 'moduleraid',
    accessLevel : 11,
    visibility : 11,
    category : 'admin'
  }
};

module.exports = config;