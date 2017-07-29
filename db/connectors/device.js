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

const deviceSchema = new mongoose.Schema({
  deviceId: { type: String, unique: true },
  socketId: String,
  deviceAlias: { type: String, unique: true },
  lastUser: String,
  lastAlive: Date,
}, { collection: 'devices' });

const Device = mongoose.model('Device', deviceSchema);

/**
 * Update device properties. Creates a new device if one doesn't exist with sent deviceId
 * @param {Object} params.device Properties to update in device
 * @param {string} params.device.deviceId Device ID
 * @param {string} [params.device.lastUser] Last user name logged in on device
 * @param {string} [params.device.socketId] Socket.IO socket ID
 * @param {Function} params.callback Callback
 */
function updateDevice({ device, callback }) {
  const { deviceId, lastUser, socketId, lastAlive } = device;
  const query = { deviceId };
  const toSet = { lastAlive };
  const toUnset = {};

  if (lastUser) { toSet.lastUser = lastUser; }

  if (socketId) {
    toSet.socketId = socketId;
  } else {
    toUnset.socketId = '';
  }

  const update = {
    $set: toSet,
    $unset: toUnset,
    $setOnInsert: { deviceAlias: device.deviceId },
  };
  const options = {
    new: true,
    upsert: true,
  };

  Device.findOneAndUpdate(query, update, options).lean().exec((err, updatedDevice) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'updateDevice' }) });

      return;
    }

    callback({ data: { device: updatedDevice } });
  });
}

/**
 * Update device alias
 * @param {Object} params.device Device
 * @param {string} params.deviceId Device id
 * @param {string} params.deviceAlias New device alias
 * @param {Function} params.callback Callback
 */
function updateDeviceAlias({ device, callback }) {
  const query = { deviceId: device.deviceId };
  const update = { $set: { deviceAlias: device.deviceAlias } };
  const options = { new: true };

  Device.findOneAndUpdate(query, update, options).lean().exec((error, updatedDevice) => {
    if (error) {
      callback({ error: new errorCreator.Database({ errorObject: error, name: 'updateDeviceAlias' }) });

      return;
    } else if (!updatedDevice) {
      callback({ error: new errorCreator.DoesNotExist({ name: `device ${device.deviceId}` }) });

      return;
    }

    callback({ data: { device: updatedDevice } });
  });
}

/**
 * Gets device by socket id
 * @param {string} socketId Socket io socket
 * @param {Function} callback Callback
 */
function getDeviceBySocketId({ socketId, callback }) {
  const query = { socketId };

  Device.findOne(query).lean().exec((err, device) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'getDeviceBySocketId' }) });

      return;
    } else if (!device) {
      callback({ error: new errorCreator.DoesNotExist({ name: `device socket id ${socketId}` }) });

      return;
    }

    callback({ data: { device } });
  });
}

/**
 * Get device based on device ID or alias
 * @param {string} params.deviceCode Device ID OR device alias
 * @param {Function} params.callback Callback
 */
function getDevice({ deviceCode, callback }) {
  const query = {
    $or: [
      { deviceId: deviceCode },
      { deviceAlias: deviceCode },
    ],
  };

  Device.findOne(query).lean().exec((err, device) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'getDevice' }) });

      return;
    }

    callback({ data: { device } });
  });
}

/**
 * Get all devices
 * @param {Function} params.callback Callback
 */
function getAllDevices({ callback }) {
  const query = {};
  const filter = { _id: 0, socketId: 0 };

  Device.find(query, filter).lean().exec((err, devices) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'getAllDevices' }) });

      return;
    }

    callback({ data: { devices } });
  });
}

exports.updateDevice = updateDevice;
exports.getDevice = getDevice;
exports.getAllDevices = getAllDevices;
exports.getDeviceBySocketId = getDeviceBySocketId;
exports.updateDeviceAlias = updateDeviceAlias;
