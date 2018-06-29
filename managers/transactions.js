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

const { dbConfig } = require('../config/defaults/config');
const errorCreator = require('../error/errorCreator');
const dbTransaction = require('../db/connectors/transaction');
const authenticator = require('../helpers/authenticator');
const walletManager = require('./wallets');
const managerHelper = require('../helpers/manager');

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
  internalCallUser,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    internalCallUser,
    commandName: dbConfig.apiCommands.GetTransaction.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user: authUser } = data;

      dbTransaction.getTransactionById({
        transactionId,
        callback: ({ error: transactionError, data: transactionData }) => {
          if (transactionError) {
            callback({ error: transactionError });

            return;
          }

          const { transaction: foundTransaction } = transactionData;
          const {
            hasAccess,
            canSee,
          } = authenticator.hasAccessTo({
            objectToAccess: foundTransaction,
            toAuth: authUser,
          });

          if (!canSee) {
            callback({ error: errorCreator.NotAllowed({ name: `transaction ${transactionId}` }) });

            return;
          } else if (!hasAccess) {
            callback({ data: { transaction: managerHelper.stripObject({ object: foundTransaction }) } });

            return;
          }

          callback({ data: transactionData });
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

      const { user: authUser } = data;

      walletManager.getWalletById({
        walletId,
        internalCallUser: authUser,
        callback: ({ error: walletError }) => {
          if (walletError) {
            callback({ error: walletError });

            return;
          }

          dbTransaction.getTransactionsByWallet({
            walletId,
            callback: ({ error: transError, data: transData }) => {
              if (transError) {
                callback({ error: transError });

                return;
              }

              const { transactions } = transData;

              callback({ data: { transactions } });
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

  walletManager.checkAmount({
    walletId: newTransaction.fromWalletId,
    amount: newTransaction.amount,
    callback: ({ error: amountError }) => {
      if (amountError) {
        callback({ error: amountError });

        return;
      }

      dbTransaction.createTransaction({
        transaction: newTransaction,
        callback: ({ error: transactionError, data: transactionData }) => {
          if (transactionError) {
            callback({ error: transactionError });

            return;
          }

          const { transaction: createdTransaction } = transactionData;

          walletManager.runTransaction({
            transaction: createdTransaction,
            callback: ({ error: runTransactionError, data: runTransactionData }) => {
              if (runTransactionError) {
                callback({ error: runTransactionError });

                return;
              }

              const { fromWallet, toWallet } = runTransactionData;
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
 * @param {Object} params.io - Socket.io.
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

      const { user: authUser } = data;

      walletManager.getWalletById({
        internalCallUser: authUser,
        walletId: transaction.fromWalletId,
        callback: ({ error: walletError, data: walletData }) => {
          if (walletError) {
            callback({ error: walletError });

            return;
          }

          const transactionToCreate = transaction;
          const { wallet: foundWallet } = walletData;

          transactionToCreate.teamId = foundWallet.teamId;
          transactionToCreate.ownerId = foundWallet.ownerId;
          transactionToCreate.ownerAliasId = foundWallet.ownerAliasId;

          createTransaction({
            io,
            callback,
            transaction: transactionToCreate,
          });
        },
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
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user: authUser } = data;

      getTransactionById({
        transactionId,
        internalCallUser: authUser,
        callback: ({ error: getTransactionError, data: getTransactionData }) => {
          if (getTransactionError) {
            callback({ error: getTransactionError });

            return;
          }

          const { transaction: foundTransaction } = getTransactionData;
          const {
            hasFullAccess,
          } = authenticator.hasAccessTo({
            objectToAccess: foundTransaction,
            toAuth: authUser,
          });

          console.log('found', foundTransaction, 'access', authenticator.hasAccessTo({
            objectToAccess: foundTransaction,
            toAuth: authUser,
          }), 'user', authUser);

          if (!hasFullAccess) {
            callback({ error: new errorCreator.NotAllowed({ name: `remove transaction ${transactionId}` }) });

            return;
          }

          const {
            amount,
            fromWalletId,
            toWalletId,
          } = foundTransaction;
          const reversedTransaction = {
            amount,
            objectId: transactionId,
            fromWalletId: toWalletId,
            toWalletId: fromWalletId,
          };

          walletManager.runTransaction({
            transaction: reversedTransaction,
            callback: ({ error: runTransactionError, data: runTransactionData }) => {
              if (runTransactionError) {
                callback({ error: runTransactionError });

                return;
              }

              const { fromWallet: updatedFromWallet, toWallet: updatedToWallet } = runTransactionData;

              dbTransaction.removeTransaction({
                transactionId,
                callback: ({ error: transactionError }) => {
                  if (transactionError) {
                    callback({ error: transactionError });

                    return;
                  }

                  const toDataToSend = {
                    data: {
                      wallet: updatedToWallet,
                      changeType: dbConfig.ChangeTypes.REMOVE,
                      transaction: { objectId: transactionId },
                    },
                  };
                  const fromDataToSend = {
                    data: {
                      wallet: updatedFromWallet,
                      transaction: { objectId: transactionId },
                      changeType: dbConfig.ChangeTypes.UPDATE,
                    },
                  };

                  io.to(updatedToWallet.objectId).emit(dbConfig.EmitTypes.TRANSACTION, toDataToSend);
                  io.to(updatedFromWallet.objectId).emit(dbConfig.EmitTypes.TRANSACTION, fromDataToSend);

                  callback({
                    data: {
                      fromWallet: updatedFromWallet,
                      toWallet: updatedToWallet,
                      transaction: reversedTransaction,
                      changeType: dbConfig.ChangeTypes.REMOVE,
                    },
                  });
                },
              });
            },
          });
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
 * @param {Object} params.io - Socket io.
 */
function updateTransaction({
  token,
  transaction,
  transactionId,
  options,
  callback,
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

      const { user: authUser } = data;

      getTransactionById({
        transactionId,
        internalCallUser: authUser,
        callback: ({ error: transactionError, data: transactionData }) => {
          if (transactionError) {
            callback({ error: transactionError });

            return;
          }

          const { transaction: foundTransaction } = transactionData;
          const {
            hasFullAccess,
          } = authenticator.hasAccessTo({
            objectToAccess: foundTransaction,
            toAuth: authUser,
          });

          if (!hasFullAccess) {
            callback({ error: new errorCreator.NotAllowed({ name: `update transaction ${transactionId}` }) });

            return;
          }

          dbTransaction.updateTransaction({
            options,
            transaction,
            transactionId,
            callback: ({ error: updateError, data: updateData }) => {
              if (updateError) {
                callback({ error: updateError });

                return;
              }

              const { transaction: updatedTransaction } = updateData;
              const dataToSend = {
                data: {
                  transaction: updatedTransaction,
                  changeType: dbConfig.ChangeTypes.UPDATE,
                },
              };

              io.to(updatedTransaction.fromWalletId).emit(dbConfig.EmitTypes.TRANSACTION, dataToSend);
              io.to(updatedTransaction.toWalletId).emit(dbConfig.EmitTypes.TRANSACTION, dataToSend);

              callback(dataToSend);
            },
          });
        },
      });
    },
  });
}

/**
 * Get transactions that the user has access to.
 * @param {Object} params - Parameters.
 * @param {Object} params.token - jwt.
 * @param {Function} params.callback - Callback.
 */
function getTransactionsByUser({
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

      const { user: authUser } = data;

      dbTransaction.getTransactionsByUser({
        user: authUser,
        callback: ({ error: transactionError, data: transactionData }) => {
          if (transactionError) {
            callback({ error: transactionError });

            return;
          }

          const { transactions } = transactionData;
          const allTransactions = transactions.map((transaction) => {
            const { hasFullAccess } = authenticator.hasAccessTo({
              toAuth: authUser,
              objectToAccess: transaction,
            });
            if (!hasFullAccess) {
              return managerHelper.stripObject({ object: transaction });
            }

            return transaction;
          });

          callback({ data: { transactions: allTransactions } });
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
exports.getTransactionsByUser = getTransactionsByUser;
