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
const errorCreator = require('../../objects/error/errorCreator');

const walletSchema = new mongoose.Schema({
  owner: { type: String, unique: true },
  amount: { type: Number, default: 0 },
  accessLevel: { type: Number, default: 1 },
  isProtected: { type: Boolean, default: false },
  team: String,
}, { collection: 'wallets' });

const Wallet = mongoose.model('Wallet', walletSchema);

/**
 * Get wallets under user's access level or owner equal to user name
 * @param {Object} params.user User retrieving wallets
 * @param {Function} params.callback Callback
 */
function getWallets({ user, callback }) {
  const query = {
    $or: [
      {
        $or: [
          { owner: user.userName },
          { isProtected: false },
        ],
      },
      { accessLevel: { $lt: user.accessLevel } },
    ],
  };

  Wallet.find(query).lean().exec((err, wallets = []) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'getWallets' }) });

      return;
    }

    callback({ data: { wallets } });
  });
}

/**
 * Get wallet
 * @param {string} params.owner Owner of wallet
 * @param {Function} params.callback Callback
 */
function getWallet({ owner, callback }) {
  const query = { owner };

  Wallet.findOne(query).lean().exec((err, wallet) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'getWallet' }) });

      return;
    } else if (!wallet) {
      callback({ error: new errorCreator.DoesNotExist({ name: `wallet ${owner}` }) });

      return;
    }

    callback({ data: { wallet } });
  });
}

/**
 * Create and save wallet
 * @param {Object} params.wallet New wallet
 * @param {Function} params.callback Callback
 */
function createWallet({ wallet, callback }) {
  const newWallet = new Wallet(wallet);
  const query = { owner: wallet.owner };

  Wallet.findOne(query).lean().exec((err, foundWallet) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'createWallet' }) });

      return;
    } else if (foundWallet) {
      callback({ error: new errorCreator.AlreadyExists({ name: `Wallet ${wallet.owner}` }) });

      return;
    }

    databaseConnector.saveObject({
      object: newWallet,
      objectType: 'wallet',
      callback: ({ error, data }) => {
        if (error) {
          callback({ error });
        }

        callback({ data: { wallet: data.savedObject } });
      },
    });
  });
}

/**
 * Increase amount in wallet
 * @param {string} params.owner Owner name
 * @param {number} params.amount Amount to increase with
 * @param {Function} params.callback Callback
 */
function increaseAmount({ owner, amount, callback }) {
  const query = { owner };
  const update = { $inc: { amount: Math.abs(amount) } };
  const options = { new: true };

  Wallet.findOneAndUpdate(query, update, options).lean().exec((err, wallet) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'increaseAmount' }) });

      return;
    } else if (!wallet) {
      callback({ error: new errorCreator.DoesNotExist({ name: `wallet ${owner}` }) });

      return;
    }

    callback({ data: { wallet } });
  });
}

/**
 * Decrease amount in wallet
 * @param {string} params.owner Owner name
 * @param {number} params.amount Amount to decrease with
 * @param {Function} params.callback Callback
 */
function decreaseAmount({ owner, amount, callback }) {
  const query = { owner };
  const update = { $inc: { amount: -Math.abs(amount) } };
  const options = { new: true };

  Wallet.findOneAndUpdate(query, update, options).lean().exec((err, wallet) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'decreaseAmount' }) });

      return;
    } else if (!wallet) {
      callback({ error: new errorCreator.DoesNotExist({ name: `wallet ${owner}` }) });

      return;
    }

    callback({ data: { wallet } });
  });
}

/**
 * Reset wallet amount to 0
 * @param {string} params.owner Owner name
 * @param {Function} params.callback Callback
 */
function resetWalletAmount({ owner, callback }) {
  const query = { owner };
  const update = { $set: { amount: 0 } };
  const options = { new: true };

  Wallet.findOneAndUpdate(query, update, options).lean().exec((err, wallet) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'resetWalletAmount' }) });

      return;
    } else if (!wallet) {
      callback({ error: new errorCreator.DoesNotExist({ name: `wallet ${owner}` }) });

      return;
    }

    callback({ data: { wallet } });
  });
}

exports.increaseAmount = increaseAmount;
exports.decreaseAmount = decreaseAmount;
exports.getWallet = getWallet;
exports.createWallet = createWallet;
exports.getWallets = getWallets;
exports.resetWalletAmount = resetWalletAmount;
