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
const databaseConnector = require('../databaseConnector');

const deviceSchema = new mongoose.Schema({
  deviceId: { type: String, unique: true },
  socketId: String,
  deviceAlias: { type: String, unique: true },
  lastUser: String,
  lastAlive: Date,
}, { collection: 'devices' });

const Device = mongoose.model('Device', deviceSchema);

/**
 * Update socket.IO ID and user connected to device
 * @param {string} deviceId - ID of the device
 * @param {string} socketId - socket.IO ID
 * @param {string} user - User name of the user that was latest active on this device
 * @param {Function} callback - Callback
 */
function updateDeviceSocketId(deviceId, socketId, user, callback) {
  const query = { deviceId };
  const update = {
    $set: {
      socketId,
      lastUser: user,
    },
  };
  const options = { new: true };

  Device.findOneAndUpdate(query, update, options).lean().exec(
    (err, device) => {
      if (err) {
        logger.sendErrorMsg({
          code: logger.ErrorCodes.db,
          text: ['Failed to update device socket Id'],
          err,
        });
        callback(err, null);
      } else if (device === null) {
        const newDevice = new Device({
          deviceId,
          socketId,
          lastUser: user,
          deviceAlias: deviceId,
        });

        databaseConnector.saveObject(newDevice, 'device', callback);
      } else {
        callback(err, device);
      }
    }
  );
}

/**
 * Update last alive (last seen) for device
 * @param {string} deviceId - ID of device
 * @param {Date} value - Date when last seen
 * @param {Function} callback - Callback
 */
function updateDeviceLastAlive(deviceId, value, callback) {
  const query = { deviceId };
  const update = { $set: { lastAlive: value } };
  const options = { new: true };

  Device.findOneAndUpdate(query, update, options).lean().exec(
    (err, device) => {
      if (err) {
        logger.sendErrorMsg({
          code: logger.ErrorCodes.db,
          text: ['Failed to update device Id'],
          err,
        });
      }

      callback(err, device);
    }
  );
}

/**
 * Update alias of device
 * @param {string} deviceId - ID of device
 * @param {string} value - New alias
 * @param {Function} callback - Callback
 */
function updateDeviceAlias(deviceId, value, callback) {
  const query = { deviceId };
  const update = { $set: { deviceAlias: value } };
  const options = { new: true };

  Device.findOneAndUpdate(query, update, options).lean().exec(
    (err, device) => {
      if (err) {
        logger.sendErrorMsg({
          code: logger.ErrorCodes.db,
          text: ['Failed to update device Id'],
          err,
        });
      }

      callback(err, device);
    }
  );
}

/**
 * Get device based on device ID or alias
 * @param {string} deviceCode - Device ID OR device alias
 * @param {Function} callback - Callback
 */
function getDevice(deviceCode, callback) {
  const query = { $or: [{ deviceId: deviceCode }, { deviceAlias: deviceCode }] };

  Device.findOne(query).lean().exec((err, device) => {
    if (err || device === null) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to get device'],
        err,
      });
    }

    callback(err, device);
  });
}

/**
 * Get all devices
 * @param {Function} callback - Callback
 */
function getAllDevices(callback) {
  const query = {};
  const filter = { _id: 0, socketId: 0 };

  Device.find(query, filter).lean().exec((err, devices) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to get all devices'],
        err,
      });
    }

    callback(err, devices);
  });
}

exports.updateDeviceAlias = updateDeviceAlias;
exports.updateDeviceSocketId = updateDeviceSocketId;
exports.getDevice = getDevice;
exports.getAllDevices = getAllDevices;
exports.updateDeviceLastAlive = updateDeviceLastAlive;
