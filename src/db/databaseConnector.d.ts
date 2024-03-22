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
import mongoose, { SortOrder } from 'mongoose';
import { AliasSchema } from 'src/db/connectors/alias.js';
import { UserSchema } from 'src/db/connectors/user.js';
import { ChildError } from 'src/error/GeneralError.js';
export type BaseSchema = {
    _id: ObjectId;
    objectId: string;
    ownerId: string;
    ownerAliasId: string;
    teamId: string;
    lastUpdated: Date;
    timeCreated: Date;
    customLastUpdated: Date;
    customTimeCreated: Date;
    visibility: number;
    accessLevel: number;
    teamAdminIds: string[];
    userAdminIds: string[];
    userIds: string[];
    teamIds: string[];
    bannedIds: string[];
    isPublic: boolean;
    triggerEvents: string[];
};
export declare const BaseSchemaDef: {
    ownerId: StringConstructor;
    ownerAliasId: StringConstructor;
    teamId: StringConstructor;
    lastUpdated: DateConstructor;
    timeCreated: DateConstructor;
    customLastUpdated: DateConstructor;
    customTimeCreated: DateConstructor;
    visibility: {
        type: NumberConstructor;
        default: number;
    };
    accessLevel: {
        type: NumberConstructor;
        default: number;
    };
    teamAdminIds: {
        type: StringConstructor[];
        default: never[];
    };
    userAdminIds: {
        type: StringConstructor[];
        default: never[];
    };
    userIds: {
        type: StringConstructor[];
        default: never[];
    };
    teamIds: {
        type: StringConstructor[];
        default: never[];
    };
    bannedIds: {
        type: StringConstructor[];
        default: never[];
    };
    isPublic: {
        type: BooleanConstructor;
        default: boolean;
    };
    triggerEvents: {
        type: StringConstructor[];
        default: never[];
    };
};
export type ImageSchema = {
    height: number;
    width: number;
    imageName: string;
    fileName: string;
};
export declare const imageSchemaDef: mongoose.SchemaDefinition<ImageSchema>;
export type CoordinatesSchema = {
    longitude: number;
    latitude: number;
    speed: number;
    accuracy: number;
    heading: number;
    timeCreated: Date;
    customTimeCreated: Date;
    altitude: number;
    altitudeAccuracy: number;
    extraCoordinates?: {
        longitude: number;
        latitude: number;
    }[];
};
export declare const coordinatesSchemaDef: mongoose.SchemaDefinition<CoordinatesSchema>;
export type CustomFieldSchema = {
    name: string;
    value: {
        [key: string]: unknown;
    };
};
export declare const customFieldSchemaDef: mongoose.SchemaDefinition<CustomFieldSchema>;
declare function saveObject<T>({ object, objectData, objectType, }: {
    object: mongoose.Model<T & BaseSchema>;
    objectData: Partial<T & BaseSchema>;
    objectType: string;
}): Promise<{
    data: {
        objectType: string;
        savedObject: T & BaseSchema & {
            password?: string | boolean | undefined;
            objectId: string;
        };
    };
    error?: undefined;
} | {
    error: import("src/error/Database.js").default;
    data?: undefined;
}>;
declare function verifyObject<T>({ query, object, }: {
    query: mongoose.FilterQuery<T & BaseSchema>;
    object: mongoose.Model<T & BaseSchema>;
}): Promise<{
    error: import("src/error/DoesNotExist.js").default;
    data?: undefined;
} | {
    data: {
        verified: mongoose.IfAny<T & BaseSchema, any, mongoose.Document<unknown, {}, T & BaseSchema> & mongoose.Require_id<T & BaseSchema>> & BaseSchema & {
            password?: string | boolean | undefined;
            objectId: string;
        };
    };
    error?: undefined;
}>;
declare function verifyAllObjects<T>({ query, object, }: {
    query: mongoose.FilterQuery<T & BaseSchema>;
    object: mongoose.Model<T & BaseSchema>;
}): Promise<{
    data: {
        verified: never[];
    };
    error?: undefined;
} | {
    error: import("src/error/Database.js").default;
    data?: undefined;
}>;
declare function dropDatabase(): Promise<{
    data: {
        success: boolean;
    };
    error?: undefined;
} | {
    error: unknown;
    data?: undefined;
}>;
declare function getObject<T>({ object, noClean, errorNameContent, query, filter, }: {
    object: mongoose.Model<T & BaseSchema>;
    noClean?: boolean;
    errorNameContent?: string;
    query?: mongoose.FilterQuery<T & BaseSchema>;
    filter?: mongoose.ProjectionType<T & BaseSchema>;
}): Promise<{
    data: {
        exists: boolean;
        object?: undefined;
    };
    error?: undefined;
} | {
    data: {
        exists: boolean;
        object: mongoose.IfAny<T & BaseSchema, any, mongoose.Document<unknown, {}, T & BaseSchema> & mongoose.Require_id<T & BaseSchema>> & BaseSchema & {
            password?: string | boolean | undefined;
            objectId: string;
        };
    };
    error?: undefined;
} | {
    error: import("src/error/Database.js").default;
    data?: undefined;
}>;
declare function doesObjectExist<T>({ object, query, }: {
    object: mongoose.Model<T & BaseSchema>;
    query: mongoose.FilterQuery<T & BaseSchema>;
}): Promise<{
    data: {
        exists: boolean;
        object: (T & BaseSchema) | null;
    };
    error?: undefined;
} | {
    error: import("src/error/Database.js").default;
    data?: undefined;
}>;
declare function getObjects<T>({ object, errorNameContent, sort, query, filter, }: {
    object: mongoose.Model<T & BaseSchema>;
    errorNameContent?: string;
    sort?: string | {
        [key in keyof T & BaseSchema]: SortOrder;
    };
    query: mongoose.FilterQuery<T & Partial<BaseSchema>>;
    filter?: mongoose.ProjectionType<T & BaseSchema>;
}): Promise<{
    data?: {
        objects: (T & BaseSchema)[];
    };
    error?: ChildError;
}>;
declare function updateObject<T>({ object, update, query, suppressError, options, errorNameContent, }: {
    object: mongoose.Model<T & BaseSchema>;
    update: mongoose.UpdateQuery<T & BaseSchema>;
    query: mongoose.FilterQuery<T & BaseSchema>;
    suppressError?: boolean;
    options?: mongoose.QueryOptions;
    errorNameContent?: string;
}): Promise<{
    data?: {
        object: T & BaseSchema;
    };
    error?: ChildError;
}>;
declare function updateObjects<T>({ object, update, query, errorNameContent, }: {
    object: mongoose.Model<T & BaseSchema>;
    update: mongoose.UpdateQuery<T & BaseSchema>;
    query: mongoose.FilterQuery<Partial<T & BaseSchema>>;
    errorNameContent?: string;
}): Promise<{
    data?: {
        objects: (T & BaseSchema)[];
    };
    error?: ChildError;
}>;
declare function removeObject<T>({ object, query, }: {
    object: mongoose.Model<T & BaseSchema>;
    query: mongoose.FilterQuery<T & BaseSchema>;
}): Promise<{
    data: {
        success: boolean;
    };
    error?: undefined;
} | {
    error: import("src/error/Database.js").default;
    data?: undefined;
}>;
declare function removeObjects<T>({ object, query, }: {
    object: mongoose.Model<T & BaseSchema>;
    query: mongoose.FilterQuery<T & BaseSchema>;
}): Promise<{
    data: {
        success: boolean;
        amount: number;
    };
    error?: undefined;
} | {
    error: import("src/error/Database.js").default;
    data?: undefined;
}>;
declare function addObjectAccess<T>({ objectId, object, userIds, teamIds, bannedIds, teamAdminIds, userAdminIds, }: {
    objectId: string;
    object: mongoose.Model<T & BaseSchema>;
    userIds?: BaseSchema['userIds'];
    teamIds?: BaseSchema['teamIds'];
    bannedIds?: BaseSchema['bannedIds'];
    teamAdminIds?: BaseSchema['teamAdminIds'];
    userAdminIds?: BaseSchema['userAdminIds'];
}): Promise<{
    data?: {
        object: T & BaseSchema;
    };
    error?: ChildError;
}>;
declare function removeObjectAccess<T>({ objectId, object, userIds, teamIds, bannedIds, teamAdminIds, userAdminIds, }: {
    objectId: string;
    object: mongoose.Model<T & BaseSchema>;
    userIds?: BaseSchema['userIds'];
    teamIds?: BaseSchema['teamIds'];
    bannedIds?: BaseSchema['bannedIds'];
    teamAdminIds?: BaseSchema['teamAdminIds'];
    userAdminIds?: BaseSchema['userAdminIds'];
}): Promise<{
    data?: {
        object: T & BaseSchema;
    };
    error?: ChildError;
}>;
declare function createUserQuery({ user, noVisibility, }: {
    user: Partial<UserSchema>;
    noVisibility?: boolean;
}): mongoose.FilterQuery<UserSchema | AliasSchema>;
declare function updateAccess<T>(params: {
    objectId: string;
    object: mongoose.Model<T & BaseSchema>;
    shouldRemove?: boolean;
    teamIds?: BaseSchema['teamIds'];
    userIds?: BaseSchema['userIds'];
    userAdminIds?: BaseSchema['userAdminIds'];
    teamAdminIds?: BaseSchema['teamAdminIds'];
}): Promise<{
    error: ChildError;
    data?: undefined;
} | {
    data: {
        object: (T & BaseSchema) | undefined;
    };
    error?: undefined;
}>;
declare const _default: {
    coordinatesSchema: {
        longitude?: mongoose.SchemaDefinitionProperty<number, any> | undefined;
        latitude?: mongoose.SchemaDefinitionProperty<number, any> | undefined;
        speed?: mongoose.SchemaDefinitionProperty<number, any> | undefined;
        accuracy?: mongoose.SchemaDefinitionProperty<number, any> | undefined;
        heading?: mongoose.SchemaDefinitionProperty<number, any> | undefined;
        timeCreated?: mongoose.SchemaDefinitionProperty<Date, any> | undefined;
        customTimeCreated?: mongoose.SchemaDefinitionProperty<Date, any> | undefined;
        altitude?: mongoose.SchemaDefinitionProperty<number, any> | undefined;
        altitudeAccuracy?: mongoose.SchemaDefinitionProperty<number, any> | undefined;
        extraCoordinates?: mongoose.SchemaDefinitionProperty<{
            longitude: number;
            latitude: number;
        }[] | undefined, any> | undefined;
    };
    imageSchema: {
        height?: mongoose.SchemaDefinitionProperty<number, any> | undefined;
        width?: mongoose.SchemaDefinitionProperty<number, any> | undefined;
        imageName?: mongoose.SchemaDefinitionProperty<string, any> | undefined;
        fileName?: mongoose.SchemaDefinitionProperty<string, any> | undefined;
    };
    customFieldSchema: {
        name?: mongoose.SchemaDefinitionProperty<string, any> | undefined;
        value?: mongoose.SchemaDefinitionProperty<{
            [key: string]: unknown;
        }, any> | undefined;
    };
    saveObject: typeof saveObject;
    verifyObject: typeof verifyObject;
    verifyAllObjects: typeof verifyAllObjects;
    dropDatabase: typeof dropDatabase;
    getObjects: typeof getObjects;
    getObject: typeof getObject;
    updateObject: typeof updateObject;
    removeObject: typeof removeObject;
    removeObjects: typeof removeObjects;
    removeObjectAccess: typeof removeObjectAccess;
    addObjectAccess: typeof addObjectAccess;
    doesObjectExist: typeof doesObjectExist;
    updateObjects: typeof updateObjects;
    createUserQuery: typeof createUserQuery;
    updateAccess: typeof updateAccess;
};
export default _default;
