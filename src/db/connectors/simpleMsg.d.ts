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
import { BaseSchema } from 'src/db/databaseConnector.js';
export type SimpleMsgSchema = BaseSchema & {
    text: string;
};
declare function createSimpleMsg({ simpleMsg, }: {
    simpleMsg: Partial<SimpleMsgSchema>;
}): Promise<{
    error: import("src/error/Database.js").default;
    data?: undefined;
} | {
    data: {
        simpleMsg: {
            text: string;
        } & BaseSchema & {
            password?: string | boolean | undefined;
            objectId: string;
        };
    };
    error?: undefined;
}>;
declare function removeSimpleMsgsByUser({ userId, }: {
    userId: string;
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
declare function removeSimpleMsg({ simpleMsgId, }: {
    simpleMsgId: string;
}): Promise<{
    data: {
        success: boolean;
    };
    error?: undefined;
} | {
    error: import("src/error/Database.js").default;
    data?: undefined;
}>;
declare function getAllSimpleMsgs(): Promise<{
    error: import("src/error/GeneralError.js").ChildError;
    data?: undefined;
} | {
    data: {
        simpleMsgs: ({
            text: string;
        } & BaseSchema)[] | undefined;
    };
    error?: undefined;
}>;
declare function updateSimpleMsg({ simpleMsgId, simpleMsg, }: {
    simpleMsgId: string;
    simpleMsg: Partial<SimpleMsgSchema>;
}): Promise<{
    error: import("src/error/DoesNotExist.js").default;
    data?: undefined;
} | {
    data: {
        simpleMsg: {
            text: string;
        } & BaseSchema;
    };
    error?: undefined;
}>;
declare function getSimpleMsgById({ simpleMsgId, }: {
    simpleMsgId: string;
}): Promise<{
    error: import("src/error/DoesNotExist.js").default;
    data?: undefined;
} | {
    data: {
        simpleMsg: mongoose.Document<unknown, {}, {
            text: string;
        } & BaseSchema> & {
            text: string;
        } & BaseSchema & Required<{
            _id: mongoose.mongo.BSON.ObjectId;
        }> & {
            password?: string | boolean | undefined;
            objectId: string;
        };
    };
    error?: undefined;
}>;
declare const _default: {
    createSimpleMsg: typeof createSimpleMsg;
    removeSimpleMsgsByUser: typeof removeSimpleMsgsByUser;
    getAllSimpleMsgs: typeof getAllSimpleMsgs;
    updateSimpleMsg: typeof updateSimpleMsg;
    getSimpleMsgById: typeof getSimpleMsgById;
    removeSimpleMsg: typeof removeSimpleMsg;
};
export default _default;
