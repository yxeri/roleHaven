'use strict';

import { dbConfig } from '../config/defaults/config';

import errorCreator from '../error/errorCreator';
import authenticator from '../helpers/authenticator';
import managerHelper from '../helpers/manager';

/**
 * Get a device by Id.
 * @param {Object} params Parameters.
 * @param {string} params.token jwt.
 * @param {Function} params.callback Callback.
 * @param {Object} [params.internalCallUser] User to use on authentication. It will bypass token authentication.
 */
function getDeviceById({
  token,
  callback,
  deviceId,
  internalCallUser,
}) {
  authenticator.isUserAllowed({
    token,
    internalCallUser,
    commandName: dbConfig.apiCommands.GetDevices.name,
    callback: ({
      error,
      data,
    }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user } = data;

      getDeviceById({
        deviceId,
        callback: ({
          error: getDeviceError,
          data: getDeviceData,
        }) => {
          if (getDeviceError) {
            callback({ error: getDeviceError });

            return;
          }

          const { device } = getDeviceData;

          const {
            canSee,
            hasFullAccess,
          } = authenticator.hasAccessTo({
            objectToAccess: device,
            toAuth: user,
          });

          if (!canSee) {
            callback({ error: errorCreator.NotAllowed({ name: `device ${deviceId}` }) });

            return;
          }

          if (!hasFullAccess) {
            callback({ data: { device: managerHelper.stripObject({ object: device }) } });

            return;
          }

          callback({ data: { device } });
        },
      });
    },
  });
}

/**
 * Create a device.
 * @param {Object} params Parameters.
 * @param {string} params.token jwt.
 * @param {Object} params.device Device parameters to create.
 * @param {Function} params.callback Callback.
 * @param {Object} params.io Socket io.
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
    callback: ({
      error,
      data,
    }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user } = data;
      const deviceToCreate = device;
      deviceToCreate.ownerId = user.objectId;

      createDevice({
        device,
        callback: (deviceData) => {
          if (deviceData.error) {
            callback({ error: deviceData.error });

            return;
          }

          const createdDevice = deviceData.data.device;
          const creatorDataToSend = {
            data: {
              isSender: true,
              device: createdDevice,
              changeType: dbConfig.ChangeTypes.CREATE,
            },
          };
          const dataToSend = {
            data: {
              device: managerHelper.stripObject({ object: createdDevice }),
              changeType: dbConfig.ChangeTypes.CREATE,
            },
          };

          if (socket) {
            socket.broadcast.emit(dbConfig.EmitTypes.DEVICE, dataToSend);
          } else {
            io.emit(dbConfig.EmitTypes.DEVICE, dataToSend);
            io.to(createdDevice.objectId)
              .emit(dbConfig.EmitTypes.DEVICE, creatorDataToSend);
          }

          callback(creatorDataToSend);
        },
      });
    },
  });
}

/**
 * Update device.
 * @param {Object} params Parameters.
 * @param {Object} params.device Device.
 * @param {Object} params.options Options.
 * @param {Function} params.callback Callback.
 * @param {Object} params.io Socket.io.
 */
function updateDevice({
  token,
  device,
  deviceId,
  options,
  callback,
  io,
  socket,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.UpdateDevice.name,
    callback: ({
      error,
      data,
    }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user: authUser } = data;

      getDeviceById({
        deviceId,
        internalCallUser: authUser,
        callback: ({
          error: deviceError,
          data: deviceData,
        }) => {
          if (deviceError) {
            callback({ error: deviceError });

            return;
          }

          const { device: foundDevice } = deviceData;
          const {
            hasFullAccess,
          } = authenticator.hasAccessTo({
            objectToAccess: foundDevice,
            toAuth: authUser,
          });

          if (!hasFullAccess) {
            callback({ error: new errorCreator.NotAllowed({ name: `device ${deviceId}` }) });

            return;
          }

          updateDevice({
            options,
            device,
            deviceId,
            callback: ({
              error: updateError,
              data: updateData,
            }) => {
              if (updateError) {
                callback({ error: updateError });

                return;
              }

              const { device: updatedDevice } = updateData;
              const creatorData = {
                data: {
                  isSender: true,
                  device: updatedDevice,
                  changeType: dbConfig.ChangeTypes.UPDATE,
                },
              };
              const dataToSend = {
                data: {
                  device: managerHelper.stripObject({ object: updatedDevice }),
                  changeType: dbConfig.ChangeTypes.UPDATE,
                },
              };

              if (socket) {
                socket.broadcast.emit(dbConfig.EmitTypes.DEVICE, dataToSend);
              } else {
                io.emit(dbConfig.EmitTypes.DEVICE, dataToSend);
                io.to(updatedDevice.objectId)
                  .emit(dbConfig.EmitTypes.DEVICE, creatorData);
              }

              callback(creatorData);
            },
          });
        },
      });
    },
  });
}

/**
 * Get devices that are accessible to the user.
 * @param {Object} params Parameters.
 * @param {string} params.token jwt.
 * @param {Function} params.callback Callback.
 */
function getDevicesByUser({
  token,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetDevices.name,
    callback: ({
      error,
      data,
    }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user } = data;

      getDevicesByUser({
        user,
        callback: ({
          error: getDevicesError,
          data: getDevicesData,
        }) => {
          if (getDevicesError) {
            callback({ error: getDevicesError });

            return;
          }

          const { devices } = getDevicesData;
          const allDevices = devices.map((deviceItem) => {
            const {
              hasFullAccess,
            } = authenticator.hasAccessTo({
              toAuth: user,
              objectToAccess: deviceItem,
            });

            if (!hasFullAccess) {
              return managerHelper.stripObject({ object: deviceItem });
            }

            return deviceItem;
          });

          callback({ data: { devices: allDevices } });
        },
      });
    },
  });
}

/**
 * Remove device.
 * @param {Object} params Parameters.
 * @param {string} params.token jwt.
 * @param {string} params.deviceId Id of the device.
 * @param {Object} params.io Socket.io.
 * @param {Function} params.callback Callback.
 */
function removeDevice({
  token,
  deviceId,
  callback,
  io,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.RemoveDevice.name,
    callback: ({
      error,
      data,
    }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user } = data;

      getDeviceById({
        deviceId,
        internalCallUser: user,
        callback: ({
          error: deviceError,
          data: deviceData,
        }) => {
          if (deviceError) {
            callback({ error: deviceError });

            return;
          }

          const { device } = deviceData;
          const {
            hasFullAccess,
          } = authenticator.hasAccessTo({
            objectToAccess: device,
            toAuth: user,
          });

          if (!hasFullAccess) {
            callback({ error: new errorCreator.NotAllowed({ name: `device ${deviceId}` }) });

            return;
          }

          removeDevice({
            deviceId,
            callback: ({ error: removeDeviceError }) => {
              if (removeDeviceError) {
                callback({ error: removeDeviceError });

                return;
              }

              const dataToSend = {
                data: {
                  device: { objectId: deviceId },
                  changeType: dbConfig.ChangeTypes.REMOVE,
                },
              };

              io.emit(dbConfig.EmitTypes.DEVICE, dataToSend);

              callback(dataToSend);
            },
          });
        },
      });
    },
  });
}

/**
 * Update access to the device for users or teams.
 * @param {Object} params Parameters.
 * @param {string} params.deviceId Id of the device.
 * @param {Function} params.callback Callback.
 * @param {boolean} [params.shouldRemove] Should access be removed from the users or teams?
 * @param {string[]} [params.userIds] Id of the users.
 * @param {string[]} [params.teamIds] Id of the teams.
 * @param {string[]} [params.bannedIds] Id of the blocked Ids to add.
 * @param {string[]} [params.teamAdminIds] Id of the teams to change admin access for.
 * @param {string[]} [params.userAdminIds] Id of the users to change admin access for.
 */
function updateAccess({
  token,
  deviceId,
  teamAdminIds,
  userAdminIds,
  userIds,
  teamIds,
  bannedIds,
  shouldRemove,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.UpdateDevice.name,
    callback: ({
      error,
      data,
    }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user } = data;

      getDeviceById({
        deviceId,
        internalCallUser: user,
        callback: ({
          error: deviceError,
          data: deviceData,
        }) => {
          if (deviceError) {
            callback({ error: deviceError });

            return;
          }

          const { device } = deviceData;

          const {
            hasFullAccess,
          } = authenticator.hasAccessTo({
            objectToAccess: device,
            toAuth: user,
          });

          if (!hasFullAccess) {
            callback({ error: errorCreator.NotAllowed({ name: `device ${deviceId}` }) });

            return;
          }

          updateAccess({
            shouldRemove,
            userIds,
            teamIds,
            bannedIds,
            teamAdminIds,
            userAdminIds,
            deviceId,
            callback,
          });
        },
      });
    },
  });
}

export { createDevice };
export { removeDevice };
export { updateDevice };
export { getDeviceById };
export { getDevicesByUser };
export { updateAccess };
