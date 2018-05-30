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
const errorCreator = require('../../error/errorCreator');
const dbConnector = require('../databaseConnector');
const { dbConfig } = require('../../config/defaults/config');

const mapPositionSchema = new mongoose.Schema(dbConnector.createSchema({
  connectedToUser: {
    type: String,
    unique: true,
    sparse: true,
  },
  coordinatesHistory: [dbConnector.coordinatesSchema],
  positionName: { type: String, unique: true },
  positionType: { type: String, default: dbConfig.PositionTypes.WORLD },
  description: { type: [String], default: [] },
  radius: { type: Number, default: 0 },
  isStationary: { type: Boolean, default: false },
  origin: { type: String, default: dbConfig.PositionOrigins.LOCAL },
  positionStructure: { type: String, default: dbConfig.PositionStructures.MARKER },
}), { collection: 'mapPositions' });

const MapPosition = mongoose.model('MapPosition', mapPositionSchema);

const positionFilter = dbConnector.createFilter({
  connectedToUser: 1,
  coordinatesHistory: 1,
  positionName: 1,
  positionType: 1,
  positionStructure: 1,
  radius: 1,
  isStationary: 1,
  description: 1,
});

/**
 * Update position.
 * @private
 * @param {Object} params - Parameter.
 * @param {string} params.positionId - Id of the position to update.
 * @param {Object} params.update - Update.
 * @param {Function} params.callback Callback.
 */
function updateObject({ positionId, update, callback }) {
  dbConnector.updateObject({
    update,
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
 * @param {Object} params - Parameters.
 * @param {Object} [params.query] - Query to get positions.
 * @param {Function} params.callback - Callback.
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
 * @param {Object} params - Parameters.
 * @param {Object} [params.query] - Query to get position.
 * @param {Function} params.callback - Callback.
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
      } else if (!data.object) {
        callback({ error: new errorCreator.DoesNotExist({ name: `position ${JSON.stringify(query, null, 4)}` }) });

        return;
      }

      callback({ data: { position: data.object } });
    },
  });
}

/**
 * Does the position exist?
 * @param {Object} params - Parameters.
 * @param {string} [params.connectedToUser] - Id of the user or alias.
 * @param {Function} params.callback - Callback.
 */
function doesPositionExist({
  positionName,
  connectedToUser,
  callback,
}) {
  if (!connectedToUser && !positionName) {
    callback({ data: { exists: false } });

    return;
  }

  const query = { $or: [] };

  if (connectedToUser) {
    query.$or.push({ connectedToUser: { $exists: true } });
  }

  if (positionName) {
    query.$or.push({ positionName });
  }

  dbConnector.doesObjectExist({
    callback,
    query,
    object: MapPosition,
  });
}

/**
 * Create position
 * @param {Object} params - Parameters
 * @param {Object} params.position - Position to add
 * @param {Function} params.callback - Callback
 */
function createPosition({ position, callback }) {
  doesPositionExist({
    positionName: position.positionName,
    connectedToUser: position.connectedToUser,
    callback: (positionData) => {
      if (positionData.error) {
        callback({ error: positionData.error });

        return;
      } else if (positionData.data.exists) {
        callback({ error: new errorCreator.AlreadyExists({ name: `positionName ${position.positionName} || connectedToUser ${position.connectedToUser} in position` }) });

        return;
      }

      const positionToSave = position;
      positionToSave.coordinatesHistory = [positionToSave.coordinates];

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
 * Update position coordinates.
 * @param {Object} params - Parameters.
 * @param {string} params.positionId - Id of the position.
 * @param {Function} params.callback - Callback.
 * @param {Object} params.coordinates - GPS coordinates.
 */
function updateCoordinates({ positionId, coordinates, callback }) {
  const update = { $push: { coordinatesHistory: coordinates } };

  updateObject({
    positionId,
    update,
    callback,
  });
}


// TODO Position should be automatically created when a user is created. connectedToUser should not be used to identify a user's position
/**
 * Update position.
 * @param {Object} params - Parameters.
 * @param {Object} params.position - Position object to update with.
 * @param {Object} [params.options] - Options.
 * @param {boolean} params.options.resetOwnerAliasId - Should the owner alias be reset on the position?
 * @param {Function} params.callback - Callback.
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
    connectedToUser,
    description,
  } = position;
  const { resetOwnerAliasId, resetConnectedToUser } = options;

  const update = {
    $set: {},
    $unset: {},
  };

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
      connectedToUser,
      callback: (deviceData) => {
        if (deviceData.error) {
          callback({ error: deviceData.error });

          return;
        } else if (deviceData.data.exists) {
          callback({ error: new errorCreator.AlreadyExists({ name: `position with connected user ${position.connectedToUser}` }) });

          return;
        }

        updateCallback();
      },
    });
  };

  if (text) { update.$set.description = text; }
  if (positionName) { update.$set.positionName = positionName; }
  if (positionType) { update.$set.positionType = positionType; }
  if (description) { update.$set.description = description; }
  if (positionStructure) { update.$set.positionStructure = positionStructure; }

  if (typeof isPublic !== 'undefined') { update.$set.isPublic = isPublic; }
  if (typeof isStationary !== 'undefined') { update.$set.isStationary = isStationary; }

  if (resetConnectedToUser) {
    update.$unset.connectedToUser = '';
    update.$set.positionType = dbConfig.PositionTypes.DEVICE;
  } else if (connectedToUser) {
    update.$set.connectedToUser = connectedToUser;
    update.$set.positionType = dbConfig.PositionTypes.USER;
  }

  if (resetOwnerAliasId) {
    update.$unset.ownerAliasId = '';
  } else if (ownerAliasId) {
    update.$set.ownerAliasId = ownerAliasId;
  }

  if (!resetConnectedToUser && connectedToUser) {
    existCallback();
  } else {
    updateCallback();
  }
}

/**
 * Get positions that the user has access to.
 * @param {Object} params - Parameters.
 * @param {string} params.user - User retrieving the positions.
 * @param {Function} params.callback - Callback.
 * @param {boolean} [params.full] - Should access information be retrieved?
 * @param {string[]} [params.positionTypes] - Types of positions to retrieve.
 */
function getPositionsByUser({
  user,
  callback,
  positionTypes,
  full = false,
}) {
  const query = dbConnector.createUserQuery({ user });
  const filter = !full ? positionFilter : {};

  if (positionTypes) {
    query.positionType = { $in: positionTypes };
  }

  getPositions({
    filter,
    query,
    callback,
  });
}

/**
 * Get positions by their structure.
 * @param {Object} params - Parameters.
 * @param {string} params.user - User retrieving the positions.
 * @param {string} params.positionStructure - Type of position structure.
 * @param {Function} params.callback - Callback.
 * @param {boolean} [params.full] - Should access information be retrieved?
 */
function getPositionsByStructure({
  user,
  callback,
  positionTypes: positionStructure,
  full = false,
}) {
  const query = dbConnector.createUserQuery({ user });
  const filter = !full ? positionFilter : {};

  if (positionStructure) {
    query.positionStructure = { $in: positionStructure };
  }

  getPositions({
    filter,
    query,
    callback,
  });
}

/**
 * Remove position
 * @param {Object} params - Parameters
 * @param {string} params.positionId - ID of the position
 * @param {Function} params.callback - Callback
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
 * @param {Object} params - Parameters
 * @param {string} params.positionType - Position type
 * @param {Function} params.callback - Callback
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
 * @param {Object} params - Parameters.
 * @param {string} params.origin - The creation origin of the positions.
 * @param {Function} params.callback - Callback.
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
 * @param {Object} params - Parameters.
 * @param {string} params.positionId - Id of the position.
 * @param {Function} params.callback - Callback.
 */
function getPositionById({ positionId, callback }) {
  getPosition({
    callback,
    query: { _id: positionId },
  });
}

/**
 * Get position of user
 * @param {Object} params - Parameters
 * @param {Object} params.userId - ID of the user
 * @param {Object} params.callback - Callback
 */
function getUserPosition({ userId, callback }) {
  getPosition({
    callback,
    query: { connectedToUser: userId },
  });
}

/**
 * Add access to position
 * @param {Object} params - Parameters
 * @param {string} params.positionId - ID of the team
 * @param {string[]} [params.userIds] - ID of the users
 * @param {string[]} [params.teamIds] - ID of the teams
 * @param {string[]} [params.bannedIds] - Blocked ids
 * @param {string[]} [params.teamAdminIds] - Id of the teams to give admin access to. They will also be added to teamIds.
 * @param {string[]} [params.userAdminIds] - Id of the users to give admin access to. They will also be added to userIds.
 * @param {Function} params.callback - Callback
 */
function addAccess({
  positionId,
  userIds,
  teamIds,
  bannedIds,
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
    objectId: positionId,
    object: MapPosition,
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
 * Remove access to position
 * @param {Object} params - Parameters
 * @param {string} params.positionId - ID of the team
 * @param {string[]} params.teamIds - ID of the teams
 * @param {string[]} [params.userIds] - ID of the user
 * @param {string[]} [params.bannedIds] - Blocked ids
 * @param {string[]} [params.teamAdminIds] - Id of the teams to remove admin access from. They will not be removed from teamIds.
 * @param {string[]} [params.userAdminIds] - Id of the users to remove admin access from. They will not be removed from userIds.
 * @param {Function} params.callback - Callback
 */
function removeAccess({
  positionId,
  userIds,
  teamIds,
  bannedIds,
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
    objectId: positionId,
    object: MapPosition,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ data: { position: data.object } });
    },
  });
}

exports.updatePositionCoordinates = updateCoordinates;
exports.removePosition = removePosition;
exports.createPosition = createPosition;
exports.getPositionsByUser = getPositionsByUser;
exports.updatePosition = updatePosition;
exports.removePositionsByOrigin = removePositionsByOrigin;
exports.getPositionById = getPositionById;
exports.getUserPosition = getUserPosition;
exports.addAccess = addAccess;
exports.removeAccess = removeAccess;
exports.removePositionsByType = removePositionsByType;
exports.removePositionsByOrigin = removePositionsByOrigin;
exports.getPositionsByStructure = getPositionsByStructure;
