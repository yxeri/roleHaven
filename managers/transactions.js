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

const dbConfig = require('../config/defaults/config').databasePopulation;
const errorCreator = require('../objects/error/errorCreator');
const dbTransaction = require('../db/connectors/transaction');
const authenticator = require('../helpers/authenticator');
const walletManager = require('./wallets');

/**
 * Get transactions for a wallet.
 * @param {Object} params - Parameters.
 * @param {string} walletId - Id of the wallet.
 * @param {Function} params.callback - Callback.
 * @param {string} params.userId - Id of the user retrieving the transactions.
 */
function getTransactions({
  userId,
  walletId,
  token,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    matchToId: userId,
    commandName: dbConfig.apiCommands.GetTransaction.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user } = data;

      walletManager.getAccessibleWallet({
        walletId,
        user,
        callback: (walletData) => {
          if (walletData.error) {
            callback({ error: walletData.error });

            return;
          }

          dbTransaction.getTransactionsByWallet({
            walletId,
            callback: (transactionsData) => {
              if (transactionsData.error) {
                callback({ err: transactionsData.error });

                return;
              }

              const { transactions } = transactionsData.data;
              const fromTransactions = [];
              const toTransactions = transactions.filter((transaction) => {
                if (transaction.toWalletId === walletId) {
                  fromTransactions.push(transaction);

                  return false;
                }

                return true;
              });

              const dataToSend = {
                data: {
                  transactions: {
                    sender: fromTransactions,
                    receiver: toTransactions,
                  },
                },
              };

              callback(dataToSend);
            },
          });
        },
      });
    },
  });
}

/**
 * Create transaction.
 * @param {Object} params - Parameters.
 * @param {Object} params.transaction - Transaction parameters to create.
 * @param {Object} params.io - Socket io. - Used if socket is not set.
 * @param {Function} callback - Callback.
 */
function createTransaction({
  transaction,
  io,
  callback,
}) {
  if (transaction.fromWalletId === transaction.toWalletId) {
    callback({ error: new errorCreator.InvalidData({ name: 'transfer to self' }) });

    return;
  } else if (transaction.amount <= 0) {
    callback({ error: new errorCreator.Insufficient({ name: 'amount is 0 or less' }) });

    return;
  }

  const newTransaction = transaction;
  newTransaction.amount = Math.abs(newTransaction.amount);

  walletManager.getWalletsAndCheckAmount({
    fromWalletId: newTransaction.fromWalletId,
    toWalletId: newTransaction.toWalletId,
    amount: newTransaction.amount,
    callback: (walletsData) => {
      if (walletsData.error) {
        callback({ error: walletsData.error });

        return;
      }

      dbTransaction.createTransaction({
        transaction: newTransaction,
        callback: (transactionData) => {
          if (transactionData.error) {
            callback({ error: transactionData.error });

            return;
          }

          const createdTransaction = transactionData.data.transaction;

          walletManager.runTransaction({
            transaction: createdTransaction,
            callback: (updatedWalletsData) => {
              if (updatedWalletsData.error) {
                callback({ error: updatedWalletsData.error });

                return;
              }

              const { fromWallet, toWallet } = updatedWalletsData.data;
              const dataToSend = {
                data: {
                  transaction: createTransaction,
                  changeType: dbConfig.EmitTypes.TRANSACTION,
                },
              };

              io.to(fromWallet.walletId).emit(dbConfig.EmitTypes.TRANSACTION, dataToSend);
              io.to(toWallet.walletId).emit(dbConfig.EmitTypes.TRANSACTION, dataToSend);

              callback(dataToSend);
            },
          });
        },
      });
    },
  });
}

/**
 * Create transaction based on user access.
 * @param {Object} params - Parameters.
 * @param {Object} params.token - jwt.
 * @param {Object} params.transaction - New transaction.
 * @param {Object} params.io - Socket.io. Will be used if socket is not set.
 * @param {Function} params.callback - Callback.
 */
function createTransactionBasedOnToken({
  transaction,
  io,
  token,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.CreateTransaction.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      createTransaction({
        transaction,
        io,
        callback,
      });
    },
  });
}

exports.createTransactionBasedOnToken = createTransactionBasedOnToken;
exports.getTransactions = getTransactions;
exports.createTransaction = createTransaction;
