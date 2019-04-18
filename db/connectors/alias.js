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
const errorCreator = require('../../error/errorCreator');
const dbConnector = require('../databaseConnector');
const dbUser = require('./user');

const aliasSchema = new mongoose.Schema(dbConnector.createSchema({
  aliasName: { type: String, unique: true },
  aliasNameLowerCase: { type: String, unique: true },
  isIdentity: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  isBanned: { type: Boolean, default: false },
  fullName: { type: String },
  image: dbConnector.imageSchema,
  partOfTeams: { type: [String], default: [] },
  followingRooms: { type: [String], default: [] },
  description: { type: [String], default: [] },
}), { collection: 'aliases' });

const Alias = mongoose.model('Alias', aliasSchema);

/**
 * Update alias
 * @private
 * @param {Object} params Parameters.
 * @param {string} params.aliasId Id of the alias to update.
 * @param {Object} params.update Update.
 * @param {Function} params.callback Callback.
 */
function updateObject({ aliasId, update, callback }) {
  dbConnector.updateObject({
    update,
    query: { _id: aliasId },
    object: Alias,
    errorNameContent: 'updateAlias',
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ data: { alias: data.object } });
    },
  });
}

/**
 * Get aliases
 * @private
 * @param {Object} params Parameters
 * @param {Object} params.query Query to get aliases
 * @param {Function} params.callback Callback
 */
function getAliases({ filter, query, callback }) {
  dbConnector.getObjects({
    query,
    filter,
    object: Alias,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ data: { aliases: data.objects } });
    },
  });
}

/**
 * Get alias
 * @private
 * @param {Object} params Parameters
 * @param {string} params.query Query to get alias
 * @param {Function} params.callback Callback
 */
function getAlias({ query, callback }) {
  dbConnector.getObject({
    query,
    object: Alias,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      if (!data.object) {
        callback({ error: new errorCreator.DoesNotExist({ name: `alias ${JSON.stringify(query, null, 4)}` }) });

        return;
      }

      callback({ data: { alias: data.object } });
    },
  });
}

/**
 * Update access to the alias
 * @param {Object} params Parameters.
 * @param {Function} params.callback Callback.
 * @param {boolean} [params.shouldRemove] Should access be removed?
 * @param {string[]} [params.userIds] Id of the users to update.
 * @param {string[]} [params.teamIds] Id of the teams to update.
 * @param {string[]} [params.bannedIds] Id of the blocked Ids to update.
 * @param {string[]} [params.teamAdminIds] Id of the teams to update admin access for.
 * @param {string[]} [params.userAdminIds] Id of the users to update admin access for.
 */
function updateAccess(params) {
  const accessParams = params;
  const { callback } = params;
  accessParams.objectId = params.aliasId;
  accessParams.object = Alias;
  accessParams.callback = ({ error, data }) => {
    if (error) {
      callback({ error });

      return;
    }

    callback({ data: { alias: data.object } });
  };

  if (params.shouldRemove) {
    dbConnector.removeObjectAccess(params);
  } else {
    dbConnector.addObjectAccess(params);
  }
}

/**
 * Get alias by id or name.
 * @param {Object} params Parameters.
 * @param {string} [params.aliasId] Id of the alias.
 * @param {string} [params.aliasName] Name of the alias.
 * @param {Function} params.callback Callback.
 */
function getAliasById({
  aliasId,
  aliasName,
  callback,
}) {
  const query = aliasId
    ? { _id: aliasId }
    : { aliasName };

  getAlias({
    callback,
    query,
  });
}

/**
 * Does the alias exist?
 * @param {Object} params Parameters
 * @param {string} params.aliasName Name of the alias
 * @param {Function} params.callback Callback
 */
function doesAliasExist({ aliasName, callback }) {
  dbConnector.doesObjectExist({
    callback,
    query: { aliasNameLowerCase: aliasName.toLowerCase() },
    object: Alias,
  });
}

/**
 * Add an alias to the user, if a user with the alias or a matching user name doesn't already exist
 * @param {Object} params Parameters
 * @param {Object} params.alias Alias to add
 * @param {Function} params.callback Callback
 */
function createAlias({
  alias,
  callback,
  options = {},
}) {
  dbUser.doesUserExist({
    username: alias.aliasName,
    callback: (nameData) => {
      if (nameData.error) {
        callback({ error: nameData.error });

        return;
      }

      if (nameData.data.exists) {
        callback({ error: new errorCreator.AlreadyExists({ name: `aliasName ${alias.aliasName}` }) });

        return;
      }

      const aliasToSave = alias;
      aliasToSave.aliasNameLowerCase = aliasToSave.aliasName.toLowerCase();

      if (options.setId && aliasToSave.objectId) {
        aliasToSave._id = mongoose.Types.ObjectId(aliasToSave.objectId); // eslint-disable-line no-underscore-dangle
      } else {
        aliasToSave._id = mongoose.Types.ObjectId(); // eslint-disable-line no-underscore-dangle
      }

      dbConnector.saveObject({
        object: new Alias(alias),
        objectType: 'alias',
        callback: (saveData) => {
          if (saveData.error) {
            callback({ error: saveData.error });

            return;
          }

          const createdAlias = saveData.data.savedObject;

          dbUser.updateUser({
            userId: createdAlias.ownerId,
            user: { aliases: [createdAlias.objectId] },
            callback: (updateData) => {
              if (updateData.error) {
                callback({ error: updateData.error });

                return;
              }

              callback({ data: { alias: createdAlias } });
            },
          });
        },
      });
    },
  });
}

/**
 * Update alias
 * @param {Object} params Parameters
 * @param {Object} params.alias Fields to update
 * @param {string} params.aliasId ID of the alias to update
 * @param {Object} [params.options] Options
 * @param {Object} [params.options.resetOwnerAliasId] Should ownerAliasId be removed?
 * @param {Function} params.callback Callback
 */
function updateAlias({
  aliasId,
  alias,
  callback,
  options = {},
}) {
  const { resetOwnerAliasId } = options;
  const {
    aliasName,
    ownerAliasId,
    isPublic,
  } = alias;
  const update = {};
  const set = {};
  const unset = {};

  if (resetOwnerAliasId) {
    unset.ownerAliasId = '';
  } else if (ownerAliasId) {
    set.ownerAliasId = ownerAliasId;
  }

  if (typeof isPublic === 'boolean') { set.isPublic = isPublic; }
  if (aliasName) {
    set.aliasName = aliasName;
    set.aliasNameLowerCase = aliasName.toLowerCase();
  }

  if (Object.keys(set).length > 0) { update.$set = set; }
  if (Object.keys(unset).length > 0) { update.$unset = unset; }

  if (aliasName) {
    dbUser.doesUserExist({
      username: aliasName,
      callback: ({ error, data }) => {
        if (error) {
          callback({ error });

          return;
        }

        if (data.exists) {
          callback({ error: new errorCreator.AlreadyExists({ name: `username ${aliasName}` }) });

          return;
        }

        updateObject({
          update,
          aliasId,
          callback,
        });
      },
    });

    return;
  }

  updateObject({
    update,
    aliasId,
    callback,
  });
}

/**
 * Get aliases that the user has access to.
 * @param {Object} params Parameters.
 * @param {string} params.user User retrieving the aliases.
 * @param {Function} params.callback Callback.
 */
function getAliasesByUser({
  user,
  callback,
}) {
  const query = dbConnector.createUserQuery({ user });

  getAliases({
    query,
    callback,
  });
}

/**
 * Get all aliases.
 * @param {Object} params Parameters.
 * @param {Function} params.callback Callback
 */
function getAllAliases({ callback }) {
  getAliases({
    callback,
    query: {},
  });
}

exports.createAlias = createAlias;
exports.updateAccess = updateAccess;
exports.getAliasesByUser = getAliasesByUser;
exports.updateAlias = updateAlias;
exports.doesAliasExist = doesAliasExist;
exports.getAliasById = getAliasById;
exports.getAllAliases = getAllAliases;
