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
  deviceId: { type: String, unique: true },
  connectedToUser: { type: String, unique: true },
  coordinates: [dbConnector.createSchema({
    longitude: Number,
    latitude: Number,
    speed: Number,
    accuracy: Number,
    heading: Number,
  })],
  positionName: String,
  positionType: { type: String, default: dbConfig.PositionTypes.WORLD },
  description: { type: [String], default: [] },
  radius: { type: Number, default: 0 },
  isStatic: { type: Boolean, default: false },
}), { collection: 'mapPositions' });

const MapPosition = mongoose.model('MapPosition', mapPositionSchema);

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
 * @param {Object} params - Parameters
 * @param {Object} [params.query] - Query to get positions
 * @param {Function} params.callback - Callback
 */
function getPositions({ query, callback }) {
  dbConnector.getObjects({
    query,
    object: MapPosition,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ data: { positions: data.objects } });
    },
  });
}

/**
 * Get position
 * @private
 * @param {Object} params - Parameters
 * @param {Object} [params.query] - Query to get position
 * @param {Function} params.callback - Callback
 */
function getPosition({ query, callback }) {
  dbConnector.getObject({
    query,
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
 * Update position
 * @param {Object} params - Parameters
 * @param {Object} params.position - Position object
 * @param {string} params.position.positionName - Name of the position
 * @param {Object} params.position.coordinates - GPS coordinates
 * @param {number} params.position.coordinates.longitude - Longitude
 * @param {number} params.position.coordinates.latitude - Latitude
 * @param {number} params.position.coordinates.speed - Speed
 * @param {number} params.position.coordinates.accuracy - Accuracy in meters
 * @param {number} params.position.coordinates.heading - Heading (0 - 359)
 * @param {string} [params.position.ownerAliasId] - ID of the user's alias
 * @param {string} params.position.positionType - Type of position
 * @param {string} [params.position.deviceId] - Device ID
 * @param {boolean} [params.position.isStatic] - Is the position static? (most commonly used on everything non-user)
 * @param {boolean} [params.position.isPublic] - Is the position public?
 * @param {string[]} [params.position.text] - Position text description
 * @param {string} [params.position.connectedToUser] - ID of the user that the position represents
 * @param {Object} [params.options] - Options
 * @param {boolean} params.options.resetOwnerAliasId - Should the owner alias be reset on the position?
 * @param {Function} params.callback - Callback
 */
function updatePosition({
  objectId,
  position,
  options,
  callback,
}) {
  const {
    deviceId,
    positionName,
    coordinates,
    ownerAliasId,
    isStatic,
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
      objectId,
      update,
      callback: ({ error, data }) => {
        if (error) {
          callback({ error });

          return;
        }

        callback({ position: data.position });
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

  if (coordinates) {
    if (coordinates.longitude) { update.$set.longitude = coordinates.longitude; }
    if (coordinates.latitude) { update.$set.latitude = coordinates.latitude; }
    if (coordinates.speed) { update.$set.speed = coordinates.speed; }
    if (coordinates.accuracy) { update.$set.accuracy = coordinates.accuracy; }
    if (coordinates.heading) { update.$set.heading = coordinates.heading; }
    if (coordinates.lastUpdated) { update.$set.lastUpdated = coordinates.lastUpdated; }
  }

  if (typeof isPublic !== 'undefined') { update.$set.isPublic = isPublic; }
  if (typeof isStatic !== 'undefined') { update.$set.isStatic = isStatic; }

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
    existCallback({ update });
  } else {
    updateCallback({ update });
  }
}

/**
 * Get all positions
 * @param {Object} params - Parameters
 * @param {Function} params.callback - Callback
 */
function getAllPositions({ callback }) {
  getPositions({ callback });
}

/**
 * Get positions by teams
 * @param {Object} params - Parameters
 * @param {string[]} params.teamIds - Ids of the teams
 * @param {Function} params.callback - Callback
 */
function getPositionsByTeams({ teamIds, callback }) {
  getPositions({
    callback,
    query: { teamIds: { $in: teamIds } },
  });
}

/**
 * Get user's positions
 * @param {Object} params - Parameters
 * @param {string} params.userId - User ID of the owner of the position
 * @param {Function} params.callback - Callback
 */
function getPositionsByUser({ userId, callback }) {
  const query = {
    $or: [
      { ownerId: userId },
      { userIds: { $in: [userId] } },
    ],
  };

  getPositions({
    query,
    callback,
  });
}

/**
 * Remove position
 * @param {Object} params - Parameters
 * @param {string} params.objectId - ID of the position
 * @param {Function} params.callback - Callback
 */
function removePosition({ objectId, callback }) {
  dbConnector.removeObject({
    callback,
    query: { _id: objectId },
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
 * Get positions by type
 * @param {Object} params - Parameters
 * @param {string} params.positionType - Position type
 * @param {Function} params.callback - Callback
 */
function getPositionsByType({ positionType, callback }) {
  getPositions({
    callback,
    query: { positionType },
  });
}

/**
 * Get position by Id
 * @param {Object} params - Parameters
 * @param {string} params.objectId - ID of the position
 * @param {Function} params.callback - Callback
 */
function getPositionById({ objectId, callback }) {
  getPosition({
    callback,
    query: { _id: objectId },
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
 * @param {string} params.objectId - ID of the team
 * @param {string[]} [params.userIds] - ID of the users
 * @param {string[]} [params.teamIds] - ID of the teams
 * @param {string[]} [params.blockedIds] - Blocked ids
 * @param {boolean} [params.isAdmin] - Should the users be added to admins?
 * @param {Function} params.callback - Callback
 */
function addAccess({
  objectId,
  userIds,
  teamIds,
  blockedIds,
  isAdmin,
  callback,
}) {
  if (!userIds && !teamIds && !blockedIds) {
    callback({ error: new errorCreator.InvalidData({ expected: 'teamIds || userIds || blockedIds' }) });

    return;
  }

  dbConnector.addObjectAccess({
    objectId,
    userIds,
    teamIds,
    blockedIds,
    isAdmin,
    callback,
    object: MapPosition,
  });
}

/**
 * Remove access to position
 * @param {Object} params - Parameters
 * @param {string} params.objectId - ID of the team
 * @param {string[]} params.teamIds - ID of the teams
 * @param {string[]} [params.userIds] - ID of the user
 * @param {string[]} [params.blockedIds] - Blocked ids
 * @param {boolean} [params.isAdmin] - Should the teams and/or users be removed from admins?
 * @param {Function} params.callback - Callback
 */
function removeAccess({
  objectId,
  userIds,
  teamIds,
  blockedIds,
  isAdmin,
  callback,
}) {
  if (!userIds && !teamIds && !blockedIds) {
    callback({ error: new errorCreator.InvalidData({ expected: 'teamIds || userIds || blockedIds' }) });

    return;
  }

  dbConnector.removeObjectAccess({
    objectId,
    userIds,
    teamIds,
    blockedIds,
    callback,
    isAdmin,
    object: MapPosition,
  });
}

exports.removePosition = removePosition;
exports.removePositionsByType = removePositionsByType;
exports.createPosition = createPosition;
exports.getPositionsByUser = getPositionsByUser;
exports.updatePosition = updatePosition;
exports.getAllPositions = getAllPositions;
exports.getPositionsByType = getPositionsByType;
exports.getPositionById = getPositionById;
exports.getPositionsByTeams = getPositionsByTeams;
exports.getUserPosition = getUserPosition;
exports.getPositionByDevice = getPositionByDevice;
exports.addAccess = addAccess;
exports.removeAccess = removeAccess;
