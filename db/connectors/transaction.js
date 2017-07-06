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
const databaseConnector = require('../databaseConnector');
const errorCreator = require('../../objects/error/errorCreator');

const transactionSchema = new mongoose.Schema({
  time: { type: Date, default: new Date() },
  amount: Number,
  to: String,
  from: String,
  coordinates: {
    longitude: Number,
    latitude: Number,
    accuracy: Number,
  },
  note: String,
}, { collection: 'transactions' });

const Transaction = mongoose.model('transaction', transactionSchema);

/**
 * Get transactions
 * @param {string} params.to Receiver
 * @param {string} params.from Sender
 * @param {Function} params.callback Callback
 */
function getTransactions({ to, from, callback }) {
  const query = { $and: [{ to }, { from }] };

  Transaction.find(query).lean().exec((err, transaction) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'getTransactions' }) });

      return;
    } else if (!transaction) {
      callback({ error: new errorCreator.DoesNotExist({ name: `transaction ${to} ${from}` }) });

      return;
    }

    callback({ data: { transaction } });
  });
}

/**
 * Get all transactions made by a user/team
 * @param {string} params.owner Name of the user/team
 * @param {Function} params.callback Callback
 */
function getAllTransactions({ owner, callback }) {
  const query = { $or: [{ to: owner }, { from: owner }] };

  Transaction.find(query).lean().exec((err, transactions = []) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'getAllTransactions' }) });

      return;
    }

    callback({ data: { transactions } });
  });
}

/**
 * Create and save transaction
 * @param {Object} params.transaction New transaction
 * @param {Function} params.callback Callback
 */
function createTransaction({ transaction, callback }) {
  const newTransaction = new Transaction(transaction);

  databaseConnector.saveObject({
    object: newTransaction,
    objectType: 'transaction',
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ data });
    },
  });
}

exports.createTransaction = createTransaction;
exports.getTransactions = getTransactions;
exports.getAllTransactions = getAllTransactions;

