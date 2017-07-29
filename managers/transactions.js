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

const dbUser = require('../db/connectors/user');
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
 * @param {string} [params.senderName] Name of the currency sender
 * @param {Object} [params.user] User of the sender. Will be used if senderName is not set
 * @param {Object} params.transaction Transaction to create
 * @param {Object} params.io Socket io
 * @param {boolean} [params.emitToSender] Should an event be sent to sender?
 * @param {boolean} [param.sfromTeam] Is the transaction made from a team?
 * @param {Function} callback Callback
 */
function createTransaction({ senderName, user, transaction, io, emitToSender, fromTeam, callback }) {
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

  const newTransaction = transaction;
  newTransaction.amount = Math.abs(newTransaction.amount);
  newTransaction.time = new Date();

  if (senderName) {
    newTransaction.from = senderName;
  } else {
    newTransaction.from = fromTeam ? user.team + appConfig.teamAppend : user.userName;
  }

  dbWallet.getWallet({
    owner: newTransaction.from,
    callback: (walletData) => {
      if (walletData.error) {
        callback({ error: walletData.error });

        return;
      } else if (walletData.data.wallet.amount - newTransaction.amount <= 0) {
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

                  callback({ data: { transaction, wallet: decreasedWallet } });

                  if (fromTeam) {
                    io.to(createdTransaction.to).emit('transaction', {
                      data: {
                        transaction: createdTransaction,
                        wallet: increasedWallet,
                      },
                    });
                    io.to(createdTransaction.from).emit('transaction', {
                      data: {
                        transaction: createdTransaction,
                        wallet: decreasedWallet,
                      },
                    });

                    return;
                  }

                  if (createdTransaction.to.indexOf(appConfig.teamAppend) > -1) {
                    io.to(createdTransaction.to).emit('transaction', {
                      data: {
                        transaction: createdTransaction,
                        wallet: increasedWallet,
                      },
                    });

                    if (emitToSender) {
                      dbUser.getUserByAlias({
                        alias: senderName || user.userName,
                        callback: ({ error: senderError, data: senderData }) => {
                          if (senderError) {
                            callback({ error: senderError });

                            return;
                          }

                          if (senderData.socketId) {
                            io.to(senderData.socketId).emit('transaction', {
                              data: {
                                transaction: createdTransaction,
                                wallet: decreasedWallet,
                              },
                            });
                          }
                        },
                      });
                    }

                    return;
                  }

                  dbUser.getUserByAlias({
                    alias: createdTransaction.to,
                    callback: (aliasData) => {
                      if (aliasData.error) {
                        callback({ error: aliasData.error });

                        return;
                      }

                      const { user: receiver } = aliasData.data;

                      if (receiver.socketId !== '') {
                        io.to(receiver.socketId).emit('transaction', {
                          data: {
                            transaction: createdTransaction,
                            wallet: increasedWallet,
                          },
                        });
                      }

                      if (emitToSender) {
                        dbUser.getUserByAlias({
                          alias: user.userName,
                          callback: (senderData) => {
                            if (senderData.error) {
                              callback({ error: senderData.error });

                              return;
                            }

                            const { user: sender } = senderData.data;

                            if (sender.socketId) {
                              io.to(sender.socketId).emit('transaction', {
                                data: {
                                  transaction: createdTransaction,
                                  wallet: decreasedWallet,
                                },
                              });
                            }
                          },
                        });
                      }
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
 *
 * @param {Object} params.transaction New transaction
 * @param {Object} params.io Socket.io io
 * @param {boolean} [params.fromTeam] Is the transaction made by a team?
 * @param {boolean} [params.emitToSender] Should event be emitted to sender?
 * @param {Object} [params.fromUser] Uses
 * @param {Function} params.callback Callback
 */
function createTransactionBasedOnToken({ transaction, io, emitToSender, fromTeam, token, callback }) {
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
        emitToSender,
        fromTeam,
        callback,
        user: data.user,
      });
    },
  });
}

exports.createTransactionBasedOnToken = createTransactionBasedOnToken;
exports.getTransactions = getTransactions;
exports.createTransaction = createTransaction;
