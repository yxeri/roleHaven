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
import { BaseSchema, ImageSchema } from 'src/db/databaseConnector.js';
export type ForumSchema = BaseSchema & {
    title: string;
    text: string[];
    isPersonal: boolean;
    image: ImageSchema;
};
declare function createForum({ forum, silentExistsError, options, }: {
    forum: Partial<ForumSchema> & {
        title: string;
    };
    silentExistsError?: boolean;
    options?: {
        setId?: boolean;
    };
}): Promise<{
    data: {
        exists: boolean;
        forum?: undefined;
    };
    error?: undefined;
} | {
    error: import("src/error/AlreadyExists.js").default;
    data?: undefined;
} | {
    data: {
        forum: {
            title: string;
            text: string[];
            isPersonal: boolean;
            image: ImageSchema;
        } & BaseSchema & {
            password?: string | boolean | undefined;
            objectId: string;
        };
        exists?: undefined;
    };
    error?: undefined;
}>;
declare function getForumById({ forumId, }: {
    forumId: string;
}): Promise<{
    error: import("src/error/Database.js").default;
    data?: undefined;
} | {
    data: {
        forum: (mongoose.Document<unknown, {}, {
            title: string;
            text: string[];
            isPersonal: boolean;
            image: ImageSchema;
        } & BaseSchema> & {
            title: string;
            text: string[];
            isPersonal: boolean;
            image: ImageSchema;
        } & BaseSchema & Required<{
            _id: ObjectId;
        }> & {
            password?: string | boolean | undefined;
            objectId: string;
        }) | undefined;
    };
    error?: undefined;
}>;
declare function getForumsByIds({ forumIds, }: {
    forumIds: string[];
}): Promise<{
    error: import("src/error/GeneralError.js").ChildError;
    data?: undefined;
} | {
    data: {
        forums: ({
            title: string;
            text: string[];
            isPersonal: boolean;
            image: ImageSchema;
        } & BaseSchema)[] | undefined;
    };
    error?: undefined;
}>;
declare function getAllForums(): Promise<{
    error: import("src/error/GeneralError.js").ChildError;
    data?: undefined;
} | {
    data: {
        forums: ({
            title: string;
            text: string[];
            isPersonal: boolean;
            image: ImageSchema;
        } & BaseSchema)[] | undefined;
    };
    error?: undefined;
}>;
declare function updateForum({ forumId, forum, }: {
    forumId: string;
    forum: Partial<ForumSchema>;
}): Promise<{
    error: import("src/error/DoesNotExist.js").default;
    data?: undefined;
} | {
    data: {
        forum: {
            title: string;
            text: string[];
            isPersonal: boolean;
            image: ImageSchema;
        } & BaseSchema;
    };
    error?: undefined;
}>;
declare function removeForum({ forumId, fullRemoval, }: {
    forumId: string;
    fullRemoval?: boolean;
}): Promise<any>;
declare function getForumsByUser({ user, }: {
    user: Partial<UserSchema>;
}): Promise<{
    error: import("src/error/GeneralError.js").ChildError;
    data?: undefined;
} | {
    data: {
        forums: ({
            title: string;
            text: string[];
            isPersonal: boolean;
            image: ImageSchema;
        } & BaseSchema)[] | undefined;
    };
    error?: undefined;
}>;
declare function populateDbForums(): Promise<{
    error: import("src/error/AlreadyExists.js").default;
    data?: undefined;
} | {
    data: {
        success: boolean;
    };
    error?: undefined;
}>;
declare const _default: {
    createForum: typeof createForum;
    getForumById: typeof getForumById;
    updateForum: typeof updateForum;
    getAllForums: typeof getAllForums;
    getForumsByIds: typeof getForumsByIds;
    removeForum: typeof removeForum;
    getForumsByUser: typeof getForumsByUser;
    populateDbForums: typeof populateDbForums;
};
export default _default;
