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
const logger = require('../../utils/logger');

const transactionSchema = new mongoose.Schema({
  amount: Number,
  to: String,
  from: String,
  time: Date,
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
 * @param {string} to Receiver
 * @param {string} from Sender
 * @param {Function} callback Callback
 */
function getTransactions(to, from, callback) {
  const query = { $and: [{ to }, { from }] };

  Transaction.find(query).lean().exec((err, transaction) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to get wallet'],
        err,
      });
    }

    callback(err, transaction);
  });
}

/**
 * Get all transactions made by a user/team
 * @param {string} owner Name of the user/team
 * @param {Function} callback Callback
 */
function getAllTransactions(owner, callback) {
  const query = { $or: [{ to: owner }, { from: owner }] };

  Transaction.find(query).lean().exec((err, transactions) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to get wallet'],
        err,
      });
    }

    callback(err, transactions);
  });
}

/**
 * Create and save transaction
 * @param {Object} transaction - New transaction
 * @param {Function} callback - Callback
 */
function createTransaction(transaction, callback) {
  const newTransaction = new Transaction(transaction);

  databaseConnector.saveObject(newTransaction, 'transaction', (err, trans) => {
    if (err) {
      callback(err, null);

      return;
    }

    callback(err, trans);
  });
}

exports.createTransaction = createTransaction;
exports.getTransactions = getTransactions;
exports.getAllTransactions = getAllTransactions;

