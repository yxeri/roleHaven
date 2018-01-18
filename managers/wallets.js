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
const dbConfig = require('../config/defaults/config').databasePopulation;
const errorCreator = require('../objects/error/errorCreator');
const authenticator = require('../helpers/authenticator');

/**
 * Get wallet by ID and check if the user has access to it.
 * @param {Object} params - Parameters.
 * @param {Object} params.user - User retrieving the wallet.
 * @param {string} params.walletId - ID of the wallet to retrieve.
 * @param {Function} params.callback - Callback.
 * @param {string} [params.errorContentText] - Text to be printed on error.
 * @param {boolean} [params.shouldBeAdmin] - Does the user have to be an admin?
 */
function getAccessibleWallet({
  user,
  walletId,
  callback,
  shouldBeAdmin,
  errorContentText = `walletId ${walletId}`,
}) {
  dbWallet.getWalletById({
    walletId,
    callback: (walletData) => {
      if (walletData.error) {
        callback({ error: walletData.error });

        return;
      } else if (!authenticator.hasAccessTo({
        shouldBeAdmin,
        toAuth: user,
        objectToAccess: walletData.data.wallet,
      })) {
        callback({ error: new errorCreator.NotAllowed({ name: errorContentText }) });

        return;
      }

      callback(walletData);
    },
  });
}

/**
 * Update wallet.
 * @param {Object} params - Parameters.
 * @param {string} params.walletId - Id of the wallet.
 * @param {Object} params.wallet - Wallet parameters to update.
 * @param {Object} params.options - Update options.
 * @param {Function} params.callback - Callback.
 * @param {Object} params.io - Socket.io.
 */
function updateWallet({
  walletId,
  wallet,
  token,
  callback,
  io,
  options,
}) {
  const { amount } = wallet;
  const { resetAmount } = options;

  authenticator.isUserAllowed({
    token,
    commandName: !amount && !resetAmount ? dbConfig.apiCommands.UpdateWallet.name : dbConfig.apiCommands.UpdateWalletAmount.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (amount <= 0) {
        callback({ error: new errorCreator.InvalidData({ name: 'amount is 0 or lower' }) });

        return;
      }

      const { user } = data;

      getAccessibleWallet({
        walletId,
        user,
        full: true,
        callback: (walletData) => {
          if (walletData.error) {
            callback({ error: walletData.error });

            return;
          } else if (walletData.data.wallet.amount < amount) {
            callback({ error: new errorCreator.InvalidData({ name: 'wallet amount' }) });

            return;
          }

          dbWallet.updateWallet({
            walletId,
            options,
            wallet: { amount },
            callback: (updateData) => {
              if (updateData.error) {
                callback({ error: updateData.error });

                return;
              }

              const dataToSend = {
                data: {
                  wallet: {
                    objectId: walletId,
                    amount: updateData.data.wallet.amount,
                  },
                  changeType: dbConfig.ChangeTypes.UPDATE,
                },
              };

              io.to(walletId).emit(dbConfig.EmitTypes.WALLET, dataToSend);

              callback({ data: updateData.data });
            },
          });
        },
      });
    },
  });
}

/**
 * Get wallet.
 * @param {Object} params - Parameters.
 * @param {string} params.walletId - Id of the wallet.
 * @param {string} params.token - jwt.
 * @param {Function} params.callback - Callback.
 */
function getWalletById({
  walletId,
  token,
  callback,
  full,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetWallet.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user } = data;

      getAccessibleWallet({
        walletId,
        callback,
        user,
        shouldBeAdmin: full && dbConfig.apiCommands.GetFull.accessLevel > user.accessLevel,
      });
    },
  });
}

/**
 * Set wallet amount to 0.
 * @param {Object} params - Parameters.
 * @param {string} params.walletId - Id of the wallet.
 * @param {string} params.token - jwt
 * @param {Function} params.callback - Callback.
 * @param {Object} params.io - Socket.io.
 */
function emptyWallet({
  walletId,
  token,
  callback,
  io,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.ChangeWalletAmount.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbWallet.updateWallet({
        walletId,
        wallet: {},
        options: { resetAmount: true },
        callback: (updateData) => {
          const dataToSend = {
            data: {
              wallet: {
                objectId: walletId,
                amount: updateData.data.wallet.amount,
              },
              changeType: dbConfig.ChangeTypes.UPDATE,
            },
          };

          io.to(walletId).emit(dbConfig.EmitTypes.WALLET, dataToSend);

          callback({ data: updateData.data });
        },
      });
    },
  });
}

/**
 * Modifies wallets based on transaction.
 * @param {Object} params - Parameters.
 * @param {Object} params.transaction - Transaction.
 * @param {Function} params.callback - Callback
 */
function runTransaction({ transaction, callback }) {
  dbWallet.updateWallet({
    walletId: transaction.fromWalletId,
    wallet: {},
    options: { shouldDecreaseAmount: true },
    callback: (decreasedWalletData) => {
      if (decreasedWalletData.error) {
        callback({ error: decreasedWalletData.error });

        return;
      }

      dbWallet.updateWallet({
        walletId: transaction.toWalletId,
        wallet: {},
        options: { shouldDecreaseAmount: false },
        callback: (increasedWalletData) => {
          if (increasedWalletData.error) {
            callback({ error: increasedWalletData.error });

            return;
          }

          callback({
            data: {
              fromWallet: decreasedWalletData.data.wallet,
              toWallet: increasedWalletData.data.wallet,
            },
          });
        },
      });
    },
  });
}

/**
 * Checks if the sender wallet has enough amount and returns both sender and receiver wallets.
 * @param {Object} params - Parameters.
 * @param {string} params.fromWalletId - Id of the sender wallet.
 * @param {string} params.toWalletId - Id of the receiver wallet.
 * @param {number} params.amount - Amount.
 * @param {Function} params.callback - Callback
 */
function getWalletsAndCheckAmount({
  fromWalletId,
  toWalletId,
  amount,
  callback,
}) {
  dbWallet.getWalletsByIds({
    walletIds: [fromWalletId, toWalletId],
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const fromWallet = data.wallets.find(wallet => wallet.objectId === fromWalletId);

      if (fromWallet.amount - amount < 0) {
        callback({ error: new errorCreator.Insufficient({ name: 'transfer too much' }) });

        return;
      }

      callback({ data });
    },
  });
}

/**
 * Get wallets that the user has access to.
 * @param {Object} params - Parameters.
 * @param {Function} params.callback - Callback.
 * @param {string} params.token - jwt.
 */
function getWalletsByUser({
  callback,
  token,
  full,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: full ? dbConfig.apiCommands.GetFull.name : dbConfig.apiCommands.GetWallet.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user } = data;

      dbWallet.getWalletsByUser({
        callback,
        user,
        full,
      });
    },
  });
}

/**
 * Remove a wallet.
 * @param {Object} params - Parameters.
 * @param {string} params.token - jwt.
 * @param {string} params.walletId - Id of the wallet to remove.
 * @param {Function} params.callback - Callback.
 * @param {Object} params.io - Socket.io.
 */
function removeWallet({
  token,
  walletId,
  callback,
  io,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.RemoveWallet.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbWallet.removeWallet({
        walletId,
        callback: ({ error: walletError }) => {
          if (walletError) {
            callback({ error: walletError });

            return;
          }

          const dataToSend = {
            data: {
              changeType: dbConfig.ChangeTypes.REMOVE,
              wallet: { objectId: walletId },
            },
          };
          const callbackData = dataToSend;
          dataToSend.success = true;

          io.emit(dbConfig.EmitTypes.WALLET, dataToSend);

          callback(callbackData);
        },
      });
    },
  });
}

exports.updateWallet = updateWallet;
exports.getWalletById = getWalletById;
exports.emptyWallet = emptyWallet;
exports.getAccessibleWallet = getAccessibleWallet;
exports.runTransaction = runTransaction;
exports.getWalletsAndCheckAmount = getWalletsAndCheckAmount;
exports.getWalletsByUser = getWalletsByUser;
exports.removeWallet = removeWallet;
