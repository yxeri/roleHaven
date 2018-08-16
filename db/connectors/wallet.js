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

const mongoose = require('mongoose');
const dbConnector = require('../databaseConnector');
const errorCreator = require('../../error/errorCreator');

const walletSchema = new mongoose.Schema(dbConnector.createSchema({
  amount: { type: Number, default: 0 },
  isProtected: { type: Boolean, default: false },
}), { collection: 'wallets' });

const Wallet = mongoose.model('Wallet', walletSchema);

/**
 * Get wallets
 * @private
 * @param {Object} params - Parameters
 * @param {string} params.query - Database query
 * @param {Function} params.callback - Callback
 */
function getWallets({ filter, query, callback }) {
  dbConnector.getObjects({
    query,
    filter,
    object: Wallet,
    errorNameContent: 'getWallets',
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({
        data: {
          wallets: data.objects,
        },
      });
    },
  });
}

/**
 * Get wallet.
 * @private
 * @param {Object} params - Parameters.
 * @param {string} params.query - Query to get wallet.
 * @param {Function} params.callback - Callback
 */
function getWallet({ query, callback }) {
  dbConnector.getObject({
    query,
    object: Wallet,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!data.object) {
        callback({ error: new errorCreator.DoesNotExist({ name: `wallet ${JSON.stringify(query, null, 4)}` }) });

        return;
      }

      callback({ data: { wallet: data.object } });
    },
  });
}

/**
 * Update wallet
 * @private
 * @param {Object} params - Parameters
 * @param {string} params.walletId - ID of the wallet to update
 * @param {Function} params.callback - Callback
 */
function updateObject({ update, walletId, callback }) {
  dbConnector.updateObject({
    update,
    query: { _id: walletId },
    object: Wallet,
    errorNameContent: 'updateWallet',
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ data: { wallet: data.object } });
    },
  });
}

/**
 * Get all wallets
 * @param {Object} params - Parameters
 * @param {Function} params.callback - Callback
 */
function getAllWallets({ callback }) {
  getWallets({
    callback,
    errorNameContent: 'getAllWallets',
  });
}

/**
 * Get wallets by teams
 * @param {Object} params - Parameters
 * @param {string} params.teamIds - ID of the teams
 * @param {Function} params.callback - Callback
 */
function getWalletsByTeams({ teamIds, callback }) {
  const query = {
    $or: [
      { ownerId: { $in: teamIds } },
      { teamIds: { $in: teamIds } },
    ],
  };

  getWallets({
    callback,
    query,
  });
}

/**
 * Get wallets that the user has access to.
 * @param {Object} params - Parameters
 * @param {string} params.user - User retrieving wallets.
 * @param {Function} params.callback - Callback
 */
function getWalletsByUser({
  user,
  callback,
}) {
  const query = dbConnector.createUserQuery({ user });

  getWallets({
    query,
    callback,
  });
}

/**
 * Create and save wallet.
 * @param {Object} params - Parameters.
 * @param {Object} params.wallet - New wallet.
 * @param {Function} params.callback - Callback.
 * @param {Object} [params.options] - Options.
 */
function createWallet({
  wallet,
  callback,
  options = {},
}) {
  const walletToSave = wallet;

  if (options.setId && walletToSave.objectId) {
    walletToSave._id = mongoose.Types.ObjectId(walletToSave.objectId); // eslint-disable-line no-underscore-dangle
  }

  dbConnector.saveObject({
    object: new Wallet(walletToSave),
    objectType: 'wallet',
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ data: { wallet: data.savedObject } });
    },
  });
}

/**
 * Update wallet
 * @param {Object} params - Parameters
 * @param {string} params.walletId - Wallet ID
 * @param {Object} params.wallet - Update wallet
 * @param {number} [params.wallet.amount] - Amount to increase or decrease with
 * @param {Object} [params.options] - Options
 * @param {boolean} [params.options.shouldDecreaseAmount] - Should the amount in the wallet be decreased?
 * @param {boolean} [params.options.resetAmount] - Should the wallet amount be reset?
 * @param {boolean} [params.options.resetOwnerAliasId] - Should owner alias ID be removed?
 * @param {Function} params.callback - Callback
 */
function updateWallet({
  walletId,
  wallet,
  callback,
  options = {},
}) {
  const {
    amount,
    ownerAliasId,
    visibility,
    accessLevel,
    isProtected,
  } = wallet;
  const {
    shouldDecreaseAmount,
    resetAmount,
    resetOwnerAliasId,
  } = options;
  const update = {};
  const set = {};
  const unset = {};

  if (typeof resetAmount === 'boolean' && resetAmount) {
    set.amount = 0;
  } else if (amount) {
    update.$inc = {};

    if (shouldDecreaseAmount) {
      update.$inc.amount = -Math.abs(amount);
    } else {
      update.$inc.amount = Math.abs(amount);
    }
  }

  if (resetOwnerAliasId) {
    unset.ownerAliasId = '';
  } else if (ownerAliasId) {
    set.ownerAliasId = ownerAliasId;
  }

  if (typeof isProtected === 'boolean') { set.isProtected = isProtected; }
  if (visibility) { set.visibility = visibility; }
  if (accessLevel) { set.accessLevel = accessLevel; }

  if (Object.keys(set).length > 0) { update.$set = set; }
  if (Object.keys(unset).length > 0) { update.$unset = unset; }

  updateObject({
    update,
    walletId,
    callback,
  });
}

/**
 * Update access to the wallet.
 * @param {Object} params - Parameters.
 * @param {Function} params.callback - Callback.
 * @param {boolean} [params.shouldRemove] - Should access be removed?
 * @param {string[]} [params.userIds] - Id of the users to update.
 * @param {string[]} [params.teamIds] - Id of the teams to update.
 * @param {string[]} [params.bannedIds] - Id of the blocked Ids to update.
 * @param {string[]} [params.teamAdminIds] - Id of the teams to update admin access for.
 * @param {string[]} [params.userAdminIds] - Id of the users to update admin access for.
 */
function updateAccess(params) {
  const accessParams = params;
  const { callback } = params;
  accessParams.objectId = params.walletId;
  accessParams.object = Wallet;
  accessParams.callback = ({ error, data }) => {
    if (error) {
      callback({ error });

      return;
    }

    callback({ data: { wallet: data.object } });
  };

  if (params.shouldRemove) {
    dbConnector.removeObjectAccess(params);
  } else {
    dbConnector.addObjectAccess(params);
  }
}

/**
 * Remove wallet
 * @param {Object} params - Parameters
 * @param {string} params.walletId - ID of the wallet to remove
 * @param {Function} params.callback - Callback
 */
function removeWallet({ walletId, callback }) {
  dbConnector.removeObject({
    callback,
    query: { _id: walletId },
    object: Wallet,
  });
}

/**
 * Get wallets by Ids
 * @param {Object} params - Parameters
 * @param {string[]} params.walletIds - Wallet Ids
 * @param {Function} params.callback - Callback
 */
function getWalletsByIds({ walletIds, callback }) {
  getWallets({
    callback,
    query: { _id: { $in: walletIds } },
  });
}

/**
 * Get wallet by Id.
 * @param {Object} params - Parameters.
 * @param {string[]} params.walletId - Wallet Id.
 * @param {Function} params.callback - Callback.
 */
function getWalletById({ walletId, callback }) {
  getWallet({
    callback,
    query: { _id: walletId },
  });
}

exports.createWallet = createWallet;
exports.getAllWallets = getAllWallets;
exports.getWalletsByUser = getWalletsByUser;
exports.updateAccess = updateAccess;
exports.removeWallet = removeWallet;
exports.updateWallet = updateWallet;
exports.getWalletsByTeams = getWalletsByTeams;
exports.getWalletsByIds = getWalletsByIds;
exports.getWalletById = getWalletById;
