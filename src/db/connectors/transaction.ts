'use strict';

import mongoose from 'mongoose';
import { UserSchema } from 'src/db/connectors/user.js';
import dbWallet from 'src/db/connectors/wallet.js';
import dbConnector, { BaseSchema, BaseSchemaDef, CoordinatesSchema } from 'src/db/databaseConnector.js';
import ErrorCreator from 'src/error/errorCreator.js';
import errorCreator from 'src/error/errorCreator.js';

export type TransactionSchema = BaseSchema & {
  amount: number;
  toWalletId: string;
  fromWalletId: string;
  note?: string;
  coordinates?: CoordinatesSchema;
};

export const transactionSchema = new mongoose.Schema<TransactionSchema>({
  ...BaseSchemaDef,
  amount: Number,
  toWalletId: String,
  fromWalletId: String,
  note: String,
  coordinates: dbConnector.coordinatesSchema,
}, { collection: 'transactions' });

const Transaction = mongoose.model('transaction', transactionSchema);

async function updateObject({
  transactionId,
  update,
}: {
  transactionId: string;
  update: mongoose.UpdateQuery<TransactionSchema>;
}) {
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

async function getTransactions({
  filter,
  query,
}: {
  filter?: mongoose.ProjectionType<TransactionSchema>;
  query: mongoose.FilterQuery<TransactionSchema>;
}) {
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

async function getTransaction({
  query,
}: {
  query: mongoose.FilterQuery<TransactionSchema>;
}) {
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

async function getTransactionsByWallet({
  walletId,
}: {
  walletId: string;
}) {
  const query: mongoose.FilterQuery<TransactionSchema> = {
    $or: [
      { toWalletId: walletId },
      { fromWalletId: walletId },
    ],
  };

  return getTransactions({
    query,
  });
}

async function getTransactionsByUser({
  user,
}: {
  user: Partial<UserSchema>;
}) {
  const { error, data } = await dbWallet.getWalletsByUser({
    user,
    noVisibility: true,
  });

  if (error) {
    return { error };
  }

  const { wallets = [] } = data;
  const walletIds = wallets.map((wallet) => wallet.objectId);
  const query: mongoose.FilterQuery<TransactionSchema> = {
    $or: [
      { toWalletId: { $in: walletIds } },
      { fromWalletId: { $in: walletIds } },
    ],
  };

  return getTransactions({
    query,
  });
}

async function createTransaction({
  transaction,
}: {
  transaction: Partial<TransactionSchema>;
}) {
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

async function removeTransaction({
  transactionId,
}: {
  transactionId: string;
}) {
  return dbConnector.removeObject({
    object: Transaction,
    query: { _id: transactionId },
  });
}

async function getTransactionById({
  transactionId,
}: {
  transactionId: string;
}) {
  return getTransaction({
    query: { _id: transactionId },
  });
}

async function updateTransaction({
  transactionId,
  transaction,
  options = {},
}: {
  transactionId: string;
  transaction: Partial<TransactionSchema>;
  options?: {
    resetCoordinates?: boolean;
    resetOwnerAliasId?: boolean;
  };
}) {
  const {
    note,
    ownerAliasId,
  } = transaction;
  const {
    resetCoordinates = false,
    resetOwnerAliasId = false,
  } = options;
  const update: mongoose.UpdateQuery<TransactionSchema> = {};
  const set: mongoose.UpdateQuery<TransactionSchema>['$set'] = {};
  const unset: mongoose.UpdateQuery<TransactionSchema>['$unset'] = {};

  if (resetOwnerAliasId) {
    unset.ownerAliasId = '';
  } else if (ownerAliasId) {
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
