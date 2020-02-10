/*
 Copyright 2017 Carmilla Mina Jankovic

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
const { appConfig, dbConfig } = require('../config/defaults/config');
const errorCreator = require('../error/errorCreator');
const authenticator = require('../helpers/authenticator');
const managerHelper = require('../helpers/manager');

/**
 * Start overdraft interval.
 * @param {Object} params Parameters.
 * @param {Object} params.io Socket.io.
 */
function startOverdraftInterval({ io }) {
  if (appConfig.overdraftInterval < 999) {
    return;
  }

  console.log('Starting overdraft interval');

  setInterval(() => {
    dbWallet.getAllWallets({
      callback: ({ error, data }) => {
        if (error) {
          console.log('Overdraft error');

          return;
        }

        const { wallets } = data;

        wallets.forEach((wallet) => {
          const { amount } = wallet;

          if (wallet.amount < 0) {
            let deduction = amount * appConfig.overdraftRate;

            if (amount + deduction < appConfig.walletMinimumAmount) {
              deduction = amount + Math.abs(appConfig.walletMinimumAmount);
            }

            dbWallet.updateWallet({
              wallet: { amount: deduction },
              options: { shouldDecreaseAmount: true },
              walletId: wallet.objectId,
              callback: ({ error: updateError, data: updateData }) => {
                if (updateError) {
                  console.log('Overdraft error');

                  return;
                }

                const dataToSend = {
                  data: {
                    wallet: updateData.wallet,
                    changeType: dbConfig.ChangeTypes.UPDATE,
                  },
                };

                io.to(wallet.objectId).emit(dbConfig.EmitTypes.WALLET, dataToSend);
                io.to(dbConfig.AccessLevels.MODERATOR).emit(dbConfig.EmitTypes.WALLET, dataToSend);
              },
            });
          }
        });
      },
    });
  }, appConfig.overdraftInterval);
}

/**
 * Get wallet.
 * @param {Object} params Parameters.
 * @param {string} params.walletId Id of the wallet.
 * @param {string} params.token jwt.
 * @param {Function} params.callback Callback.
 */
function getWalletById({
  walletId,
  token,
  internalCallUser,
  callback,
  needsAccess,
}) {
  managerHelper.getObjectById({
    token,
    internalCallUser,
    callback,
    needsAccess,
    objectId: walletId,
    objectType: 'wallet',
    objectIdType: 'walletId',
    dbCallFunc: dbWallet.getWalletById,
    commandName: dbConfig.apiCommands.GetWallet.name,
  });
}

/**
 * Update wallet.
 * @param {Object} params Parameters.
 * @param {string} params.walletId Id of the wallet.
 * @param {Object} params.wallet Wallet parameters to update.
 * @param {Object} params.options Update options.
 * @param {Function} params.callback Callback.
 * @param {Object} params.io Socket.io.
 */
function updateWallet({
  walletId,
  wallet,
  token,
  callback,
  io,
  internalCallUser,
  socket,
  options = {},
}) {
  const walletToUpdate = wallet;
  const { amount } = walletToUpdate;
  walletToUpdate.amount = walletToUpdate.amount
    ? Number.parseInt(walletToUpdate.amount, 10)
    : undefined;

  const {
    resetAmount,
    shouldDecreaseAmount,
  } = options;
  const commandName = !amount && !resetAmount
    ? dbConfig.apiCommands.UpdateWallet.name
    : dbConfig.apiCommands.UpdateWalletAmount.name;

  authenticator.isUserAllowed({
    token,
    commandName,
    internalCallUser,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      if (amount && amount <= 0) {
        callback({ error: new errorCreator.InvalidData({ name: `${commandName}. User: ${data.user.objectId}. Access wallet ${walletId} and update with negative amount.` }) });

        return;
      }

      const { user: authUser } = data;

      getWalletById({
        walletId,
        internalCallUser: authUser,
        callback: ({ error: walletError, data: walletData }) => {
          if (walletError) {
            callback({ error: walletError });

            return;
          }

          if (shouldDecreaseAmount && amount && walletData.wallet.amount < amount) {
            callback({ error: new errorCreator.Insufficient({ name: `${commandName}. User: ${data.user.objectId}. Access wallet ${walletId} and update amount without enough in wallet.` }) });

            return;
          }

          dbWallet.updateWallet({
            walletId,
            options,
            wallet,
            callback: ({ error: updateError, data: updateData }) => {
              if (updateError) {
                callback({ error: updateError });

                return;
              }

              const { wallet: updatedWallet } = updateData;

              const dataToSend = {
                data: {
                  wallet: updatedWallet,
                  changeType: dbConfig.ChangeTypes.UPDATE,
                },
              };

              if (socket) {
                socket.broadcast.emit(dbConfig.EmitTypes.WALLET, dataToSend);
              } else {
                io.emit(dbConfig.EmitTypes.WALLET, dataToSend);
              }

              io.to(dbConfig.AccessLevels.MODERATOR).emit(dbConfig.EmitTypes.WALLET, dataToSend);

              callback(dataToSend);
            },
          });
        },
      });
    },
  });
}

/**
 * Modifies wallets based on transaction.
 * @param {Object} params Parameters.
 * @param {Object} params.transaction Transaction.
 * @param {Function} params.callback Callback
 */
function runTransaction({ transaction, callback }) {
  const {
    fromWalletId,
    toWalletId,
    amount,
  } = transaction;

  dbWallet.updateWallet({
    walletId: fromWalletId,
    wallet: { amount },
    options: { shouldDecreaseAmount: true },
    callback: ({ error: decreaseError, data: decreaseData }) => {
      if (decreaseError) {
        callback({ error: decreaseError });

        return;
      }

      dbWallet.updateWallet({
        walletId: toWalletId,
        wallet: { amount },
        options: { shouldDecreaseAmount: false },
        callback: ({ error: increaseError, data: increaseData }) => {
          if (increaseError) {
            callback({ error: increaseError });

            return;
          }

          const { wallet: fromWallet } = decreaseData;
          const { wallet: toWallet } = increaseData;

          callback({
            data: {
              fromWallet,
              toWallet,
            },
          });
        },
      });
    },
  });
}

/**
 * Checks if the wallet has enough amount.
 * @param {Object} params Parameters.
 * @param {string} params.walletId Id of the wallet.
 * @param {number} params.amount Amount.
 * @param {Function} params.callback Callback
 */
function checkAmount({
  walletId,
  amount,
  callback,
}) {
  dbWallet.getWalletById({
    walletId,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { wallet } = data;

      if (wallet.amount - amount < appConfig.walletMinimumAmount) {
        callback({ error: new errorCreator.Insufficient({ name: `checkAmount. Update amount ${amount} without enough in wallet ${walletId}.` }) });

        return;
      }

      callback({ data: { success: true } });
    },
  });
}

/**
 * Get wallets that the user has access to.
 * @param {Object} params Parameters.
 * @param {Function} params.callback Callback.
 * @param {string} params.token jwt.
 */
function getWalletsByUser({
  callback,
  token,
}) {
  managerHelper.getObjects({
    callback,
    token,
    commandName: dbConfig.apiCommands.GetWallet.name,
    objectsType: 'wallets',
    dbCallFunc: dbWallet.getWalletsByUser,
  });
}

/**
 * Update access to the wallet for users or teams.
 * @param {Object} params Parameters.
 * @param {string} params.walletId Id of the wallet.
 * @param {Function} params.callback Callback.
 * @param {boolean} [params.shouldRemove] Should access be removed from the users or teams?
 * @param {string[]} [params.userIds] Id of the users.
 * @param {string[]} [params.teamIds] Id of the teams.
 * @param {string[]} [params.bannedIds] Id of the blocked Ids to add.
 * @param {string[]} [params.teamAdminIds] Id of the teams to change admin access for.
 * @param {string[]} [params.userAdminIds] Id of the users to change admin access for.
 */
function updateAccess({
  token,
  walletId,
  teamAdminIds,
  userAdminIds,
  userIds,
  teamIds,
  bannedIds,
  shouldRemove,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.UpdateWallet.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user: authUser } = data;

      getWalletById({
        walletId,
        internalCallUser: authUser,
        callback: ({ error: walletError, data: walletData }) => {
          if (walletError) {
            callback({ error: walletError });

            return;
          }

          const { wallet } = walletData;

          const {
            hasFullAccess,
          } = authenticator.hasAccessTo({
            objectToAccess: wallet,
            toAuth: authUser,
          });

          if (!hasFullAccess) {
            callback({ error: errorCreator.NotAllowed({ name: `update wallet ${walletId}` }) });

            return;
          }

          dbWallet.updateAccess({
            shouldRemove,
            userIds,
            teamIds,
            bannedIds,
            teamAdminIds,
            userAdminIds,
            walletId,
            callback,
          });
        },
      });
    },
  });
}

exports.updateWallet = updateWallet;
exports.getWalletById = getWalletById;
exports.runTransaction = runTransaction;
exports.checkAmount = checkAmount;
exports.getWalletsByUser = getWalletsByUser;
exports.updateAccess = updateAccess;
exports.startOverdraftInterval = startOverdraftInterval;
