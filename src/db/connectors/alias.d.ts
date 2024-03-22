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
import { BaseSchema, CustomFieldSchema, ImageSchema } from '../databaseConnector.js';
import { UserSchema } from './user.js';
export type AliasSchema = BaseSchema & {
    aliasName: string;
    aliasNameLowerCase: string;
    image: ImageSchema;
    partOfTeams: string[];
    followingRooms: string[];
    description: string[];
    pronouns: string[];
    customFields: CustomFieldSchema[];
    isVerified: boolean;
    isBanned: boolean;
};
declare function getAliasById({ aliasId, aliasName, }: {
    aliasId: string;
    aliasName?: string;
} | {
    aliasName: string;
    aliasId?: string;
}): Promise<{
    error: import("src/error/DoesNotExist.js").default;
    data?: undefined;
} | {
    data: {
        alias: mongoose.Document<unknown, {}, {
            aliasName: string;
            aliasNameLowerCase: string;
            image: ImageSchema;
            partOfTeams: string[];
            followingRooms: string[];
            description: string[];
            pronouns: string[];
            customFields: CustomFieldSchema[];
            isVerified: boolean;
            isBanned: boolean;
        } & BaseSchema> & {
            aliasName: string;
            aliasNameLowerCase: string;
            image: ImageSchema;
            partOfTeams: string[];
            followingRooms: string[];
            description: string[];
            pronouns: string[];
            customFields: CustomFieldSchema[];
            isVerified: boolean;
            isBanned: boolean;
        } & BaseSchema & Required<{
            _id: ObjectId;
        }> & {
            password?: string | boolean | undefined;
            objectId: string;
        };
    };
    error?: undefined;
}>;
declare function doesAliasExist({ aliasName, }: {
    aliasName: string;
}): Promise<{
    data: {
        exists: boolean;
        object: ({
            aliasName: string;
            aliasNameLowerCase: string;
            image: ImageSchema;
            partOfTeams: string[];
            followingRooms: string[];
            description: string[];
            pronouns: string[];
            customFields: CustomFieldSchema[];
            isVerified: boolean;
            isBanned: boolean;
        } & BaseSchema) | null;
    };
    error?: undefined;
} | {
    error: import("src/error/Database.js").default;
    data?: undefined;
}>;
declare function createAlias({ alias, options, }: {
    alias: AliasSchema;
    options?: {
        setId?: boolean;
    };
}): Promise<{
    error: import("src/error/AlreadyExists.js").default;
    data?: undefined;
} | {
    data: {
        alias: {
            aliasName: string;
            aliasNameLowerCase: string;
            image: ImageSchema;
            partOfTeams: string[];
            followingRooms: string[];
            description: string[];
            pronouns: string[];
            customFields: CustomFieldSchema[];
            isVerified: boolean;
            isBanned: boolean;
        } & BaseSchema & {
            password?: string | boolean | undefined;
            objectId: string;
        };
    };
    error?: undefined;
}>;
declare function updateAlias({ aliasId, alias, options, }: {
    aliasId: string;
    alias: Partial<AliasSchema>;
    options?: {
        resetOwnerAliasId?: boolean;
    };
}): Promise<{
    data: {
        alias: ({
            aliasName: string;
            aliasNameLowerCase: string;
            image: ImageSchema;
            partOfTeams: string[];
            followingRooms: string[];
            description: string[];
            pronouns: string[];
            customFields: CustomFieldSchema[];
            isVerified: boolean;
            isBanned: boolean;
        } & BaseSchema) | undefined;
    };
    error?: undefined;
} | {
    error: import("src/error/AlreadyExists.js").default;
}>;
declare function getAliasesByUser({ user, }: {
    user: Partial<UserSchema>;
}): Promise<{
    error: import("src/error/GeneralError.js").ChildError;
    data?: undefined;
} | {
    data: {
        aliases: ({
            aliasName: string;
            aliasNameLowerCase: string;
            image: ImageSchema;
            partOfTeams: string[];
            followingRooms: string[];
            description: string[];
            pronouns: string[];
            customFields: CustomFieldSchema[];
            isVerified: boolean;
            isBanned: boolean;
        } & BaseSchema)[] | undefined;
    };
    error?: undefined;
}>;
declare function getAllAliases(): Promise<{
    error: import("src/error/GeneralError.js").ChildError;
    data?: undefined;
} | {
    data: {
        aliases: ({
            aliasName: string;
            aliasNameLowerCase: string;
            image: ImageSchema;
            partOfTeams: string[];
            followingRooms: string[];
            description: string[];
            pronouns: string[];
            customFields: CustomFieldSchema[];
            isVerified: boolean;
            isBanned: boolean;
        } & BaseSchema)[] | undefined;
    };
    error?: undefined;
}>;
declare const _default: {
    Model: mongoose.Model<AliasSchema, {}, {}, {}, mongoose.Document<unknown, {}, AliasSchema> & BaseSchema & {
        aliasName: string;
        aliasNameLowerCase: string;
        image: ImageSchema;
        partOfTeams: string[];
        followingRooms: string[];
        description: string[];
        pronouns: string[];
        customFields: CustomFieldSchema[];
        isVerified: boolean;
        isBanned: boolean;
    } & Required<{
        _id: ObjectId;
    }>, mongoose.Schema<AliasSchema, mongoose.Model<AliasSchema, any, any, any, mongoose.Document<unknown, any, AliasSchema> & BaseSchema & {
        aliasName: string;
        aliasNameLowerCase: string;
        image: ImageSchema;
        partOfTeams: string[];
        followingRooms: string[];
        description: string[];
        pronouns: string[];
        customFields: CustomFieldSchema[];
        isVerified: boolean;
        isBanned: boolean;
    } & Required<{
        _id: ObjectId;
    }>, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, AliasSchema, mongoose.Document<unknown, {}, mongoose.FlatRecord<AliasSchema>> & mongoose.FlatRecord<AliasSchema> & Required<{
        _id: ObjectId;
    }>>>;
    Schema: mongoose.Schema<AliasSchema, mongoose.Model<AliasSchema, any, any, any, mongoose.Document<unknown, any, AliasSchema> & BaseSchema & {
        aliasName: string;
        aliasNameLowerCase: string;
        image: ImageSchema;
        partOfTeams: string[];
        followingRooms: string[];
        description: string[];
        pronouns: string[];
        customFields: CustomFieldSchema[];
        isVerified: boolean;
        isBanned: boolean;
    } & Required<{
        _id: ObjectId;
    }>, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, AliasSchema, mongoose.Document<unknown, {}, mongoose.FlatRecord<AliasSchema>> & mongoose.FlatRecord<AliasSchema> & Required<{
        _id: ObjectId;
    }>>;
    createAlias: typeof createAlias;
    getAliasesByUser: typeof getAliasesByUser;
    updateAlias: typeof updateAlias;
    doesAliasExist: typeof doesAliasExist;
    getAliasById: typeof getAliasById;
    getAllAliases: typeof getAllAliases;
};
export default _default;
