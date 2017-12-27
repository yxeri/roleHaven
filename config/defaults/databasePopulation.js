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
  GOD: 6,
  SUPERUSER: 5,
  ADMIN: 4,
  MODERATOR: 3,
  PRIVILEGED: 2,
  STANDARD: 1,
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
 * Default rooms
 */
config.rooms = {
  /**
   * Public is followed by all users.
   * It is also reachable by anonymous users.
   */
  public: config.rooms.public || {
    roomId: 'public',
    roomName: 'public',
    visibility: config.AccessLevels.ANONYMOUS,
    accessLevel: config.AccessLevels.ANONYMOUS,
    ownerId: config.users.systemUser.userId,
    lockedName: true,
    isSystemRoom: true,
  },

  /**
   * Admin related messages will be sent here.
   * E.g. when a user needs verification.
   */
  admin: config.rooms.admin || {
    roomId: 'hqroom',
    roomName: 'hqroom',
    visibility: config.AccessLevels.MODERATOR,
    accessLevel: config.AccessLevels.MODERATOR,
    ownerId: config.users.systemUser.userId,
    lockedName: true,
    isSystemRoom: true,
  },

  /**
   * Messages sent to anonymous will have their user and team name stripped.
   */
  anonymous: config.rooms.anonymous || {
    roomId: 'anonymous',
    roomName: 'anonymous',
    visibility: config.AccessLevels.ANONYMOUS,
    accessLevel: config.AccessLevels.ANONYMOUS,
    isAnonymous: true,
    ownerId: config.users.systemUser.userId,
    lockedName: true,
    isSystemRoom: true,
  },

  important: config.rooms.important || {
    roomId: 'important-room',
    roomName: 'important-room',
    visibility: config.AccessLevels.SUPERUSER,
    accessLevel: config.AccessLevels.SUPERUSER,
    ownerId: config.users.systemUser.userId,
    lockedName: true,
    isSystemRoom: true,
  },

  news: config.rooms.news || {
    roomId: 'news-room',
    roomName: 'news-room',
    visibility: config.AccessLevels.SUPERUSER,
    accessLevel: config.AccessLevels.SUPERUSER,
    ownerId: config.users.systemUser.userId,
    lockedName: true,
    isSystemRoom: true,
  },

  schedule: config.rooms.schedule || {
    roomId: 'schedule-room',
    roomName: 'schedule-room',
    visibility: config.AccessLevels.SUPERUSER,
    accessLevel: config.AccessLevels.SUPERUSER,
    ownerId: config.users.systemUser.userId,
    lockedName: true,
    isSystemRoom: true,
  },

  /**
   * Used to store messages labeled as broadcast.
   * Not used as an ordinary chat room
   */
  bcast: config.rooms.bcast || {
    roomId: 'broadcast-room',
    roomName: 'broadcast-room',
    visibility: config.AccessLevels.SUPERUSER,
    accessLevel: config.AccessLevels.SUPERUSER,
    ownerId: config.users.systemUser.userId,
    lockedName: true,
    isSystemRoom: true,
  },
};

/**
 * Access level rooms.
 * Users will follow them based on their access level.
 */
Object.keys(config.AccessLevels).forEach((key) => {
  const roomName = key.toString();

  config.rooms[roomName] = {
    roomName,
    visibility: config.AccessLevels.SUPERUSER,
    accessLevel: config.AccessLevels.SUPERUSER,
    ownerId: config.users.systemUser.userId,
    lockedName: true,
  };
});

config.requiredRooms = [
  config.rooms.anonymous.roomName,
  config.rooms.bcast.roomName,
  config.rooms.public.roomName,
  config.rooms.important.roomName,
  config.rooms.news.roomName,
  config.rooms.schedule.roomName,
];

config.protectedRoomNames = Object.keys(config.rooms).map(roomId => config.rooms[roomId].roomName);

config.roomsToBeHidden = [
  config.rooms.bcast.roomName,
  config.rooms.important.roomName,
  config.rooms.news.roomName,
  config.rooms.schedule.roomName,
];

config.deviceRoomPrepend = 'device#';

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

config.protectedNames = [
  config.users.systemUser.username,
  config.users.anonymous.username,
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
  PROFILE: 'profile',
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
  ACCEPT: 'accept',
};

config.OriginTypes = {
  SOCKET: 'socket',
  NONE: 'none',
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
  ROOM: 'room',
  FOLLOWER: 'follower',
  TEAM: 'team',
  INVITATION: 'invitation',
  TEAMMEMBER: 'team member',
  LOGOUT: 'logout',
  BAN: 'ban',
  WALLET: 'wallet',
  TRANSACTION: 'transaction',
};

/**
 * *******************
 * * Client settings *
 * *******************
 */

/**
 * Room that is the default one opened on clients.
 * @type {Room}
 */
config.defaultRoom = config.rooms.public;

/**
 * ***************************
 * * System and API commands *
 * ***************************
 */

config.apiCommands = {
  /**
   * Alias
   */
  CreateAlias: config.apiCommands.CreateAlias || {
    name: 'CreateAlias',
    accessLevel: config.AccessLevels.MODERATOR,
    selfAccessLevel: config.AccessLevels.STANDARD,
  },
  GetAliases: config.apiCommands.GetAliases || {
    name: 'GetAliases',
    accessLevel: config.AccessLevels.MODERATOR,
    selfAccessLevel: config.AccessLevels.STANDARD,
  },
  UpdateAlias: config.apiCommands.UpdateAlias || {
    name: 'UpdateAlias',
    accessLevel: config.AccessLevels.MODERATOR,
    selfAccessLevel: config.AccessLevels.STANDARD,
  },
  RemoveAlias: config.apiCommands.RemoveAlias || {
    name: 'RemoveAlias',
    accessLevel: config.AccessLevels.ADMIN,
  },

  /**
   * Broadcast
   */
  SendBroadcast: config.apiCommands.SendBroadcast || {
    name: 'SendBroadcast',
    accessLevel: config.AccessLevels.MODERATOR,
  },
  GetBroadcasts: config.apiCommands.GetBroadcasts || {
    name: 'GetBroadcasts',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },

  /**
   * Message
   */
  SendMessage: config.apiCommands.SendMessage || {
    name: 'SendMessage',
    accessLevel: config.AccessLevels.STANDARD,
  },
  SendWhisper: config.apiCommands.SendWhisper || {
    name: 'SendWhisper',
    accessLevel: config.AccessLevels.STANDARD,
  },
  GetHistory: config.apiCommands.GetHistory || {
    name: 'GetHistory',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },
  RemoveMessage: config.apiCommands.RemoveMessage || {
    name: 'RemoveMessage',
    selfAccessLevel: config.AccessLevels.STANDARD,
    accessLevel: config.AccessLevels.MODERATOR,
  },

  /**
   * Room
   */
  CreateRoom: config.apiCommands.CreateRoom || {
    name: 'CreateRoom',
    accessLevel: config.AccessLevels.STANDARD,
  },
  GetRoom: config.apiCommands.GetRoom || {
    name: 'GetRoom',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },
  RemoveRoom: config.apiCommands.RemoveRoom || {
    name: 'RemoveRoom',
    accessLevel: config.AccessLevels.ADMIN,
  },
  FollowWhisperRoom: config.apiCommands.FollowWhisperRoom || {
    name: 'FollowWhisperRoom',
    accessLevel: config.AccessLevels.SUPERUSER,
    selfAccessLevel: config.AccessLevels.STANDARD,
  },
  FollowRoom: config.apiCommands.FollowRoom || {
    name: 'FollowRoom',
    accessLevel: config.AccessLevels.SUPERUSER,
    selfAccessLevel: config.AccessLevels.STANDARD,
  },
  UnfollowRoom: config.apiCommands.UnfollowRoom || {
    name: 'UnfollowRoom',
    accessLevel: config.AccessLevels.SUPERUSER,
    selfAccessLevel: config.AccessLevels.STANDARD,
  },
  UpdateRoom: config.apiCommands.UpdateRoom || {
    name: 'UpdateRoom',
    accessLevel: config.AccessLevels.STANDARD,
  },

  /**
   * Transaction
   */
  CreateTransaction: config.apiCommands.CreateTransaction || {
    name: 'CreateTransaction',
    accessLevel: config.AccessLevels.STANDARD,
  },
  GetTransaction: config.apiCommands.GetTransaction || {
    name: 'GetTransaction',
    accessLevel: config.AccessLevels.MODERATOR,
    selfAccessLevel: config.AccessLevels.STANDARD,
  },

  /**
   * Wallet
   */
  UpdateWallet: config.apiCommands.UpdateWallet || {
    name: 'UpdateWallet',
    accessLevel: config.AccessLevels.MODERATOR,
    selfAccessLevel: config.AccessLevels.STANDARD,
  },
  UpdateWalletAmount: config.apiCommands.UpdateWalletAmount || {
    name: 'UpdateWalletAmount',
    accessLevel: config.AccessLevels.MODERATOR,
  },
  GetWallet: config.apiCommands.GetWallet || {
    name: 'GetWallet',
    accessLevel: config.AccessLevels.MODERATOR,
    selfAccessLevel: config.AccessLevels.STANDARD,
  },

  /**
   * User
   */
  CreateUser: config.apiCommands.CreateUser || {
    name: 'CreateUser',
    accessLevel: config.AccessLevels.MODERATOR,
  },
  CreateUserThroughSocket: config.apiCommands.CreateUserThroughSocket || {
    name: 'CreateUserThroughSocket',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },
  BanUser: config.apiCommands.BanUser || {
    name: 'BanUser',
    accessLevel: config.AccessLevels.MODERATOR,
  },
  UnbanUser: config.apiCommands.UnbanUser || {
    name: 'UnbanUser',
    selfAccessLevel: config.AccessLevels.GOD,
    accessLevel: config.AccessLevels.MODERATOR,
  },
  VerifyUser: config.apiCommands.VerifyUser || {
    name: 'VerifyUser',
    accessLevel: config.AccessLevels.MODERATOR,
  },
  UpdateId: config.apiCommands.UpdateId || {
    name: 'UpdateId',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },
  Logout: config.apiCommands.Logout || {
    name: 'Logout',
    accessLevel: config.AccessLevels.ADMIN,
    selfAccessLevel: config.AccessLevels.STANDARD,
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
    accessLevel: config.AccessLevels.MODERATOR,
    selfAccessLevel: config.AccessLevels.STANDARD,
  },
  GetUsers: config.apiCommands.GetUsers || {
    name: 'GetUsers',
    accessLevel: config.AccessLevels.STANDARD,
  },
  GetUserDetails: config.apiCommands.GetUserDetails || {
    name: 'GetUserDetails',
    accessLevel: config.AccessLevels.MODERATOR,
  },
  GetInactiveUsers: config.apiCommands.GetInactiveUsers || {
    name: 'GetInactiveUsers',
    accessLevel: config.AccessLevels.MODERATOR,
  },
  ChangePassword: config.apiCommands.ChangePassword || {
    name: 'ChangePassword',
    accessLevel: config.AccessLevels.ADMIN,
    selfAccessLevel: config.AccessLevels.STANDARD,
  },

  /**
   * Mail
   */
  AddBlockedMail: config.apiCommands.AddBlockedMail || {
    name: 'AddBlockedMail',
    accessLevel: config.AccessLevels.MODERATOR,
  },
  RequestPasswordReset: config.apiCommands.RequestPasswordReset || {
    name: 'RequestPasswordReset',
    accessLevel: config.AccessLevels.STANDARD,
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
    accessLevel: config.AccessLevels.MODERATOR,
  },

  /**
   * Team
   */
  CreateTeam: config.apiCommands.CreateTeam || {
    name: 'CreateTeam',
    accessLevel: config.AccessLevels.STANDARD,
  },
  GetTeam: config.apiCommands.GetTeam || {
    name: 'GetTeam',
    accessLevel: config.AccessLevels.PRIVILEGED,
  },
  GetTeams: config.apiCommands.GetTeams || {
    name: 'GetTeams',
    accessLevel: config.AccessLevels.STANDARD,
  },
  LeaveTeam: config.apiCommands.LeaveTeam || {
    name: 'LeaveTeam',
    accessLevel: config.AccessLevels.STANDARD,
  },
  VerifyTeam: config.apiCommands.LeaveTeam || {
    name: 'VerifyTeam',
    accessLevel: config.AccessLevels.ADMIN,
  },
  GetTeamsList: config.apiCommands.GetTeamsList || {
    name: 'GetTeamsList',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },
  RemoveTeam: config.apiCommands.RemoveTeam || {
    name: 'RemoveTeam',
    accessLevel: config.AccessLevels.ADMIN,
  },
  UpdateTeam: config.apiCommands.UpdateTeam || {
    name: 'UpdateTeam',
    accessLevel: config.AccessLevels.ADMIN,
    selfAccessLevel: config.AccessLevels.STANDARD,
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
  UpdateForum: config.apiCommands.UpdateForum || {
    name: 'UpdateForum',
    accessLevel: config.AccessLevels.MODERATOR,
  },

  /**
   * Forum Post
   */
  CreateForumPost: config.apiCommands.CreateForumPost || {
    name: 'CreateForumPost',
    accessLevel: config.AccessLevels.STANDARD,
  },
  GetForumPost: config.apiCommands.GetForumPost || {
    name: 'GetForumPost',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },
  UpdateForumPost: config.apiCommands.UpdateForumPost || {
    name: 'UpdateForumPost',
    accessLevel: config.AccessLevels.MODERATOR,
    selfAccessLevel: config.AccessLevels.STANDARD,
  },
  RemoveForumPost: config.apiCommands.RemoveForumPost || {
    name: 'RemoveForumPost',
    accessLevel: config.AccessLevels.ADMIN,
    selfAccessLevel: config.AccessLevels.STANDARD,
  },

  /**
   * Forum Thread
   */
  CreateForumThread: config.apiCommands.CreateForumThread || {
    name: 'CreateForumThread',
    accessLevel: config.AccessLevels.STANDARD,
  },
  GetForumThread: config.apiCommands.GetForumThread || {
    name: 'GetForumThread',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },
  UpdateForumThread: config.apiCommands.UpdateForumThread || {
    name: 'UpdateForumThread',
    accessLevel: config.AccessLevels.MODERATOR,
    selfAccessLevel: config.AccessLevels.STANDARD,
  },
  RemoveForumThread: config.apiCommands.RemoveForumThread || {
    name: 'RemoveForumThread',
    accessLevel: config.AccessLevels.MODERATOR,
    selfAccessLevel: config.AccessLevels.STANDARD,
  },

  /**
   * Device
   */
  CreateDevice: config.apiCommands.CreateDevice || {
    name: 'CreateDevice',
    accessLevel: config.AccessLevels.PRIVILEGED,
  },
  UpdateDevice: config.apiCommands.UpdateDevice || {
    name: 'UpdateDevice',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },
  UpdateDeviceName: config.apiCommands.UpdateDeviceName || {
    name: 'UpdateDeviceName',
    accessLevel: config.AccessLevels.MODERATOR,
  },
  GetDevices: config.apiCommands.GetDevices || {
    name: 'GetDevices',
    accessLevel: config.AccessLevels.STANDARD,
  },

  /**
   * Doc File
   */
  CreateDocFile: config.apiCommands.CreateDocFile || {
    name: 'CreateDocFile',
    accessLevel: config.AccessLevels.STANDARD,
  },
  RemoveDocFile: config.apiCommands.RemoveDocFile || {
    name: 'RemoveDocFile',
    accessLevel: config.AccessLevels.MODERATOR,
    selfAccessLevel: config.AccessLevels.STANDARD,
  },
  GetDocFile: config.apiCommands.GetDocFile || {
    name: 'GetDocFile',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },
  GetDocFilesList: config.apiCommands.GetDocFilesList || {
    name: 'GetDocFilesList',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },

  /**
   * Simple Msg
   */
  SendSimpleMsg: config.apiCommands.SendSimpleMsg || {
    name: 'SendSimpleMsg',
    accessLevel: config.AccessLevels.STANDARD,
  },
  GetSimpleMsgs: config.apiCommands.GetSimpleMsgs || {
    name: 'GetSimpleMsgs',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },
  RemoveSimpleMsg: config.apiCommands.RemoveSimpleMsg || {
    name: 'RemoveSimpleMsg',
    selfAccessLevel: config.AccessLevels.STANDARD,
    accessLevel: config.AccessLevels.MODERATOR,
  },
  UpdateSimpleMsg: config.apiCommands.UpdateSimpleMsg || {
    name: 'UpdateSimpleMsg',
    selfAccessLevel: config.AccessLevels.STANDARD,
    accessLevel: config.AccessLevels.MODERATOR,
  },

  /**
   * Game Code
   */
  CreateGameCode: config.apiCommands.CreateGameCode || {
    name: 'CreateGameCode',
    selfAccessLevel: config.AccessLevels.STANDARD,
    accessLevel: config.AccessLevels.MODERATOR,
  },
  UseGameCode: config.apiCommands.UseGameCode || {
    name: 'UseGameCode',
    accessLevel: config.AccessLevels.STANDARD,
  },
  GetGameCode: config.apiCommands.GetGameCode || {
    name: 'GetGameCode',
    accessLevel: config.AccessLevels.MODERATOR,
    selfAccessLevel: config.AccessLevels.STANDARD,
  },
  RemoveGameCode: config.apiCommands.RemoveGameCode || {
    name: 'RemoveGameCode',
    accessLevel: config.AccessLevels.MODERATOR,
    selfAccessLevel: config.AccessLevels.STANDARD,
  },
  UpdateGameCode: config.apiCommands.UpdateGameCode || {
    name: 'UpdateGameCode',
    accessLevel: config.AccessLevels.MODERATOR,
    selfAccessLevel: config.AccessLevels.STANDARD,
  },

  /**
   * Position
   */
  CreatePosition: config.apiCommands.CreatePosition || {
    name: 'CreatePosition',
    accessLevel: config.AccessLevels.MODERATOR,
    selfAccessLevel: config.AccessLevels.STANDARD,
  },
  GetPositions: config.apiCommands.GetPositions || {
    name: 'GetPositions',
    accessLevel: config.AccessLevels.MODERATOR,
    selfAccessLevel: config.AccessLevels.STANDARD,
  },
  GetUserPosition: config.apiCommands.GetUserPosition || {
    name: 'GetUserPosition',
    accessLevel: config.AccessLevels.MODERATOR,
    selfAccessLevel: config.AccessLevels.STANDARD,
  },
  UpdatePosition: config.apiCommands.UpdatePosition || {
    name: 'UpdatePosition',
    accessLevel: config.AccessLevels.MODERATOR,
    selfAccessLevel: config.AccessLevels.STANDARD,
  },
  UpdatePositionCoordinates: config.apiCommands.UpdatePositionCoordinates || {
    name: 'UpdatePositionCoordinates',
    accessLevel: config.AccessLevels.MODERATOR,
    selfAccessLevel: config.AccessLevels.STANDARD,
  },
  RemovePosition: config.apiCommands.RemovePosition || {
    name: 'RemovePosition',
    accessLevel: config.AccessLevels.MODERATOR,
    selfAccessLevel: config.AccessLevels.STANDARD,
  },

  /**
   * Invitation
   */
  InviteToTeam: config.apiCommands.InviteToTeam || {
    name: 'InviteToTeam',
    accessLevel: config.AccessLevels.STANDARD,
  },
  AcceptInvitation: config.apiCommands.AcceptInvitation || {
    name: 'AcceptInvitation',
    accessLevel: config.AccessLevels.STANDARD,
  },
  DeclineInvitation: config.apiCommands.DeclineInvitation || {
    name: 'DeclineInvitation',
    accessLevel: config.AccessLevels.STANDARD,
  },
  GetInvitations: config.apiCommands.GetInvitations || {
    name: 'GetInvitations',
    acessLevel: config.AccessLevels.ADMIN,
    selfAccessLevel: config.AccessLevels.STANDARD,
  },
  RemoveInvitation: config.apiCommands.RemoveInvitation || {
    name: 'RemoveInvitation',
    accessLevel: config.AccessLevels.MODERATOR,
    selfAccessLevel: config.AccessLevels.STANDARD,
  },

  /**
   * Game Item
   */
  CreateGameItems: config.apiCommands.CreateGameItems || {
    name: 'CreateGameItems',
    accessLevel: config.AccessLevels.MODERATOR,
  },
  GetGameItems: config.apiCommands.GetGameItems || {
    name: 'GetGameItems',
    accessLevel: config.AccessLevels.MODERATOR,
  },
  RemoveGameItem: config.apiCommands.RemoveGameItem || {
    name: 'RemoveGameItem',
    accessLevel: config.AccessLevels.MODERATOR,
  },

  /**
   * Lantern Station
   */
  CreateLanternStation: config.apiCommands.CreateLanternStation || {
    name: 'CreateLanternStation',
    accessLevel: config.AccessLevels.MODERATOR,
  },
  UpdateLanternStation: config.apiCommands.UpdateLanternStation || {
    name: 'UpdateLanternStation',
    accessLevel: config.AccessLevels.MODERATOR,
  },
  GetLanternStations: config.apiCommands.GetLanternStations || {
    name: 'GetLanternStations',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },
  DeleteLanternStation: config.apiCommands.DeleteLanternStation || {
    name: 'DeleteLanternStation',
    accessLevel: config.AccessLevels.MODERATOR,
  },

  /**
   * Lantern Team
   */
  CreateLanternTeam: config.apiCommands.CreateLanternTeam || {
    name: 'CreateLanternTeam',
    accessLevel: config.AccessLevels.MODERATOR,
  },
  GetLanternTeam: config.apiCommands.GetLanternTeam || {
    name: 'GetLanternTeam',
    accessLevel: config.AccessLevels.STANDARD,
  },
  DeleteLanternTeam: config.apiCommands.DeleteLanternTeam || {
    name: 'DeleteLanternTeam',
    accessLevel: config.AccessLevels.MODERATOR,
  },

  /**
   * Hack Lantern
   */
  HackLantern: config.apiCommands.HackLantern || {
    name: 'HackLantern',
    accessLevel: config.AccessLevels.STANDARD,
  },

  /**
   * Lantern Round
   */
  CreateLanternRound: config.apiCommands.CreateLanternRound || {
    name: 'CreateLanternRound',
    accessLevel: config.AccessLevels.MODERATOR,
  },
  UpdateLanternRound: config.apiCommands.UpdateLanternRound || {
    name: 'UpdateLanternRound',
    accessLevel: config.AccessLevels.MODERATOR,
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
    accessLevel: config.AccessLevels.MODERATOR,
  },
  EndLanternRound: config.apiCommands.EndLanternRound || {
    name: 'EndLanternRound',
    accessLevel: config.AccessLevels.MODERATOR,
  },

  /**
   * Calibration Mission
   */
  GetCalibrationMission: config.apiCommands.GetCalibrationMission || {
    name: 'GetCalibrationMission',
    accessLevel: config.AccessLevels.MODERATOR,
  },
  GetCalibrationMissions: config.apiCommands.GetCalibrationMissions || {
    name: 'GetCalibrationMissions',
    accessLevel: config.AccessLevels.MODERATOR,
    selfAccessLevel: config.AccessLevels.STANDARD,
  },
  CancelCalibrationMission: config.apiCommands.CancelCalibrationMission || {
    name: 'CancelCalibrationMission',
    accessLevel: config.AccessLevels.MODERATOR,
  },
  CompleteCalibrationMission: config.apiCommands.CompleteCalibrationMission || {
    name: 'CompleteCalibrationMission',
    accessLevel: config.AccessLevels.MODERATOR,
  },
};

module.exports = config;
