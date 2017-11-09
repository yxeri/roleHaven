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

const dbWallet = require('../db/connectors/wallet');
const appConfig = require('../config/defaults/config').app;
const dbConfig = require('../config/defaults/config').databasePopulation;
const errorCreator = require('../objects/error/errorCreator');
const dbTransaction = require('../db/connectors/transaction');
const authenticator = require('../helpers/authenticator');

/**
 * Get all user/team transactions
 * @param {string} params.owner Name of the user or team
 * @param {boolean} params.isTeam Is it a team wallet?
 * @param {Function} params.callback Callback
 */
function getTransactions({ owner, token, callback }) {
  authenticator.isUserAllowed({
    token,
    matchToId: owner,
    commandName: dbConfig.apiCommands.GetTransaction.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const walletOwner = owner || data.user.username;

      const getOwnerTransactions = ({ ownerName, callback: transCallback }) => {
        dbTransaction.getAllTransactions({
          owner: ownerName,
          callback: (transactionsData) => {
            if (transactionsData.error) {
              transCallback({ err: transactionsData.error });

              return;
            }

            const { transactions } = transactionsData.data;
            const dataToSend = {};

            if (transactions.length > 0) {
              dataToSend.toTransactions = transactions.filter(transaction => transaction.to === ownerName);
              dataToSend.fromTransactions = transactions.filter(transaction => transaction.from === ownerName);
            } else {
              dataToSend.toTransactions = [];
              dataToSend.fromTransactions = [];
            }

            transCallback({ data: dataToSend });
          },
        });
      };

      getOwnerTransactions({
        ownerName: walletOwner,
        callback: ({ error: transError, data: transData }) => {
          if (transError) {
            callback({ error: transError });

            return;
          }

          if (!owner || (data.user && !data.user.team)) {
            callback({ data: transData });

            return;
          }

          const { fromTransactions, toTransactions } = transData;

          getOwnerTransactions({
            ownerName: `${data.user.team}${appConfig.teamAppend}`,
            callback: ({ error: teamError, data: teamData }) => {
              if (teamError) {
                callback({ error: teamError });

                return;
              }

              const teamFromTransactions = teamData.fromTransactions.filter(transaction => transaction.to !== walletOwner && transaction.from !== walletOwner);
              const teamToTransactions = teamData.toTransactions.filter(transaction => transaction.to !== walletOwner && transaction.from !== walletOwner);

              callback({
                data: {
                  fromTransactions: fromTransactions.concat(teamFromTransactions),
                  toTransactions: toTransactions.concat(teamToTransactions),
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
 * Create transaction
 * @param {Object} [params.user] - User of the sender
 * @param {Object} params.transaction - Transaction to create
 * @param {Object} [params.socket] - Socket io
 * @param {Object} params.io - Socket io. Used if socket is not set
 * @param {Function} callback Callback
 */
function createTransaction({ userId, transaction, io, socket, callback }) {
  if (transaction.fromWalletId === transaction.toWalletId) {
    callback({ error: new errorCreator.InvalidData({ name: 'transfer to self' }) });

    return;
  } else if (transaction.amount <= 0) {
    callback({ error: new errorCreator.Insufficient({ name: 'amount is 0 or less' }) });

    return;
  } else if (transaction.fromWalletId === transaction.toWalletId) {
    callback({ error: new errorCreator.InvalidData({ name: 'send to same' }) });

    return;
  }

  const newTransaction = transaction;
  newTransaction.amount = Math.abs(newTransaction.amount);

  dbWallet.getWallet({
    walletId: newTransaction.fromWalletId,
    callback: (walletData) => {
      if (walletData.error) {
        callback({ error: walletData.error });

        return;
      } else if (walletData.data.wallet.amount - newTransaction.amount < 0) {
        callback({ error: new errorCreator.Insufficient({ name: 'transfer too much' }) });

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

          dbWallet.decreaseAmount({
            walletId: createdTransaction.fromWalletId,
            amount: createdTransaction.amount,
            callback: (decreasedWalletData) => {
              if (decreasedWalletData.error) {
                callback({ error: decreasedWalletData.error });

                return;
              }

              dbWallet.increaseAmount({
                walletId: createdTransaction.toWalletId,
                amount: createdTransaction.amount,
                callback: (increasedWalletData) => {
                  if (increasedWalletData.error) {
                    callback({ error: increasedWalletData.error });

                    return;
                  }

                  const { wallet: increasedWallet } = increasedWalletData.data;
                  const { wallet: decreasedWallet } = decreasedWalletData.data;

                  if (socket) {
                    socket.broadcast.to(createdTransaction.fromWalletId).emit('transaction', {
                      data: {
                        transaction: createdTransaction,
                        wallet: decreasedWallet,
                      },
                    });

                    socket.broadcast.to(createdTransaction.toWalletId).emit('transaction', {
                      data: {
                        transaction: createdTransaction,
                        wallet: increasedWallet,
                      },
                    });
                  } else {
                    io.to(createdTransaction.fromWalletId).emit('transaction', {
                      data: {
                        transaction: createdTransaction,
                        wallet: decreasedWallet,
                      },
                    });

                    io.to(createdTransaction.toWalletId).emit('transaction', {
                      data: {
                        transaction: createdTransaction,
                        wallet: increasedWallet,
                      },
                    });
                  }

                  const dataToSend = {
                    transaction,
                    wallet: decreasedWallet,
                  };

                  // FIXME Check if user is in teamId
                  if (user.team && createdTransaction.to === user.team + appConfig.teamAppend) {
                    dataToSend.toWallet = increasedWallet;
                  }

                  callback({ data: dataToSend });
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
 * Create transaction based on jwt token
 * @param {Object} params.token - jwt
 * @param {Object} params.transaction - New transaction
 * @param {Object} params.io - Socket.io. Will be used if socket is not set
 * @param {Object} [params.socket] - Socket.io
 * @param {Function} params.callback - Callback
 */
function createTransactionBasedOnToken({ transaction, io, socket, token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.CreateTransaction.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      createTransaction({
        transaction,
        io,
        socket,
        callback,
        user: data.user,
      });
    },
  });
}

exports.createTransactionBasedOnToken = createTransactionBasedOnToken;
exports.getTransactions = getTransactions;
exports.createTransaction = createTransaction;
