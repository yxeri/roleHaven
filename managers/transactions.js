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
const errorCreator = require('../error/errorCreator');
const dbTransaction = require('../db/connectors/transaction');
const authenticator = require('../helpers/authenticator');
const walletManager = require('./wallets');

/**
 * Get transaction by Id and check if the user has access to it.
 * @param {Object} params - Parameters.
 * @param {Object} params.user - User retrieving the wallet.
 * @param {string} params.transactionId - Id of the transaction to retrieve.
 * @param {Function} params.callback - Callback.
 * @param {string} [params.errorContentText] - Text to be printed on error.
 * @param {boolean} [params.shouldBeAdmin] - Does the user have to be an admin?
 */
function getAccessibleTransaction({
  user,
  transactionId,
  callback,
  shouldBeAdmin,
  full,
  errorContentText = `transactionId ${transactionId}`,
}) {
  dbTransaction.getTransactionById({
    transactionId,
    callback: (transactionData) => {
      if (transactionData.error) {
        callback({ error: transactionData.error });

        return;
      } else if (!authenticator.hasAccessTo({
        shouldBeAdmin,
        toAuth: user,
        objectToAccess: transactionData.data.transaction,
      })) {
        callback({ error: new errorCreator.NotAllowed({ name: errorContentText }) });

        return;
      }

      const foundTransaction = transactionData.data.transaction;
      const filteredTransaction = {
        amount: foundTransaction.amount,
        toWalletId: foundTransaction.toWalletId,
        fromWalletId: foundTransaction.fromWalletId,
        note: foundTransaction.note,
        coordinates: foundTransaction.coordinates,
        ownerId: foundTransaction.ownerId,
        ownerAliasId: foundTransaction.ownerAliasId,
        timeCreated: foundTransaction.timeCreated,
        customTimeCreated: foundTransaction.customTimeCreated,
        lastUpdated: foundTransaction.lastUpdated,
        customLastUpdated: foundTransaction.customLastUpdated,
      };

      callback({
        data: {
          transaction: full ? foundTransaction : filteredTransaction,
        },
      });
    },
  });
}

/**
 * Get transactions for a wallet.
 * @param {Object} params - Parameters.
 * @param {string} walletId - Id of the wallet.
 * @param {Function} params.callback - Callback.
 */
function getTransactionsByWallet({
  walletId,
  token,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
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
            callback: ({ error: transError, data: transData }) => {
              if (transError) {
                callback({ error: transError });

                return;
              }

              callback({ data: transData });
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
  newTransaction.ownerId = newTransaction.ownerId || dbConfig.users.systemUser.objectId;

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
                  transaction: createdTransaction,
                  changeType: dbConfig.ChangeTypes.CREATE,
                },
              };

              io.to(fromWallet.objectId).emit(dbConfig.EmitTypes.TRANSACTION, dataToSend);
              io.to(toWallet.objectId).emit(dbConfig.EmitTypes.TRANSACTION, dataToSend);

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
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { objectId: userId } = data.user;

      const transactionToCreate = transaction;
      transactionToCreate.ownerId = userId;

      createTransaction({
        transaction,
        io,
        callback,
      });
    },
  });
}

/**
 * Get transaction by Id.
 * @param {Object} params - Parameters.
 * @param {string} params.transactionId - Id of the transaction to retrieve.
 * @param {string} params.token - jwt.
 * @param {Function} params.callback - Callback.
 */
function getTransactionById({
  transactionId,
  token,
  callback,
  full,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetTransaction.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user } = data;

      getAccessibleTransaction({
        user,
        full,
        transactionId,
        callback,
        shouldBeAdmin: full && dbConfig.apiCommands.GetFull.accessLevel > user.accessLevel,
      });
    },
  });
}

/**
 * Remove a transaction.
 * @param {Object} params - Parameters.
 * @param {string} params.token - jwt.
 * @param {string} params.transactionId - Id of the transaction to remove.
 * @param {Function} params.callback - Callback.
 * @param {Object} params.io - Socket.io.
 */
function removeTransaction({
  token,
  transactionId,
  callback,
  io,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.RemoveTransaction.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbTransaction.removeTransaction({
        transactionId,
        callback: ({ error: transactionError }) => {
          if (transactionError) {
            callback({ error: transactionError });

            return;
          }

          const dataToSend = {
            data: {
              changeType: dbConfig.ChangeTypes.REMOVE,
              transaction: { objectId: transactionId },
            },
          };

          io.emit(dbConfig.EmitTypes.TRANSACTION, dataToSend);

          callback(dataToSend);
        },
      });
    },
  });
}

/**
 * Update transaction.
 * @param {Object} params - Parameters.
 * @param {Object} params.transaction - Transaction.
 * @parm {Object} params.options - Options.
 * @param {Function} params.callback - Callback.
 * @param {Object} params.io - Socket io. Will be used if socket is not set.
 * @param {Object} [params.socket] - Socket io.
 */
function updateTransaction({
  token,
  transaction,
  transactionId,
  options,
  callback,
  socket,
  io,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.UpdateTransaction.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user } = data;

      getAccessibleTransaction({
        transactionId,
        user,
        shouldBeAdmin: true,
        errorContentText: `update transaction ${transactionId}`,
        callback: (transactionData) => {
          if (transactionData.error) {
            callback({ error: transactionData.error });

            return;
          }

          dbTransaction.updateTransaction({
            options,
            transaction,
            transactionId,
            callback: (updateData) => {
              if (updateData.error) {
                callback({ error: updateData.error });

                return;
              }

              const dataToSend = {
                data: {
                  transaction: updateData.data.transaction,
                  changeType: dbConfig.ChangeTypes.UPDATE,
                },
              };

              if (socket) {
                socket.broadcast.emit(dbConfig.EmitTypes.TRANSACTION, dataToSend);
              } else {
                io.emit(dbConfig.EmitTypes.TRANSACTION, dataToSend);
              }

              callback(dataToSend);
            },
          });
        },
      });
    },
  });
}

/**
 * Get transactions created by the user.
 * @param {Object} params - Parameters.
 * @param {string} params.token - jwt.
 * @param {Function} params.callback - Callback.
 * @param {boolean} [params.full] - Should the complete objects be returned?
 */
function getTransactionsCreatedByUser({
  token,
  callback,
  full,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: full ? dbConfig.apiCommands.GetFull.name : dbConfig.apiCommands.GetTransaction.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { userId } = data.user;

      dbTransaction.getTransactionsCreatedByUser({
        full,
        userId,
        callback: ({ error: transactionsError, data: transactionsData }) => {
          if (transactionsError) {
            callback({ error: transactionsError });

            return;
          }

          callback({ data: transactionsData });
        },
      });
    },
  });
}

exports.createTransactionBasedOnToken = createTransactionBasedOnToken;
exports.getTransactionsByWallet = getTransactionsByWallet;
exports.createTransaction = createTransaction;
exports.getTransactionById = getTransactionById;
exports.removeTransaction = removeTransaction;
exports.updateTransaction = updateTransaction;
exports.getTransactionsCreatedByUser = getTransactionsCreatedByUser;
