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

let config = {};

try {
  config = require(path.normalize(`${__dirname}/../../../../config/databasePopulation`)).config; // eslint-disable-line import/no-unresolved, global-require, import/no-dynamic-require, prefer-destructuring
} catch (err) {
  console.log('Did not find modified dbConfig. Using defaults');
}

config.rooms = config.rooms || {};
config.users = config.users || {};
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

config.users = {
  systemUser: {
    userId: 'config-user-system',
    username: 'system',
  },
  anonymous: {
    username: 'anonymous',
    userId: 'config-user-anonymous',
  },
};

/**
 * Rooms to be created on first run
 */
config.rooms = {
  // GeneralError chat room, available for every user
  public: config.rooms.public || {
    roomName: 'public',
    visibility: config.AccessLevels.ANONYMOUS,
    accessLevel: config.AccessLevels.ANONYMOUS,
    ownerId: config.users.systemUser.userId,
    lockedName: true,
  },

  /**
   * Used to store messages labeled as broadcast.
   * Not used as an ordinary chat room
   */
  bcast: config.rooms.bcast || {
    roomName: 'broadcasts',
    visibility: config.AccessLevels.SUPERUSER,
    accessLevel: config.AccessLevels.SUPERUSER,
    ownerId: config.users.systemUser.userId,
    lockedName: true,
  },

  /**
   * Admin related messages will be sent here
   * E.g. when a user needs verification
   */
  admin: config.rooms.admin || {
    roomName: 'hq',
    visibility: config.AccessLevels.ADMIN,
    accessLevel: config.AccessLevels.ADMIN,
    ownerId: config.users.systemUser.userId,
    lockedName: true,
  },

  anonymous: config.rooms.anonymous || {
    roomName: 'anonymous',
    visibility: config.AccessLevels.ANONYMOUS,
    accessLevel: config.AccessLevels.ANONYMOUS,
    isAnonymous: true,
    ownerId: config.users.systemUser.userId,
    lockedName: true,
  },

  important: config.rooms.important || {
    roomName: 'important-room',
    visibility: config.AccessLevels.SUPERUSER,
    accessLevel: config.AccessLevels.SUPERUSER,
    ownerId: config.users.systemUser.userId,
    lockedName: true,
  },

  news: config.rooms.news || {
    roomName: 'news',
    visibility: config.AccessLevels.SUPERUSER,
    accessLevel: config.AccessLevels.SUPERUSER,
    ownerId: config.users.systemUser.userId,
    lockedName: true,
  },

  schedule: config.rooms.schedule || {
    roomName: 'schedule-room',
    visibility: config.AccessLevels.SUPERUSER,
    accessLevel: config.AccessLevels.SUPERUSER,
    ownerId: config.users.systemUser.userId,
    lockedName: true,
  },
};

config.defaultRoom = config.rooms.public;

config.anonymousUser = {
  username: '',
  accessLevel: config.AccessLevels.ANONYMOUS,
  visibility: config.AccessLevels.ANONYMOUS,
  roomIds: [
    config.rooms.anonymous.roomId,
    config.rooms.bcast.roomId,
    config.rooms.public.roomId,
    config.rooms.important.roomId,
    config.rooms.news.roomId,
    config.rooms.schedule.roomId,
  ],
  isAnonymous: true,
};

config.requiredRooms = [
  config.rooms.anonymous.roomName,
  config.rooms.bcast.roomName,
  config.rooms.public.roomName,
  config.rooms.important.roomName,
  config.rooms.news.roomName,
  config.rooms.schedule.roomName,
];

config.protectedNames = [
  config.users.systemUser.username,
  config.users.anonymous.username,
];

config.roomsToBeHidden = [
  config.rooms.bcast.roomName,
  config.rooms.important.roomName,
  config.rooms.news.roomName,
  config.rooms.schedule.roomName,
];

config.DeviceTypes = {
  USERDEVICE: 'userDevice',
  GPS: 'gps',
  CUSTOM: 'custom',
};

config.GameCodeTypes = {
  TRANSACTION: 'transaction',
  DOCFILE: 'docfile',
  TEXT: 'text',
};

config.InvitationTypes = {
  TEAM: 'team',
};

config.MessageTypes = {
  CHAT: 'chat',
  WHISPER: 'whisper',
  BROADCAST: 'broadcast',
};

config.PositionTypes = {
  USER: 'user',
  WORLD: 'world',
};

config.ChangeTypes = {
  UPDATE: 'update',
  CREATE: 'create',
  REMOVE: 'remove',
  ACCESS: 'access',
};

config.EmitTypes = {
  FORUM: 'forum',
  FORUMTHREAD: 'forumThread',
  FORUMPOST: 'forumPost',
  FOLLOW: 'follow',
  USER: 'user',
  CHATMSG: 'chatMsg',
  DEVICE: 'device',
  DOCFILE: 'docFile',
  WHISPER: 'whisper',
  BROADCAST: 'broadcast',
  GAMECODE: 'gameCode',
  ALIAS: 'alias',
  POSITION: 'position',
};

config.apiCommands = {
  /**
   * Message
   */
  SendMessage: config.apiCommands.SendMessage || {
    name: 'SendMessage',
    accessLevel: config.AccessLevels.BASIC,
  },
  SendWhisper: config.apiCommands.SendWhisper || {
    name: 'SendWhisper',
    accessLevel: config.AccessLevels.BASIC,
  },
  GetHistory: config.apiCommands.GetHistory || {
    name: 'GetHistory',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },
  RemoveMessage: config.apiCommands.RemoveMessage || {
    name: 'RemoveMessage',
    selfAccessLevel: config.AccessLevels.BASIC,
    accessLevel: config.AccessLevels.LOWERADMIN,
  },

  /**
   * Broadcast
   */
  SendBroadcast: config.apiCommands.SendBroadcast || {
    name: 'SendBroadcast',
    accessLevel: config.AccessLevels.LOWERADMIN,
  },
  GetBroadcasts: config.apiCommands.GetBroadcasts || {
    name: 'GetBroadcasts',
    accessLevel: config.AccessLevels.BASIC,
  },

  /**
   * Room
   */
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
  FollowWhisperRoom: config.apiCommands.FollowWhisperRoom || {
    name: 'FollowWhisperRoom',
    accessLevel: config.AccessLevels.GOD,
    selfAccessLevel: config.AccessLevels.BASIC,
  },
  IsRoomFollowed: config.apiCommands.IsRoomFollowed || {
    name: 'IsRoomFollowed',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },
  UpdateRoom: config.apiCommands.UpdateRoom || {
    name: 'UpdateRoom',
    accessLevel: config.AccessLevels.BASIC,
  },

  /**
   * Alias
   */
  CreateAlias: config.apiCommands.CreateAlias || {
    name: 'CreateAlias',
    accessLevel: config.AccessLevels.LOWERADMIN,
    selfAccessLevel: config.AccessLevels.BASIC,
  },
  GetAliases: config.apiCommands.GetAliases || {
    name: 'GetAliases',
    accessLevel: config.AccessLevels.LOWERADMIN,
    selfAccessLevel: config.AccessLevels.BASIC,
  },
  UpdateAlias: config.apiCommands.UpdateAlias || {
    name: 'UpdateAlias',
    accessLevel: config.AccessLevels.LOWERADMIN,
    selfAccessLevel: config.AccessLevels.BASIC,
  },
  RemoveAlias: config.apiCommands.RemoveAlias || {
    name: 'RemoveAlias',
    accessLevel: config.AccessLevels.LOWERADMIN,
    selfAccessLevel: config.AccessLevels.BASIC,
  },

  /**
   * Transaction
   */
  CreateTransaction: config.apiCommands.CreateTransaction || {
    name: 'CreateTransaction',
    accessLevel: config.AccessLevels.BASIC,
  },
  GetTransaction: config.apiCommands.GetTransaction || {
    name: 'GetTransaction',
    accessLevel: config.AccessLevels.LOWERADMIN,
    selfAccessLevel: config.AccessLevels.BASIC,
  },

  /**
   * Wallet
   */
  IncreaseWalletAmount: config.apiCommands.IncreaseWalletAmount || {
    name: 'IncreaseWalletAmount',
    accessLevel: config.AccessLevels.LOWERADMIN,
  },
  DecreaseWalletAmount: config.apiCommands.DecreaseWalletAmount || {
    name: 'DecreaseWalletAmount',
    accessLevel: config.AccessLevels.LOWERADMIN,
  },
  GetWallet: config.apiCommands.GetWallet || {
    name: 'GetWallet',
    accessLevel: config.AccessLevels.LOWERADMIN,
    selfAccessLevel: config.AccessLevels.BASIC,
  },

  /**
   * User
   */
  CreateUser: config.apiCommands.CreateUser || {
    name: 'CreateUser',
    accessLevel: config.AccessLevels.LOWERADMIN,
  },
  CreateUserThroughSocket: config.apiCommands.CreateUserThroughSocket || {
    name: 'CreateUserThroughSocket',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },
  BanUser: config.apiCommands.BanUser || {
    name: 'BanUser',
    accessLevel: config.AccessLevels.LOWERADMIN,
  },
  VerifyUser: config.apiCommands.VerifyUser || {
    name: 'VerifyUser',
    accessLevel: config.AccessLevels.LOWERADMIN,
  },
  UpdateId: config.apiCommands.UpdateId || {
    name: 'UpdateId',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },
  Logout: config.apiCommands.Logout || {
    name: 'Logout',
    accessLevel: config.AccessLevels.BASIC,
  },
  SetFullAccess: config.apiCommands.SetFullAccess || {
    name: 'SetFullAccess',
    accessLevel: config.AccessLevels.ADMIN,
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
  GetInactiveUsers: config.apiCommands.GetInactiveUsers || {
    name: 'GetInactiveUsers',
    accessLevel: config.AccessLevels.LOWERADMIN,
  },

  /**
   * Mail
   */
  AddBlockedMail: config.apiCommands.AddBlockedMail || {
    name: 'AddBlockedMail',
    accessLevel: config.AccessLevels.LOWERADMIN,
  },
  RequestPasswordReset: config.apiCommands.RequestPasswordReset || {
    name: 'RequestPasswordReset',
    accessLevel: config.AccessLevels.BASIC,
  },

  /**
   * Utilities
   */
  RebootAll: config.apiCommands.RebootAll || {
    name: 'RebootAll',
    accessLevel: config.AccessLevels.ADMIN,
  },
  GetAll: config.apiCommands.GetAll || {
    name: 'GetAll',
    accessLevel: config.AccessLevels.LOWERADMIN,
  },

  /**
   * Team
   */
  CreateTeam: config.apiCommands.CreateTeam || {
    name: 'CreateTeam',
    accessLevel: config.AccessLevels.BASIC,
  },
  GetTeam: config.apiCommands.GetTeam || {
    name: 'GetTeam',
    accessLevel: config.AccessLevels.PRIVILEGED,
  },
  GetTeams: config.apiCommands.GetTeams || {
    name: 'GetTeams',
    accessLevel: config.AccessLevels.BASIC,
  },
  LeaveTeam: config.apiCommands.LeaveTeam || {
    name: 'LeaveTeam',
    accessLevel: config.AccessLevels.BASIC,
  },

  /**
   * Forum
   */
  CreateForum: config.apiCommands.CreateForum || {
    name: 'CreateForum',
    accessLevel: config.AccessLevels.ADMIN,
  },
  GetForum: config.apiCommands.GetForum || {
    name: 'GetForum',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },
  RemoveForum: config.apiCommands.RemoveForum || {
    name: 'RemoveForum',
    accessLevel: config.AccessLevels.ADMIN,
  },

  /**
   * Forum Post
   */
  CreateForumPost: config.apiCommands.CreateForumPost || {
    name: 'CreateForumPost',
    accessLevel: config.AccessLevels.BASIC,
  },
  GetForumPost: config.apiCommands.GetForumPost || {
    name: 'GetForumPost',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },
  UpdateForumPost: config.apiCommands.UpdateForumPost || {
    name: 'UpdateForumPost',
    accessLevel: config.AccessLevels.ADMIN,
    selfAccessLevel: config.AccessLevels.BASIC,
  },
  RemoveForumPost: config.apiCommands.RemoveForumPost || {
    name: 'RemoveForumPost',
    accessLevel: config.AccessLevels.ADMIN,
    selfAccessLevel: config.AccessLevels.BASIC,
  },

  /**
   * Forum Thread
   */
  CreateForumThread: config.apiCommands.CreateForumThread || {
    name: 'CreateForumThread',
    accessLevel: config.AccessLevels.BASIC,
  },
  GetForumThread: config.apiCommands.GetForumThread || {
    name: 'GetForumThread',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },
  UpdateForumThread: config.apiCommands.UpdateForumThread || {
    name: 'UpdateForumThread',
    accessLevel: config.AccessLevels.ADMIN,
    selfAccessLevel: config.AccessLevels.BASIC,
  },
  RemoveForumThread: config.apiCommands.RemoveForumThread || {
    name: 'RemoveForumThread',
    accessLevel: config.AccessLevels.ADMIN,
    selfAccessLevel: config.AccessLevels.BASIC,
  },

  /**
   * Device
   */
  CreateDevice: config.apiCommands.CreateDevice || {
    name: 'CreateDevice',
    accessLevel: config.AccessLevels.ADVANCED,
  },
  UpdateDevice: config.apiCommands.UpdateDevice || {
    name: 'UpdateDevice',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },
  UpdateDeviceName: config.apiCommands.UpdateDeviceName || {
    name: 'UpdateDeviceName',
    accessLevel: config.AccessLevels.LOWERADMIN,
  },
  GetDevices: config.apiCommands.GetDevices || {
    name: 'GetDevices',
    accessLevel: config.AccessLevels.BASIC,
  },

  /**
   * Doc File
   */
  CreateDocFile: config.apiCommands.CreateDocFile || {
    name: 'CreateDocFile',
    accessLevel: config.AccessLevels.BASIC,
  },
  RemoveDocFile: config.apiCommands.RemoveDocFile || {
    name: 'RemoveDocFile',
    accessLevel: config.AccessLevels.LOWERADMIN,
    selfAccessLevel: config.AccessLevels.BASIC,
  },
  GetDocFile: config.apiCommands.GetDocFile || {
    name: 'GetDocFile',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },

  /**
   * Simple msg
   */
  SendSimpleMsg: config.apiCommands.SendSimpleMsg || {
    name: 'SendSimpleMsg',
    accessLevel: config.AccessLevels.BASIC,
  },
  GetSimpleMsgs: config.apiCommands.GetSimpleMsgs || {
    name: 'GetSimpleMsgs',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },

  /**
   * Game code
   */
  CreateGameCode: config.apiCommands.CreateGameCode || {
    name: 'CreateGameCode',
    selfAccessLevel: config.AccessLevels.BASIC,
    accessLevel: config.AccessLevels.LOWERADMIN,
  },
  UseGameCode: config.apiCommands.UseGameCode || {
    name: 'UseGameCode',
    accessLevel: config.AccessLevels.BASIC,
  },
  GetGameCode: config.apiCommands.GetGameCode || {
    name: 'GetGameCode',
    accessLevel: config.AccessLevels.LOWERADMIN,
    selfAccessLevel: config.AccessLevels.BASIC,
  },
  RemoveGameCode: config.apiCommands.RemoveGameCode || {
    name: 'RemoveGameCode',
    accessLevel: config.AccessLevels.LOWERADMIN,
    selfAccessLevel: config.AccessLevels.BASIC,
  },

  /**
   * Position
   */
  CreatePosition: config.apiCommands.CreatePosition || {
    name: 'CreatePosition',
    accessLevel: config.AccessLevels.LOWERADMIN,
    selfAccessLevel: config.AccessLevels.BASIC,
  },
  GetPositions: config.apiCommands.GetPositions || {
    name: 'GetPositions',
    accessLevel: config.AccessLevels.LOWERADMIN,
    selfAccessLevel: config.AccessLevels.BASIC,
  },
  GetUserPosition: config.apiCommands.GetUserPosition || {
    name: 'GetUserPosition',
    accessLevel: config.AccessLevels.LOWERADMIN,
    selfAccessLevel: config.AccessLevels.BASIC,
  },
  UpdatePosition: config.apiCommands.UpdatePosition || {
    name: 'UpdatePosition',
    accessLevel: config.AccessLevels.LOWERADMIN,
    selfAccessLevel: config.AccessLevels.BASIC,
  },
  UpdatePositionCoordinates: config.apiCommands.UpdatePositionCoordinates || {
    name: 'UpdatePositionCoordinates',
    accessLevel: config.AccessLevels.LOWERADMIN,
    selfAccessLevel: config.AccessLevels.BASIC,
  },

  /**
   * Invitation
   */
  InviteToTeam: config.apiCommands.InviteToTeam || {
    name: 'InviteToTeam',
    accessLevel: config.AccessLevels.BASIC,
  },
  AcceptInvitation: config.apiCommands.AcceptInvitation || {
    name: 'AcceptInvitation',
    accessLevel: config.AccessLevels.BASIC,
  },
  DeclineInvitation: config.apiCommands.DeclineInvitation || {
    name: 'DeclineInvitation',
    accessLevel: config.AccessLevels.BASIC,
  },
  GetInvitations: config.apiCommands.GetInvitations || {
    name: 'GetInvitations',
    accessLevel: config.AccessLevels.BASIC,
  },

  /**
   * Game item
   */
  CreateGameItems: config.apiCommands.CreateGameItems || {
    name: 'CreateGameItems',
    accessLevel: config.AccessLevels.LOWERADMIN,
  },
  GetGameItems: config.apiCommands.GetGameItems || {
    name: 'GetGameItems',
    accessLevel: config.AccessLevels.LOWERADMIN,
  },
  RemoveGameItem: config.apiCommands.RemoveGameItem || {
    name: 'RemoveGameItem',
    accessLevel: config.AccessLevels.LOWERADMIN,
  },

  /**
   * Lantern station
   */
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
  DeleteLanternStation: config.apiCommands.DeleteLanternStation || {
    name: 'DeleteLanternStation',
    accessLevel: config.AccessLevels.LOWERADMIN,
  },

  /**
   * Lantern Team
   */
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

  /**
   * Hack Lantern
   */
  HackLantern: config.apiCommands.HackLantern || {
    name: 'HackLantern',
    accessLevel: config.AccessLevels.BASIC,
  },

  /**
   * Lantern round
   */
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

  /**
   * Calibration mission
   */
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
};

module.exports = config;
