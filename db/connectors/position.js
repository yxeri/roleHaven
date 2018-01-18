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
const dbConfig = require('../../config/defaults/config').databasePopulation;

const mapPositionSchema = new mongoose.Schema(dbConnector.createSchema({
  deviceId: {
    type: String,
    unique: true,
    sparse: true,
  },
  connectedToUser: {
    type: String,
    unique: true,
    sparse: true,
  },
  coordinatesHistory: [dbConnector.coordinatesSchema],
  positionName: String,
  positionType: { type: String, default: dbConfig.PositionTypes.WORLD },
  description: { type: [String], default: [] },
  radius: { type: Number, default: 0 },
  isStationary: { type: Boolean, default: false },
}), { collection: 'mapPositions' });

const MapPosition = mongoose.model('MapPosition', mapPositionSchema);

const positionFilter = {
  connectedToUser: 1,
  deviceId: 1,
  coordinatesHistory: 1,
  positionName: 1,
  positionType: 1,
  radius: 1,
  isStationary: 1,
  lastUpdated: 1,
  customLastUpdated: 1,
  timeCreated: 1,
  customTimeCreated: 1,
};

/**
 * Update position
 * @private
 * @param {Object} params - Parameters
 * @param {string} params.positionId - ID of the position to update
 * @param {Object} params.update - Update
 * @param {Function} params.callback Callback
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
 * Get positions
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
        callback({ error: new errorCreator.DoesNotExist({ name: `position ${query.toString()}` }) });

        return;
      }

      callback({ data: { position: data.object } });
    },
  });
}

/**
 * Get position by device
 * @param {Object} params - Parameters
 * @param {string} params.deviceId - ID of the device
 * @param {Function} params.callback - Callback
 */
function getPositionByDevice({ deviceId, callback }) {
  getPosition({
    callback,
    object: MapPosition,
    query: { deviceId },
  });
}

/**
 * Does the position exist?
 * @param {Object} params - Parameters
 * @param {string} [params.deviceId] - ID of the device
 * @param {string} [params.connectedToUser] - ID of the user or alias
 * @param {Function} params.callback - Callback
 */
function doesPositionExist({ deviceId, connectedToUser, callback }) {
  if (!deviceId && !connectedToUser) {
    callback({ data: { exists: false } });

    return;
  }

  const query = {};

  if (deviceId && connectedToUser) {
    query.$or = [
      { deviceId },
      { connectedToUser },
    ];
  } else if (deviceId) {
    query.deviceId = deviceId;
  } else if (connectedToUser) {
    query.connectedToUser = connectedToUser;
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
  const existCallback = ({ saveCallback }) => {
    doesPositionExist({
      deviceId: position.deviceId,
      connectedToUser: position.connectedToUser,
      callback: (deviceData) => {
        if (deviceData.error) {
          callback({ error: deviceData.error });

          return;
        } else if (deviceData.data.exists) {
          callback({ error: new errorCreator.AlreadyExists({ name: `device ${position.deviceId} || connectedToUser ${position.connectedToUser} in position` }) });

          return;
        }

        saveCallback();
      },
    });
  };

  const saveCallback = () => {
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
  };

  if (position.connectedToUser || position.deviceId) {
    existCallback({ saveCallback });
  } else {
    saveCallback();
  }
}

/**
 * Update position coordinates
 * @param {Object} params - Parameters
 * @param {string} params.positionId - ID of the position
 * @param {Function} params.callback - Callback
 * @param {Object} params.coordinates - GPS coordinates
 * @param {number} params.coordinates.longitude - Longitude
 * @param {number} params.coordinates.latitude - Latitude
 * @param {number} params.coordinates.accuracy - Accuracy in meters
 * @param {number} [params.coordinates.heading] - Heading (0 - 359)
 * @param {number} [params.coordinates.speed] - Speed
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
    deviceId,
    positionName,
    ownerAliasId,
    isStationary,
    positionType,
    text,
    isPublic,
    connectedToUser,
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
      deviceId,
      connectedToUser,
      callback: (deviceData) => {
        if (deviceData.error) {
          callback({ error: deviceData.error });

          return;
        } else if (deviceData.data.exists) {
          callback({ error: new errorCreator.AlreadyExists({ name: `position with device ${position.deviceId} || ${position.connectedToUser}` }) });

          return;
        }

        updateCallback();
      },
    });
  };

  if (text) { update.$set.description = text; }
  if (positionName) { update.$set.positionName = positionName; }
  if (positionType) { update.$set.positionType = positionType; }
  if (deviceId) { update.$set.deviceId = deviceId; }
  if (connectedToUser) { update.$set.connectedToUser = connectedToUser; }

  if (typeof isPublic !== 'undefined') { update.$set.isPublic = isPublic; }
  if (typeof isStationary !== 'undefined') { update.$set.isStationary = isStationary; }

  if (resetConnectedToUser) {
    update.$unset.connectedToUser = '';
  } else if (connectedToUser) {
    update.$set.connectedToUser = connectedToUser;
  }

  if (resetOwnerAliasId) {
    update.$unset.ownerAliasId = '';
  } else if (ownerAliasId) {
    update.$set.ownerAliasId = ownerAliasId;
  }

  if ((!resetConnectedToUser && connectedToUser) || deviceId) {
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
 * Remove positions based on marker type
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

exports.updateCoordinates = updateCoordinates;
exports.removePosition = removePosition;
exports.createPosition = createPosition;
exports.getPositionsByUser = getPositionsByUser;
exports.updatePosition = updatePosition;
exports.getPositionById = getPositionById;
exports.getUserPosition = getUserPosition;
exports.getPositionByDevice = getPositionByDevice;
exports.addAccess = addAccess;
exports.removeAccess = removeAccess;
exports.removePositionsByType = removePositionsByType;
