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
import { DeviceType } from 'src/config/defaults/dbConfig.js';
import { UserSchema } from 'src/db/connectors/user.js';
import { BaseSchema } from 'src/db/databaseConnector.js';
type DeviceSchema = BaseSchema & {
    deviceName: string;
    socketId: string;
    lastUserId: string;
    connectedToUser: string;
    deviceType: DeviceType;
};
declare function createDevice({ device, }: {
    device: Partial<DeviceSchema> & {
        deviceName: string;
    };
}): Promise<{
    error: import("src/error/AlreadyExists.js").default;
    data?: undefined;
} | {
    data: {
        device: {
            deviceName: string;
            socketId: string;
            lastUserId: string;
            connectedToUser: string;
            deviceType: DeviceType;
        } & BaseSchema & {
            password?: string | boolean | undefined;
            objectId: string;
        };
    };
    error?: undefined;
}>;
declare function updateDevice({ deviceId, deviceSocketId, device, suppressError, options, }: {
    deviceId?: string;
    deviceSocketId?: string;
    device: Partial<DeviceSchema>;
    suppressError?: boolean;
    options?: {
        resetSocket?: boolean;
        resetOwnerAliasId?: boolean;
    };
}): Promise<{
    error: import("src/error/DoesNotExist.js").default;
    data?: undefined;
} | {
    data: {
        device: {
            deviceName: string;
            socketId: string;
            lastUserId: string;
            connectedToUser: string;
            deviceType: DeviceType;
        } & BaseSchema;
    };
    error?: undefined;
}>;
declare function getDevicesByUser({ user, }: {
    user: Partial<UserSchema>;
}): Promise<{
    error: import("src/error/GeneralError.js").ChildError;
    data?: undefined;
} | {
    data: {
        devices: ({
            deviceName: string;
            socketId: string;
            lastUserId: string;
            connectedToUser: string;
            deviceType: DeviceType;
        } & BaseSchema)[] | undefined;
    };
    error?: undefined;
}>;
declare function getDeviceById({ deviceId, }: {
    deviceId: string;
}): Promise<{
    error: import("src/error/DoesNotExist.js").default;
    data?: undefined;
} | {
    data: {
        device: mongoose.Document<unknown, {}, {
            deviceName: string;
            socketId: string;
            lastUserId: string;
            connectedToUser: string;
            deviceType: DeviceType;
        } & BaseSchema> & {
            deviceName: string;
            socketId: string;
            lastUserId: string;
            connectedToUser: string;
            deviceType: DeviceType;
        } & BaseSchema & Required<{
            _id: mongoose.mongo.BSON.ObjectId;
        }> & {
            password?: string | boolean | undefined;
            objectId: string;
        };
    };
    error?: undefined;
}>;
declare function removeDevice({ deviceId, }: {
    deviceId: string;
}): Promise<{
    data: {
        success: boolean;
    };
    error?: undefined;
} | {
    error: import("src/error/Database.js").default;
    data?: undefined;
}>;
declare function getDeviceBySocketId({ socketId, }: {
    socketId: string;
}): Promise<{
    error: import("src/error/DoesNotExist.js").default;
    data?: undefined;
} | {
    data: {
        device: mongoose.Document<unknown, {}, {
            deviceName: string;
            socketId: string;
            lastUserId: string;
            connectedToUser: string;
            deviceType: DeviceType;
        } & BaseSchema> & {
            deviceName: string;
            socketId: string;
            lastUserId: string;
            connectedToUser: string;
            deviceType: DeviceType;
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
    updateDevice: typeof updateDevice;
    createDevice: typeof createDevice;
    getDevicesByUser: typeof getDevicesByUser;
    getDeviceById: typeof getDeviceById;
    removeDevice: typeof removeDevice;
    getDeviceBySocketId: typeof getDeviceBySocketId;
};
export default _default;
