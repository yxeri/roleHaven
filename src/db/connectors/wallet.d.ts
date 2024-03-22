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
export type WalletSchema = BaseSchema & {
    amount: number;
    isProtected: boolean;
};
export declare const walletSchema: mongoose.Schema<WalletSchema, mongoose.Model<WalletSchema, any, any, any, mongoose.Document<unknown, any, WalletSchema> & BaseSchema & {
    amount: number;
    isProtected: boolean;
} & Required<{
    _id: ObjectId;
}>, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, WalletSchema, mongoose.Document<unknown, {}, mongoose.FlatRecord<WalletSchema>> & mongoose.FlatRecord<WalletSchema> & Required<{
    _id: ObjectId;
}>>;
declare function getAllWallets(): Promise<{
    error: import("src/error/GeneralError.js").ChildError;
    data?: undefined;
} | {
    data: {
        wallets: ({
            amount: number;
            isProtected: boolean;
        } & BaseSchema)[] | undefined;
    };
    error?: undefined;
}>;
declare function getWalletsByTeams({ teamIds, }: {
    teamIds: string[];
}): Promise<{
    error: import("src/error/GeneralError.js").ChildError;
    data?: undefined;
} | {
    data: {
        wallets: ({
            amount: number;
            isProtected: boolean;
        } & BaseSchema)[] | undefined;
    };
    error?: undefined;
}>;
declare function getWalletsByUser({ user, noVisibility, }: {
    user: Partial<UserSchema>;
    noVisibility?: boolean;
}): Promise<{
    error: import("src/error/GeneralError.js").ChildError;
    data?: undefined;
} | {
    data: {
        wallets: ({
            amount: number;
            isProtected: boolean;
        } & BaseSchema)[] | undefined;
    };
    error?: undefined;
}>;
declare function createWallet({ wallet, options, }: {
    wallet: Partial<WalletSchema>;
    options?: {
        setId?: boolean;
    };
}): Promise<{
    error: import("src/error/Database.js").default;
    data?: undefined;
} | {
    data: {
        wallet: {
            amount: number;
            isProtected: boolean;
        } & BaseSchema & {
            password?: string | boolean | undefined;
            objectId: string;
        };
    };
    error?: undefined;
}>;
declare function updateWallet({ walletId, wallet, options, }: {
    walletId: string;
    wallet: Partial<WalletSchema>;
    options?: {
        resetAmount?: boolean;
        shouldDecreaseAmount?: boolean;
        resetOwnerAliasId?: boolean;
    };
}): Promise<{
    error: import("src/error/DoesNotExist.js").default;
    data?: undefined;
} | {
    data: {
        wallet: {
            amount: number;
            isProtected: boolean;
        } & BaseSchema;
    };
    error?: undefined;
}>;
declare function removeWallet({ walletId, }: {
    walletId: string;
}): Promise<{
    data: {
        success: boolean;
    };
    error?: undefined;
} | {
    error: import("src/error/Database.js").default;
    data?: undefined;
}>;
declare function getWalletsByIds({ walletIds, }: {
    walletIds: string[];
}): Promise<{
    error: import("src/error/GeneralError.js").ChildError;
    data?: undefined;
} | {
    data: {
        wallets: ({
            amount: number;
            isProtected: boolean;
        } & BaseSchema)[] | undefined;
    };
    error?: undefined;
}>;
declare function getWalletById({ walletId, }: {
    walletId: string;
}): Promise<{
    error: import("src/error/DoesNotExist.js").default;
    data?: undefined;
} | {
    data: {
        wallet: mongoose.Document<unknown, {}, {
            amount: number;
            isProtected: boolean;
        } & BaseSchema> & {
            amount: number;
            isProtected: boolean;
        } & BaseSchema & Required<{
            _id: ObjectId;
        }> & {
            password?: string | boolean | undefined;
            objectId: string;
        };
    };
    error?: undefined;
}>;
declare const _default: {
    createWallet: typeof createWallet;
    getAllWallets: typeof getAllWallets;
    getWalletsByUser: typeof getWalletsByUser;
    removeWallet: typeof removeWallet;
    updateWallet: typeof updateWallet;
    getWalletsByTeams: typeof getWalletsByTeams;
    getWalletsByIds: typeof getWalletsByIds;
    getWalletById: typeof getWalletById;
};
export default _default;
