'use strict';
import mongoose from 'mongoose';
import dbWallet from 'src/db/connectors/wallet.js';
import dbConnector, { BaseSchemaDef } from 'src/db/databaseConnector.js';
import ErrorCreator from 'src/error/errorCreator.js';
import errorCreator from 'src/error/errorCreator.js';
export const transactionSchema = new mongoose.Schema({
    ...BaseSchemaDef,
    amount: Number,
    toWalletId: String,
    fromWalletId: String,
    note: String,
    coordinates: dbConnector.coordinatesSchema,
}, { collection: 'transactions' });
const Transaction = mongoose.model('transaction', transactionSchema);
async function updateObject({ transactionId, update, }) {
    const { error, data } = await dbConnector.updateObject({
        update,
        object: Transaction,
        query: { _id: transactionId },
        errorNameContent: 'updateTransactionObject',
    });
    if (error) {
        return { error };
    }
    if (!data?.object) {
        return { error: new ErrorCreator.DoesNotExist({ name: `transaction ${transactionId}` }) };
    }
    return { data: { transaction: data.object } };
}
async function getTransactions({ filter, query, }) {
    const { error, data } = await dbConnector.getObjects({
        query,
        filter,
        object: Transaction,
    });
    if (error) {
        return { error };
    }
    return {
        data: {
            transactions: data?.objects,
        },
    };
}
async function getTransaction({ query, }) {
    const { error, data } = await dbConnector.getObject({
        query,
        object: Transaction,
    });
    if (error) {
        return { error };
    }
    if (!data.object) {
        return { error: new errorCreator.DoesNotExist({ name: `transaction ${JSON.stringify(query, null, 4)}` }) };
    }
    return { data: { transaction: data.object } };
}
async function getTransactionsByWallet({ walletId, }) {
    const query = {
        $or: [
            { toWalletId: walletId },
            { fromWalletId: walletId },
        ],
    };
    return getTransactions({
        query,
    });
}
async function getTransactionsByUser({ user, }) {
    const { error, data } = await dbWallet.getWalletsByUser({
        user,
        noVisibility: true,
    });
    if (error) {
        return { error };
    }
    const { wallets = [] } = data;
    const walletIds = wallets.map((wallet) => wallet.objectId);
    const query = {
        $or: [
            { toWalletId: { $in: walletIds } },
            { fromWalletId: { $in: walletIds } },
        ],
    };
    return getTransactions({
        query,
    });
}
async function createTransaction({ transaction, }) {
    const { error, data } = await dbConnector.saveObject({
        object: Transaction,
        objectData: transaction,
        objectType: 'transaction',
    });
    if (error) {
        return { error };
    }
    return { data: { transaction: data.savedObject } };
}
async function removeTransaction({ transactionId, }) {
    return dbConnector.removeObject({
        object: Transaction,
        query: { _id: transactionId },
    });
}
async function getTransactionById({ transactionId, }) {
    return getTransaction({
        query: { _id: transactionId },
    });
}
async function updateTransaction({ transactionId, transaction, options = {}, }) {
    const { note, ownerAliasId, } = transaction;
    const { resetCoordinates = false, resetOwnerAliasId = false, } = options;
    const update = {};
    const set = {};
    const unset = {};
    if (resetOwnerAliasId) {
        unset.ownerAliasId = '';
    }
    else if (ownerAliasId) {
        set.ownerAliasId = ownerAliasId;
    }
    if (resetCoordinates) {
        unset.coordinates = '';
    }
    if (note) {
        set.note = note;
    }
    if (Object.keys(set).length > 0) {
        update.$set = set;
    }
    if (Object.keys(unset).length > 0) {
        update.$unset = unset;
    }
    return updateObject({
        transactionId,
        update,
    });
}
export default {
    createTransaction,
    getTransactionsByWallet,
    getTransactionsByUser,
    removeTransaction,
    getTransactionById,
    updateTransaction,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNhY3Rpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ0cmFuc2FjdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7QUFFYixPQUFPLFFBQVEsTUFBTSxVQUFVLENBQUM7QUFFaEMsT0FBTyxRQUFRLE1BQU0sNkJBQTZCLENBQUM7QUFDbkQsT0FBTyxXQUFXLEVBQUUsRUFBYyxhQUFhLEVBQXFCLE1BQU0sNkJBQTZCLENBQUM7QUFDeEcsT0FBTyxZQUFZLE1BQU0sMkJBQTJCLENBQUM7QUFDckQsT0FBTyxZQUFZLE1BQU0sMkJBQTJCLENBQUM7QUFVckQsTUFBTSxDQUFDLE1BQU0saUJBQWlCLEdBQUcsSUFBSSxRQUFRLENBQUMsTUFBTSxDQUFvQjtJQUN0RSxHQUFHLGFBQWE7SUFDaEIsTUFBTSxFQUFFLE1BQU07SUFDZCxVQUFVLEVBQUUsTUFBTTtJQUNsQixZQUFZLEVBQUUsTUFBTTtJQUNwQixJQUFJLEVBQUUsTUFBTTtJQUNaLFdBQVcsRUFBRSxXQUFXLENBQUMsaUJBQWlCO0NBQzNDLEVBQUUsRUFBRSxVQUFVLEVBQUUsY0FBYyxFQUFFLENBQUMsQ0FBQztBQUVuQyxNQUFNLFdBQVcsR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLGFBQWEsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO0FBRXJFLEtBQUssVUFBVSxZQUFZLENBQUMsRUFDMUIsYUFBYSxFQUNiLE1BQU0sR0FJUDtJQUNDLE1BQU0sRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEdBQUcsTUFBTSxXQUFXLENBQUMsWUFBWSxDQUFDO1FBQ3JELE1BQU07UUFDTixNQUFNLEVBQUUsV0FBVztRQUNuQixLQUFLLEVBQUUsRUFBRSxHQUFHLEVBQUUsYUFBYSxFQUFFO1FBQzdCLGdCQUFnQixFQUFFLHlCQUF5QjtLQUM1QyxDQUFDLENBQUM7SUFFSCxJQUFJLEtBQUssRUFBRSxDQUFDO1FBQ1YsT0FBTyxFQUFFLEtBQUssRUFBRSxDQUFDO0lBQ25CLENB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