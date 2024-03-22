import { ChildError } from 'src/error/GeneralError.js';
import { BaseSchema, CustomFieldSchema, ImageSchema } from '../databaseConnector.js';
import { AliasSchema } from './alias.js';
export type UserSchema = BaseSchema & {
    username: string;
    usernameLowerCase: string;
    mailAddress: string | boolean;
    password: string | boolean;
    socketId: string;
    lastOnline: Date;
    registerDevice: string;
    description: string[];
    hasFullAccess: boolean;
    isVerified: boolean;
    isBanned: boolean;
    isOnline: boolean;
    isLootable: boolean;
    defaultRoomId: string;
    partOfTeams: string[];
    followingRooms: string[];
    aliases: string[];
    image: ImageSchema;
    offName: string | boolean;
    pronouns: string[];
    customFields: CustomFieldSchema[];
};
declare function getUserById({ userId, username, getPassword, supressExistError, }: {
    userId?: string;
    username?: string;
    getPassword?: boolean;
    supressExistError?: boolean;
}): Promise<{
    error: import("src/error/DoesNotExist.js").default;
    data?: undefined;
} | {
    data: {
        user: UserSchema;
    };
    error?: undefined;
}>;
declare function doesUserSocketIdExist({ socketId, }: {
    socketId: string;
}): Promise<{
    error: import("src/error/Database.js").default;
    data?: undefined;
} | {
    data: {
        exists: boolean;
        object: ({
            username: string;
            usernameLowerCase: string;
            mailAddress: string | boolean;
            password: string | boolean;
            socketId: string;
            lastOnline: Date;
            registerDevice: string;
            description: string[];
            hasFullAccess: boolean;
            isVerified: boolean;
            isBanned: boolean;
            isOnline: boolean;
            isLootable: boolean;
            defaultRoomId: string;
            partOfTeams: string[];
            followingRooms: string[];
            aliases: string[];
            image: ImageSchema;
            offName: string | boolean;
            pronouns: string[];
            customFields: CustomFieldSchema[];
        } & BaseSchema) | null;
    };
    error?: undefined;
}>;
declare function doesUserExist({ username, mailAddress, }: {
    username?: UserSchema['username'];
    mailAddress?: UserSchema['mailAddress'];
}): Promise<{
    data?: {
        exists: boolean;
        object: AliasSchema | UserSchema | null;
    };
    error?: ChildError;
}>;
declare function createUser({ user, options, }: {
    user: Partial<UserSchema>;
    options?: {
        setId?: boolean;
    };
}): Promise<{
    error: import("src/error/AlreadyExists.js").default;
    data?: undefined;
} | {
    data: {
        user: UserSchema;
    };
    error?: undefined;
}>;
declare function updateOnline({ userId, isOnline, socketId, suppressError, }: {
    userId: string;
    isOnline: boolean;
    socketId?: string;
    suppressError?: boolean;
}): Promise<{
    error: ChildError;
    data?: undefined;
} | {
    data: {
        user: UserSchema;
    };
    error?: undefined;
}>;
declare function updateUser({ userSocketId, userId, user, options, }: {
    userSocketId?: string;
    userId: string;
    user: Partial<UserSchema>;
    options?: {
        resetSocket?: boolean;
    };
}): Promise<{
    data: {
        user: UserSchema;
    };
    error?: undefined;
} | {
    error: import("src/error/AlreadyExists.js").default;
}>;
declare function verifyUser({ userId, }: {
    userId: string;
}): Promise<{
    error: ChildError;
    data?: undefined;
} | {
    data: {
        user: UserSchema;
    };
    error?: undefined;
}>;
declare function updateBanUser({ shouldBan, userId, }: {
    shouldBan: boolean;
    userId: string;
}): Promise<{
    error: import("src/error/DoesNotExist.js").default;
    data?: undefined;
} | {
    data: {
        user: UserSchema;
    };
    error?: undefined;
}>;
declare function updateUserPassword({ userId, password, }: {
    userId: string;
    password: string;
}): Promise<{
    error: ChildError;
    data?: undefined;
} | {
    data: {
        user: UserSchema;
    };
    error?: undefined;
}>;
declare function getUsersByUser({ includeInactive, user, includeOff, }: {
    includeInactive?: boolean;
    user: UserSchema;
    includeOff?: boolean;
}): Promise<{
    error: ChildError;
    data?: undefined;
} | {
    data: {
        users: UserSchema[] | undefined;
    };
    error?: undefined;
}>;
declare function addToTeam({ userIds, teamId, isAdmin, }: {
    userIds: UserSchema['userIds'];
    teamId: UserSchema['teamId'];
    isAdmin?: boolean;
}): Promise<{
    error: ChildError;
    data?: undefined;
} | {
    data: {
        team: ({
            teamName: string;
            shortName: string;
            teamNameLowerCase: string;
            shortNameLowerCase: string;
            isVerified: boolean;
            isProtected: boolean;
            members: string[];
            image: ImageSchema;
            locationName: string;
            isPermissionsOnly: boolean;
        } & BaseSchema) | undefined;
        users: UserSchema[] | undefined;
    };
    error?: undefined;
}>;
declare function addAlias({ aliasId, userId, }: {
    aliasId: string;
    userId: string;
}): Promise<{
    error: ChildError;
    data?: undefined;
} | {
    data: {
        user: UserSchema;
    };
    error?: undefined;
}>;
declare function removeAlias({ aliasId, userId, }: {
    aliasId: string;
    userId: string;
}): Promise<{
    error: ChildError;
    data?: undefined;
} | {
    data: {
        user: UserSchema;
    };
    error?: undefined;
}>;
declare function removeAliasFromAllUsers({ aliasId, }: {
    aliasId: string;
}): Promise<{
    error: ChildError;
    data?: undefined;
} | {
    data: {
        users: UserSchema[] | undefined;
    };
    error?: undefined;
}>;
declare function removeFromTeam({ userId, teamId, }: {
    userId: string;
    teamId: string;
}): Promise<{
    error: ChildError;
    data?: undefined;
} | {
    data: {
        team: ({
            teamName: string;
            shortName: string;
            teamNameLowerCase: string;
            shortNameLowerCase: string;
            isVerified: boolean;
            isProtected: boolean;
            members: string[];
            image: ImageSchema;
            locationName: string;
            isPermissionsOnly: boolean;
        } & BaseSchema) | undefined;
        user: UserSchema;
    };
    error?: undefined;
}>;
declare function getAllSocketIds(): Promise<{
    error: ChildError;
    data?: undefined;
} | {
    data: {
        userSocketIds: {
            [key: string]: string;
        };
    };
    error?: undefined;
}>;
declare function removeRoomFromAll({ roomId, }: {
    roomId: string;
}): Promise<{
    error: ChildError;
    data?: undefined;
} | {
    data: {
        users: UserSchema[] | undefined;
    };
    error?: undefined;
}>;
declare function removeTeamFromAll({ teamId, }: {
    teamId: string;
}): Promise<{
    error: ChildError;
    data?: undefined;
} | {
    data: {
        users: UserSchema[] | undefined;
    };
    error?: undefined;
}>;
declare function getInactiveUsers(): Promise<{
    error: ChildError;
    data?: undefined;
} | {
    data: {
        users: UserSchema[] | undefined;
    };
    error?: undefined;
}>;
declare function followRoom({ roomId, userIds, }: {
    roomId: string;
    userIds: string[];
}): Promise<{
    error: ChildError;
    data?: undefined;
} | {
    data: {
        users: UserSchema[] | undefined;
    };
    error?: undefined;
}>;
declare function unfollowRoom({ roomId, userId, }: {
    roomId: string;
    userId: string;
}): Promise<{
    error: ChildError;
    data?: undefined;
} | {
    data: {
        user: UserSchema;
    };
    error?: undefined;
}>;
declare function getAllUsers(): Promise<{
    error: ChildError;
    data?: undefined;
} | {
    data: {
        users: UserSchema[] | undefined;
    };
    error?: undefined;
}>;
declare function getUsersByAliases({ aliasIds, }: {
    aliasIds: string[];
}): Promise<{
    error: ChildError;
    data?: undefined;
} | {
    data: {
        users: UserSchema[] | undefined;
    };
    error?: undefined;
}>;
declare const _default: {
    createUser: typeof createUser;
    updateUser: typeof updateUser;
    verifyUser: typeof verifyUser;
    updateBanUser: typeof updateBanUser;
    updateUserPassword: typeof updateUserPassword;
    getUserById: typeof getUserById;
    doesUserExist: typeof doesUserExist;
    getAllSocketIds: typeof getAllSocketIds;
    addToTeam: typeof addToTeam;
    removeFromTeam: typeof removeFromTeam;
    removeRoomFromAll: typeof removeRoomFromAll;
    removeTeamFromAll: typeof removeTeamFromAll;
    updateOnline: typeof updateOnline;
    getInactiveUsers: typeof getInactiveUsers;
    followRoom: typeof followRoom;
    unfollowRoom: typeof unfollowRoom;
    getUsersByUser: typeof getUsersByUser;
    addAlias: typeof addAlias;
    removeAlias: typeof removeAlias;
    removeAliasFromAllUsers: typeof removeAliasFromAllUsers;
    getAllUsers: typeof getAllUsers;
    getUsersByAliases: typeof getUsersByAliases;
    doesUserSocketIdExist: typeof doesUserSocketIdExist;
};
export default _default;
