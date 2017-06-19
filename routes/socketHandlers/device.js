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
const dbConfig = require('../../config/defaults/config').databasePopulation;
const objectValidator = require('../../utils/objectValidator');
const errorCreator = require('../../objects/error/errorCreator');

/**
 * @param {Object} socket Socket.IO socket
 */
function handle(socket) {
  socket.on('listDevices', ({ token }, callback = () => {}) => {
    manager.userIsAllowed({
      token,
      commandName: dbConfig.commands.listDevices.commandName,
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

            const { devices } = data;

            callback({ data: { devices } });
          },
        });
      },
    });
  });

  socket.on('updateDevice', ({ device, token }, callback = () => {}) => {
    if (!objectValidator.isValidData({ device }, { device: { deviceId: true } })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ device: { deviceId } }' }) });

      return;
    }

    manager.userIsAllowed({
      token,
      commandName: dbConfig.commands.updateDevice.commandName,
      callback: ({ error, allowedUser }) => {
        if (error) {
          callback({ error });

          return;
        } else if (device.deviceAlias && allowedUser.accessLevel < dbConfig.commands.updateDeviceAlias.accessLevel) {
          callback({ error: new errorCreator.NotAllowed({ name: 'device alias' }) });

          return;
        }

        device.socketId = socket.id;
        device.lastUser = allowedUser.userName;

        dbDevice.updateDevice({
          device,
          callback: ({ error: updateError, data }) => {
            if (updateError) {
              callback({ error: updateError });
            }

            const { device: updatedDevice } = data;

            callback({ data: { updatedDevice } });
          },
        });
      },
    });
  });
}

exports.handle = handle;
