/*
 Copyright 2015 Aleksandar Jankovic

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

'use strict';

const path = require('path');

let config = {};

try {
  config = require(path.normalize(`${__dirname}/../../../../config/databasePopulation`)).config; // eslint-disable-line import/no-unresolved, global-require, import/no-dynamic-require
} catch (err) {
  console.log('Did not find modified databasePopulation. Using defaults');
}

/**
 * Return random string
 * @returns {string} Random string
 */
function generatePass() {
  const randomString = '023456789abcdefghijkmnopqrstuvwxyz';
  const randomLength = randomString.length;
  let code = '';

  for (let i = 0; i < 10; i += 1) {
    const randomVal = Math.random() * (randomLength - 1);

    code += randomString[Math.round(randomVal)];
  }

  return code;
}

// To avoid undefined if rooms and commands haven't been changed
config.rooms = config.rooms || {};
config.commands = config.commands || {};
config.users = config.users || {};

config.accessLevels = config.accessLevels || {
  god: 13,
  superUser: 12,
  admin: 11,
  privileged: 9,
  advanced: 3,
  basic: 1,
  anonymous: 0,
};

/**
 * Rooms to be created on first run
 * important, broadcast, admin should always be created. The rest are optional
 */
config.rooms = {
  // General chat room, available for every user
  public: config.rooms.public || {
    roomName: 'public',
    visibility: config.accessLevels.anonymous,
    accessLevel: config.accessLevels.anonymous,
    writeLevel: config.accessLevels.basic,
  },

  /**
   * Used to store messages labeled as important.
   * Not used as an ordinary chat room
   */
  important: config.rooms.important || {
    roomName: 'important',
    visibility: config.accessLevels.superUser,
    accessLevel: config.accessLevels.superUser,
  },

  /**
   * Used to store messages labeled as broadcast.
   * Not used as an ordinary chat room
   */
  bcast: config.rooms.bcast || {
    roomName: 'broadcast',
    visibility: config.accessLevels.superUser,
    accessLevel: config.accessLevels.superUser,
  },

  /**
   * Used for morse messages
   * Not used as an ordinary chat room
   */
  morse: {
    roomName: 'morse',
    visibility: config.accessLevels.superUser,
    accessLevel: config.accessLevels.superUser,
  },

  /**
   * Admin related messages will be sent here
   * E.g. when a user needs verification
   */
  admin: config.rooms.admin || {
    roomName: 'hqroom',
    visibility: config.accessLevels.admin,
    accessLevel: config.accessLevels.admin,
  },

  /**
   * Blocking name for users
   * Not used as an ordinary chat room
   */
  team: {
    roomName: 'team',
    visibility: config.accessLevels.superUser,
    accessLevel: config.accessLevels.superUser,
  },

  /**
   * Blocking name for users
   * Not used as an ordinary chat room
   */
  whisper: {
    roomName: 'whisper',
    visibility: config.accessLevels.superUser,
    accessLevel: config.accessLevels.superUser,
  },
};

/**
 * Users to be created on first run
 * superuser should always be created. The rest are optional
 */
config.users = {
  // Admin users to be used to create the first rooms and verify first users
  superuser: config.users.superuser || {
    userName: 'superuser',
    password: generatePass(),
    verified: true,
    accessLevel: config.accessLevels.superUser,
    visibility: config.accessLevels.god,
    rooms: [config.rooms.public.roomName],
  },
  // Blocking name for users
  root: config.users.root || {
    userName: 'root',
    password: generatePass(),
    verified: false,
    accessLevel: config.accessLevels.anonymous,
    visibility: config.accessLevels.god,
    rooms: [],
  },
  // Blocking name for users
  admin: config.users.admin || {
    userName: 'admin',
    password: generatePass(),
    verified: false,
    accessLevel: config.accessLevels.anonymous,
    visibility: config.accessLevels.god,
    rooms: [],
  },
};

/**
 *
 */
config.commands = {
  help: config.commands.help || {
    commandName: 'help',
    accessLevel: config.accessLevels.anonymous,
    visibility: config.accessLevels.anonymous,
    category: 'basic',
  },
  clear: config.commands.clear || {
    commandName: 'clear',
    accessLevel: config.accessLevels.basic,
    visibility: config.accessLevels.basic,
    category: 'basic',
  },
  whoami: config.commands.whoami || {
    commandName: 'whoami',
    accessLevel: config.accessLevels.basic,
    visibility: config.accessLevels.basic,
    category: 'basic',
  },
  msg: config.commands.msg || {
    commandName: 'msg',
    accessLevel: config.accessLevels.basic,
    visibility: config.accessLevels.basic,
    category: 'messaging',
  },
  broadcast: config.commands.broadcast || {
    commandName: 'broadcast',
    accessLevel: config.accessLevels.privileged,
    visibility: config.accessLevels.privileged,
    category: 'messaging',
  },
  follow: config.commands.follow || {
    commandName: 'follow',
    accessLevel: config.accessLevels.basic,
    visibility: config.accessLevels.basic,
    category: 'basic',
  },
  unfollow: config.commands.unfollow || {
    commandName: 'unfollow',
    accessLevel: config.accessLevels.basic,
    visibility: config.accessLevels.basic,
    category: 'basic',
  },
  list: config.commands.list || {
    commandName: 'list',
    accessLevel: config.accessLevels.basic,
    visibility: config.accessLevels.basic,
    category: 'basic',
  },
  mode: config.commands.mode || {
    commandName: 'mode',
    accessLevel: config.accessLevels.basic,
    visibility: config.accessLevels.basic,
    category: 'extra',
  },
  register: config.commands.register || {
    commandName: 'register',
    accessLevel: config.accessLevels.anonymous,
    visibility: config.accessLevels.anonymous,
    category: 'login',
  },
  createroom: config.commands.createroom || {
    commandName: 'createroom',
    accessLevel: config.accessLevels.basic,
    visibility: config.accessLevels.god,
    category: 'basic',
  },
  login: config.commands.login || {
    commandName: 'login',
    accessLevel: config.accessLevels.anonymous,
    visibility: config.accessLevels.anonymous,
    category: 'login',
  },
  time: config.commands.time || {
    commandName: 'time',
    accessLevel: config.accessLevels.anonymous,
    visibility: config.accessLevels.anonymous,
    category: 'basic',
  },
  locate: config.commands.locate || {
    commandName: 'locate',
    accessLevel: config.accessLevels.basic,
    visibility: config.accessLevels.basic,
    category: 'basic',
  },
  history: config.commands.history || {
    commandName: 'history',
    accessLevel: config.accessLevels.anonymous,
    visibility: config.accessLevels.anonymous,
    category: 'messaging',
  },
  morse: config.commands.morse || {
    commandName: 'morse',
    accessLevel: config.accessLevels.admin,
    visibility: config.accessLevels.admin,
    category: 'messaging',
  },
  password: config.commands.password || {
    commandName: 'password',
    accessLevel: config.accessLevels.basic,
    visibility: config.accessLevels.basic,
    category: 'basic',
  },
  logout: config.commands.logout || {
    commandName: 'logout',
    accessLevel: config.accessLevels.basic,
    visibility: config.accessLevels.basic,
    category: 'basic',
  },
  reboot: config.commands.reboot || {
    commandName: 'reboot',
    accessLevel: config.accessLevels.anonymous,
    visibility: config.accessLevels.anonymous,
    category: 'basic',
  },
  verifyuser: config.commands.verifyuser || {
    commandName: 'verifyuser',
    accessLevel: config.accessLevels.admin,
    visibility: config.accessLevels.admin,
    category: 'admin',
  },
  banuser: config.commands.banuser || {
    commandName: 'banuser',
    accessLevel: config.accessLevels.admin,
    visibility: config.accessLevels.admin,
    category: 'admin',
  },
  unbanuser: config.commands.unbanuser || {
    commandName: 'unbanuser',
    accessLevel: config.accessLevels.admin,
    visibility: config.accessLevels.admin,
    category: 'admin',
  },
  whisper: config.commands.whisper || {
    commandName: 'whisper',
    accessLevel: config.accessLevels.basic,
    visibility: config.accessLevels.basic,
    category: 'messaging',
  },
  hackroom: config.commands.hackroom || {
    commandName: 'hackroom',
    accessLevel: config.accessLevels.advanced,
    visibility: config.accessLevels.advanced,
    category: 'basic',
  },
  hacklantern: config.commands.hacklantern || {
    commandName: 'hacklantern',
    accessLevel: config.accessLevels.basic,
    visibility: config.accessLevels.basic,
    category: 'basic',
  },
  importantmsg: config.commands.importantmsg || {
    commandName: 'importantmsg',
    accessLevel: config.accessLevels.admin,
    visibility: config.accessLevels.admin,
    category: 'messaging',
  },
  chipper: config.commands.chipper || {
    commandName: 'chipper',
    accessLevel: config.accessLevels.advanced,
    visibility: config.accessLevels.advanced,
    category: 'basic',
    authGroup: 'hackers',
  },
  switchroom: config.commands.switchroom || {
    commandName: 'room',
    accessLevel: config.accessLevels.basic,
    visibility: config.accessLevels.basic,
    category: 'basic',
  },
  removeroom: config.commands.removeroom || {
    commandName: 'removeroom',
    accessLevel: config.accessLevels.basic,
    visibility: config.accessLevels.god,
    category: 'basic',
  },
  updateuser: config.commands.updateuser || {
    commandName: 'updateuser',
    accessLevel: config.accessLevels.admin,
    visibility: config.accessLevels.admin,
    category: 'admin',
  },
  updatecommand: config.commands.updatecommand || {
    commandName: 'updatecommand',
    accessLevel: config.accessLevels.admin,
    visibility: config.accessLevels.admin,
    category: 'admin',
  },
  weather: config.commands.weather || {
    commandName: 'weather',
    accessLevel: config.accessLevels.anonymous,
    visibility: config.accessLevels.anonymous,
    category: 'basic',
  },
  updatedevice: config.commands.updatedevice || {
    commandName: 'updatedevice',
    accessLevel: config.accessLevels.admin,
    visibility: config.accessLevels.admin,
    category: 'admin',
  },
  updateroom: config.commands.updateroom || {
    commandName: 'updateroom',
    accessLevel: config.accessLevels.admin,
    visibility: config.accessLevels.admin,
    category: 'admin',
  },
  inviteteam: config.commands.inviteteam || {
    commandName: 'inviteteam',
    accessLevel: config.accessLevels.basic,
    visibility: config.accessLevels.god,
    category: 'admin',
  },
  createteam: config.commands.createteam || {
    commandName: 'createteam',
    accessLevel: config.accessLevels.basic,
    visibility: config.accessLevels.god,
    category: 'basic',
  },
  alias: config.commands.alias || {
    commandName: 'alias',
    accessLevel: config.accessLevels.basic,
    visibility: config.accessLevels.basic,
    category: 'extra',
  },
  central: config.commands.central || {
    commandName: 'central',
    accessLevel: config.accessLevels.god,
    visibility: config.accessLevels.god,
    category: 'basic',
  },
  jobs: config.commands.jobs || {
    commandName: 'jobs',
    accessLevel: config.accessLevels.anonymous,
    visibility: config.accessLevels.anonymous,
    category: 'basic',
  },
  invitations: config.commands.invitations || {
    commandName: 'invitations',
    accessLevel: config.accessLevels.basic,
    visibility: config.accessLevels.basic,
    category: 'basic',
  },
  inviteroom: config.commands.inviteroom || {
    commandName: 'inviteroom',
    accessLevel: config.accessLevels.basic,
    visibility: config.accessLevels.god,
    category: 'basic',
  },
  createmission: config.commands.createmission || {
    commandName: 'createmission',
    accessLevel: config.accessLevels.basic,
    visibility: config.accessLevels.basic,
    category: 'basic',
  },
  verifyteam: config.commands.verifyteam || {
    commandName: 'verifyteam',
    accessLevel: config.accessLevels.admin,
    visibility: config.accessLevels.admin,
    category: 'admin',
  },
  map: config.commands.map || {
    commandName: 'map',
    accessLevel: config.accessLevels.basic,
    visibility: config.accessLevels.basic,
    category: 'basic',
  },
  archives: config.commands.archives || {
    commandName: 'archives',
    accessLevel: config.accessLevels.basic,
    visibility: config.accessLevels.basic,
    category: 'basic',
  },
  leaveteam: config.commands.leaveteam || {
    commandName: 'leaveteam',
    accessLevel: config.accessLevels.basic,
    visibility: config.accessLevels.basic,
    category: 'basic',
  },
  creategameuser: config.commands.creategameuser || {
    commandName: 'creategameuser',
    accessLevel: config.accessLevels.admin,
    visibility: config.accessLevels.admin,
    category: 'basic',
  },
  creategameword: config.commands.creategameword || {
    commandName: 'creategameword',
    accessLevel: config.accessLevels.admin,
    visibility: config.accessLevels.admin,
    category: 'basic',
  },
  rebootall: config.commands.rebootall || {
    commandName: 'rebootall',
    accessLevel: config.accessLevels.admin,
    visibility: config.accessLevels.admin,
    category: 'admin',
  },
};

module.exports = config;
