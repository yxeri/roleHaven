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

const dbDevice = require('../../db/connectors/device');
const manager = require('../../socketHelpers/manager');
const databasePopulation = require('../../config/defaults/config').databasePopulation;
const logger = require('../../utils/logger');
const objectValidator = require('../../utils/objectValidator');
const appConfig = require('../../config/defaults/config').app;

/**
 * @param {Object} socket Socket.IO socket
 */
function handle(socket) {
  /**
   * Returns all devices from database, if the user has high enough access level
   * Emits list
   */
  socket.on('listDevices', (params, callback = () => {}) => {
    manager.userAllowedCommand(socket.id, databasePopulation.commands.list.commandName, (allowErr, allowed, user) => {
      if (allowErr || !allowed) {
        callback({ error: {} });

        return;
      } else if (user.accessLevel < 11) {
        callback({
          error: {
            code: logger.ErrorCodes.unauth,
            text: ['You are not allowed to list devices'],
            text_se: ['Ni har inte tillåtelse att lista enheter'],
          },
        });

        return;
      }

      dbDevice.getAllDevices((devErr, devices) => {
        if (devErr) {
          logger.sendErrorMsg({
            code: logger.ErrorCodes.db,
            text: ['Failed to get all devices'],
            err: devErr,
          });

          callback({ error: {} });

          return;
        }

        callback({ data: { devices } });
      });
    });
  });

  socket.on('updateDeviceLastAlive', (params) => {
    if (!objectValidator.isValidData(params, { device: { deviceId: true, lastAlive: true } })) {
      return;
    }

    dbDevice.updateDeviceLastAlive(params.device.deviceId, params.device.lastAlive, () => {});
  });

  /**
   * Updates a field on a device in the database
   */
  socket.on('updateDevice', (params, callback = () => {}) => {
    if (!objectValidator.isValidData(params, { device: { deviceId: true }, field: true, value: true })) {
      callback({ error: {} });

      return;
    }

    manager.userAllowedCommand(socket.id, databasePopulation.commands.updatedevice.commandName, (allowErr, allowed) => {
      if (allowErr || !allowed) {
        callback({ error: {} });

        return;
      }

      const deviceId = params.device.deviceId;
      const field = params.field;
      const value = params.value;
      const updateCallback = (err, device) => {
        if (err || device === null) {
          let errMsg = 'Failed to update device';

          if (err && err.code === 11000) {
            errMsg += '. Alias already exists';
          }

          callback({
            error: {
              text: [errMsg],
              code: logger.ErrorCodes.general,
            },
          });

          return;
        }

        callback({
          message: {
            text: [`${device.deviceId} has been updated`],
          },
        });
      };

      switch (field) {
        case 'alias': {
          dbDevice.updateDeviceAlias(deviceId, value, updateCallback);

          break;
        }
        default: {
          callback({
            error: {
              text: [`Invalid field. Device doesn't have ${field}`],
              text_se: [`Inkorrekt fält. Enheter har inte fältet ${field}`],
              code: logger.ErrorCodes.general,
            },
          });

          break;
        }
      }
    });
  });

  /**
   * Checks if the device is in the database
   * Emits commandFail or commandSuccess if the device was found
   */
  socket.on('verifyDevice', (params, callback = () => {}) => {
    // TODO Check if either device.alias or device.deviceId is set
    if (!objectValidator.isValidData(params, { device: { deviceId: true } })) {
      return;
    }

    dbDevice.getDevice(params.device.deviceId, (err, device) => {
      if (err || device === null) {
        callback({
          message: {
            text: ['Device is not in the database'],
            text_se: ['Enheten finns inte i databasen'],
          },
        });
        socket.emit('commandFail');

        return;
      }

      callback({
        message: {
          text: ['Device found in the database'],
          text_se: ['Enheten funnen i databasen'],
        },
      });
      socket.emit('commandSuccess', params);
    });
  });

  /**
   * Updates socketID and user name on a device in the database
   */
  socket.on('updateDeviceSocketId', (data) => {
    if (!objectValidator.isValidData(data, { user: { userName: true }, device: { deviceId: true } })) {
      return;
    }

    const deviceId = data.device.deviceId;
    const userName = data.user.userName;

    socket.join(deviceId + appConfig.deviceAppend);

    dbDevice.updateDeviceSocketId(deviceId, socket.id, userName, () => {
    });
  });
}

exports.handle = handle;
