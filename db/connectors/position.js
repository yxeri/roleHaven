/*
 Copyright 2015 Aleksandar Jankovic

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

const mapPositionSchema = new mongoose.Schema({
  coordinates: {
    longitude: Number,
    latitude: Number,
    speed: Number,
    accuracy: Number,
    heading: Number,
    radius: Number,
  },
  isStatic: { type: Boolean, default: false },
  isPublic: { type: Boolean, default: false },
  owner: String,
  deviceId: String,
  markerType: String,
  team: String,
  lastUpdated: Date,
  positionName: { type: String, unique: true }, // TODO Should not be unique. Should instead check for positionName + markerType
  description: [String],
}, { collection: 'mapPositions' });

const MapPosition = mongoose.model('MapPosition', mapPositionSchema);

/**
 * Update position
 * @param {Object} params Parameters
 * @param {Object} params.position Position object
 * @param {string} params.position.positionName Name of the position
 * @param {Object} params.position.coordinates GPS coordinates
 * @param {number} params.position.coordinates.longitude Longitude
 * @param {number} params.position.coordinates.latitude Latitude
 * @param {string} params.position.owner User name of the owner of the position
 * @param {string} params.position.markerType Type of position
 * @param {string} params.position.deviceId Device ID
 * @param {Date} params.position.lastUpdated Date when the position was last updated
 * @param {string} [params.position.team] Name of the team with access to the location
 * @param {boolean} [params.position.isStatic] Is the position static? (most commonly used on everything non-user)
 * @param {boolean} [params.position.isPublic] Is the position public?
 * @param {string[]} [params.position.description] Position text description
 * @param {Function} params.callback Callback
 */
function updatePosition({ position: { deviceId, positionName, coordinates, owner, team, isStatic, markerType, description, isPublic, lastUpdated }, callback }) {
  const query = { $and: [{ positionName }, { owner }] };
  const update = {
    deviceId,
    owner,
    coordinates,
    markerType,
    lastUpdated,
  };
  const options = { upsert: true, new: true };

  if (typeof description !== 'undefined') {
    update.description = description;
  }

  if (typeof team !== 'undefined') {
    update.team = team;
  }

  if (typeof isPublic !== 'undefined') {
    update.isPublic = isPublic;
  }

  if (typeof isStatic !== 'undefined') {
    update.team = isStatic;
  }

  MapPosition.findOneAndUpdate(query, update, options).lean().exec((err, position) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err }) });

      return;
    } else if (!position) {
      callback({ error: new errorCreator.DoesNotExist({ name: `position ${positionName}` }) });

      return;
    }

    callback({ data: { position } });
  });
}

/**
 * Get position
 * @param {string} params.positionName Name of the position
 * @param {Function} params.callback Callback
 */
function getPosition({ positionName, callback }) {
  const query = { positionName };

  MapPosition.findOne(query).lean().exec((err, position) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err }) });

      return;
    } else if (!position) {
      callback({ error: new errorCreator.DoesNotExist({ name: `position ${positionName}` }) });

      return;
    }

    callback({ data: { position } });
  });
}

/**
 * Get user position by device ID
 * @param {string} params.deviceId Device id
 * @param {Function} params.callback Callback
 */
function getUserPositionByDeviceId({ deviceId, callback }) {
  const query = { deviceId, markerType: 'user' };

  MapPosition.findOne(query).lean().exec((err, position) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err }) });

      return;
    } else if (!position) {
      callback({ error: new errorCreator.DoesNotExist({ name: `position with device id ${deviceId}` }) });

      return;
    }

    callback({ data: { position } });
  });
}

/**
 * Get multiple positions
 * @param {string[]} params.positionNames Name of the positions
 * @param {Function} params.callback Callback
 */
function getPositions({ positionNames, callback }) {
  const query = { positionName: { $in: positionNames } };

  MapPosition.find(query).lean().exec((mapErr, positions = []) => {
    if (mapErr) {
      callback({ error: new errorCreator.Database({ errorObject: mapErr }) });

      return;
    }

    callback({ data: { positions } });
  });
}

/**
 * Get all static positions
 * @param {Function} params.callback Callback
 */
function getAllStaticPositions({ callback }) {
  const query = { isStatic: true };

  MapPosition.find(query).lean().exec((err, positions) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err }) });

      return;
    }

    callback({ data: { positions } });
  });
}

/**
 * Get user position
 * @param {string} params.userName User name
 * @param {Function} params.callback Callback
 */
function getUserPosition({ userName, callback }) {
  const query = { positionName: userName, markerType: 'user' };

  MapPosition.findOne(query).lean().exec((err, position) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err }) });

      return;
    } else if (!position) {
      callback({ error: new errorCreator.DoesNotExist({ name: `user position ${userName}` }) });

      return;
    }

    callback({ data: { position } });
  });
}

/**
 * Get all user positions
 * @param {Function} params.callback Callback
 */
function getUserPositions({ callback }) {
  const query = { markerType: 'user' };

  MapPosition.find(query).lean().exec((err, positions) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err }) });

      return;
    }

    callback({ data: { positions } });
  });
}

/**
 * Get all signal block positions
 * @param {Function} params.callback Callback
 */
function getSignalBlockPositions({ callback }) {
  const query = { markerType: 'signalBlock' };

  MapPosition.find(query).lean().exec((err, positions = []) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err }) });

      return;
    }

    callback({ data: { positions } });
  });
}

/**
 * Get all custom positions
 * @param {string} params.owner Name of the owner of the position
 * @param {Function} params.callback Callback
 */
function getCustomPositions({ owner, callback }) {
  const query = { $and: [{ markerType: 'custom' }, { $or: [{ isPublic: true }, { owner }] }] };

  MapPosition.find(query).lean().exec((err, positions) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err }) });

      return;
    }

    callback({ data: { positions } });
  });
}

/**
 * Get pings
 * @param {Object} params.user User retrieving pings
 * @param {Function} params.callback Callback
 */
function getPings({ user, callback }) {
  const query = {
    $and: [
      { markerType: 'ping' },
      { $or: [
        { isPublic: true },
        { owner: user.userName },
        { team: user.team },
      ] },
    ],
  };

  MapPosition.find(query).lean().exec((err, positions = []) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err }) });

      return;
    }

    callback({ data: { positions } });
  });
}

/**
 * Remove position
 * @param {string} params.positionName Name of the position
 * @param {string} params.markerType Position type
 * @param {Function} params.callback Callback
 */
function removePosition({ positionName, markerType, callback }) {
  const query = { positionName, markerType };

  MapPosition.findOneAndRemove(query).lean().exec((err) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err }) });

      return;
    }

    callback({ data: { success: true } });
  });
}

/**
 * Remove positions based on marker type
 * @param {string} params.markerType Marker type
 * @param {Function} params.callback Callback
 */
function removePositions({ markerType, callback }) {
  const query = { markerType };

  MapPosition.remove(query).lean().exec((err) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err }) });

      return;
    }

    callback({ data: { success: true } });
  });
}

exports.updatePosition = updatePosition;
exports.getAllStaticPositions = getAllStaticPositions;
exports.getPosition = getPosition;
exports.getPositions = getPositions;
exports.getCustomPositions = getCustomPositions;
exports.getPings = getPings;
exports.getUserPositions = getUserPositions;
exports.removePosition = removePosition;
exports.removePositions = removePositions;
exports.getSignalBlockPositions = getSignalBlockPositions;
exports.getUserPositionByDeviceId = getUserPositionByDeviceId;
exports.getUserPosition = getUserPosition;
