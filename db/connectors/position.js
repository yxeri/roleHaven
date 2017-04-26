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
const logger = require('../../utils/logger');

const mapPositionSchema = new mongoose.Schema({
  deviceId: String,
  coordinates: {
    longitude: Number,
    latitude: Number,
    speed: Number,
    accuracy: Number,
    heading: Number,
  },
  isStatic: { type: Boolean, default: false },
  isPublic: { type: Boolean, default: false },
  owner: String,
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
 * @param {Date} params.position.lastUpdated Date when the position was last updated
 * @param {string} [params.position.team] Name of the team with access to the location
 * @param {boolean} [params.position.isStatic] Is the position static? (most commonly used on everything non-user)
 * @param {boolean} [params.position.isPublic] Is the position public?
 * @param {string[]} [params.position.description] Position text description
 * @param {Function} params.callback Callback
 */
function updatePosition({ position: { positionName, coordinates, owner, team, isStatic, markerType, description, isPublic, lastUpdated }, callback }) {
  const query = { $and: [{ positionName }, { owner }] };
  const update = {
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

  MapPosition.findOneAndUpdate(query, update, options).lean().exec((err, mapPosition) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to update map position'],
        err,
      });
    }

    callback(err, mapPosition);
  });
}

/**
 * Get position
 * @param {string} positionName Name of the position
 * @param {Function} callback Callback
 */
function getPosition(positionName, callback) {
  const query = { positionName };

  MapPosition.findOne(query).lean().exec((err, position) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: [`Failed to get position ${positionName}`],
        err,
      });
    }

    callback(err, position);
  });
}

/**
 * Get multiple positions
 * @param {string[]} positionNames Name of the positions
 * @param {Function} callback Callback
 */
function getPositions(positionNames, callback) {
  const query = { positionName: { $in: positionNames } };

  MapPosition.find(query).lean().exec((mapErr, positions) => {
    if (mapErr) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to get all user positions'],
        mapErr,
      });
    }

    callback(mapErr, positions);
  });
}

/**
 * Get all static positions
 * @param {Function} callback Callback
 */
function getAllStaticPositions(callback) {
  const query = { isStatic: true };

  MapPosition.find(query).lean().exec((err, staticPositions) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to get static positions'],
        err,
      });
    }

    callback(err, staticPositions);
  });
}

/**
 * Get all custom positions
 * @param {string} owner Name of the owner of the position
 * @param {Function} callback Callback
 */
function getCustomPositions(owner, callback) {
  const query = { $and: [{ markerType: 'custom' }, { $or: [{ isPublic: true }, { owner }] }] };

  MapPosition.find(query).lean().exec((err, customLocations) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to get custom locations'],
        err,
      });
    }

    callback(err, customLocations);
  });
}

/**
 * Get pings
 * @param {Object} user Name of the owner of the position
 * @param {Function} callback Callback
 */
function getPings(user, callback) {
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

  MapPosition.find(query).lean().exec((err, customLocations) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to get ping positions'],
        err,
      });
    }

    callback(err, customLocations);
  });
}

exports.updatePosition = updatePosition;
exports.getAllStaticPositions = getAllStaticPositions;
exports.getPosition = getPosition;
exports.getPositions = getPositions;
exports.getCustomPositions = getCustomPositions;
exports.getPings = getPings;
