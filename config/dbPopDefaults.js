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

// Users to be created on first run
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

// Rooms to be created on first run
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
    accessLevel : 12
  },

  /**
   * Used to store messages labeled as broadcast.
   * Not used as an ordinary chat room
   */
  broadcast : {
    roomName : 'broadcast',
    visibility : 12,
    accessLevel : 12
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

module.exports = config;