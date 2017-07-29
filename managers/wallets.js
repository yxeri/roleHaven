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
 * Decrease wallet amount
 * @param {string} params.owner Name of the owner of the wallet
 * @param {number} params.amount The amount to decrease wallet amount with
 * @param {Function} params.callback Callback
 */
function decreaseWalletAmount({ owner, amount, token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.DecreaseWalletAmount.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      } else if (amount <= 0) {
        callback({ error: new errorCreator.InvalidData({ name: 'amount is 0' }) });

        return;
      }

      dbWallet.getWallet({
        owner,
        callback: ({ error: walletError, data: walletData }) => {
          if (walletError) {
            callback({ error: walletError });

            return;
          } else if (walletData.wallet.amount < amount) {
            callback({ error: new errorCreator.InvalidData({ name: 'wallet amount' }) });

            return;
          }

          dbWallet.decreaseAmount({
            amount,
            owner,
            callback: ({ error: decreasedError, data: decreasedData }) => {
              if (decreasedError) {
                callback({ error: decreasedError });

                return;
              }

              callback({ data: decreasedData });
            },
          });
        },
      });
    },
  });
}

/**
 * Increase wallet amount
 * @param {string} params.owner Name of the owner of the wallet
 * @param {number} params.amount The amount to increase wallet amount with
 * @param {Function} params.callback Callback
 */
function increaseWalletAmount({ owner, amount, token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.IncreaseWalletAmount.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      } else if (amount <= 0) {
        callback({ error: new errorCreator.InvalidData({ name: 'amount is 0' }) });

        return;
      }

      dbWallet.getWallet({
        owner,
        callback: ({ error: walletError }) => {
          if (walletError) {
            callback({ error: walletError });

            return;
          }

          dbWallet.increaseAmount({
            amount,
            owner,
            callback: ({ error: decreasedError, data: decreasedData }) => {
              if (decreasedError) {
                callback({ error: decreasedError });

                return;
              }

              callback({ data: decreasedData });
            },
          });
        },
      });
    },
  });
}

/**
 * Get wallets
 * @param {string} params.token jwt
 * @param {Function} params.callback Callback
 */
function getWallets({ token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetWallet.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbWallet.getUserWallets({
        user: data.user,
        callback: ({ error: walletError, data: walletsData }) => {
          if (walletError) {
            callback({ error: walletError });

            return;
          }

          callback({ data: walletsData });
        },
      });
    },
  });
}

/**
 * Get wallet
 * @param {string} params.owner Owner of the wallet
 * @param {string} params.token jwt
 * @param {Function} params.callback Callback
 */
function getWallet({ owner, token, callback }) {
  authenticator.isUserAllowed({
    token,
    matchNameTo: owner,
    commandName: dbConfig.apiCommands.GetWallet.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const walletOwner = owner || data.user.userName;

      dbWallet.getWallet({
        owner: walletOwner,
        callback: ({ error: walletError, data: walletData }) => {
          if (walletError) {
            callback({ error: walletError });

            return;
          }

          callback({ data: walletData });
        },
      });
    },
  });
}

/**
 * Set wallet amount to 0
 * @param {string} params.owner User name of owner
 * @param {string} params.token jwt
 * @param {boolean} [params.isTeam] Is it a team wallet?
 * @param {Function} params.callback Callback
 */
function emptyWallet({ owner, token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.DecreaseWalletAmount.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbWallet.resetWalletAmount({
        owner,
        callback: ({ error: walletError, data: walletData }) => {
          if (walletError) {
            callback({ error: walletError });

            return;
          }

          callback({ data: walletData });
        },
      });
    },
  });
}

exports.decreaseWalletAmount = decreaseWalletAmount;
exports.increaseWalletAmount = increaseWalletAmount;
exports.getWallets = getWallets;
exports.getWallet = getWallet;
exports.emptyWallet = emptyWallet;
