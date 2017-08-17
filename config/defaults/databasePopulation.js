/*
 Copyright 2017 Aleksandar Jankovic

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
  isAnonymous: true,
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

config.protectedNames = [
  config.anonymousUserName.toLowerCase(),
  config.systemUserName.toLowerCase(),
  'superuser',
  'root',
  'admin',
  'position',
  'positions',
  'active',
  'messages',
  'end',
  'unverified',
  'verify',
  'verified',
  'ban',
  'banned',
  'alias',
  'aliases',
];

config.roomsToBeHidden = [
  config.rooms.bcast.roomName,
  config.rooms.important.roomName,
  config.rooms.news.roomName,
  config.rooms.schedule.roomName,
  config.rooms.user.roomName,
];

config.GameCodeTypes = {
  LOOT: 'loot',
  PROFILE: 'profile',
};

config.apiCommands = {
  LeaveTeam: config.apiCommands.LeaveTeam || {
    name: 'LeaveTeam',
    accessLevel: config.AccessLevels.BASIC,
  },
  SendMessage: config.apiCommands.SendMessage || {
    name: 'SendMessage',
    accessLevel: config.AccessLevels.BASIC,
  },
  SendBroadcast: config.apiCommands.SendBroadcast || {
    name: 'SendBroadcast',
    accessLevel: config.AccessLevels.LOWERADMIN,
  },
  GetBroadcasts: config.apiCommands.GetBroadcasts || {
    name: 'GetBroadcasts',
    accessLevel: config.AccessLevels.LOWERADMIN,
  },
  SendWhisper: config.apiCommands.SendWhisper || {
    name: 'SendWhisper',
    accessLevel: config.AccessLevels.BASIC,
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
  CreateUserThroughSocket: config.apiCommands.CreateUserThroughSocket || {
    name: 'CreateUserThroughSocket',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },
  ChangeUserLevels: config.apiCommands.ChangeUserLevels || {
    name: 'ChangeUserLevels',
    accessLevel: config.AccessLevels.ADMIN,
  },
  GetUser: config.apiCommands.GetUser || {
    name: 'GetUser',
    accessLevel: config.AccessLevels.LOWERADMIN,
    selfAccessLevel: config.AccessLevels.BASIC,
  },
  GetUsers: config.apiCommands.GetUsers || {
    name: 'GetUsers',
    accessLevel: config.AccessLevels.BASIC,
  },
  GetUserDetails: config.apiCommands.GetUserDetails || {
    name: 'GetUserDetails',
    accessLevel: config.AccessLevels.LOWERADMIN,
  },
  RequestPasswordReset: config.apiCommands.RequestPasswordReset || {
    name: 'RequestPasswordReset',
    accessLevel: config.AccessLevels.BASIC,
  },
  CreateAlias: config.apiCommands.CreateAlias || {
    name: 'CreateAlias',
    accessLevel: config.AccessLevels.LOWERADMIN,
    selfAccessLevel: config.AccessLevels.BASIC,
  },
  GetAliases: config.apiCommands.GetAliases || {
    name: 'GetAliases',
    accessLevel: config.AccessLevels.ADVANCED,
    selfAccessLevel: config.AccessLevels.BASIC,
  },
  GetAllAliases: config.apiCommands.GetAllAliases || {
    name: 'GetAllAliases',
    accessLevel: config.AccessLevels.BASIC,
  },
  GetInactiveUsers: config.apiCommands.GetInactiveUsers || {
    name: 'GetInactiveUsers',
    accessLevel: config.AccessLevels.LOWERADMIN,
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
    accessLevel: config.AccessLevels.ANONYMOUS,
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
    accessLevel: config.AccessLevels.LOWERADMIN,
  },
  GetCalibrationMissions: config.apiCommands.GetCalibrationMissions || {
    name: 'GetCalibrationMissions',
    accessLevel: config.AccessLevels.LOWERADMIN,
    selfAccessLevel: config.AccessLevels.BASIC,
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
  DeleteLanternTeam: config.apiCommands.DeleteLanternTeam || {
    name: 'DeleteLanternTeam',
    accessLevel: config.AccessLevels.LOWERADMIN,
  },
  CreateTransaction: config.apiCommands.CreateTransaction || {
    name: 'CreateTransaction',
    accessLevel: config.AccessLevels.BASIC,
  },
  GetTransaction: config.apiCommands.GetTransaction || {
    name: 'GetTransaction',
    accessLevel: config.AccessLevels.LOWERADMIN,
    selfAccessLevel: config.AccessLevels.BASIC,
  },
  FollowRoom: config.apiCommands.FollowRoom || {
    name: 'FollowRoom',
    accessLevel: config.AccessLevels.LOWERADMIN,
    selfAccessLevel: config.AccessLevels.BASIC,
  },
  UnfollowRoom: config.apiCommands.UnfollowRoom || {
    name: 'UnfollowRoom',
    accessLevel: config.AccessLevels.LOWERADMIN,
    selfAccessLevel: config.AccessLevels.BASIC,
  },
  CreateRoom: config.apiCommands.CreateRoom || {
    name: 'CreateRoom',
    accessLevel: config.AccessLevels.BASIC,
  },
  GetRoom: config.apiCommands.GetRoom || {
    name: 'GetRoom',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },
  RemoveRoom: config.apiCommands.RemoveRoom || {
    name: 'RemoveRoom',
    accessLevel: config.AccessLevels.LOWERADMIN,
    selfAccessLevel: config.AccessLevels.BASIC,
  },
  IsRoomFollowed: config.apiCommands.IsRoomFollowed || {
    name: 'IsRoomFollowed',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },
  GetUserPosition: config.apiCommands.GetUserPosition || {
    name: 'GetUserPosition',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },
  UpdateUserPosition: config.apiCommands.UpdateUserPosition || {
    name: 'UpdateUserPosition',
    accessLevel: config.AccessLevels.BASIC,
  },
  UpdatePosition: config.apiCommands.UpdatePosition || {
    name: 'UpdatePosition',
    accessLevel: config.AccessLevels.BASIC,
  },
  GetWallet: config.apiCommands.GetWallet || {
    name: 'GetWallet',
    accessLevel: config.AccessLevels.LOWERADMIN,
    selfAccessLevel: config.AccessLevels.BASIC,
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
    accessLevel: config.AccessLevels.BASIC,
  },
  CreateTeam: config.apiCommands.CreateTeam || {
    name: 'CreateTeam',
    accessLevel: config.AccessLevels.BASIC,
  },
  InviteToTeam: config.apiCommands.InviteToTeam || {
    name: 'InviteToTeam',
    accessLevel: config.AccessLevels.BASIC,
  },
  GetDevices: config.apiCommands.GetDevices || {
    name: 'GetDevices',
    accessLevel: config.AccessLevels.LOWERADMIN,
  },
  UpdateDevice: config.apiCommands.UpdateDevice || {
    name: 'UpdateDevice',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },
  UpdateDeviceAlias: config.apiCommands.UpdateDeviceAlias || {
    name: 'UpdateDeviceAlias',
    accessLevel: config.AccessLevels.LOWERADMIN,
  },
  CreateSignalBlock: config.apiCommands.CreateSignalBlock || {
    name: 'CreateSignalBlock',
    accessLevel: config.AccessLevels.PRO,
  },
  AcceptInvitation: config.apiCommands.AcceptInvitation || {
    name: 'AcceptInvitation',
    accessLevel: config.AccessLevels.BASIC,
  },
  GetInvitations: config.apiCommands.GetInvitations || {
    name: 'GetInvitations',
    accessLevel: config.AccessLevels.BASIC,
  },
  UpdateId: config.apiCommands.UpdateId || {
    name: 'UpdateId',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },
  Logout: config.apiCommands.Logout || {
    name: 'Login',
    accessLevel: config.AccessLevels.BASIC,
  },
  GetPositions: config.apiCommands.GetPositions || {
    name: 'GetPositions',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },
  RebootAll: config.apiCommands.RebootAll || {
    name: 'RebootAll',
    accessLevel: config.AccessLevels.ADMIN,
  },
  GetGameCode: config.apiCommands.GetGameCode || {
    name: 'GetGameCode',
    accessLevel: config.AccessLevels.ADMIN,
    selfAccessLevel: config.AccessLevels.BASIC,
  },
  CreateGameCode: config.apiCommands.CreateGameCode || {
    name: 'CreateGameCode',
    selfAccessLevel: config.AccessLevels.BASIC,
    accessLevel: config.AccessLevels.LOWERADMIN,
  },
  UseGameCode: config.apiCommands.UseGameCode || {
    name: 'UseGameCode',
    accessLevel: config.AccessLevels.BASIC,
  },
  HackLantern: config.apiCommands.HackLantern || {
    name: 'HackLantern',
    accessLevel: config.AccessLevels.BASIC,
  },
  BanUser: config.apiCommands || {
    name: 'BanUser',
    accessLevel: config.AccessLevels.LOWERADMIN,
  },
  SendSimpleMsg: config.apiCommands.SendSimpleMsg || {
    name: 'SendSimpleMsg',
    accessLevel: config.AccessLevels.BASIC,
  },
  GetSimpleMsgs: config.apiCommands.GetSimpleMsgs || {
    name: 'GetSimpleMsgs',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },
  FollowWhisperRoom: config.apiCommands.FollowWhisperRoom || {
    name: 'FollowWhisperRoom',
    accessLevel: config.AccessLevels.GOD,
    selfAccessLevel: config.AccessLevels.BASIC,
  },
  DeclineInvitation: config.apiCommands.DeclineInvitation || {
    name: 'DeclineInvitation',
    accessLevel: config.AccessLevels.BASIC,
  },
  CreateGameItems: config.apiCommands.CreateGameItems || {
    name: 'CreateGameItems',
    accessLevel: config.AccessLevels.LOWERADMIN,
  },
  GetGameItems: config.apiCommands.GetGameItems || {
    name: 'GetGameItems',
    accessLevel: config.AccessLevels.LOWERADMIN,
  },
  AddBlockedMail: config.apiCommands.AddBlockedMail || {
    name: 'AddBlockedMail',
    accessLevel: config.AccessLevels.ADMIN,
  }
};

module.exports = config;
