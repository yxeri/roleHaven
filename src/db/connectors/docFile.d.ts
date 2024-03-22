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
type DocFileSchema = BaseSchema & {
    code: string;
    title: string;
    text: string[];
    videoCodes: string[];
    images: ImageSchema[];
};
declare function createDocFile({ docFile, }: {
    docFile: Partial<DocFileSchema>;
}): Promise<{
    error: import("src/error/AlreadyExists.js").default;
    data?: undefined;
} | {
    data: {
        docFile: {
            code: string;
            title: string;
            text: string[];
            videoCodes: string[];
            images: ImageSchema[];
        } & BaseSchema & {
            password?: string | boolean | undefined;
            objectId: string;
        };
    };
    error?: undefined;
}>;
declare function updateDocFile({ docFileId, docFile, options, }: {
    docFileId: string;
    docFile: Partial<DocFileSchema>;
    options?: {
        resetOwnerAliasId?: boolean;
    };
}): Promise<{
    error: import("src/error/DoesNotExist.js").default;
    data?: undefined;
} | {
    data: {
        docFile: {
            code: string;
            title: string;
            text: string[];
            videoCodes: string[];
            images: ImageSchema[];
        } & BaseSchema;
    };
    error?: undefined;
}>;
declare function removeDocFile({ docFileId, }: {
    docFileId: string;
}): Promise<{
    data: {
        success: boolean;
    };
    error?: undefined;
} | {
    error: import("src/error/Database.js").default;
    data?: undefined;
}>;
declare function getAllDocFiles(): Promise<{
    error: import("src/error/GeneralError.js").ChildError;
    data?: undefined;
} | {
    data: {
        docFiles: ({
            code: string;
            title: string;
            text: string[];
            videoCodes: string[];
            images: ImageSchema[];
        } & BaseSchema)[] | undefined;
    };
    error?: undefined;
}>;
declare function getDocFileById({ docFileId, }: {
    docFileId: string;
}): Promise<{
    error: import("src/error/DoesNotExist.js").default;
    data?: undefined;
} | {
    data: {
        docFile: mongoose.Document<unknown, {}, {
            code: string;
            title: string;
            text: string[];
            videoCodes: string[];
            images: ImageSchema[];
        } & BaseSchema> & {
            code: string;
            title: string;
            text: string[];
            videoCodes: string[];
            images: ImageSchema[];
        } & BaseSchema & Required<{
            _id: mongoose.mongo.BSON.ObjectId;
        }> & {
            password?: string | boolean | undefined;
            objectId: string;
        };
    };
    error?: undefined;
}>;
declare function getDocFileByCode({ code, }: {
    code: string;
}): Promise<{
    error: import("src/error/DoesNotExist.js").default;
    data?: undefined;
} | {
    data: {
        docFile: mongoose.Document<unknown, {}, {
            code: string;
            title: string;
            text: string[];
            videoCodes: string[];
            images: ImageSchema[];
        } & BaseSchema> & {
            code: string;
            title: string;
            text: string[];
            videoCodes: string[];
            images: ImageSchema[];
        } & BaseSchema & Required<{
            _id: mongoose.mongo.BSON.ObjectId;
        }> & {
            password?: string | boolean | undefined;
            objectId: string;
        };
    };
    error?: undefined;
}>;
declare function getDocFilesByUser({ user, }: {
    user: Partial<UserSchema>;
}): Promise<{
    error: import("src/error/GeneralError.js").ChildError;
    data?: undefined;
} | {
    data: {
        docFiles: ({
            code: string;
            title: string;
            text: string[];
            videoCodes: string[];
            images: ImageSchema[];
        } & BaseSchema)[] | undefined;
    };
    error?: undefined;
}>;
declare function getDocFilesList(): Promise<{
    error: import("src/error/GeneralError.js").ChildError;
    data?: undefined;
} | {
    data: {
        docFiles: ({
            code: string;
            title: string;
            text: string[];
            videoCodes: string[];
            images: ImageSchema[];
        } & BaseSchema)[] | undefined;
    };
    error?: undefined;
}>;
declare const _default: {
    createDocFile: typeof createDocFile;
    updateDocFile: typeof updateDocFile;
    getDocFileById: typeof getDocFileById;
    removeDocFile: typeof removeDocFile;
    getAllDocFiles: typeof getAllDocFiles;
    getDocFileByCode: typeof getDocFileByCode;
    getDocFilesByUser: typeof getDocFilesByUser;
    getDocFilesList: typeof getDocFilesList;
};
export default _default;
