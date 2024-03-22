'use strict';
export var DeviceType;
(function (DeviceType) {
    DeviceType["USERDEVICE"] = "userDevice";
    DeviceType["GPS"] = "gps";
    DeviceType["CUSTOM"] = "custom";
    DeviceType["RESTAPI"] = "restApi";
})(DeviceType || (DeviceType = {}));
let config = {};
try {
    const dbConfig = await import('src/config/dbConfig.js');
    config = { ...dbConfig.default };
}
catch (err) {
    console.log('Did not find modified dbConfig. Using defaults.');
}
config.rooms = config.rooms || {};
config.users = config.users || {};
config.apiCommands = config.apiCommands || {};
config.forums = config.forums || {};
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
config.users.anonymous = config.users.anonymous || {
    username: 'anonymous',
    objectId: '222222222222222222222221',
    partOfTeams: [],
    aliases: [],
    followingRooms: [],
    visibility: config.AccessLevels.MODERATOR,
};
config.rooms.public = config.rooms.public || {
    objectId: '111111111111111111111110',
    roomName: 'public',
    visibility: config.AccessLevels.ANONYMOUS,
    accessLevel: config.AccessLevels.ANONYMOUS,
    ownerId: config.users.systemUser.objectId,
    isSystemRoom: true,
    isPublic: true,
};
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
config.defaultRoom = config.rooms.public;
config.apiCommands = {
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
    SendBroadcast: config.apiCommands.SendBroadcast || {
        name: 'SendBroadcast',
        accessLevel: config.AccessLevels.MODERATOR,
    },
    GetBroadcasts: config.apiCommands.GetBroadcasts || {
        name: 'GetBroadcasts',
        accessLevel: config.AccessLevels.ANONYMOUS,
    },
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
    RebootAll: config.apiCommands.RebootAll || {
        name: 'RebootAll',
        accessLevel: config.AccessLevels.ADMIN,
    },
    GetFull: config.apiCommands.GetFull || {
        name: 'GetFull',
        accessLevel: config.AccessLevels.MODERATOR,
    },
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGJDb25maWcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJkYkNvbmZpZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7QUFJYixNQUFNLENBQU4sSUFBWSxVQUtYO0FBTEQsV0FBWSxVQUFVO0lBQ3BCLHVDQUF5QixDQUFBO0lBQ3pCLHlCQUFXLENBQUE7SUFDWCwrQkFBaUIsQ0FBQTtJQUNqQixpQ0FBbUIsQ0FBQTtBQUNyQixDQUFDLEVBTFcsVUFBVSxLQUFWLFVBQVUsUUFLckI7QUEyS0QsSUFBSSxNQUFNLEdBQWEsRUFBYyxDQUFDO0FBRXRDLElBQUksQ0FBQztJQUNILE1BQU0sUUFBUSxHQUFHLE1BQU0sTUFBTSxDQUFDLHdCQUF3QixDQUFDLENBQUM7SUFFeEQsTUFBTSxHQUFHLEVBQUUsR0FBRyxRQUFRLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDbkMsQ0FBQztBQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7SUFDYixPQUFPLENBQUMsR0FBRyxDQUFDLGlEQUFpRCxDQUFDLENBQUM7QUFDakUsQ0FBQztBQUVELE1BQU0sQ0FBQyxLQUFLLEdBQUcsTUFBTSxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUM7QUFDbEMsTUFBTSxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUMsS0FBSyxJQUFJLEVBQUUsQ0FBQztBQUNsQyxNQUFNLENBQUMsV0FBVyxHQUFHLE1BQU0sQ0FBQyxXQUFXLElBQUksRUFBRSxDQUFDO0FBQzlDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sSUFBSSxFQUFFLENBQUM7QUFNcEMsTUFBTSxDQUFDLFlBQVksR0FBRyxNQUFNLENBQUMsWUFBWSxJQUFJO0lBQzNDLFNBQVMsRUFBRSxDQUFDO0lBQ1osUUFBUSxFQUFFLENBQUM7SUFDWCxVQUFVLEVBQUUsQ0FBQztJQUNiLFNBQVMsRUFBRSxDQUFDO0lBQ1osS0FBSyxFQUFFLENBQUM7SUFDUixTQUFTLEVBQUUsQ0FBQztJQUNaLEdBQUcs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