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
 * Get device by Id and check if the user has access to it
 * @param {Object} params - Parameters
 * @param {Object} params.user - User retrieving the device
 * @param {string} params.deviceId - ID of the device to retrieve
 * @param {Function} params.callback - Callback
 * @param {string} [params.errorContentText] - Text to be printed on error
 * @param {boolean} [params.shouldBeAdmin] - Does the user have to be an admin?
 */
function getAccessibleDevice({
  user,
  deviceId,
  callback,
  shouldBeAdmin,
  errorContentText = `deviceId ${deviceId}`,
}) {
  dbDevice.getDeviceById({
    deviceId,
    callback: (deviceData) => {
      if (deviceData.error) {
        callback({ error: deviceData.error });

        return;
      } else if (!authenticator.hasAccessTo({
        shouldBeAdmin,
        toAuth: user,
        objectToAccess: deviceData.data.device,
      })) {
        callback({ error: new errorCreator.NotAllowed({ name: errorContentText }) });

        return;
      }

      callback(deviceData);
    },
  });
}

/**
 * Get devices.
 * @param {Object} params - Parameters.
 * @param {string} params.token - jwt.
 * @param {Function} params.callback - Callback.
 */
function getAllDevices({ token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetAll.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbDevice.getAllDevices({ callback });
    },
  });
}

/**
 * Create a device.
 * @param {Object} params - Parameters.
 * @param {string} params.token - jwt.
 * @param {Object} params.device - Device parameters to create.
 * @param {Function} params.callback - Callback.
 * @param {Object} params.io - Socket io. Will be used if socket is not set.
 * @param {Object} [params.socket] - Socket io.
 */
function createDevice({
  token,
  device,
  callback,
  io,
  socket,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.CreateDevice.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbDevice.createDevice({
        device,
        callback: (deviceData) => {
          if (deviceData.error) {
            callback({ error: deviceData.error });

            return;
          }

          const createdDevice = deviceData.data.device;
          const dataToSend = {
            data: {
              device: createdDevice,
              changeType: dbConfig.ChangeTypes.CREATE,
            },
          };

          if (socket) {
            socket.broadcast.emit(dbConfig.EmitTypes.DEVICE, dataToSend);
          } else {
            io.emit(dbConfig.EmitTypes.DEVICE, dataToSend);
          }

          callback(dataToSend);
        },
      });
    },
  });
}

/**
 * Update device.
 * @param {Object} params - Parameters.
 * @param {Object} params.device - Device.
 * @parm {Object} params.options - Options.
 * @param {Function} params.callback - Callback.
 * @param {Object} params.io - Socket io. Will be used if socket is not set.
 * @param {Object} [params.socket] - Socket io.
 */
function updateDevice({
  token,
  device,
  deviceId,
  options,
  callback,
  socket,
  io,
}) {
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

      getAccessibleDevice({
        deviceId,
        shouldBeAdmin: true,
        user: data.user,
        errorContentText: `update device id ${deviceId}`,
        callback: (deviceData) => {
          if (deviceData.error) {
            callback({ error: deviceData.error });

            return;
          }

          dbDevice.updateDevice({
            options,
            device,
            deviceId,
            callback: (updateData) => {
              if (updateData.error) {
                callback({ error: updateData.error });

                return;
              }

              const dataToSend = {
                data: {
                  device: updateData.data.device,
                  changeType: dbConfig.ChangeTypes.UPDATE,
                },
              };

              if (socket) {
                socket.broadcast.emit(dbConfig.EmitTypes.DEVICE, dataToSend);
              } else {
                io.emit(dbConfig.EmitTypes.DEVICE, dataToSend);
              }

              callback(dataToSend);
            },
          });
        },
      });
    },
  });
}

/**
 * Get devices that are accessible to the user.
 * @param {Object} params - Parameters.
 * @param {string} params.token - jwt.
 * @param {string} params.userId - ID of the user.
 * @param {Function} params.callback - Callback.
 */
function getDevicesByUser({
  token,
  userId,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    matchToId: userId,
    commandName: dbConfig.apiCommands.GetDevices,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbDevice.getDevicesByUser({
        callback,
        userId: data.user.userId,
      });
    },
  });
}

/**
 * Remove device
 * @param {Object} params - Parameters
 * @param {string} params.token - jwt
 * @param {string} params.deviceId - ID of the device
 * @param {string} params.userId - ID of the user who is removing the device
 * @param {Object} params.io - Socket io. Will be used if socket is not set
 * @param {Function} params.callback - Callback
 * @param {Object} [params.socket] - Socket io.
 */
function removeDevice({
  token,
  deviceId,
  userId,
  callback,
  socket,
  io,
}) {
  authenticator.isUserAllowed({
    token,
    matchToId: userId,
    commandName: dbConfig,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const authUser = data.user;

      getAccessibleDevice({
        deviceId,
        shouldBeAdmin: true,
        user: authUser,
        errorContentText: `remove device id ${deviceId}`,
        callback: (aliasData) => {
          if (aliasData.error) {
            callback({ error: aliasData });

            return;
          }

          dbDevice.removeDevice({
            deviceId,
            callback: (removeData) => {
              if (removeData.error) {
                callback({ error: removeData.error });

                return;
              }

              const dataToSend = {
                data: {
                  device: { deviceId },
                  changeType: dbConfig.ChangeTypes.REMOVE,
                },
              };

              if (socket) {
                socket.broadcast.emit(dbConfig.EmitTypes.DEVICE, dataToSend);
              } else {
                io.emit(dbConfig.EmitTypes.DEVICE, dataToSend);
              }

              callback(dataToSend);
            },
          });
        },
      });
    },
  });
}

/**
 * Get a device.
 * @param {Object} params - Parameters.
 * @param {string} params.token - jwt.
 * @param {string} params.userId - Id of the user retrieving the device.
 * @param {Function} params.callback - Callback
 */
function getDevice({
  token,
  userId,
  callback,
  deviceId,
}) {
  authenticator.isUserAllowed({
    token,
    matchToId: userId,
    commandName: dbConfig,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      getAccessibleDevice({
        deviceId,
        callback,
        user: data.user,
      });
    },
  });
}

exports.createDevice = createDevice;
exports.removeDevice = removeDevice;
exports.updateDevice = updateDevice;
exports.getDevice = getDevice;
exports.getAllDevices = getAllDevices;
exports.getDevicesByUser = getDevicesByUser;
