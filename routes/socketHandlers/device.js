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
const objectValidator = require('../../utils/objectValidator');
const appConfig = require('../../config/defaults/config').app;
const errorCreator = require('../../objects/error/errorCreator');

/**
 * @param {Object} socket Socket.IO socket
 */
function handle(socket) {
  // TODO Update

  /**
   * Returns all devices from database, if the user has high enough access level
   * Emits list
   */
  socket.on('listDevices', (params, callback = () => {}) => {
    manager.userIsAllowed(socket.id, databasePopulation.commands.listDevices.commandName, (allowErr, allowed) => {
      if (allowErr || !allowed) {
        callback({ error: new errorCreator.NotAllowed({ used: 'listDevices' }) });

        return;
      }

      dbDevice.getAllDevices((devErr, devices) => {
        if (devErr) {
          callback({ error: new errorCreator.Database() });

          return;
        }

        callback({ data: { devices } });
      });
    });
  });

  socket.on('updateDeviceLastAlive', ({ device }, callback = () => {}) => {
    if (!objectValidator.isValidData({ device }, { device: { deviceId: true } })) {
      callback({ error: new errorCreator.InvalidData({ expectedResult: '{ device: { deviceId } }' }) });

      return;
    }

    dbDevice.updateDeviceLastAlive(device.deviceId, new Date(), (err, updatedDevice) => {
      if (err) {
        callback({ error: new errorCreator.Database() });

        return;
      }

      callback({ data: { device: updatedDevice }});
    });
  });

  /**
   * Updates a field on a device in the database
   */
  socket.on('updateDevice', ({ device, field, value }, callback = () => {}) => {
    if (!objectValidator.isValidData({ device }, { device: { deviceId: true }, field: true, value: true })) {
      callback({ error: new errorCreator.InvalidData({ expectedResult: '{ device: { deviceId }, field, value }' }) });

      return;
    }

    manager.userIsAllowed(socket.id, databasePopulation.commands.updatedevice.commandName, (allowErr, allowed) => {
      if (allowErr || !allowed) {
        callback({ error: new errorCreator.NotAllowed({ used: 'updateDevice' }) });

        return;
      }

      const deviceId = device.deviceId;
      const updateCallback = (err, updatedDevice) => {
        if (err || updatedDevice === null) {
          callback({ error: new errorCreator.Database() });

          return;
        }

        callback({ data: { device: updatedDevice } });
      };

      switch (field) {
        case 'alias': {
          dbDevice.updateDeviceAlias(deviceId, value, updateCallback);

          break;
        }
        default: {
          callback({
            error: new errorCreator.InvalidData({ incorrectProperties: 'field' }),
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
  socket.on('verifyDevice', ({ device }, callback = () => {}) => {
    // TODO Check if either device.alias or device.deviceId is set
    if (!objectValidator.isValidData({ device }, { device: { deviceId: true } })) {
      return;
    }

    dbDevice.getDevice(device.deviceId, (err, foundDevice) => {
      if (err || device === null) {
        callback({ error: new errorCreator.Database() });

        return;
      }

      callback({ data: { device: foundDevice } });
    });
  });

  // TODO Should leave previous device room
  /**
   * Updates socketID and user name on a device in the database
   */
  socket.on('updateDeviceSocketId', ({ user, device }) => {
    if (!objectValidator.isValidData({ user, device }, { user: { userName: true }, device: { deviceId: true } })) {
      return;
    }

    const deviceId = device.deviceId;

    socket.join(deviceId + appConfig.deviceAppend);

    dbDevice.updateDeviceSocketId(deviceId, socket.id, user.userName, () => {
    });
  });
}

exports.handle = handle;
