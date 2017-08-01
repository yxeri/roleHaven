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
    matchNameTo: owner,
    commandName: dbConfig.apiCommands.GetTransaction.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const walletOwner = owner || data.user.userName;

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
              dataToSend.toTransactions = transactions.filter(transaction => transaction.to === walletOwner);
              dataToSend.fromTransactions = transactions.filter(transaction => transaction.from === walletOwner);
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

          getOwnerTransactions({
            ownerName: `${data.user.team}${appConfig.teamAppend}`,
            callback: ({ error: teamError, data: teamData }) => {
              if (teamError) {
                callback({ error: teamError });

                return;
              }

              const { fromTransactions, toTransactions } = transData;

              callback({
                data: {
                  fromTransactions: fromTransactions.concat(teamData.fromTransactions),
                  toTransactions: toTransactions.concat(teamData.toTransactions),
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
 * @param {Object} [params.user] User of the sender
 * @param {Object} params.transaction Transaction to create
 * @param {Object} [params.socket] Socket io
 * @param {Object} params.io Socket io. Used if socket is not set
 * @param {boolean} [params.fromTeam] Is the transaction made from a team?
 * @param {boolean} [params.toTeam] Is the transaction made to a team?
 * @param {Function} callback Callback
 */
function createTransaction({ user, transaction, io, fromTeam, socket, callback }) {
  if (fromTeam && !user.team) {
    callback({ error: new errorCreator.DoesNotExist({ name: 'not part of team' }) });

    return;
  } else if (user.userName === transaction.to) {
    callback({ error: new errorCreator.InvalidData({ name: 'transfer to self' }) });

    return;
  } else if (transaction.amount <= 0) {
    callback({ error: new errorCreator.InvalidData({ name: 'amount is 0 or less' }) });

    return;
  }

  const toTeam = transaction.to.indexOf(appConfig.teamAppend) > -1;
  const fromRoom = fromTeam ? user.team + appConfig.teamAppend : user.userName + appConfig.whisperAppend;
  const toRoom = toTeam ? transaction.to : transaction.to + appConfig.whisperAppend;
  const newTransaction = transaction;
  newTransaction.amount = Math.abs(newTransaction.amount);
  newTransaction.time = new Date();
  newTransaction.from = fromTeam ? user.team + appConfig.teamAppend : user.userName;

  if (newTransaction.from === newTransaction.to) {
    callback({ error: new errorCreator.InvalidData({ name: 'send to same' }) });

    return;
  }

  dbWallet.getWallet({
    owner: newTransaction.from,
    callback: (walletData) => {
      if (walletData.error) {
        callback({ error: walletData.error });

        return;
      } else if (walletData.data.wallet.amount - newTransaction.amount < 0) {
        callback({ error: new errorCreator.NotAllowed({ name: 'transfer too much' }) });

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
            owner: createdTransaction.from,
            amount: createdTransaction.amount,
            callback: (decreasedWalletData) => {
              if (decreasedWalletData.error) {
                callback({ error: decreasedWalletData.error });

                return;
              }

              dbWallet.increaseAmount({
                owner: createdTransaction.to,
                amount: createdTransaction.amount,
                callback: (increasedWalletData) => {
                  if (increasedWalletData.error) {
                    callback({ error: increasedWalletData.error });

                    return;
                  }

                  const { wallet: increasedWallet } = increasedWalletData.data;
                  const { wallet: decreasedWallet } = decreasedWalletData.data;

                  if (socket) {
                    socket.broadcast.to(fromRoom).emit('transaction', {
                      data: {
                        transaction: createdTransaction,
                        wallet: decreasedWallet,
                      },
                    });

                    socket.broadcast.to(toRoom).emit('transaction', {
                      data: {
                        transaction: createdTransaction,
                        wallet: increasedWallet,
                      },
                    });
                  } else {
                    io.to(toRoom).emit('transaction', {
                      data: {
                        transaction: createdTransaction,
                        wallet: increasedWallet,
                      },
                    });

                    io.to(fromRoom).emit('transaction', {
                      data: {
                        transaction: createdTransaction,
                        wallet: decreasedWallet,
                      },
                    });
                  }

                  const dataToSend = {
                    transaction,
                    wallet: decreasedWallet,
                  };

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
 * @param {Object} params.transaction New transaction
 * @param {Object} params.io Socket.io. Will be used if socket is not set
 * @param {boolean} params.fromTeam Is the transaction made by a team?
 * @param {Object} [params.socket] Socket.io
 * @param {Function} params.callback Callback
 */
function createTransactionBasedOnToken({ transaction, io, socket, fromTeam, token, callback }) {
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
        fromTeam,
        user: data.user,
      });
    },
  });
}

exports.createTransactionBasedOnToken = createTransactionBasedOnToken;
exports.getTransactions = getTransactions;
exports.createTransaction = createTransaction;
