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
const winston = require('winston');

let config = {};

try {
  config = require(path.normalize(`${__dirname}/../../../../config/databasePopulation`)).config; // eslint-disable-line import/no-unresolved, global-require, import/no-dynamic-require
} catch (err) {
  winston.info('Did not find modified dbConfig. Using defaults');
}

// To avoid undefined if rooms and commands haven't been changed
config.rooms = config.rooms || {};
config.commands = config.commands || {};
config.apiCommands = config.apiCommands || {};

config.AccessLevels = config.AccessLevels || {
  GOD: 13,
  SUPERUSER: 12,
  ADMIN: 11,
  LOWERADMIN: 9,
  PRIVILEGED: 6,
  PRO: 3,
  ADVANCED: 2,
  BASIC: 1,
  ANONYMOUS: 0,
};

config.systemUserName = 'SYSTEM';
config.anonymousUserName = 'ANONYMOUS';

/**
 * Rooms to be created on first run
 */
config.rooms = {
  // GeneralError chat room, available for every user
  public: config.rooms.public || {
    roomName: 'public',
    visibility: config.AccessLevels.ANONYMOUS,
    accessLevel: config.AccessLevels.ANONYMOUS,
    owner: config.systemUserName,
  },

  /**
   * Used to store messages labeled as broadcast.
   * Not used as an ordinary chat room
   */
  bcast: config.rooms.bcast || {
    roomName: 'broadcast',
    visibility: config.AccessLevels.SUPERUSER,
    accessLevel: config.AccessLevels.SUPERUSER,
    owner: config.systemUserName,
  },

  /**
   * Admin related messages will be sent here
   * E.g. when a user needs verification
   */
  admin: config.rooms.admin || {
    roomName: 'hqroom',
    visibility: config.AccessLevels.ADMIN,
    accessLevel: config.AccessLevels.ADMIN,
    owner: config.systemUserName,
  },

  /**
   * Blocking name for users
   * Not used as an ordinary chat room
   */
  team: config.rooms.team || {
    roomName: 'team',
    visibility: config.AccessLevels.SUPERUSER,
    accessLevel: config.AccessLevels.SUPERUSER,
    owner: config.systemUserName,
  },

  /**
   * Blocking name for users
   * Not used as an ordinary chat room
   */
  whisper: config.rooms.whisper || {
    roomName: 'whisper',
    visibility: config.AccessLevels.SUPERUSER,
    accessLevel: config.AccessLevels.SUPERUSER,
    owner: config.systemUserName,
  },

  anonymous: config.rooms.anonymous || {
    roomName: 'anonymous',
    visibility: config.AccessLevels.ANONYMOUS,
    accessLevel: config.AccessLevels.ANONYMOUS,
    anonymous: true,
    owner: config.systemUserName,
  },

  important: config.rooms.important || {
    roomName: 'important',
    visibility: config.AccessLevels.SUPERUSER,
    accessLevel: config.AccessLevels.SUPERUSER,
    owner: config.systemUserName,
  },

  news: config.rooms.news || {
    roomName: 'news',
    visibility: config.AccessLevels.SUPERUSER,
    accessLevel: config.AccessLevels.SUPERUSER,
    owner: config.systemUserName,
  },

  schedule: config.rooms.schedule || {
    roomName: 'schedule',
    visibility: config.AccessLevels.SUPERUSER,
    accessLevel: config.AccessLevels.SUPERUSER,
    owner: config.systemUserName,
  },

  user: config.rooms.user || {
    roomName: 'user',
    visibility: config.AccessLevels.SUPERUSER,
    accessLevel: config.AccessLevels.SUPERUSER,
    owner: config.systemUserName,
  },
};

config.anonymousUser = {
  userName: '',
  accessLevel: config.AccessLevels.ANONYMOUS,
  visibility: config.AccessLevels.ANONYMOUS,
  aliases: [],
  rooms: [],
  whisperRooms: [],
  isTracked: false,
  team: null,
  shortTeam: null,
};

config.requiredRooms = [
  config.rooms.anonymous,
  config.rooms.team.roomName,
  config.rooms.bcast.roomName,
  config.rooms.public.roomName,
  config.rooms.important.roomName,
  config.rooms.news.roomName,
  config.rooms.schedule.roomName,
  config.rooms.user.roomName,
];

config.protectedUserNames = [
  config.anonymousUserName.toLowerCase(),
  config.systemUserName.toLowerCase(),
  'superuser',
  'root',
  'admin',
];

config.commands = {
  help: config.commands.help || {
    commandName: 'help',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },
  clear: config.commands.clear || {
    commandName: 'clear',
    accessLevel: config.AccessLevels.BASIC,
  },
  whoami: config.commands.whoami || {
    commandName: 'whoami',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },
  chatMsg: config.commands.chatMsg || {
    commandName: 'chatMsg',
    accessLevel: config.AccessLevels.BASIC,
  },
  broadcast: config.commands.broadcast || {
    commandName: 'broadcast',
    accessLevel: config.AccessLevels.PRIVILEGED,
  },
  follow: config.commands.follow || {
    commandName: 'follow',
    accessLevel: config.AccessLevels.BASIC,
  },
  unfollow: config.commands.unfollow || {
    commandName: 'unfollow',
    accessLevel: config.AccessLevels.BASIC,
  },
  listUsers: config.commands.listUsers || {
    commandName: 'listUsers',
    accessLevel: config.AccessLevels.BASIC,
  },
  listRooms: config.commands.listRooms || {
    commandName: 'listRooms',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },
  listTeams: config.commands.listTeams || {
    commandName: 'listTeams',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },
  listDevices: config.commands.listDevices || {
    commandName: 'listDevices',
    accessLevel: config.AccessLevels.LOWERADMIN,
  },
  register: config.commands.register || {
    commandName: 'register',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },
  createRoom: config.commands.createRoom || {
    commandName: 'createRoom',
    accessLevel: config.AccessLevels.BASIC,
  },
  login: config.commands.login || {
    commandName: 'login',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },
  time: config.commands.time || {
    commandName: 'time',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },
  locate: config.commands.locate || {
    commandName: 'locate',
    accessLevel: config.AccessLevels.BASIC,
  },
  getHistory: config.commands.getHistory || {
    commandName: 'getHistory',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },
  password: config.commands.password || {
    commandName: 'password',
    accessLevel: config.AccessLevels.BASIC,
  },
  logout: config.commands.logout || {
    commandName: 'logout',
    accessLevel: config.AccessLevels.BASIC,
  },
  reboot: config.commands.reboot || {
    commandName: 'reboot',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },
  verifyUser: config.commands.verifyUser || {
    commandName: 'verifyUser',
    accessLevel: config.AccessLevels.ADMIN,
  },
  banUser: config.commands.banUser || {
    commandName: 'banUser',
    accessLevel: config.AccessLevels.ADMIN,
  },
  unbanUser: config.commands.unbanUser || {
    commandName: 'unbanUser',
    accessLevel: config.AccessLevels.ADMIN,
  },
  getBannedUsers: config.commands.getBannedUsers || {
    commandName: 'getBannedUsers',
    accessLevel: config.AccessLevels.LOWERADMIN,
  },
  whisper: config.commands.whisper || {
    commandName: 'whisper',
    accessLevel: config.AccessLevels.BASIC,
  },
  hackRoom: config.commands.hackRoom || {
    commandName: 'hackRoom',
    accessLevel: config.AccessLevels.ADVANCED,
  },
  hackLantern: config.commands.hackLantern || {
    commandName: 'hackLantern',
    accessLevel: config.AccessLevels.BASIC,
  },
  chipper: config.commands.chipper || {
    commandName: 'chipper',
    accessLevel: config.AccessLevels.ADVANCED,
    authGroup: 'hackers',
  },
  switchRoom: config.commands.switchRoom || {
    commandName: 'room',
    accessLevel: config.AccessLevels.BASIC,
  },
  removeRoom: config.commands.removeRoom || {
    commandName: 'removeRoom',
    accessLevel: config.AccessLevels.BASIC,
  },
  updateUser: config.commands.updateUser || {
    commandName: 'updateUser',
    accessLevel: config.AccessLevels.ADMIN,
  },
  updateCommand: config.commands.updateCommand || {
    commandName: 'updateCommand',
    accessLevel: config.AccessLevels.ADMIN,
  },
  weather: config.commands.weather || {
    commandName: 'weather',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },
  updateDevice: config.commands.updateDevice || {
    commandName: 'updateDevice',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },
  updateRoom: config.commands.updateRoom || {
    commandName: 'updateRoom',
    accessLevel: config.AccessLevels.ADMIN,
  },
  inviteTeam: config.commands.inviteTeam || {
    commandName: 'inviteTeam',
    accessLevel: config.AccessLevels.BASIC,
  },
  createTeam: config.commands.createTeam || {
    commandName: 'createTeam',
    accessLevel: config.AccessLevels.BASIC,
  },
  central: config.commands.central || {
    commandName: 'central',
    accessLevel: config.AccessLevels.GOD,
  },
  jobs: config.commands.jobs || {
    commandName: 'jobs',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },
  invitations: config.commands.invitations || {
    commandName: 'invitations',
    accessLevel: config.AccessLevels.BASIC,
  },
  inviteRoom: config.commands.inviteRoom || {
    commandName: 'inviteRoom',
    accessLevel: config.AccessLevels.BASIC,
  },
  createMission: config.commands.createMission || {
    commandName: 'createMission',
    accessLevel: config.AccessLevels.BASIC,
  },
  verifyTeam: config.commands.verifyTeam || {
    commandName: 'verifyTeam',
    accessLevel: config.AccessLevels.LOWERADMIN,
  },
  getPositions: config.commands.getPositions || {
    commandName: 'getPositions',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },
  docFiles: config.commands.docFiles || {
    commandName: 'docFiles',
    accessLevel: config.AccessLevels.BASIC,
  },
  leaveTeam: config.commands.leaveTeam || {
    commandName: 'leaveTeam',
    accessLevel: config.AccessLevels.BASIC,
  },
  createGameUser: config.commands.createGameUser || {
    commandName: 'createGameUser',
    accessLevel: config.AccessLevels.ADMIN,
  },
  createGameWord: config.commands.createGameWord || {
    commandName: 'createGameWord',
    accessLevel: config.AccessLevels.ADMIN,
  },
  rebootAll: config.commands.rebootAll || {
    commandName: 'rebootAll',
    accessLevel: config.AccessLevels.ADMIN,
  },
  getDocFiles: config.commands.getDocFiles || {
    commandName: 'getDocFiles',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },
  getDocFile: config.commands.getDocFile || {
    commandName: 'getDocFile',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },
  getRooms: config.commands.getRooms || {
    commandName: 'getRooms',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },
  updateUserPosition: config.commands.updateUserPosition || {
    commandName: 'updateUserPosition',
    accessLevel: config.AccessLevels.BASIC,
  },
  updateDevicePosition: config.commands.updateDevicePosition || {
    commandName: 'updateDevicePosition',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },
  createPosition: config.commands.createPosition || {
    commandName: 'createPosition',
    accessLevel: config.AccessLevels.BASIC,
  },
  getWallet: config.commands.getWallet || {
    commandName: 'getWallet',
    accessLevel: config.AccessLevels.BASIC,
  },
  calibrationMission: config.commands.calibrationMission || {
    commandName: 'calibrationMission',
    accessLevel: config.AccessLevels.BASIC,
  },
  updateCalibrationMission: config.commands.updateCalibrationMission || {
    commandName: 'updateCalibrationMission',
    accessLevel: config.AccessLevels.LOWERADMIN,
  },
  getTeam: config.commands.getTeam || {
    commandName: 'getTeam',
    accessLevel: config.AccessLevels.BASIC,
  },
  addAlias: config.commands.addAlias || {
    commandName: 'addAlias',
    accessLevel: config.AccessLevels.BASIC,
  },
  aliases: config.commands.aliases || {
    commandName: 'aliases',
    accessLevel: config.AccessLevels.BASIC,
  },
  getSimpleMsgs: config.commands.getSimpleMsgs || {
    commandName: 'getSimpleMsgs',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },
  simpleMsg: config.commands.simpleMsg || {
    commandName: 'simpleMsg',
    accessLevel: config.AccessLevels.BASIC,
  },
  getGameCode: config.commands.getGameCode || {
    commandName: 'getGameCode',
    accessLevel: config.AccessLevels.BASIC,
  },
  useGameCode: config.commands.useGameCode || {
    commandName: 'useGameCode',
    accessLevel: config.AccessLevels.BASIC,
  },
  createGameCode: config.commands.createGameCode || {
    commandName: 'createameCode',
    accessLevel: config.AccessLevels.BASIC,
  },
  signalBlock: config.commands.signalBlock || {
    commandName: 'signalBlock',
    accessLevel: config.AccessLevels.BASIC,
  },
  updateId: config.commands.updateId || {
    commandName: 'updateId',
    accessLevel: config.AccessLevels.BASIC,
  },
  verifyDevice: config.commands.verifyDevice || {
    commandName: 'verifyDevice',
    accessLevel: config.AccessLevels.LOWERADMIN,
  },
  getUserPositions: config.commands.getUserPositions || {
    commandName: 'getUserPosition',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },
  getCustomPositions: config.commands.getCustomPositions || {
    commandName: 'getCustomPositions',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },
  getSources: config.commands.getSources || {
    commandName: 'getSources',
    accessLevel: config.AccessLevels.BASIC,
  },
  updateDeviceAlias: config.commands.updateDeviceAlias || {
    commandName: 'updateDeviceAlias',
    accessLevel: config.AccessLevels.LOWERADMIN,
  },
  listAliases: config.commands.listAliases || {
    commandName: 'listAliases',
    accessLevel: config.AccessLevels.LOWERADMIN,
  },
  createTimedEvent: config.commands.createTimedEvent || {
    commandName: 'createTimedEvent',
    accessLevel: config.AccessLevels.PRIVILEGED,
  },
};

config.apiCommands = {
  SendMessage: config.apiCommands.SendMessage || {
    name: 'SendMessage',
    accessLevel: config.AccessLevels.BASIC,
  },
  SendBroadcast: config.apiCommands.SendBroadcast || {
    name: 'SendBroadcast',
    accessLevel: config.AccessLevels.LOWERADMIN,
  },
  GetHistory: config.apiCommands.GetHistory || {
    name: 'GetHistory',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },
  CreateDocFile: config.apiCommands.CreateDocFile || {
    name: 'CreateDocFile',
    accessLevel: config.AccessLevels.BASIC,
  },
  GetDocFile: config.apiCommands.GetDocFile || {
    name: 'GetDocFile',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },
  CreateUser: config.apiCommands.CreateUser || {
    name: 'CreateUser',
    accessLevel: config.AccessLevels.LOWERADMIN,
  },
  ChangeUserLevels: config.apiCommands.ChangeUserLevels || {
    name: 'ChangeUserLevels',
    accessLevel: config.AccessLevels.ADMIN,
  },
  GetUser: config.apiCommands.GetUser || {
    name: 'GetUser',
    accessLevel: config.AccessLevels.BASIC,
  },
  RequestPasswordReset: config.apiCommands.RequestPasswordReset || {
    name: 'RequestPasswordReset',
    accessLevel: config.AccessLevels.BASIC,
  },
  CreateAlias: config.apiCommands.CreateAlias || {
    name: 'CreateAlias',
    accessLevel: config.AccessLevels.ADVANCED,
  },
  GetAliases: config.apiCommands.GetAliases || {
    name: 'GetAliases',
    accessLevel: config.AccessLevels.ADVANCED,
  },
  CreateLanternRound: config.apiCommands.CreateLanternRound || {
    name: 'CreateLanternRound',
    accessLevel: config.AccessLevels.LOWERADMIN,
  },
  UpdateLanternRound: config.apiCommands.UpdateLanternRound || {
    name: 'UpdateLanternRound',
    accessLevel: config.AccessLevels.LOWERADMIN,
  },
  GetLanternRound: config.apiCommands.GetLanternRound || {
    name: 'GetLanternRound',
    accessLevel: config.AccessLevels.LOWERADMIN,
  },
  GetActiveLanternRound: config.apiCommands.GetActiveLanternRound || {
    name: 'GetActiveLanternRound',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },
  StartLanternRound: config.apiCommands.StartLanternRound || {
    name: 'StartLanternRound',
    accessLevel: config.AccessLevels.LOWERADMIN,
  },
  EndLanternRound: config.apiCommands.EndLanternRound || {
    name: 'EndLanternRound',
    accessLevel: config.AccessLevels.LOWERADMIN,
  },
  GetCalibrationMission: config.apiCommands.GetCalibrationMission || {
    name: 'GetCalibrationMission',
    accessLevel: config.AccessLevels.BASIC,
  },
  CancelCalibrationMission: config.apiCommands.CancelCalibrationMission || {
    name: 'CancelCalibrationMission',
    accessLevel: config.AccessLevels.LOWERADMIN,
  },
  CompleteCalibrationMission: config.apiCommands.CompleteCalibrationMission || {
    name: 'CompleteCalibrationMission',
    accessLevel: config.AccessLevels.LOWERADMIN,
  },
  CreateLanternStation: config.apiCommands.CreateLanternStation || {
    name: 'CreateLanternStation',
    accessLevel: config.AccessLevels.LOWERADMIN,
  },
  UpdateLanternStation: config.apiCommands.UpdateLanternStation || {
    name: 'UpdateLanternStation',
    accessLevel: config.AccessLevels.LOWERADMIN,
  },
  GetLanternStations: config.apiCommands.GetLanternStations || {
    name: 'GetLanternStations',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },
  CreateLanternTeam: config.apiCommands.CreateLanternTeam || {
    name: 'CreateLanternTeam',
    accessLevel: config.AccessLevels.LOWERADMIN,
  },
  GetLanternTeam: config.apiCommands.GetLanternTeam || {
    name: 'GetLanternTeam',
    accessLevel: config.AccessLevels.BASIC,
  },
  CreateTransaction: config.apiCommands.CreateTransaction || {
    name: 'CreateTransaction',
    accessLevel: config.AccessLevels.BASIC,
  },
  GetTransaction: config.apiCommands.GetTransaction || {
    name: 'GetTransaction',
    accessLevel: config.AccessLevels.BASIC,
  },
  FollowRoom: config.apiCommands.FollowRoom || {
    name: 'FollowRoom',
    accessLevel: config.AccessLevels.BASIC,
  },
  UnfollowRoom: config.apiCommands.UnfollowRoom || {
    name: 'UnfollowRoom',
    accessLevel: config.AccessLevels.BASIC,
  },
  CreateRoom: config.apiCommands.CreateRoom || {
    name: 'CreateRoom',
    accessLevel: config.AccessLevels.BASIC,
  },
  GetRoom: config.apiCommands.GetRoom || {
    name: 'GetRoom',
    accessLevel: config.AccessLevels.BASIC,
  },
  GetUserPosition: config.apiCommands.GetUserPosition || {
    name: 'GetUserPosition',
    accessLevel: config.AccessLevels.BASIC,
  },
  UpdateUserPosition: config.apiCommands.UpdateUserPosition || {
    name: 'UpdateUserPosition',
    accessLevel: config.AccessLevels.BASIC,
  },
  GetWallet: config.apiCommands.GetWallet || {
    name: 'GetWallet',
    accessLevel: config.AccessLevels.BASIC,
  },
  IncreaseWalletAmount: config.apiCommands.IncreaseWalletAmount || {
    name: 'IncreaseWalletAmount',
    accessLevel: config.AccessLevels.LOWERADMIN,
  },
  DecreaseWalletAmount: config.apiCommands.DecreaseWalletAmount || {
    name: 'DecreaseWalletAmount',
    accessLevel: config.AccessLevels.LOWERADMIN,
  },
  GetTeam: config.apiCommands.GetTeam || {
    name: 'GetTeam',
    accessLevel: config.AccessLevels.PRIVILEGED,
  },
  GetTeams: config.apiCommands.GetTeams || {
    name: 'GetTeams',
    accessLevel: config.AccessLevels.PRIVILEGED,
  },
  CreateTeam: config.apiCommands.CreateTeam || {
    name: 'CreateTeam',
    accessLevel: config.AccessLevels.BASIC,
  },
  InviteToTeam: config.apiCommands.InviteToTeam || {
    name: 'InviteToTeam',
    accessLevel: config.AccessLevels.BASIC,
  },
};

module.exports = config;
