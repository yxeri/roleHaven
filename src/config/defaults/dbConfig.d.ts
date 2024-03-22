import { ForumSchema } from 'src/db/connectors/forum.js';
export declare enum DeviceType {
    USERDEVICE = "userDevice",
    GPS = "gps",
    CUSTOM = "custom",
    RESTAPI = "restApi"
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
        CIRCLE: string;
    };
    OriginTypes: {
        SOCKET: string;
        NONE: string;
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
        [key: string]: Partial<ForumSchema> & {
            title: string;
        };
        public: Partial<ForumSchema> & {
            title: string;
        };
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
declare let config: DbConfig;
export default config;
