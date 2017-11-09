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
 * Does user have access to devices?
 * @private
 * @param {Object} params - Parameter
 * @param {Object} params.user - User to auth
 * @param {Object} params.device - Device to check against
 * @param {Function} params.callback - Callback
 */
function hasAccessToDevice({ user, device, callback }) {
  authenticator.hasAccessTo({
    objectToAccess: device,
    toAuth: { userId: user.userId, teamIds: user.partOfTeams },
    callback: (accessData) => {
      if (accessData.error) {
        callback({ error: accessData.error });

        return;
      }

      callback({ data: { device } });
    },
  });
}

/**
 * Get devices
 * @param {Object} params - Parameters
 * @param {string} params.jwt - jwt
 * @param {Function} params.callback - Callback
 */
function getAllDevices({ token, callback }) {
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
 * Get devices that the user, including the teams that the user is part of, has access to
 * @param {Object} params - Parameters
 * @param {string} params.token - jwt
 * @param {Function} params.callback - Callback
 * @param {Object} [params.userId] - ID of other user to retrieve devices with
 */
function getUsersDevices({ token, callback, userId }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetDevices.name,
    matchToId: userId,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const authUser = data.user;

      dbDevice.getDevicesByUser({
        user: authUser,
        callback: (devicesData) => {
          if (devicesData.error) {
            callback({ error: devicesData.error });

            return;
          }

          dbDevice.getDevicesByTeams({
            teamIds: authUser.partOfTeams,
            callback: (teamData) => {
              if (teamData.error) {
                callback({ error: teamData.error });

                return;
              }

              callback({
                data: {
                  devices: devicesData.data.devices.concat(teamData.data.devices),
                },
              });
            },
          });
        },
      });
    },
  });
}

/**
 * Update device
 * @param {Object} params - Parameters
 * @param {Object} params.device - Device
 * @parm {Object} params.options - Options
 * @param {Function} params.callback - Callback
 */
function updateDevice({ token, device, options, callback }) {
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

      const authUser = data.user;
      const deviceToUpdate = {
        deviceId: device.deviceId,
        socketId: authUser.socketId,
        lastUserId: authUser.userId,
      };

      dbDevice.getDeviceById({
        deviceId: device.deviceId,
        callback: (deviceData) => {
          if (deviceData.error) {
            callback({ error: deviceData.error });

            return;
          }

          hasAccessToDevice({
            device: deviceData.data.device,
            user: authUser,
            callback: (accessData) => {
              if (accessData.error) {
                callback({ error: accessData.error });

                return;
              }

              dbDevice.updateDevice({
                callback,
                options,
                device: deviceToUpdate,
              });
            },
          });
        },
      });
    },
  });
}

exports.getAllDevices = getAllDevices;
exports.updateDevice = updateDevice;
exports.getUsersDevices = getUsersDevices;
