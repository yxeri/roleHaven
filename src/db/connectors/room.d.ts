/// <reference types="mongoose/types/aggregate.js" />
/// <reference types="mongoose/types/callback.js" />
/// <reference types="mongoose/types/collection.js" />
/// <reference types="mongoose/types/connection.js" />
/// <reference types="mongoose/types/cursor.js" />
/// <reference types="mongoose/types/document.js" />
/// <reference types="mongoose/types/error.js" />
/// <reference types="mongoose/types/expressions.js" />
/// <reference types="mongoose/types/helpers.js" />
/// <reference types="mongoose/types/middlewares.js" />
/// <reference types="mongoose/types/indexes.js" />
/// <reference types="mongoose/types/models.js" />
/// <reference types="mongoose/types/mongooseoptions.js" />
/// <reference types="mongoose/types/pipelinestage.js" />
/// <reference types="mongoose/types/populate.js" />
/// <reference types="mongoose/types/query.js" />
/// <reference types="mongoose/types/schemaoptions.js" />
/// <reference types="mongoose/types/schematypes.js" />
/// <reference types="mongoose/types/session.js" />
/// <reference types="mongoose/types/types.js" />
/// <reference types="mongoose/types/utility.js" />
/// <reference types="mongoose/types/validation.js" />
/// <reference types="mongoose/types/virtuals.js" />
/// <reference types="mongoose/types/inferschematype.js" />
import { ObjectId } from 'mongodb';
import mongoose from 'mongoose';
import { UserSchema } from 'src/db/connectors/user.js';
import { BaseSchema } from 'src/db/databaseConnector.js';
export type RoomSchema = BaseSchema & {
    roomName: string;
    roomNameLowerCase: string;
    password: string;
    participantIds: string[];
    nameIsLocked: boolean;
    isAnonymous: boolean;
    isWhisper: boolean;
    followers: string[];
    isSystemRoom: boolean;
    isUser: boolean;
    isTeam: boolean;
};
declare function doesRoomExist({ skipExistsCheck, roomName, roomId, }: {
    skipExistsCheck?: boolean;
    roomName?: string;
    roomId?: string;
}): Promise<{
    data: {
        exists: boolean;
        object: ({
            roomName: string;
            roomNameLowerCase: string;
            password: string;
            participantIds: string[];
            nameIsLocked: boolean;
            isAnonymous: boolean;
            isWhisper: boolean;
            followers: string[];
            isSystemRoom: boolean;
            isUser: boolean;
            isTeam: boolean;
        } & BaseSchema) | null;
    };
    error?: undefined;
} | {
    data: {
        exists: boolean;
    };
    error?: undefined;
} | {
    error: import("src/error/InvalidData.js").default;
    data?: undefined;
}>;
declare function addFollowers({ userIds, roomId, addParticipants, }: {
    userIds: string[];
    roomId: string;
    addParticipants?: boolean;
}): Promise<{
    error: import("src/error/GeneralError.js").ChildError;
    data?: undefined;
} | {
    data: {
        room: ({
            roomName: string;
            roomNameLowerCase: string;
            password: string;
            participantIds: string[];
            nameIsLocked: boolean;
            isAnonymous: boolean;
            isWhisper: boolean;
            followers: string[];
            isSystemRoom: boolean;
            isUser: boolean;
            isTeam: boolean;
        } & BaseSchema) | undefined;
    };
    error?: undefined;
}>;
declare function createRoom({ room, silentExistsError, skipExistsCheck, options, }: {
    room: Partial<RoomSchema>;
    silentExistsError?: boolean;
    skipExistsCheck?: boolean;
    options?: {
        setId?: boolean;
        isFollower?: boolean;
    };
}): Promise<{
    error: import("src/error/InvalidData.js").default;
    data?: undefined;
} | {
    data: {
        exists: boolean;
        room?: undefined;
    };
    error?: undefined;
} | {
    data: {
        room: {
            roomName: string;
            roomNameLowerCase: string;
            password: string;
            participantIds: string[];
            nameIsLocked: boolean;
            isAnonymous: boolean;
            isWhisper: boolean;
            followers: string[];
            isSystemRoom: boolean;
            isUser: boolean;
            isTeam: boolean;
        } & BaseSchema & {
            password?: string | boolean | undefined;
            objectId: string;
        };
        exists?: undefined;
    };
    error?: undefined;
}>;
declare function removeRoom({ roomId, fullRemoval, }: {
    roomId: string;
    fullRemoval?: boolean;
}): Promise<{
    error: import("src/error/Database.js").default;
    data?: undefined;
} | {
    error: import("src/error/GeneralError.js").ChildError;
    data?: undefined;
} | {
    data: {
        userIds: string[] | undefined;
        success: boolean;
    };
    error?: undefined;
}>;
declare function removeFollowers({ userIds, roomId, }: {
    userIds: string[];
    roomId: string;
}): Promise<{
    error: import("src/error/GeneralError.js").ChildError;
    data?: undefined;
} | {
    data: {
        room: ({
            roomName: string;
            roomNameLowerCase: string;
            password: string;
            participantIds: string[];
            nameIsLocked: boolean;
            isAnonymous: boolean;
            isWhisper: boolean;
            followers: string[];
            isSystemRoom: boolean;
            isUser: boolean;
            isTeam: boolean;
        } & BaseSchema) | undefined;
    };
    error?: undefined;
}>;
declare function updateRoom({ roomId, room, options, }: {
    roomId: string;
    room: Partial<RoomSchema>;
    options?: {
        resetOwnerAliasId?: boolean;
        resetPassword?: boolean;
    };
}): Promise<{
    data: {
        room: ({
            roomName: string;
            roomNameLowerCase: string;
            password: string;
            participantIds: string[];
            nameIsLocked: boolean;
            isAnonymous: boolean;
            isWhisper: boolean;
            followers: string[];
            isSystemRoom: boolean;
            isUser: boolean;
            isTeam: boolean;
        } & BaseSchema) | undefined;
    };
    error?: undefined;
} | {
    error: import("src/error/InvalidData.js").default;
}>;
declare function getRoomById({ roomId, roomName, getPassword, }: {
    roomId?: string;
    roomName?: string;
    getPassword?: boolean;
}): Promise<{
    error: import("src/error/DoesNotExist.js").default;
    data?: undefined;
} | {
    data: {
        room: mongoose.Document<unknown, {}, {
            roomName: string;
            roomNameLowerCase: string;
            password: string;
            participantIds: string[];
            nameIsLocked: boolean;
            isAnonymous: boolean;
            isWhisper: boolean;
            followers: string[];
            isSystemRoom: boolean;
            isUser: boolean;
            isTeam: boolean;
        } & BaseSchema> & {
            roomName: string;
            roomNameLowerCase: string;
            password: string;
            participantIds: string[];
            nameIsLocked: boolean;
            isAnonymous: boolean;
            isWhisper: boolean;
            followers: string[];
            isSystemRoom: boolean;
            isUser: boolean;
            isTeam: boolean;
        } & BaseSchema & Required<{
            _id: ObjectId;
        }> & {
            password?: string | boolean | undefined;
            objectId: string;
        };
    };
    error?: undefined;
}>;
declare function getRoomsByIds({ roomIds, }: {
    roomIds: string[];
}): Promise<{
    error: import("src/error/GeneralError.js").ChildError;
    data?: undefined;
} | {
    data: {
        rooms: ({
            roomName: string;
            roomNameLowerCase: string;
            password: string;
            participantIds: string[];
            nameIsLocked: boolean;
            isAnonymous: boolean;
            isWhisper: boolean;
            followers: string[];
            isSystemRoom: boolean;
            isUser: boolean;
            isTeam: boolean;
        } & BaseSchema)[] | undefined;
    };
    error?: undefined;
}>;
declare function getRoomsByUser({ user, }: {
    user: Partial<UserSchema>;
}): Promise<{
    error: import("src/error/GeneralError.js").ChildError;
    data?: undefined;
} | {
    data: {
        rooms: ({
            roomName: string;
            roomNameLowerCase: string;
            password: string;
            participantIds: string[];
            nameIsLocked: boolean;
            isAnonymous: boolean;
            isWhisper: boolean;
            followers: string[];
            isSystemRoom: boolean;
            isUser: boolean;
            isTeam: boolean;
        } & BaseSchema)[] | undefined;
    };
    error?: undefined;
}>;
declare function getWhisperRoom({ participantIds, }: {
    participantIds: string[];
}): Promise<{
    error: import("src/error/DoesNotExist.js").default;
    data?: undefined;
} | {
    data: {
        room: mongoose.Document<unknown, {}, {
            roomName: string;
            roomNameLowerCase: string;
            password: string;
            participantIds: string[];
            nameIsLocked: boolean;
            isAnonymous: boolean;
            isWhisper: boolean;
            followers: string[];
            isSystemRoom: boolean;
            isUser: boolean;
            isTeam: boolean;
        } & BaseSchema> & {
            roomName: string;
            roomNameLowerCase: string;
            password: string;
            participantIds: string[];
            nameIsLocked: boolean;
            isAnonymous: boolean;
            isWhisper: boolean;
            followers: string[];
            isSystemRoom: boolean;
            isUser: boolean;
            isTeam: boolean;
        } & BaseSchema & Required<{
            _id: ObjectId;
        }> & {
            password?: string | boolean | undefined;
            objectId: string;
        };
    };
    error?: undefined;
}>;
declare function doesWhisperRoomExist({ participantIds, }: {
    participantIds: string[];
}): Promise<{
    data: {
        exists: boolean;
        object: ({
            roomName: string;
            roomNameLowerCase: string;
            password: string;
            participantIds: string[];
            nameIsLocked: boolean;
            isAnonymous: boolean;
            isWhisper: boolean;
            followers: string[];
            isSystemRoom: boolean;
            isUser: boolean;
            isTeam: boolean;
        } & BaseSchema) | null;
    };
    error?: undefined;
} | {
    error: import("src/error/Database.js").default;
    data?: undefined;
}>;
declare function getAllRooms(): Promise<{
    error: import("src/error/GeneralError.js").ChildError;
    data?: undefined;
} | {
    data: {
        rooms: ({
            roomName: string;
            roomNameLowerCase: string;
            password: string;
            participantIds: string[];
            nameIsLocked: boolean;
            isAnonymous: boolean;
            isWhisper: boolean;
            followers: string[];
            isSystemRoom: boolean;
            isUser: boolean;
            isTeam: boolean;
        } & BaseSchema)[] | undefined;
    };
    error?: undefined;
}>;
declare function populateDbRooms(): Promise<{
    error: import("src/error/InvalidData.js").default;
    data?: undefined;
} | {
    data: {
        success: boolean;
    };
    error?: undefined;
}>;
declare const _default: {
    createRoom: typeof createRoom;
    removeRoom: typeof removeRoom;
    populateDbRooms: typeof populateDbRooms;
    updateRoom: typeof updateRoom;
    getRoomById: typeof getRoomById;
    doesRoomExist: typeof doesRoomExist;
    getWhisperRoom: typeof getWhisperRoom;
    addFollowers: typeof addFollowers;
    removeFollowers: typeof removeFollowers;
    getRoomsByUser: typeof getRoomsByUser;
    getRoomsByIds: typeof getRoomsByIds;
    getAllRooms: typeof getAllRooms;
    doesWhisperRoomExist: typeof doesWhisperRoomExist;
};
export default _default;
