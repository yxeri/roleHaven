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

const manager = require('../../helpers/manager');
const dbConfig = require('../../config/defaults/config').databasePopulation;
const objectValidator = require('../../utils/objectValidator');
const errorCreator = require('../../objects/error/errorCreator');
const authenticator = require('../../helpers/authenticator');

/**
 * Get devices
 * @param {Object} params.token jwt
 * @param {Function} params.callback Callback
 */
function getDevices({ token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetDevices.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      manager.getDevices({ callback });
    },
  });
}

/**
 * Update device's lastAlive, lastUser and socketId, retrieved from the user account
 * @param {Object} params.device Device
 * @param {string} params.device.deviceId Device id of the device to update
 * @param {Object} params.token jwt
 * @param {Function} params.callback Callback
 */
function updateDevice({ device, token, callback }) {
  if (!objectValidator.isValidData({ device }, { device: { deviceId: true } })) {
    callback({ error: new errorCreator.InvalidData({ expected: '{ device: { deviceId } }' }) });

    return;
  }

  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.UpdateDevice.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      manager.updateDevice({
        device,
        callback,
        user: data.user,
      });
    },
  });
}

/**
 * Update device alias
 * @param {Object} params.device Device
 * @param {string} params.device.deviceId Id of the device to update
 * @param {string} params.device.deviceAlias New alias for the device
 * @param {Object} params.token jwt
 * @param {Function} param.scallback Callback
 */
function updateDeviceAlias({ device, token, callback }) {
  if (!objectValidator.isValidData({ device }, { device: { deviceId: true, deviceAlias: true } })) {
    callback({ error: new errorCreator.InvalidData({ expected: '{ device: { deviceId, deviceAlias } }' }) });

    return;
  }

  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.UpdateDeviceAlias.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      manager.updateDeviceAlias({
        device,
        callback,
      });
    },
  });
}

/**
 * @param {Object} socket Socket.IO socket
 */
function handle(socket) {
  socket.on('getDevices', ({ token }, callback = () => {}) => {
    getDevices({ token, callback });
  });

  socket.on('updateDevice', ({ device, token }, callback = () => {}) => {
    updateDevice({ device, token, callback });
  });

  socket.on('updateDeviceAlias', ({ device, token }, callback = () => {}) => {
    updateDeviceAlias({ device, token, callback });
  });
}

exports.getDevices = getDevices;
exports.updateDevice = updateDevice;
exports.updateDeviceAlias = updateDeviceAlias;
exports.handle = handle;
