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
const errorCreator = require('../../objects/error/errorCreator');
const dbConnector = require('../databaseConnector');
const dbUser = require('./user');

const aliasSchema = new mongoose.Schema(dbConnector.createSchema({
  aliasName: { type: String, unique: true },
  isIdentity: { type: Boolean, default: false },
}), { collection: 'aliases' });

const Alias = mongoose.model('Alias', aliasSchema);

/**
 * Add custom id to the object
 * @param {Object} alias - Alias object
 * @return {Object} - Alias object with id
 */
function addCustomId(alias) {
  const updatedAlias = alias;
  updatedAlias.aliasId = alias.objectId;

  return updatedAlias;
}

/**
 * Update alias
 * @private
 * @param {Object} params - Parameters
 * @param {string} params.aliasId - ID of the alias to update
 * @param {Object} params.update - Update
 * @param {Function} params.callback Callback
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

      callback({ data: { alias: addCustomId(data.object) } });
    },
  });
}

/**
 * Get aliases
 * @private
 * @param {Object} params - Parameters
 * @param {Object} params.query - Query to get aliases
 * @param {Function} params.callback - Callback
 */
function getAliases({ query, callback }) {
  dbConnector.getObjects({
    query,
    object: Alias,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({
        data: {
          aliases: data.objects.map(alias => addCustomId(alias)),
        },
      });
    },
  });
}

/**
 * Get alias
 * @private
 * @param {Object} params - Parameters
 * @param {string} params.query - Query to get alias
 * @param {Function} params.callback - Callback
 */
function getAlias({ query, callback }) {
  dbConnector.getObject({
    query,
    object: Alias,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!data.object) {
        callback({ error: new errorCreator.DoesNotExist({ name: `alias ${query.toString()}` }) });

        return;
      }

      callback({ data: { alias: addCustomId(data.object) } });
    },
  });
}

/**
 * Add access to the alias for users or teams
 * @param {Object} params - Parameters
 * @param {string} params.aliasId - ID of the alias
 * @param {string[]} [params.userIds] - ID of the users
 * @param {string[]} [params.teamIds] - ID of the teams
 * @param {string[]} [params.bannedIds] - ID of the blocked Ids to add
 * @param {string[]} [params.teamAdminIds] - ID of the team admins to add
 * @param {string[]} [params.userAdminIds] - ID of the user admins to add
 * @param {Function} params.callback - Callback
 */
function addAccess({
  userIds,
  teamIds,
  bannedIds,
  aliasId,
  teamAdminIds,
  userAdminIds,
  callback,
}) {
  dbConnector.addObjectAccess({
    userIds,
    teamIds,
    bannedIds,
    userAdminIds,
    teamAdminIds,
    objectId: aliasId,
    object: Alias,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ alias: addCustomId(data.object) });
    },
  });
}

/**
 * Remove access to the alias for user or team
 * @param {Object} params - Parameters
 * @param {string} params.aliasId - ID of the alias
 * @param {string[]} [params.userIds] - ID of the users to remove
 * @param {string[]} [params.teamIds] - ID of the teams to remove
 * @param {string[]} [params.bannedIds] - Blocked IDs to remove
 * @param {string[]} [params.teamAdminIds] - ID of the team admins to remove
 * @param {string[]} [params.userAdminIds] - ID of the user admins to remove
 * @param {Function} params.callback - Callback
 */
function removeAccess({
  userIds,
  teamIds,
  bannedIds,
  aliasId,
  teamAdminIds,
  userAdminIds,
  callback,
}) {
  dbConnector.removeObjectAccess({
    userIds,
    teamIds,
    bannedIds,
    teamAdminIds,
    userAdminIds,
    objectId: aliasId,
    object: Alias,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ alias: addCustomId(data.object) });
    },
  });
}

/**
 * Get alias by name
 * @param {Object} params - Parameters
 * @param {string} params.aliasName - Name of the alias
 * @param {Function} params.callback - Callback
 */
function getAliasByName({ aliasName, callback }) {
  getAlias({
    callback,
    query: { aliasName },
  });
}

/**
 * Get alias by id
 * @param {Object} params - Parameters
 * @param {string} params.aliasId - ID of the alias
 * @param {Function} params.callback - Callback
 */
function getAliasById({ aliasId, callback }) {
  getAlias({
    callback,
    query: { _id: aliasId },
  });
}

/**
 * Does the alias exist?
 * @param {Object} params - Parameters
 * @param {string} params.aliasName - Name of the alias
 * @param {Function} params.callback - Callback
 */
function doesAliasExist({ aliasName, callback }) {
  dbConnector.doesObjectExist({
    callback,
    query: { aliasName },
    object: Alias,
  });
}

/**
 * Add an alias to the user, if a user with the alias or a matching user name doesn't already exist
 * @param {Object} params - Parameters
 * @param {Object} params.alias - Alias to add
 * @param {Function} params.callback - Callback
 */
function createAlias({ alias, callback }) {
  dbUser.doesUserExist({
    aliasName: alias.aliasName,
    callback: (nameData) => {
      if (nameData.error) {
        callback({ error: nameData.error });

        return;
      } else if (nameData.data.exists) {
        callback({ error: new errorCreator.AlreadyExists({ name: `aliasName ${alias.aliasName}` }) });

        return;
      }

      dbConnector.saveObject({
        object: new Alias(alias),
        objectType: 'alias',
        callback: (saveData) => {
          if (saveData.error) {
            callback({ error: saveData.error });

            return;
          }

          callback({
            data: {
              alias: addCustomId(saveData.data.savedObject),
            },
          });
        },
      });
    },
  });
}

/**
 * Update alias
 * @param {Object} params - Parameters
 * @param {Object} params.alias - Fields to update
 * @param {string} params.aliasId - ID of the alias to update
 * @param {Object} [params.options] - Options
 * @param {Object} [params.options.resetOwnerAliasId] - Should ownerAliasId be removed?
 * @param {Function} params.callback - Callback
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
  const update = { $set: {} };

  if (resetOwnerAliasId) {
    update.$unset = { ownerAliasId: '' };
  } else if (ownerAliasId) {
    update.$set.ownerAliasId = ownerAliasId;
  }

  if (typeof isPublic === 'boolean') { update.$set.isPublic = isPublic; }

  if (aliasName) {
    update.$set.aliasName = aliasName;

    dbUser.doesUserExist({
      aliasName,
      callback: ({ error, data }) => {
        if (error) {
          callback({ error });

          return;
        } else if (data.exists) {
          callback({ error: new errorCreator.AlreadyExists({ name: `username ${aliasName}` }) });

          return;
        }

        doesAliasExist({
          aliasName,
          callback: (aliasData) => {
            if (aliasData.error) {
              callback({ error: aliasData.error });

              return;
            } else if (aliasData.data.exists) {
              callback({ error: new errorCreator.AlreadyExists({ name: `aliasName ${aliasName}` }) });

              return;
            }

            updateObject({
              update,
              aliasId,
              callback,
            });
          },
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
 * Get aliases that the teams have access to
 * @param {Object} params - Parameters
 * @param {string[]} params.teamIds - ID of the teams
 * @param {Function} params.callback - Callback
 */
function getAliasesByTeams({ teamIds, callback }) {
  getAliases({
    callback,
    query: { teamIds: { $in: teamIds } },
  });
}

/**
 * Get aliases that the user has access to
 * @param {Object} params - Parameters
 * @param {string} params.userId - ID of the user
 * @param {Function} params.callback - Callback
 */
function getAliasesByUser({ userId, callback }) {
  const query = {
    $or: [
      { ownerId: userId },
      { userIds: { $in: [userId] } },
    ],
  };

  getAliases({
    query,
    callback,
  });
}

/**
 * Get all aliases
 * @param {Object} params - Parameters
 * @param {Function} params.callback - Callback
 */
function getAllAliases({ callback }) {
  getAliases({
    callback,
  });
}

/**
 * Remove alias
 * @param {Object} params - Parameters
 * @param {string} params.aliasId - ID of the alias to remove
 * @param {Function} params.callback - Callback
 */
function removeAlias({ aliasId, callback }) {
  dbConnector.removeObject({
    callback,
    query: { _id: aliasId },
    object: Alias,
  });
}

exports.createAlias = createAlias;
exports.removeAccess = removeAccess;
exports.addAccess = addAccess;
exports.getAllAliases = getAllAliases;
exports.getAliasesByUser = getAliasesByUser;
exports.updateAlias = updateAlias;
exports.removeAlias = removeAlias;
exports.getAliasByName = getAliasByName;
exports.doesAliasExist = doesAliasExist;
exports.getAliasesByTeams = getAliasesByTeams;
exports.getAliasById = getAliasById;
