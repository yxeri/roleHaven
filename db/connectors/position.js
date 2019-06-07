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
const {
  dbConfig,
  appConfig,
} = require('../../config/defaults/config');

const mapPositionSchema = new mongoose.Schema(dbConnector.createSchema({
  coordinatesHistory: { type: [dbConnector.coordinatesSchema], default: [] },
  positionName: { type: String, unique: true },
  positionType: { type: String, default: dbConfig.PositionTypes.WORLD },
  description: { type: [String], default: [] },
  radius: { type: Number, default: 0 },
  isStationary: { type: Boolean, default: false },
  origin: { type: String, default: dbConfig.PositionOrigins.LOCAL },
  positionStructure: { type: String, default: dbConfig.PositionStructures.MARKER },
  styleName: String,
  occupants: [String],
}), { collection: 'mapPositions' });

const MapPosition = mongoose.model('MapPosition', mapPositionSchema);

/**
 * Update position.
 * @private
 * @param {Object} params Parameter.
 * @param {string} params.positionId Id of the position to update.
 * @param {Object} params.update Update.
 * @param {Function} params.callback Callback.
 */
function updateObject({
  positionId,
  update,
  callback,
  upsert,
}) {
  dbConnector.updateObject({
    update,
    upsert,
    query: { _id: positionId },
    object: MapPosition,
    errorNameContent: 'updatePosition',
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ data: { position: data.object } });
    },
  });
}

/**
 * Get positions.
 * @private
 * @param {Object} params Parameters.
 * @param {Object} [params.query] Query to get positions.
 * @param {Function} params.callback Callback.
 */
function getPositions({
  query,
  callback,
  filter,
}) {
  dbConnector.getObjects({
    query,
    filter,
    object: MapPosition,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({
        data: {
          positions: data.objects,
        },
      });
    },
  });
}

/**
 * Get position
 * @private
 * @param {Object} params Parameters.
 * @param {Object} [params.query] Query to get position.
 * @param {Function} params.callback Callback.
 */
function getPosition({ filter, query, callback }) {
  dbConnector.getObject({
    query,
    filter,
    object: MapPosition,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      if (!data.object) {
        callback({ error: new errorCreator.DoesNotExist({ name: `position ${JSON.stringify(query, null, 4)}` }) });

        return;
      }

      callback({ data: { position: data.object } });
    },
  });
}

/**
 * Does the position exist?
 * @param {Object} params Parameters.
 * @param {Function} params.callback Callback.
 */
function doesPositionExist({
  positionName,
  callback,
}) {
  const query = { positionName };

  dbConnector.doesObjectExist({
    callback,
    query,
    object: MapPosition,
  });
}

/**
 * Create position
 * @param {Object} params Parameters
 * @param {Object} params.position Position to add
 * @param {Function} params.callback Callback
 */
function createPosition({
  position,
  callback,
  suppressExistsError = false,
  options = {},
}) {
  doesPositionExist({
    positionName: position.positionName,
    callback: (positionData) => {
      if (positionData.error) {
        callback({ error: positionData.error });

        return;
      }

      if (positionData.data.exists) {
        callback({
          error: new errorCreator.AlreadyExists({
            suppressExistsError,
            name: `positionName ${position.positionName} in position`,
          }),
        });

        return;
      }

      const positionToSave = position;

      if (positionToSave.coordinates) {
        positionToSave.coordinatesHistory = [positionToSave.coordinates];
      }

      if (options.setId && position.objectId) {
        positionToSave._id = mongoose.Types.ObjectId(position.objectId); // eslint-disable-line no-underscore-dangle
      }

      dbConnector.saveObject({
        object: new MapPosition(position),
        objectType: 'mapPosition',
        callback: ({ error, data }) => {
          if (error) {
            callback({ error });

            return;
          }

          callback({ data: { position: data.savedObject } });
        },
      });
    },
  });
}

/**
 * Update position.
 * @param {Object} params Parameters.
 * @param {Object} params.position Position object to update with.
 * @param {Object} [params.options] Options.
 * @param {boolean} params.options.resetOwnerAliasId Should the owner alias be reset on the position?
 * @param {Function} params.callback Callback.
 */
function updatePosition({
  positionId,
  position,
  callback,
  options = {},
}) {
  const {
    positionStructure,
    positionName,
    ownerAliasId,
    isStationary,
    positionType,
    text,
    isPublic,
    description,
    styleName,
    coordinates,
  } = position;
  const {
    resetOwnerAliasId,
  } = options;

  const update = {};
  const set = {};
  const unset = {};
  const push = {};

  const updateCallback = () => {
    updateObject({
      positionId,
      update,
      callback: ({ error, data }) => {
        if (error) {
          callback({ error });

          return;
        }

        callback({ data });
      },
    });
  };
  const existCallback = () => {
    doesPositionExist({
      positionName,
      callback: (positionData) => {
        if (positionData.error) {
          callback({ error: positionData.error });

          return;
        }

        if (positionData.data.exists) {
          callback({ error: new errorCreator.AlreadyExists({ name: `position with name ${position.positionName}` }) });

          return;
        }

        updateCallback();
      },
    });
  };

  if (text) { set.description = text; }
  if (positionName) { set.positionName = positionName; }
  if (positionType) { set.positionType = positionType; }
  if (description) { set.description = description; }
  if (positionStructure) { set.positionStructure = positionStructure; }
  if (styleName) { set.styleName = styleName; }
  if (coordinates) {
    push.coordinatesHistory = {
      $each: [coordinates],
      $sort: { timeCreated: 1 },
      $slice: -appConfig.maxPositionHistory,
    };
  }

  if (typeof isPublic !== 'undefined') { set.isPublic = isPublic; }
  if (typeof isStationary !== 'undefined') { set.isStationary = isStationary; }

  if (resetOwnerAliasId) {
    unset.ownerAliasId = '';
  } else if (ownerAliasId) {
    set.ownerAliasId = ownerAliasId;
  }

  if (Object.keys(set).length > 0) { update.$set = set; }
  if (Object.keys(unset).length > 0) { update.$unset = unset; }
  if (Object.keys(push).length > 0) { update.$push = push; }

  if (positionName) {
    existCallback();
  } else {
    updateCallback();
  }
}

/**
 * Get positions that the user has access to.
 * @param {Object} params Parameters.
 * @param {string} params.user User retrieving the positions.
 * @param {Function} params.callback Callback.
 */
function getPositionsByUser({
  user,
  callback,
}) {
  const query = dbConnector.createUserQuery({ user });

  getPositions({
    query,
    callback,
  });
}

/**
 * Get positions by their structure.
 * @param {Object} params Parameters.
 * @param {string} params.user User retrieving the positions.
 * @param {string} params.positionStructure Type of position structure.
 * @param {Function} params.callback Callback.
 */
function getPositionsByStructure({
  user,
  callback,
  positionTypes: positionStructure,
}) {
  const query = dbConnector.createUserQuery({ user });
  query.positionStructure = { $in: positionStructure };

  getPositions({
    query,
    callback,
  });
}

/**
 * Remove position
 * @param {Object} params Parameters
 * @param {string} params.positionId ID of the position
 * @param {Function} params.callback Callback
 */
function removePosition({ positionId, callback }) {
  dbConnector.removeObject({
    callback,
    query: { _id: positionId },
    object: MapPosition,
  });
}

/**
 * Remove positions based on position type.
 * @param {Object} params Parameters
 * @param {string} params.positionType Position type
 * @param {Function} params.callback Callback
 */
function removePositionsByType({ positionType, callback }) {
  dbConnector.removeObjects({
    callback,
    object: MapPosition,
    query: { positionType },
  });
}

/**
 * Remove positions based on its origin.
 * @param {Object} params Parameters.
 * @param {string} params.origin The creation origin of the positions.
 * @param {Function} params.callback Callback.
 */
function removePositionsByOrigin({ origin, callback }) {
  dbConnector.removeObjects({
    callback,
    object: MapPosition,
    query: { origin },
  });
}

/**
 * Get position by Id.
 * @param {Object} params Parameters.
 * @param {string} params.positionId Id of the position.
 * @param {Function} params.callback Callback.
 */
function getPositionById({ positionId, callback }) {
  getPosition({
    callback,
    query: { _id: positionId },
  });
}

/**
 * Get position of user
 * @param {Object} params Parameters
 * @param {Object} params.userId ID of the user
 * @param {Object} params.callback Callback
 */
function getUserPosition({ userId, callback }) {
  getPosition({
    callback,
    query: { _id: userId },
  });
}

/**
 * Update access to the position.
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
  accessParams.objectId = params.positionId;
  accessParams.object = MapPosition;
  accessParams.callback = ({ error, data }) => {
    if (error) {
      callback({ error });

      return;
    }

    callback({ data: { position: data.object } });
  };

  if (params.shouldRemove) {
    dbConnector.removeObjectAccess(params);
  } else {
    dbConnector.addObjectAccess(params);
  }
}

exports.removePosition = removePosition;
exports.createPosition = createPosition;
exports.getPositionsByUser = getPositionsByUser;
exports.updatePosition = updatePosition;
exports.removePositionsByOrigin = removePositionsByOrigin;
exports.getPositionById = getPositionById;
exports.getUserPosition = getUserPosition;
exports.updateAccess = updateAccess;
exports.removePositionsByType = removePositionsByType;
exports.removePositionsByOrigin = removePositionsByOrigin;
exports.getPositionsByStructure = getPositionsByStructure;
