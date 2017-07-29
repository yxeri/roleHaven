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

const dbConfig = require('../config/defaults/config').databasePopulation;
const errorCreator = require('../objects/error/errorCreator');
const objectValidator = require('../utils/objectValidator');
const dbDevice = require('../db/connectors/device');
const authenticator = require('../helpers/authenticator');

/**
 * Get devices
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

      dbDevice.getAllDevices({
        callback: ({ error: deviceError, data }) => {
          if (deviceError) {
            callback({ error: deviceError });

            return;
          }

          callback({ data });
        },
      });
    },
  });
}

/**
 * Update device's lastAlive, lastUser and socketId, retrieved from the user account
 * @param {Object} params.device Device
 * @param {string} params.device.deviceId Device id of the device to update
 * @param {Function} params.callback Callback
 */
function updateDevice({ token, device, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.UpdateDevice.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!objectValidator.isValidData({ device }, { device: { deviceId: true } })) {
        callback({ error: new errorCreator.InvalidData({ expected: '{ device: { deviceId } }' }) });

        return;
      }

      const deviceToUpdate = {};
      deviceToUpdate.lastAlive = new Date();
      deviceToUpdate.deviceId = device.deviceId;

      if (!data.user.isAnonymous) {
        deviceToUpdate.socketId = data.user.socketId;
        deviceToUpdate.lastUser = data.user.userName;
      }

      dbDevice.updateDevice({
        device: deviceToUpdate,
        callback: ({ error: updateError, data: deviceData }) => {
          if (updateError) {
            callback({ error: updateError });
          }

          // TODO Shold create device room, if upsert

          callback({ data: deviceData });
        },
      });
    },
  });
}

/**
 * Update device alias
 * @param {Object} params.device Device
 * @param {string} params.device.deviceId Id of the device to update
 * @param {string} params.device.deviceAlias New alias for the device
 * @param {Function} param.scallback Callback
 */
function updateDeviceAlias({ token, device, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.UpdateDeviceAlias.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!objectValidator.isValidData({ device }, { device: { deviceId: true, deviceAlias: true } })) {
        callback({ error: new errorCreator.InvalidData({ expected: '{ device: { deviceId, deviceAlias } }' }) });

        return;
      }

      const deviceToUpdate = {};
      deviceToUpdate.deviceId = device.deviceId;
      deviceToUpdate.deviceAlias = device.deviceAlias;

      dbDevice.updateDeviceAlias({
        device: deviceToUpdate,
        callback: ({ error: updateError, data: deviceData }) => {
          if (updateError) {
            callback({ error: updateError });
          }

          callback({ data: deviceData });
        },
      });
    },
  });
}

exports.getDevices = getDevices;
exports.updateDevice = updateDevice;
exports.updateDeviceAlias = updateDeviceAlias;
