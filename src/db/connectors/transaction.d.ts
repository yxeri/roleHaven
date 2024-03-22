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
import { BaseSchema, CoordinatesSchema } from 'src/db/databaseConnector.js';
export type TransactionSchema = BaseSchema & {
    amount: number;
    toWalletId: string;
    fromWalletId: string;
    note?: string;
    coordinates?: CoordinatesSchema;
};
export declare const transactionSchema: mongoose.Schema<TransactionSchema, mongoose.Model<TransactionSchema, any, any, any, mongoose.Document<unknown, any, TransactionSchema> & BaseSchema & {
    amount: number;
    toWalletId: string;
    fromWalletId: string;
    note?: string | undefined;
    coordinates?: CoordinatesSchema | undefined;
} & Required<{
    _id: mongoose.mongo.BSON.ObjectId;
}>, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, TransactionSchema, mongoose.Document<unknown, {}, mongoose.FlatRecord<TransactionSchema>> & mongoose.FlatRecord<TransactionSchema> & Required<{
    _id: mongoose.mongo.BSON.ObjectId;
}>>;
declare function getTransactionsByWallet({ walletId, }: {
    walletId: string;
}): Promise<{
    error: import("src/error/GeneralError.js").ChildError;
    data?: undefined;
} | {
    data: {
        transactions: ({
            amount: number;
            toWalletId: string;
            fromWalletId: string;
            note?: string | undefined;
            coordinates?: CoordinatesSchema | undefined;
        } & BaseSchema)[] | undefined;
    };
    error?: undefined;
}>;
declare function getTransactionsByUser({ user, }: {
    user: Partial<UserSchema>;
}): Promise<{
    error: import("src/error/GeneralError.js").ChildError;
    data?: undefined;
} | {
    data: {
        transactions: ({
            amount: number;
            toWalletId: string;
            fromWalletId: string;
            note?: string | undefined;
            coordinates?: CoordinatesSchema | undefined;
        } & BaseSchema)[] | undefined;
    };
    error?: undefined;
}>;
declare function createTransaction({ transaction, }: {
    transaction: Partial<TransactionSchema>;
}): Promise<{
    error: import("src/error/Database.js").default;
    data?: undefined;
} | {
    data: {
        transaction: {
            amount: number;
            toWalletId: string;
            fromWalletId: string;
            note?: string | undefined;
            coordinates?: CoordinatesSchema | undefined;
        } & BaseSchema & {
            password?: string | boolean | undefined;
            objectId: string;
        };
    };
    error?: undefined;
}>;
declare function removeTransaction({ transactionId, }: {
    transactionId: string;
}): Promise<{
    data: {
        success: boolean;
    };
    error?: undefined;
} | {
    error: import("src/error/Database.js").default;
    data?: undefined;
}>;
declare function getTransactionById({ transactionId, }: {
    transactionId: string;
}): Promise<{
    error: import("src/error/DoesNotExist.js").default;
    data?: undefined;
} | {
    data: {
        transaction: mongoose.Document<unknown, {}, {
            amount: number;
            toWalletId: string;
            fromWalletId: string;
            note?: string | undefined;
            coordinates?: CoordinatesSchema | undefined;
        } & BaseSchema> & {
            amount: number;
            toWalletId: string;
            fromWalletId: string;
            note?: string | undefined;
            coordinates?: CoordinatesSchema | undefined;
        } & BaseSchema & Required<{
            _id: mongoose.mongo.BSON.ObjectId;
        }> & {
            password?: string | boolean | undefined;
            objectId: string;
        };
    };
    error?: undefined;
}>;
declare function updateTransaction({ transactionId, transaction, options, }: {
    transactionId: string;
    transaction: Partial<TransactionSchema>;
    options?: {
        resetCoordinates?: boolean;
        resetOwnerAliasId?: boolean;
    };
}): Promise<{
    error: import("src/error/DoesNotExist.js").default;
    data?: undefined;
} | {
    data: {
        transaction: {
            amount: number;
            toWalletId: string;
            fromWalletId: string;
            note?: string | undefined;
            coordinates?: CoordinatesSchema | undefined;
        } & BaseSchema;
    };
    error?: undefined;
}>;
declare const _default: {
    createTransaction: typeof createTransaction;
    getTransactionsByWallet: typeof getTransactionsByWallet;
    getTransactionsByUser: typeof getTransactionsByUser;
    removeTransaction: typeof removeTransaction;
    getTransactionById: typeof getTransactionById;
    updateTransaction: typeof updateTransaction;
};
export default _default;
