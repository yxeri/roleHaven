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
  console.log('Did not find modified dbConfig. Using defaults');
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
config.apiCommands = config.apiCommands || {};

config.accessLevels = config.accessLevels || {
  god: 13,
  superUser: 12,
  admin: 11,
  lowerAdmin: 9,
  privileged: 6,
  pro: 3,
  advanced: 2,
  basic: 1,
  anonymous: 0,
};

/**
 * Rooms to be created on first run
 */
config.rooms = {
  // GeneralError chat room, available for every user
  public: config.rooms.public || {
    roomName: 'public',
    visibility: config.accessLevels.anonymous,
    accessLevel: config.accessLevels.anonymous,
    writeLevel: config.accessLevels.basic,
    owner: 'superuser',
  },

  /**
   * Used to store messages labeled as broadcast.
   * Not used as an ordinary chat room
   */
  bcast: config.rooms.bcast || {
    roomName: 'broadcast',
    visibility: config.accessLevels.superUser,
    accessLevel: config.accessLevels.superUser,
    owner: 'superuser',
  },

  /**
   * Admin related messages will be sent here
   * E.g. when a user needs verification
   */
  admin: config.rooms.admin || {
    roomName: 'hqroom',
    visibility: config.accessLevels.admin,
    accessLevel: config.accessLevels.admin,
    owner: 'superuser',
  },

  /**
   * Blocking name for users
   * Not used as an ordinary chat room
   */
  team: config.rooms.team || {
    roomName: 'team',
    visibility: config.accessLevels.superUser,
    accessLevel: config.accessLevels.superUser,
    owner: 'superuser',
  },

  /**
   * Blocking name for users
   * Not used as an ordinary chat room
   */
  whisper: config.rooms.whisper || {
    roomName: 'whisper',
    visibility: config.accessLevels.superUser,
    accessLevel: config.accessLevels.superUser,
    owner: 'superuser',
  },

  // TODO Move outside of defaults
  dead: config.rooms.dead || {
    roomName: 'd34d',
    visibility: config.accessLevels.anonymous,
    accessLevel: config.accessLevels.anonymous,
    anonymous: true,
    owner: 'superuser',
  },

  important: config.rooms.important || {
    roomName: 'important',
    visibility: config.accessLevels.superUser,
    accessLevel: config.accessLevels.superUser,
    owner: 'superuser',
  },

  news: config.rooms.news || {
    roomName: 'news',
    visibility: config.accessLevels.superUser,
    accessLevel: config.accessLevels.superUser,
    owner: 'superuser',
  },

  schedule: config.rooms.schedule || {
    roomName: 'schedule',
    visibility: config.accessLevels.superUser,
    accessLevel: config.accessLevels.superUser,
    owner: 'superuser',
  },

  user: config.rooms.user || {
    roomName: 'user',
    visibility: config.accessLevels.superUser,
    accessLevel: config.accessLevels.superUser,
    owner: 'superuser',
  },
};

config.requiredRooms = [
  config.rooms.team.roomName,
  config.rooms.bcast.roomName,
  config.rooms.public.roomName,
  config.rooms.important.roomName,
  config.rooms.news.roomName,
  config.rooms.schedule.roomName,
  config.rooms.user.roomName,
];

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
    accessLevel: config.accessLevels.anonymous,
    visibility: config.accessLevels.god,
    rooms: [config.rooms.public.roomName],
    mail: 'superuser',
  },
  // Blocking name for users
  root: config.users.root || {
    userName: 'root',
    password: generatePass(),
    verified: false,
    accessLevel: config.accessLevels.anonymous,
    visibility: config.accessLevels.god,
    rooms: [],
    mail: 'root',
  },
  // Blocking name for users
  admin: config.users.admin || {
    userName: 'admin',
    password: generatePass(),
    verified: false,
    accessLevel: config.accessLevels.anonymous,
    visibility: config.accessLevels.god,
    rooms: [],
    mail: 'admin',
  },
  anonymous: config.users.anonymous || {
    userName: 'anonymous',
    password: generatePass(),
    verified: false,
    accessLevel: config.accessLevels.anonymous,
    visibility: config.accessLevels.god,
    rooms: [],
    mail: 'anonymous',
  },
  system: config.users.system || {
    userName: 'system',
    password: generatePass(),
    verified: false,
    accessLevel: config.accessLevels.admin,
    visibility: config.accessLevels.god,
    rooms: [],
    mail: 'system',
  },
};

config.commands = {
  help: config.commands.help || {
    commandName: 'help',
    accessLevel: config.accessLevels.anonymous,
  },
  clear: config.commands.clear || {
    commandName: 'clear',
    accessLevel: config.accessLevels.basic,
  },
  whoami: config.commands.whoami || {
    commandName: 'whoami',
    accessLevel: config.accessLevels.anonymous,
  },
  chatMsg: config.commands.chatMsg || {
    commandName: 'chatMsg',
    accessLevel: config.accessLevels.basic,
  },
  broadcast: config.commands.broadcast || {
    commandName: 'broadcast',
    accessLevel: config.accessLevels.privileged,
  },
  follow: config.commands.follow || {
    commandName: 'follow',
    accessLevel: config.accessLevels.basic,
  },
  unfollow: config.commands.unfollow || {
    commandName: 'unfollow',
    accessLevel: config.accessLevels.basic,
  },
  listUsers: config.commands.listUsers || {
    commandName: 'listUsers',
    accessLevel: config.accessLevels.basic,
  },
  listRooms: config.commands.listRooms || {
    commandName: 'listRooms',
    accessLevel: config.accessLevels.anonymous,
  },
  listTeams: config.commands.listTeams || {
    commandName: 'listTeams',
    accessLevel: config.accessLevels.anonymous,
  },
  listDevices: config.commands.listDevices || {
    commandName: 'listDevices',
    accessLevel: config.accessLevels.lowerAdmin,
  },
  register: config.commands.register || {
    commandName: 'register',
    accessLevel: config.accessLevels.anonymous,
  },
  createRoom: config.commands.createRoom || {
    commandName: 'createRoom',
    accessLevel: config.accessLevels.basic,
  },
  login: config.commands.login || {
    commandName: 'login',
    accessLevel: config.accessLevels.anonymous,
  },
  time: config.commands.time || {
    commandName: 'time',
    accessLevel: config.accessLevels.anonymous,
  },
  locate: config.commands.locate || {
    commandName: 'locate',
    accessLevel: config.accessLevels.basic,
  },
  getHistory: config.commands.getHistory || {
    commandName: 'getHistory',
    accessLevel: config.accessLevels.anonymous,
  },
  password: config.commands.password || {
    commandName: 'password',
    accessLevel: config.accessLevels.basic,
  },
  logout: config.commands.logout || {
    commandName: 'logout',
    accessLevel: config.accessLevels.basic,
  },
  reboot: config.commands.reboot || {
    commandName: 'reboot',
    accessLevel: config.accessLevels.anonymous,
  },
  verifyUser: config.commands.verifyUser || {
    commandName: 'verifyUser',
    accessLevel: config.accessLevels.admin,
  },
  banUser: config.commands.banUser || {
    commandName: 'banUser',
    accessLevel: config.accessLevels.admin,
  },
  unbanUser: config.commands.unbanUser || {
    commandName: 'unbanUser',
    accessLevel: config.accessLevels.admin,
  },
  getBannedUsers: config.commands.getBannedUsers || {
    commandName: 'getBannedUsers',
    accessLevel: config.accessLevels.lowerAdmin,
  },
  whisper: config.commands.whisper || {
    commandName: 'whisper',
    accessLevel: config.accessLevels.basic,
  },
  hackRoom: config.commands.hackRoom || {
    commandName: 'hackRoom',
    accessLevel: config.accessLevels.advanced,
  },
  hackLantern: config.commands.hackLantern || {
    commandName: 'hackLantern',
    accessLevel: config.accessLevels.basic,
  },
  chipper: config.commands.chipper || {
    commandName: 'chipper',
    accessLevel: config.accessLevels.advanced,
    authGroup: 'hackers',
  },
  switchRoom: config.commands.switchRoom || {
    commandName: 'room',
    accessLevel: config.accessLevels.basic,
  },
  removeRoom: config.commands.removeRoom || {
    commandName: 'removeRoom',
    accessLevel: config.accessLevels.basic,
  },
  updateUser: config.commands.updateUser || {
    commandName: 'updateUser',
    accessLevel: config.accessLevels.admin,
  },
  updateCommand: config.commands.updateCommand || {
    commandName: 'updateCommand',
    accessLevel: config.accessLevels.admin,
  },
  weather: config.commands.weather || {
    commandName: 'weather',
    accessLevel: config.accessLevels.anonymous,
  },
  updateDevice: config.commands.updateDevice || {
    commandName: 'updateDevice',
    accessLevel: config.accessLevels.anonymous,
  },
  updateRoom: config.commands.updateRoom || {
    commandName: 'updateRoom',
    accessLevel: config.accessLevels.admin,
  },
  inviteTeam: config.commands.inviteTeam || {
    commandName: 'inviteTeam',
    accessLevel: config.accessLevels.basic,
  },
  createTeam: config.commands.createTeam || {
    commandName: 'createTeam',
    accessLevel: config.accessLevels.basic,
  },
  central: config.commands.central || {
    commandName: 'central',
    accessLevel: config.accessLevels.god,
  },
  jobs: config.commands.jobs || {
    commandName: 'jobs',
    accessLevel: config.accessLevels.anonymous,
  },
  invitations: config.commands.invitations || {
    commandName: 'invitations',
    accessLevel: config.accessLevels.basic,
  },
  inviteRoom: config.commands.inviteRoom || {
    commandName: 'inviteRoom',
    accessLevel: config.accessLevels.basic,
  },
  createMission: config.commands.createMission || {
    commandName: 'createMission',
    accessLevel: config.accessLevels.basic,
  },
  verifyTeam: config.commands.verifyTeam || {
    commandName: 'verifyTeam',
    accessLevel: config.accessLevels.lowerAdmin,
  },
  getPositions: config.commands.getPositions || {
    commandName: 'getPositions',
    accessLevel: config.accessLevels.anonymous,
  },
  docFiles: config.commands.docFiles || {
    commandName: 'docFiles',
    accessLevel: config.accessLevels.basic,
  },
  leaveTeam: config.commands.leaveTeam || {
    commandName: 'leaveTeam',
    accessLevel: config.accessLevels.basic,
  },
  createGameUser: config.commands.createGameUser || {
    commandName: 'createGameUser',
    accessLevel: config.accessLevels.admin,
  },
  createGameWord: config.commands.createGameWord || {
    commandName: 'createGameWord',
    accessLevel: config.accessLevels.admin,
  },
  rebootAll: config.commands.rebootAll || {
    commandName: 'rebootAll',
    accessLevel: config.accessLevels.admin,
  },
  getDocFiles: config.commands.getDocFiles || {
    commandName: 'getDocFiles',
    accessLevel: config.accessLevels.anonymous,
  },
  getDocFile: config.commands.getDocFile || {
    commandName: 'getDocFile',
    accessLevel: config.accessLevels.anonymous,
  },
  getRooms: config.commands.getRooms || {
    commandName: 'getRooms',
    accessLevel: config.accessLevels.anonymous,
  },
  updateUserPosition: config.commands.updateUserPosition || {
    commandName: 'updateUserPosition',
    accessLevel: config.accessLevels.basic,
  },
  updateDevicePosition: config.commands.updateDevicePosition || {
    commandName: 'updateDevicePosition',
    accessLevel: config.accessLevels.anonymous,
  },
  createPosition: config.commands.createPosition || {
    commandName: 'createPosition',
    accessLevel: config.accessLevels.basic,
  },
  getWallet: config.commands.getWallet || {
    commandName: 'getWallet',
    accessLevel: config.accessLevels.basic,
  },
  calibrationMission: config.commands.calibrationMission || {
    commandName: 'calibrationMission',
    accessLevel: config.accessLevels.basic,
  },
  updateCalibrationMission: config.commands.updateCalibrationMission || {
    commandName: 'updateCalibrationMission',
    accessLevel: config.accessLevels.lowerAdmin,
  },
  getTeam: config.commands.getTeam || {
    commandName: 'getTeam',
    accessLevel: config.accessLevels.basic,
  },
  addAlias: config.commands.addAlias || {
    commandName: 'addAlias',
    accessLevel: config.accessLevels.basic,
  },
  aliases: config.commands.aliases || {
    commandName: 'aliases',
    accessLevel: config.accessLevels.basic,
  },
  getSimpleMsgs: config.commands.getSimpleMsgs || {
    commandName: 'getSimpleMsgs',
    accessLevel: config.accessLevels.anonymous,
  },
  simpleMsg: config.commands.simpleMsg || {
    commandName: 'simpleMsg',
    accessLevel: config.accessLevels.basic,
  },
  getGameCode: config.commands.getGameCode || {
    commandName: 'getGameCode',
    accessLevel: config.accessLevels.basic,
  },
  useGameCode: config.commands.useGameCode || {
    commandName: 'useGameCode',
    accessLevel: config.accessLevels.basic,
  },
  createGameCode: config.commands.createGameCode || {
    commandName: 'createameCode',
    accessLevel: config.accessLevels.basic,
  },
  signalBlock: config.commands.signalBlock || {
    commandName: 'signalBlock',
    accessLevel: config.accessLevels.basic,
  },
  updateId: config.commands.updateId || {
    commandName: 'updateId',
    accessLevel: config.accessLevels.basic,
  },
  verifyDevice: config.commands.verifyDevice || {
    commandName: 'verifyDevice',
    accessLevel: config.accessLevels.lowerAdmin,
  },
  getUserPositions: config.commands.getUserPositions || {
    commandName: 'getUserPosition',
    accessLevel: config.accessLevels.anonymous,
  },
  getCustomPositions: config.commands.getCustomPositions || {
    commandName: 'getCustomPositions',
    accessLevel: config.accessLevels.anonymous,
  },
  getSources: config.commands.getSources || {
    commandName: 'getSources',
    accessLevel: config.accessLevels.basic,
  },
  updateDeviceAlias: config.commands.updateDeviceAlias || {
    commandName: 'updateDeviceAlias',
    accessLevel: config.accessLevels.lowerAdmin,
  },
  listAliases: config.commands.listAliases || {
    commandName: 'listAliases',
    accessLevel: config.accessLevels.lowerAdmin,
  },
  createTimedEvent: config.commands.createTimedEvent || {
    commandName: 'createTimedEvent',
    accessLevel: config.accessLevels.privileged,
  },
};

config.apiCommands = {
  UnfollowRoom: config.apiCommands.UnfollowRoom || { accessLevel: config.accessLevels.lowerAdmin },
  FollowRoom: config.apiCommands.FollowRoom || { accessLevel: config.accessLevels.lowerAdmin },
  CancelCalibrationMission: config.apiCommands.FollowRoom || { accessLevel: config.accessLevels.lowerAdmin },
  CompleteCalibrationMission: config.apiCommands.FollowRoom || { accessLevel: config.accessLevels.lowerAdmin },
  SendBroadcast: config.apiCommands.SendBroadcast || { accessLevel: config.accessLevels.lowerAdmin },
  UpdateLanternRound: config.apiCommands.UpdateLanternRound || { accessLevel: config.accessLevels.lowerAdmin },
  CreateLanternRound: config.apiCommands.CreateLanternRound || { accessLevel: config.accessLevels.lowerAdmin },
  StartLanternRound: config.apiCommands.StartLanternRound || { accessLevel: config.accessLevels.lowerAdmin },
  CreateLanternStation: config.apiCommands.CreateLanternStation || { accessLevel: config.accessLevels.lowerAdmin },
  UpdateLanternStation: config.apiCommands.UpdateLanternStation || { accessLevel: config.accessLevels.lowerAdmin },
  CreateLanternTeam: config.apiCommands.CreateLanternTeam || { accessLevel: config.accessLevels.lowerAdmin },
  CreateUser: config.apiCommands.CreateUser || { accessLevel: config.accessLevels.lowerAdmin },
  CreateAlias: config.apiCommands.CreateAlias || { accessLevel: config.accessLevels.pro },
};

module.exports = config;
