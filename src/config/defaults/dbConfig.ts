'use strict';

import { ForumSchema } from 'src/db/connectors/forum.js';

export enum DeviceType {
  USERDEVICE = 'userDevice',
  GPS = 'gps',
  CUSTOM = 'custom',
  RESTAPI = 'restApi',
}

export type DbConfig = {
  defaultRoom: DbConfig['rooms'][0];
  customUserFields: never[];
  Pronouns: {
    SHE: string;
    IT: string;
    HE: string;
    THEY: string;
  };
  TriggerTypes: {
    TIMED: string;
    TRIGGER: string;
    MANUAL: string;
    PROXIMITY: string;
  };
  TriggerChangeTypes: {
    CREATE: string;
    REMOVE: string;
    UPDATE: string;
  };
  TriggerEventTypes: {
    DOCFILE: string;
    CHATMSG: string;
    WHISPER: string;
    POSITION: string;
  };
  EmitTypes: {
    FORUM: string;
    FORUMTHREAD: string;
    FORUMPOST: string;
    FOLLOW: string;
    USER: string;
    CHATMSG: string;
    DEVICE: string;
    DOCFILE: string;
    WHISPER: string;
    SIMPLEMSG: string;
    BROADCAST: string;
    GAMECODE: string;
    ALIAS: string;
    POSITION: string;
    POSITIONS: string;
    ROOM: string;
    FOLLOWER: string;
    TEAM: string;
    INVITATION: string;
    TEAMMEMBER: string;
    LOGOUT: string;
    BAN: string;
    WALLET: string;
    TRANSACTION: string;
    DISCONNECT: string;
    RECONNECT: string;
    STARTUP: string;
    SENDMSG: string;
    TRIGGEREVENT: string;
  };
  PositionStructures: {
    POLYGON: string;
    MARKER: string;
    LINE: string;
    CIRCLE: string
  };
  OriginTypes: {
    SOCKET: string;
    NONE: string
  };
  rooms: {
    [key: string]: {
      objectId: string;
      roomName: string;
      visibility: number;
      accessLevel: number;
      ownerId: string;
      isSystemRoom: boolean;
      isPublic: boolean;
    };
  };
  users: {
    systemUser: {
      objectId: string;
      username: string;
      partOfTeams: string[];
      aliases: string[];
      followingRooms: string[];
      visibility: number;
    };
    anonymous: {
      username: string;
      objectId: string;
      partOfTeams: string[];
      aliases: string[];
      followingRooms: string[];
      visibility: number;
    };
  };
  apiCommands: {
    [key: string]: {
      name: string;
      accessLevel: number;
    };
  };
  forums: {
    [key: string]: Partial<ForumSchema> & { title: string };
    public: Partial<ForumSchema> & { title: string };
  };
  AccessLevels: {
    ANONYMOUS: number;
    STANDARD: number;
    PRIVILEGED: number;
    MODERATOR: number;
    ADMIN: number;
    SUPERUSER: number;
    GOD: number;
  };
  deviceRoomPrepend: string;
  anonymousUser: {
    username: string;
    accessLevel: number;
    visibility: number;
    registerDevice: string;
    followingRooms: string[];
    isVerified: boolean;
    defaultRoomId: string;
    partOfTeams: string[];
    aliases: string[];
    isAnonymous: boolean;
  };
  protectedRoomNames: string[];
  requiredRooms: string[];
  roomsToBeHidden: string[];
  protectedNames: string[];
  DeviceTypes: {
    [key in keyof DeviceType]: DeviceType[keyof DeviceType];
  };
  GameCodeTypes: {
    TRANSACTION: string;
    DOCFILE: string;
    TEXT: string;
    PROFILE: string;
  };
  InvitationTypes: {
    TEAM: string;
    ROOM: string;
  };
  MessageTypes: {
    CHAT: string;
    WHISPER: string;
    BROADCAST: string;
    MESSAGE: string;
  };
  PositionTypes: {
    USER: string;
    WORLD: string;
    LOCAL: string;
    DEVICE: string;
  };
  PositionOrigins: {
    LOCAL: string;
    GOOGLE: string;
    EXTERNAL: string;
  };
  ChangeTypes: {
    UPDATE: string;
    CREATE: string;
    REMOVE: string;
  };
};

let config: DbConfig = {} as DbConfig;

try {
  const dbConfig = await import('src/config/dbConfig.js');

  config = { ...dbConfig.default };
} catch (err) {
  console.log('Did not find modified dbConfig. Using defaults.');
}

config.rooms = config.rooms || {};
config.users = config.users || {};
config.apiCommands = config.apiCommands || {};
config.forums = config.forums || {};

/**
 * Access levels are used as permissions for users.
 * A user that has an level equal to or greater than the required access level will be able to use the function.
 */
config.AccessLevels = config.AccessLevels || {
  ANONYMOUS: 0,
  STANDARD: 1,
  PRIVILEGED: 2,
  MODERATOR: 3,
  ADMIN: 4,
  SUPERUSER: 5,
  GOD: 6,
};

config.users.systemUser = config.users.systemUser || {
  objectId: '222222222222222222222220',
  username: 'system',
  partOfTeams: [],
  aliases: [],
  followingRooms: [],
  visibility: config.AccessLevels.MODERATOR,
};

/**
 * Default user used when the client is not authenticated.
 */
config.users.anonymous = config.users.anonymous || {
  username: 'anonymous',
  objectId: '222222222222222222222221',
  partOfTeams: [],
  aliases: [],
  followingRooms: [],
  visibility: config.AccessLevels.MODERATOR,
};

/**
 * Default rooms
 */

/**
 * Public is followed by all users.
 * It is also reachable by anonymous users.
 */
config.rooms.public = config.rooms.public || {
  objectId: '111111111111111111111110',
  roomName: 'public',
  visibility: config.AccessLevels.ANONYMOUS,
  accessLevel: config.AccessLevels.ANONYMOUS,
  ownerId: config.users.systemUser.objectId,
  isSystemRoom: true,
  isPublic: true,
};
/**
 * Admin related messages will be sent here.
 * E.g. when a user needs verification.
 */
config.rooms.admin = config.rooms.admin || {
  objectId: '111111111111111111111111',
  roomName: 'hqroom',
  visibility: config.AccessLevels.MODERATOR,
  accessLevel: config.AccessLevels.MODERATOR,
  ownerId: config.users.systemUser.objectId,
  isSystemRoom: true,
};
config.rooms.important = config.rooms.important || {
  objectId: '111111111111111111111113',
  roomName: 'important',
  visibility: config.AccessLevels.SUPERUSER,
  accessLevel: config.AccessLevels.SUPERUSER,
  ownerId: config.users.systemUser.objectId,
  isSystemRoom: true,
};
config.rooms.news = config.rooms.news || {
  objectId: '111111111111111111111114',
  roomName: 'news',
  visibility: config.AccessLevels.SUPERUSER,
  accessLevel: config.AccessLevels.SUPERUSER,
  ownerId: config.users.systemUser.objectId,
  isSystemRoom: true,
};
config.rooms.schedule = config.rooms.schedule || {
  objectId: '111111111111111111111115',
  roomName: 'schedule',
  visibility: config.AccessLevels.SUPERUSER,
  accessLevel: config.AccessLevels.SUPERUSER,
  ownerId: config.users.systemUser.objectId,
  isSystemRoom: true,
};
/**
 * Used to store messages labeled as broadcast.
 * Not used as an ordinary chat room
 */
config.rooms.bcast = config.rooms.bcast || {
  objectId: '111111111111111111111116',
  roomName: 'broadcast',
  visibility: config.AccessLevels.SUPERUSER,
  accessLevel: config.AccessLevels.SUPERUSER,
  ownerId: config.users.systemUser.objectId,
  isSystemRoom: true,
};

config.requiredRooms = [
  config.rooms.bcast.objectId,
  config.rooms.public.objectId,
  config.rooms.important.objectId,
  config.rooms.news.objectId,
  config.rooms.schedule.objectId,
];

config.protectedRoomNames = Object.keys(config.rooms)
  .map((objectId) => config.rooms[objectId].roomName);

config.roomsToBeHidden = [
  config.rooms.bcast.objectId,
  config.rooms.important.objectId,
  config.rooms.news.objectId,
  config.rooms.schedule.objectId,
];

config.forums.public = config.forums.public || {
  objectId: '111111111111111111111120',
  title: 'Board',
  isPublic: true,
};

config.deviceRoomPrepend = 'device#';

config.anonymousUser = {
  username: 'ANONYMOUS_USER',
  accessLevel: config.AccessLevels.ANONYMOUS,
  visibility: config.AccessLevels.ANONYMOUS,
  registerDevice: 'ANONYMOUS_USER',
  followingRooms: Object.keys(config.rooms)
    .map((key) => config.rooms[key].objectId),
  isVerified: true,
  defaultRoomId: config.rooms.public.objectId,
  partOfTeams: [],
  aliases: [],
  isAnonymous: true,
};

config.protectedNames = [
  config.users.systemUser.username,
  config.users.anonymous.username,
];

config.GameCodeTypes = {
  TRANSACTION: 'transaction',
  DOCFILE: 'docfile',
  TEXT: 'text',
  PROFILE: 'profile',
};

config.InvitationTypes = {
  TEAM: 'team',
  ROOM: 'room',
};

config.MessageTypes = {
  CHAT: 'chat',
  WHISPER: 'whisper',
  BROADCAST: 'broadcast',
  MESSAGE: 'message',
};

config.PositionTypes = {
  USER: 'user',
  WORLD: 'world',
  LOCAL: 'local',
  DEVICE: 'device',
};

config.PositionOrigins = {
  LOCAL: 'local',
  GOOGLE: 'google',
  EXTERNAL: 'external',
};

config.ChangeTypes = {
  UPDATE: 'update',
  CREATE: 'create',
  REMOVE: 'remove',
};

config.OriginTypes = {
  SOCKET: 'socket',
  NONE: 'none',
};

config.PositionStructures = {
  MARKER: 'marker',
  CIRCLE: 'circle',
  POLYGON: 'polygon',
  LINE: 'line',
};

config.EmitTypes = {
  FORUM: 'forum',
  FORUMTHREAD: 'forumThread',
  FORUMPOST: 'forumPost',
  FOLLOW: 'followRoom',
  USER: 'user',
  CHATMSG: 'chatMsg',
  DEVICE: 'device',
  DOCFILE: 'docFile',
  WHISPER: 'whisper',
  SIMPLEMSG: 'simpleMsg',
  BROADCAST: 'broadcast',
  GAMECODE: 'gameCode',
  ALIAS: 'alias',
  POSITION: 'position',
  POSITIONS: 'positions',
  ROOM: 'room',
  FOLLOWER: 'follower',
  TEAM: 'team',
  INVITATION: 'invitation',
  TEAMMEMBER: 'team member',
  LOGOUT: 'logout',
  BAN: 'ban',
  WALLET: 'wallet',
  TRANSACTION: 'transaction',
  DISCONNECT: 'disconnect',
  RECONNECT: 'reconnect',
  STARTUP: 'startup',
  SENDMSG: 'sendMessage',
  TRIGGEREVENT: 'triggerEvent',
};

config.TriggerEventTypes = {
  DOCFILE: 'docFile',
  CHATMSG: 'chatMsg',
  WHISPER: 'whisper',
  POSITION: 'position',
};

config.TriggerChangeTypes = {
  UPDATE: 'update',
  CREATE: 'create',
  REMOVE: 'remove',
};

config.TriggerTypes = {
  PROXIMITY: 'proximity',
  TIMED: 'timed',
  MANUAL: 'manual',
  TRIGGER: 'trigger',
};

config.Pronouns = {
  SHE: 'She',
  HE: 'He',
  THEY: 'They',
  IT: 'It',
};

config.customUserFields = config.customUserFields || [];

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
    accessLevel: process.env.CREATEALIASLEVEL || config.AccessLevels.STANDARD,
  },
  GetAliases: config.apiCommands.GetAliases || {
    name: 'GetAliases',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },
  UpdateAlias: config.apiCommands.UpdateAlias || {
    name: 'UpdateAlias',
    accessLevel: config.AccessLevels.STANDARD,
  },
  RemoveAlias: config.apiCommands.RemoveAlias || {
    name: 'RemoveAlias',
    accessLevel: config.AccessLevels.ADMIN,
  },
  UpdateAliasVisibility: config.apiCommands.UpdateAliasVisibility || {
    name: 'UpdateAliasVisibility',
    accessLevel: config.AccessLevels.MODERATOR,
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
  SendOneTimeMessage: config.apiCommands.SendOneTimeMessage || {
    name: 'SendOneTimeMessage',
    accessLevel: config.AccessLevels.PRIVILEGED,
  },
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
    accessLevel: config.AccessLevels.STANDARD,
  },
  UpdateMessage: config.apiCommands.UpdateMessage || {
    name: 'UpdateMessage',
    accessLevel: config.AccessLevels.STANDARD,
  },
  GetMessage: config.apiCommands.GetMessage || {
    name: 'GetMessage',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },
  GetAllMessages: config.apiCommands.GetAllMessages || {
    name: 'GetAllMessages',
    accessLevel: config.AccessLevels.ADMIN,
  },

  /**
   * Room
   */
  CreateRoom: config.apiCommands.CreateRoom || {
    name: 'CreateRoom',
    accessLevel: process.env.CREATEROOM || config.AccessLevels.STANDARD,
  },
  GetRoom: config.apiCommands.GetRoom || {
    name: 'GetRoom',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },
  GetRoomsList: config.apiCommands.GetRoomsList || {
    name: 'GetRoomsList',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },
  RemoveRoom: config.apiCommands.RemoveRoom || {
    name: 'RemoveRoom',
    accessLevel: config.AccessLevels.STANDARD,
  },
  FollowWhisperRoom: config.apiCommands.FollowWhisperRoom || {
    name: 'FollowWhisperRoom',
    accessLevel: config.AccessLevels.STANDARD,
  },
  FollowRoom: config.apiCommands.FollowRoom || {
    name: 'FollowRoom',
    accessLevel: config.AccessLevels.STANDARD,
  },
  UnfollowRoom: config.apiCommands.UnfollowRoom || {
    name: 'UnfollowRoom',
    accessLevel: config.AccessLevels.STANDARD,
  },
  UpdateRoom: config.apiCommands.UpdateRoom || {
    name: 'UpdateRoom',
    accessLevel: config.AccessLevels.STANDARD,
  },
  InviteToRoom: config.apiCommands.InviteToRoom || {
    name: 'InviteToRoom',
    accessLevel: config.AccessLevels.STANDARD,
  },

  /**
   * Transaction
   */
  CreateTransaction: config.apiCommands.CreateTransaction || {
    name: 'CreateTransaction',
    accessLevel: process.env.CREATETRANSACTION || config.AccessLevels.STANDARD,
  },
  GetTransaction: config.apiCommands.GetTransaction || {
    name: 'GetTransaction',
    accessLevel: config.AccessLevels.STANDARD,
  },
  RemoveTransaction: config.apiCommands.RemoveTransaction || {
    name: 'RemoveTransaction',
    accessLevel: config.AccessLevels.MODERATOR,
  },
  UpdateTransaction: config.apiCommands.UpdateTransaction || {
    name: 'UpdateTransaction',
    accessLevel: config.AccessLevels.STANDARD,
  },

  /**
   * Wallet
   */
  UpdateWallet: config.apiCommands.UpdateWallet || {
    name: 'UpdateWallet',
    accessLevel: config.AccessLevels.MODERATOR,
  },
  UpdateWalletAmount: config.apiCommands.UpdateWalletAmount || {
    name: 'UpdateWalletAmount',
    accessLevel: config.AccessLevels.MODERATOR,
  },
  GetWallet: config.apiCommands.GetWallet || {
    name: 'GetWallet',
    accessLevel: config.AccessLevels.STANDARD,
  },
  RemoveWallet: config.apiCommands.RemoveWallet || {
    name: 'RemoveWallet',
    accessLevel: config.AccessLevels.ADMIN,
  },
  ChangeWalletAmount: config.apiCommands.ChangeWalletAmount || {
    name: 'ChangeWalletAmount',
    accessLevel: config.AccessLevels.MODERATOR,
  },

  /**
   * User
   */
  CreateUser: config.apiCommands.CreateUser || {
    name: 'CreateUser',
    accessLevel: process.env.CREATEUSER || config.AccessLevels.ANONYMOUS,
  },
  CreateDisallowedUser: config.apiCommands.CreateDisallowedUser || {
    name: 'CreateDisallowedUser',
    accessLevel: config.AccessLevels.ADMIN,
  },
  CreateSockerUser: config.apiCommands.CreateSockerUser || {
    name: 'CreateSockerUser',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },
  BanUser: config.apiCommands.BanUser || {
    name: 'BanUser',
    accessLevel: config.AccessLevels.MODERATOR,
  },
  UnbanUser: config.apiCommands.UnbanUser || {
    name: 'UnbanUser',
    accessLevel: config.AccessLevels.MODERATOR,
  },
  VerifyUser: config.apiCommands.VerifyUser || {
    name: 'VerifyUser',
    accessLevel: config.AccessLevels.PRIVILEGED,
  },
  UpdateId: config.apiCommands.UpdateId || {
    name: 'UpdateId',
    accessLevel: config.AccessLevels.STANDARD,
  },
  Logout: config.apiCommands.Logout || {
    name: 'Logout',
    accessLevel: config.AccessLevels.STANDARD,
  },
  SetFullAccess: config.apiCommands.SetFullAccess || {
    name: 'SetFullAccess',
    accessLevel: config.AccessLevels.ADMIN,
  },
  UpdateUserAccess: config.apiCommands.UpdateUserLevel || {
    name: 'UpdateUserLevel',
    accessLevel: config.AccessLevels.ADMIN,
  },
  UpdateUserVisibility: config.apiCommands.UpdateUserVisibility || {
    name: 'UpdateUserVisibility',
    accessLevel: config.AccessLevels.ADMIN,
  },
  GetUser: config.apiCommands.GetUser || {
    name: 'GetUser',
    accessLevel: config.AccessLevels.STANDARD,
  },
  GetUsers: config.apiCommands.GetUsers || {
    name: 'GetUsers',
    accessLevel: config.AccessLevels.ANONYMOUS,
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
    accessLevel: config.AccessLevels.STANDARD,
  },
  UpdateUser: config.apiCommands.UpdateUser || {
    name: 'UpdateUser',
    accessLevel: config.AccessLevels.STANDARD,
  },
  RemoveUser: config.apiCommands.RemoveUser || {
    name: 'RemoveUser',
    accessLevel: config.AccessLevels.ADMIN,
  },
  UpdateSelf: config.apiCommands.UpdateSelf || {
    name: 'UpdateSelf',
    accesslevel: config.AccessLevels.ADMIN,
  },

  /**
   * Misc.
   */
  RebootAll: config.apiCommands.RebootAll || {
    name: 'RebootAll',
    accessLevel: config.AccessLevels.ADMIN,
  },
  GetFull: config.apiCommands.GetFull || {
    name: 'GetFull',
    accessLevel: config.AccessLevels.MODERATOR,
  },

  /**
   * Team
   */
  CreateTeam: config.apiCommands.CreateTeam || {
    name: 'CreateTeam',
    accessLevel: process.env.CREATETEAM || config.AccessLevels.STANDARD,
  },
  GetTeam: config.apiCommands.GetTeam || {
    name: 'GetTeam',
    accessLevel: config.AccessLevels.STANDARD,
  },
  GetTeams: config.apiCommands.GetTeams || {
    name: 'GetTeams',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },
  LeaveTeam: config.apiCommands.LeaveTeam || {
    name: 'LeaveTeam',
    accessLevel: config.AccessLevels.STANDARD,
  },
  VerifyTeam: config.apiCommands.VerifyTeam || {
    name: 'VerifyTeam',
    accessLevel: config.AccessLevels.MODERATOR,
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
    accessLevel: config.AccessLevels.STANDARD,
  },

  /**
   * Forum
   */
  CreateForum: config.apiCommands.CreateForum || {
    name: 'CreateForum',
    accessLevel: process.env.CREATEFORUM || config.AccessLevels.MODERATOR,
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
    accessLevel: process.env.CREATEFORUMPOST || config.AccessLevels.STANDARD,
  },
  GetForumPost: config.apiCommands.GetForumPost || {
    name: 'GetForumPost',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },
  UpdateForumPost: config.apiCommands.UpdateForumPost || {
    name: 'UpdateForumPost',
    accessLevel: config.AccessLevels.STANDARD,
  },
  RemoveForumPost: config.apiCommands.RemoveForumPost || {
    name: 'RemoveForumPost',
    accessLevel: config.AccessLevels.STANDARD,
  },

  /**
   * Forum Thread
   */
  CreateForumThread: config.apiCommands.CreateForumThread || {
    name: 'CreateForumThread',
    accessLevel: process.env.CREATEFORUMTHREAD || config.AccessLevels.STANDARD,
  },
  GetForumThread: config.apiCommands.GetForumThread || {
    name: 'GetForumThread',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },
  UpdateForumThread: config.apiCommands.UpdateForumThread || {
    name: 'UpdateForumThread',
    accessLevel: config.AccessLevels.STANDARD,
  },
  RemoveForumThread: config.apiCommands.RemoveForumThread || {
    name: 'RemoveForumThread',
    accessLevel: config.AccessLevels.STANDARD,
  },

  /**
   * Device
   */
  CreateDevice: config.apiCommands.CreateDevice || {
    name: 'CreateDevice',
    accessLevel: process.env.CREATEDEVICE || config.AccessLevels.STANDARD,
  },
  RemoveDevice: config.apiCommands.RemoveDevice || {
    name: 'RemoveDevice',
    accessLevel: config.AccessLevels.STANDARD,
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
    accessLevel: config.AccessLevels.ANONYMOUS,
  },

  /**
   * Doc File
   */
  CreateDocFile: config.apiCommands.CreateDocFile || {
    name: 'CreateDocFile',
    accessLevel: process.env.CREATEDOCFILE || config.AccessLevels.STANDARD,
  },
  RemoveDocFile: config.apiCommands.RemoveDocFile || {
    name: 'RemoveDocFile',
    accessLevel: config.AccessLevels.STANDARD,
  },
  GetDocFile: config.apiCommands.GetDocFile || {
    name: 'GetDocFile',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },
  UnlockDocFile: config.apiCommands.GetDocFile || {
    name: 'GetDocFile',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },
  GetDocFilesList: config.apiCommands.GetDocFilesList || {
    name: 'GetDocFilesList',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },
  UpdateDocFile: config.apiCommands.UpdateDocFile || {
    name: 'UpdateDocFile',
    accessLevel: config.AccessLevels.STANDARD,
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
    accessLevel: config.AccessLevels.STANDARD,
  },
  UpdateSimpleMsg: config.apiCommands.UpdateSimpleMsg || {
    name: 'UpdateSimpleMsg',
    accessLevel: config.AccessLevels.STANDARD,
  },

  /**
   * Game Code
   */
  CreateGameCode: config.apiCommands.CreateGameCode || {
    name: 'CreateGameCode',
    accessLevel: process.env.CREATEGAMECODE || config.AccessLevels.STANDARD,
  },
  UseGameCode: config.apiCommands.UseGameCode || {
    name: 'UseGameCode',
    accessLevel: config.AccessLevels.STANDARD,
  },
  GetGameCode: config.apiCommands.GetGameCode || {
    name: 'GetGameCode',
    accessLevel: config.AccessLevels.STANDARD,
  },
  RemoveGameCode: config.apiCommands.RemoveGameCode || {
    name: 'RemoveGameCode',
    accessLevel: config.AccessLevels.STANDARD,
  },
  UpdateGameCode: config.apiCommands.UpdateGameCode || {
    name: 'UpdateGameCode',
    accessLevel: config.AccessLevels.STANDARD,
  },

  /**
   * Position
   */
  CreatePosition: config.apiCommands.CreatePosition || {
    name: 'CreatePosition',
    accessLevel: process.env.CREATEPOSITION || config.AccessLevels.STANDARD,
  },
  CreatePermanentPosition: config.apiCommands.CreatePermanentPosition || {
    name: 'CreatePermanentPosition',
    accessLevel: process.env.CREATEPERMANENTPOSITION || config.AccessLevels.PRIVILEGED,
  },
  GetPositions: config.apiCommands.GetPositions || {
    name: 'GetPositions',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },
  GetUserPosition: config.apiCommands.GetUserPosition || {
    name: 'GetUserPosition',
    accessLevel: config.AccessLevels.STANDARD,
  },
  UpdatePosition: config.apiCommands.UpdatePosition || {
    name: 'UpdatePosition',
    accessLevel: config.AccessLevels.STANDARD,
  },
  UpdatePositionCoordinates: config.apiCommands.UpdatePositionCoordinates || {
    name: 'UpdatePositionCoordinates',
    accessLevel: config.AccessLevels.STANDARD,
  },
  RemovePosition: config.apiCommands.RemovePosition || {
    name: 'RemovePosition',
    accessLevel: config.AccessLevels.STANDARD,
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
    acessLevel: config.AccessLevels.STANDARD,
  },
  RemoveInvitation: config.apiCommands.RemoveInvitation || {
    name: 'RemoveInvitation',
    accessLevel: config.AccessLevels.STANDARD,
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
   * Trigger events
   */
  CreateTriggerEvent: config.apiCommands.CreateTriggerEvent || {
    name: 'CreateTriggerEvent',
    accessLevel: config.AccessLevels.STANDARD,
  },
  RemoveTriggerEvent: config.apiCommands.RemoveTriggerEvent || {
    name: 'RemoveTriggerEvent',
    accessLevel: config.AccessLevels.STANDARD,
  },
  UpdateTriggerEvent: config.apiCommands.UpdateTriggerEvent || {
    name: 'UpdateTriggerEvent',
    accessLevel: config.AccessLevels.STANDARD,
  },
  GetTriggerEvents: config.apiCommands.GetTriggerEvents || {
    name: 'GetTriggerEvents',
    accessLevel: config.AccessLevels.STANDARD,
  },

  /**
   * Other
   */
  AnonymousCreation: config.apiCommands.AnonymousCreation || {
    name: 'AnonymousCreation',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },
  IncludeOff: config.apiCommands.IncludeOff || {
    name: 'IncludeOff',
    accessLevel: config.AccessLevels.STANDARD,
  },
  ...config.apiCommands || {},
};

export default config;
