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
 * Add custom id to the object
 * @param {Object} wallet - Wallet object
 * @return {Object} - Wallet object with id
 */
function addCustomId(wallet) {
  const updatedWallet = wallet;
  updatedWallet.walletId = wallet.objectId;

  return updatedWallet;
}

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

      callback({
        data: {
          wallets: data.objects.map(wallet => addCustomId(wallet)),
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
        callback({ error: new errorCreator.DoesNotExist({ name: `wallet ${query.toString()}` }) });

        return;
      }

      callback({ data: { wallet: addCustomId(data.object) } });
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

      callback({ data: { wallet: addCustomId(data.object) } });
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

  if (options.setId && walletToSave.walletId) {
    walletToSave._id = walletToSave.walletId; // eslint-disable-line no-underscore-dangle
  }

  dbConnector.saveObject({
    object: new Wallet(walletToSave),
    objectType: 'wallet',
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ data: { wallet: addCustomId(data.savedObject) } });
    },
  });
}

/**
 * Update wallet
 * @param {Object} params - Parameters
 * @param {string} params.walletId - Wallet ID
 * @param {Object} params.wallet - Update wallet
 * @param {number} params.wallet.amount - Amount to increase or decrease with
 * @param {Object} params.options - Options
 * @param {boolean} params.options.shouldDecreaseAmount - Should the amount in the wallet be decreased?
 * @param {boolean} params.options.resetAmount - Should the wallet amount be reset?
 * @param {boolean} params.options.resetOwnerAliasId - Should owner alias ID be removed?
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
    walletId,
    callback,
  });
}

/**
 * Add access to the wallet for users or teams
 * @param {Object} params - Parameters
 * @param {string} params.walletId - ID of the wallet
 * @param {string[]} [params.userIds] - ID of the users
 * @param {string[]} [params.teamIds] - ID of the teams
 * @param {string[]} [params.bannedIds] - ID of the blocked Ids to add
 * @param {string[]} [params.teamAdminIds] - Id of the teams to give admin access to. They will also be added to teamIds.
 * @param {string[]} [params.userAdminIds] - Id of the users to give admin access to. They will also be added to userIds.
 * @param {Function} params.callback - Callback
 */
function addAccess({
  userIds,
  teamIds,
  bannedIds,
  walletId,
  teamAdminIds,
  userAdminIds,
  callback,
}) {
  dbConnector.addObjectAccess({
    userIds,
    teamIds,
    bannedIds,
    teamAdminIds,
    userAdminIds,
    objectId: walletId,
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
 * @param {string} params.walletId - ID of the wallet
 * @param {string[]} [params.userIds] - ID of the users
 * @param {string[]} [params.teamIds] - ID of the teams
 * @param {string[]} [params.bannedIds] - ID of the blocked Ids to add
 * @param {string[]} [params.teamAdminIds] - Id of the teams to remove admin access from. They will not be removed from teamIds.
 * @param {string[]} [params.userAdminIds] - Id of the users to remove admin access from. They will not be removed from userIds.
 * @param {Function} params.callback - Callback
 */
function removeAccess({
  userIds,
  teamIds,
  bannedIds,
  teamAdminIds,
  userAdminIds,
  walletId,
  callback,
}) {
  dbConnector.removeObjectAccess({
    userIds,
    teamIds,
    bannedIds,
    teamAdminIds,
    userAdminIds,
    callback,
    objectId: walletId,
    object: Wallet,
  });
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
exports.removeAccess = removeAccess;
exports.addAccess = addAccess;
exports.removeWallet = removeWallet;
exports.updateWallet = updateWallet;
exports.getWalletsByTeams = getWalletsByTeams;
exports.getWalletsByIds = getWalletsByIds;
exports.getWalletById = getWalletById;
