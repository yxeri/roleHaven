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
import mongoose from 'mongoose';
import { UserSchema } from 'src/db/connectors/user.js';
import { BaseSchema, ImageSchema } from 'src/db/databaseConnector.js';
type TeamSchema = BaseSchema & {
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
};
export declare const Team: mongoose.Model<TeamSchema, {}, {}, {}, mongoose.Document<unknown, {}, TeamSchema> & BaseSchema & {
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
} & Required<{
    _id: mongoose.mongo.BSON.ObjectId;
}>, mongoose.Schema<TeamSchema, mongoose.Model<TeamSchema, any, any, any, mongoose.Document<unknown, any, TeamSchema> & BaseSchema & {
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
} & Required<{
    _id: mongoose.mongo.BSON.ObjectId;
}>, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, TeamSchema, mongoose.Document<unknown, {}, mongoose.FlatRecord<TeamSchema>> & mongoose.FlatRecord<TeamSchema> & Required<{
    _id: mongoose.mongo.BSON.ObjectId;
}>>>;
declare function createTeam({ team, }: {
    team: Partial<TeamSchema>;
}): Promise<{
    error: import("src/error/AlreadyExists.js").default;
    data?: undefined;
} | {
    data: {
        team: {
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
        } & BaseSchema & {
            password?: string | boolean | undefined;
            objectId: string;
        };
    };
    error?: undefined;
}>;
declare function updateTeam({ teamId, team, options, }: {
    teamId: string;
    team: Partial<TeamSchema>;
    options?: {
        resetOwnerAliasId?: boolean;
    };
}): Promise<{
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
    };
    error?: undefined;
} | {
    error: import("src/error/AlreadyExists.js").default;
}>;
declare function getTeamsByUser({ user, includeInactive, }: {
    user: Partial<UserSchema>;
    includeInactive?: boolean;
}): Promise<{
    error: import("src/error/GeneralError.js").ChildError;
    data?: undefined;
} | {
    data: {
        teams: ({
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
        } & BaseSchema)[] | undefined;
    };
    error?: undefined;
}>;
declare function getTeamById({ teamId, }: {
    teamId: string;
}): Promise<{
    error: import("src/error/DoesNotExist.js").default;
    data?: undefined;
} | {
    data: {
        team: mongoose.Document<unknown, {}, {
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
        } & BaseSchema> & {
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
        } & BaseSchema & Required<{
            _id: mongoose.mongo.BSON.ObjectId;
        }> & {
            password?: string | boolean | undefined;
            objectId: string;
        };
    };
    error?: undefined;
}>;
declare function verifyTeam({ teamId, }: {
    teamId: string;
}): Promise<{
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
    };
    error?: undefined;
} | {
    error: import("src/error/AlreadyExists.js").default;
}>;
declare function addTeamMembers({ memberIds, teamId, }: {
    memberIds: string[];
    teamId: string;
}): Promise<{
    error: import("src/error/GeneralError.js").ChildError;
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
    };
    error?: undefined;
}>;
declare function removeTeamMembers({ memberIds, teamId, }: {
    memberIds: string[];
    teamId: string;
}): Promise<{
    error: import("src/error/GeneralError.js").ChildError;
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
    };
    error?: undefined;
}>;
declare const _default: {
    createTeam: typeof createTeam;
    getTeamsByUser: typeof getTeamsByUser;
    updateTeam: typeof updateTeam;
    getTeamById: typeof getTeamById;
    verifyTeam: typeof verifyTeam;
    addTeamMembers: typeof addTeamMembers;
    removeTeamMembers: typeof removeTeamMembers;
};
export default _default;
