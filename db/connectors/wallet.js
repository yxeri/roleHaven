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
const logger = require('../../utils/logger');

const walletSchema = new mongoose.Schema({
  owner: { type: String, unique: true },
  amount: { type: Number, default: 0 },
  accessLevel: { type: Number, default: 1 },
  protected: { type: Boolean, default: false },
}, { collection: 'wallets' });

const Wallet = mongoose.model('Wallet', walletSchema);

/**
 * Get wallet
 * @param {string} owner - Owner of wallet
 * @param {Function} callback - Callback
 */
function getWallet(owner, callback) {
  const query = { owner };

  Wallet.findOne(query).lean().exec((err, wallet) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to get wallet'],
        err,
      });
    }

    callback(err, wallet);
  });
}

/**
 * Create and save wallet
 * @param {Object} wallet - New wallet
 * @param {Function} callback - Callback
 */
function createWallet(wallet, callback) {
  const newWallet = new Wallet(wallet);

  getWallet(wallet.owner, (err, foundWallet) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to check if wallet exists'],
        err,
      });

      callback(err, null);
    } else if (foundWallet === null) {
      databaseConnector.saveObject(newWallet, 'wallet', callback);
    } else {
      callback(err, null);
    }
  });
}

/**
 * Increase amount in wallet
 * @param {string} owner - Owner name
 * @param {number} value - Amount to increase with
 * @param {Function} callback - Callback
 */
function increaseAmount(owner, value, callback) {
  const query = { owner };
  const update = { $inc: { amount: Math.abs(value) } };

  Wallet.findOneAndUpdate(query, update).lean().exec((err, wallet) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to increase amount in wallet'],
        err,
      });
    }

    callback(err, wallet);
  });
}

/**
 * Decrease amount in wallet
 * @param {string} userName - Name of the user decreasing amount
 * @param {number} userAccessLevel - Access level of the user changing the amount
 * @param {string} owner - Owner name
 * @param {number} value - Amount to decrease with
 * @param {Function} callback - Callback
 */
function decreaseAmount(userName, userAccessLevel, owner, value, callback) {
  const query = {
    $and: [
      { owner }, {
        $or: [
          { owner: userName },
          { accessLevel: { $lt: userAccessLevel } },
        ] },
    ] };
  const update = { $inc: { amount: -Math.abs(value) } };

  console.log(-Math.abs(value));

  Wallet.findOneAndUpdate(query, update).lean().exec((err, wallet) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to decrease amount in wallet'],
        err,
      });
    }

    callback(err, wallet);
  });
}

exports.increaseAmount = increaseAmount;
exports.decreaseAmount = decreaseAmount;
exports.getWallet = getWallet;
exports.createWallet = createWallet;
