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
const dbConnector = require('../databaseConnector');
const errorCreator = require('../../objects/error/errorCreator');

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
function getWallets({ query, callback }) {
  dbConnector.getObjects({
    query,
    object: Wallet,
    errorNameContent: 'getWallets',
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ wallets: data.objects });
    },
  });
}

/**
 * Update wallet
 * @private
 * @param {Object} params - Parameters
 * @param {string} params.objectId - ID of the wallet to update
 * @param {Function} params.callback - Callback
 */
function updateObject({ update, objectId, callback }) {
  dbConnector.updateObject({
    update,
    query: { _id: objectId },
    object: Wallet,
    errorNameContent: 'updateWallet',
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ wallet: data.object });
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
 * Get wallets by user's access
 * @param {Object} params - Parameters
 * @param {string} params.userId - ID of the user
 * @param {Function} params.callback - Callback
 */
function getWalletsByUser({ userId, callback }) {
  const query = {
    $or: [
      { ownerId: userId },
      { userIds: { $in: [userId] } },
    ],
  };

  getWallets({
    query,
    callback,
  });
}

/**
 * Create and save wallet
 * @param {Object} params - Parameters
 * @param {Object} params.wallet - New wallet
 * @param {Function} params.callback - Callback
 */
function createWallet({ wallet, callback }) {
  const walletToSave = wallet;

  if (walletToSave.objectId) {
    walletToSave._id = walletToSave.objectId; // eslint-disable-line no-underscore-dangle
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
 * @param {string} params.objectId - Wallet ID
 * @param {Object} params.wallet - Update wallet
 * @param {number} params.wallet.amount - Amount to increase or decrease with
 * @param {Object} params.options - Options
 * @param {boolean} params.options.shouldDecreaseAmount - Should the amount in the wallet be decreased?
 * @param {boolean} params.options.resetAmount - Should the wallet amount be reset?
 * @param {boolean} params.options.resetOwnerAliasId - Should owner alias ID be removed?
 * @param {Function} params.callback - Callback
 */
function updateWallet({
  objectId,
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
  const update = { $set: {} };

  if (typeof resetAmount === 'boolean' && resetAmount) {
    update.$set.amount = 0;
  } else if (amount) {
    update.$inc = {};

    if (shouldDecreaseAmount) {
      update.$inc.amount = Math.abs(amount);
    } else {
      update.$inc.amount = -Math.abs(amount);
    }
  }

  if (resetOwnerAliasId) {
    update.$unset = { ownerAliasId: '' };
  } else if (ownerAliasId) {
    update.$set.ownerAliasId = ownerAliasId;
  }

  if (typeof isProtected === 'boolean') { update.$set.isProtected = isProtected; }
  if (visibility) { update.$set.visibility = visibility; }
  if (accessLevel) { update.$set.accessLevel = accessLevel; }

  updateObject({
    update,
    objectId,
    callback,
  });
}

/**
 * Add access to the wallet for users or teams
 * @param {Object} params - Parameters
 * @param {string} params.objectId - ID of the wallet
 * @param {string[]} [params.userIds] - ID of the users
 * @param {string[]} [params.teamIds] - ID of the teams
 * @param {string[]} [params.blockedIds] - ID of the blocked Ids to add
 * @param {boolean} [params.isAdmin] - Should the teams and/or users be added to admins?
 * @param {Function} params.callback - Callback
 */
function addAccess({
  userIds,
  teamIds,
  blockedIds,
  objectId,
  isAdmin,
  callback,
}) {
  if (!userIds && !teamIds && !blockedIds) {
    callback({ error: new errorCreator.InvalidData({ expected: 'teamIds || aliasIds || blockedIds' }) });

    return;
  }

  dbConnector.addObjectAccess({
    objectId,
    userIds,
    teamIds,
    blockedIds,
    isAdmin,
    object: Wallet,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ wallet: data.object });
    },
  });
}

/**
 * Remove access to the wallet for users and/or teams
 * @param {Object} params - Parameters
 * @param {string} params.objectId - ID of the wallet
 * @param {string[]} [params.userIds] - ID of the users
 * @param {string[]} [params.teamIds] - ID of the teams
 * @param {string[]} [params.blockedIds] - ID of the blocked Ids to add
 * @param {boolean} [params.isAdmin] - Should the teams and/or users be removed from admins?
 * @param {Function} params.callback - Callback
 */
function removeAccess({
  userIds,
  teamIds,
  blockedIds,
  isAdmin,
  objectId,
  callback,
}) {
  if (!userIds && !teamIds && !blockedIds) {
    callback({ error: new errorCreator.InvalidData({ expected: 'teamIds || userIds || blockedIds' }) });

    return;
  }

  dbConnector.removeObjectAccess({
    userIds,
    teamIds,
    blockedIds,
    isAdmin,
    objectId,
    callback,
    object: Wallet,
  });
}

/**
 * Remove wallet
 * @param {Object} params - Parameters
 * @param {string} params.objectId - ID of the wallet to remove
 * @param {Function} params.callback - Callback
 */
function removeWallet({ objectId, callback }) {
  dbConnector.removeObject({
    callback,
    query: { _id: objectId },
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

exports.createWallet = createWallet;
exports.getAllWallets = getAllWallets;
exports.getWalletsByUser = getWalletsByUser;
exports.removeAccess = removeAccess;
exports.addAccess = addAccess;
exports.removeWallet = removeWallet;
exports.updateWallet = updateWallet;
exports.getWalletsByTeams = getWalletsByTeams;
exports.getWalletsByIds = getWalletsByIds;
