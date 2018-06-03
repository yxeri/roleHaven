/*
 Copyright 2017 Aleksandar Jankovic

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

'use strict';

const mongoose = require('mongoose');
const dbConnector = require('../databaseConnector');
const dbWallet = require('./wallet');
const errorCreator = require('../../error/errorCreator');

const transactionSchema = new mongoose.Schema(dbConnector.createSchema({
  amount: Number,
  toWalletId: String,
  fromWalletId: String,
  note: String,
  coordinates: dbConnector.coordinatesSchema,
}), { collection: 'transactions' });

const Transaction = mongoose.model('transaction', transactionSchema);

const transactionFilter = dbConnector.createFilter({
  amount: 1,
  toWalletId: 1,
  fromWalletId: 1,
  note: 1,
  coordinates: 1,
});

/**
 * Update transaction properties.
 * @param {Object} params - Parameters.
 * @param {string} params.transactionId - Id of the transaction to update.
 * @param {Object} params.update - Properties to update.
 * @param {Function} params.callback - Callback.
 */
function updateObject({ transactionId, update, callback }) {
  dbConnector.updateObject({
    update,
    object: Transaction,
    query: { _id: transactionId },
    errorNameContent: 'updateTransactionObject',
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ data: { transaction: data.object } });
    },
  });
}

/**
 * Get transactions
 * @private
 * @param {Object} params - Parameters
 * @param {Object} params.query - Query to get transactions
 * @param {Function} params.callback - Callback
 */
function getTransactions({ filter, query, callback }) {
  dbConnector.getObjects({
    query,
    filter,
    object: Transaction,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({
        data: {
          transactions: data.objects,
        },
      });
    },
  });
}

/**
 * Get transaction
 * @private
 * @param {Object} params - Parameters
 * @param {Object} params.query - Query to get transaction
 * @param {Function} params.callback - Callback
 */
function getTransaction({ query, callback }) {
  dbConnector.getObject({
    query,
    object: Transaction,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!data.object) {
        callback({ error: new errorCreator.DoesNotExist({ name: `transaction ${JSON.stringify(query, null, 4)}` }) });

        return;
      }

      callback({ data: { transaction: data.object } });
    },
  });
}

/**
 * Get transactions
 * @param {Object} params - Parameters
 * @param {string} params.walletId - Wallet ID
 * @param {Function} params.callback - Callback
 */
function getTransactionsByWallet({ walletId, callback }) {
  const query = {
    $or: [
      { toWalletId: walletId },
      { fromWalletId: walletId },
    ],
  };

  getTransactions({
    query,
    callback,
  });
}

/**
 * Get transactions by user
 * @param {Object} params - Parameters
 * @param {string} params.userId - Id of the user
 * @param {Function} params.callback - Callback
 */
function getTransactionsByUser({ userId, callback }) {
  dbWallet.getWalletsByUser({
    userId,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const walletIds = data.wallets.map(wallet => wallet.walletId);
      const query = {
        $or: [
          { fromWalletId: { $in: walletIds } },
          { toWalletId: { $in: walletIds } },
        ],
      };

      getTransactions({
        callback,
        query,
      });
    },
  });
}

/**
 * Create and save transaction
 * @param {Object} params - Parameters
 * @param {Object} params.transaction - New transaction
 * @param {Function} params.callback - Callback
 */
function createTransaction({ transaction, callback }) {
  const newTransaction = new Transaction(transaction);

  dbConnector.saveObject({
    object: newTransaction,
    objectType: 'transaction',
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ data: { transaction: data.savedObject } });
    },
  });
}

/**
 * Remove transaction
 * @param {Object} params - Parameters
 * @param {string} params.transactionId - ID of the transaction
 * @param {Function} params.callback - Callback
 */
function removeTransaction({ transactionId, callback }) {
  dbConnector.removeObject({
    callback,
    object: Transaction,
    query: { _id: transactionId },
  });
}

/**
 * Get all transactions
 * @param {Object} params - Parameters
 * @param {Function} params.callback - Callback
 */
function getAllTransactions({ callback }) {
  getTransactions({ callback });
}

/**
 * Get transaction by Id.
 * @param {Object} params - Parameters.
 * @param {string} params.transactionId - Id of the transaction.
 * @param {Function} params.callback - Callback.
 */
function getTransactionById({
  transactionId,
  callback,
}) {
  getTransaction({
    callback,
    query: { _id: transactionId },
  });
}

/**
 * Update transaction properties.
 * @param {Object} params - Parameters
 * @param {Object} params.transaction - Properties to update in the transaction.
 * @param {string} params.transactionId - Id of the transaction to update.
 * @param {Object} [params.options] - Update options.
 * @param {Function} params.callback - Callback.
 */
function updateTransaction({
  transactionId,
  transaction,
  callback,
  options = {},
}) {
  const {
    note,
    ownerAliasId,
  } = transaction;
  const {
    resetCoordinates = false,
    resetOwnerAliasId = false,
  } = options;
  const update = {
    $set: {},
    $unset: {},
  };

  if (resetOwnerAliasId) {
    update.$unset.ownerAliasId = '';
  } else if (ownerAliasId) {
    update.$set.ownerAliasId = ownerAliasId;
  }

  if (resetCoordinates) { update.$unset.coordinates = ''; }

  if (note) { update.$set.note = note; }

  updateObject({
    transactionId,
    update,
    callback,
  });
}

/**
 * Get transactions created by the user.
 * @param {Object} params - Parameters.
 * @param {string} params.userId - Id of the user.
 * @param {Function} params.callback - Callback.
 * @param {boolean} [params.full] - Should the complete objects be returned?
 */
function getTransactionsCreatedByUser({
  userId,
  callback,
  full,
}) {
  const filter = !full ? transactionFilter : {};

  getTransactions({
    filter,
    callback,
    query: { ownerId: userId },
  });
}

exports.createTransaction = createTransaction;
exports.getTransactionsByWallet = getTransactionsByWallet;
exports.getTransactionsByUser = getTransactionsByUser;
exports.removeTransaction = removeTransaction;
exports.getAllTransactions = getAllTransactions;
exports.getTransactionById = getTransactionById;
exports.updateTransaction = updateTransaction;
exports.getTransactionsCreatedByUser = getTransactionsCreatedByUser;

