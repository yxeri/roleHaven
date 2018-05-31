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
const errorCreator = require('../../error/errorCreator');
const { dbConfig } = require('../../config/defaults/config');
const dbConnector = require('../databaseConnector');

const deviceSchema = new mongoose.Schema(dbConnector.createSchema({
  deviceName: { type: String, unique: true },
  socketId: String,
  lastUserId: String,
  connectedToUser: { type: String, unique: true, sparse: true },
  deviceType: { type: String, default: dbConfig.DeviceTypes.USERDEVICE },
}), { collection: 'devices' });

const Device = mongoose.model('Device', deviceSchema);

const deviceFilter = dbConnector.createFilter({
  deviceName: 1,
  deviceType: 1,
  connectedToUser: 1,
});

/**
 * Update device object.
 * @param {Object} params - Parameters.
 * @param {string} params.deviceId - Id of the device to update.
 * @param {Object} params.update - Update.
 * @param {Function} params.callback - Callback.
 */
function updateObject({
  deviceId,
  deviceSocketId,
  update,
  callback,
}) {
  const query = {};

  if (deviceId) {
    query._id = deviceId;
  } else {
    query.socketId = deviceSocketId;
  }

  dbConnector.updateObject({
    update,
    query,
    object: Device,
    errorNameContent: 'updateDeviceObject',
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ data: { device: data.object } });
    },
  });
}

/**
 * Get devices.
 * @private
 * @param {Object} params - Parameters.
 * @param {Object} params.query - Query to get devices.
 * @param {Function} params.callback - Callback.
 */
function getDevices({
  query,
  callback,
}) {
  dbConnector.getObjects({
    query,
    object: Device,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ data: { devices: data.objects } });
    },
  });
}

/**
 * Get device.
 * @private
 * @param {Object} params - Parameters.
 * @param {string} params.query - Query to get device.
 * @param {Function} params.callback - Callback.
 */
function getDevice({ query, callback }) {
  dbConnector.getObject({
    query,
    object: Device,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!data.object) {
        callback({ error: new errorCreator.DoesNotExist({ name: `device ${JSON.stringify(query, null, 4)}` }) });

        return;
      }

      callback({ data: { device: data.object } });
    },
  });
}

/**
 * Does the device exist?
 * @param {Object} params - Parameters
 * @param {string} params.deviceName - Name of the device
 * @param {Function} params.callback - Callback
 */
function doesDeviceExist({ deviceName, callback }) {
  dbConnector.doesObjectExist({
    callback,
    query: { deviceName },
    object: Device,
  });
}

/**
 * Create and save device
 * @param {Object} params - Parameters
 * @param {Object} params.device - New device
 * @param {Function} params.callback - Callback
 */
function createDevice({ device, callback }) {
  doesDeviceExist({
    deviceName: device.deviceName,
    callback: (nameData) => {
      if (nameData.error) {
        callback({ error: nameData.error });

        return;
      } else if (nameData.data.exists) {
        callback({ error: new errorCreator.AlreadyExists({ name: `device ${device.deviceName}` }) });

        return;
      }

      dbConnector.saveObject({
        object: new Device(device),
        objectType: 'device',
        callback: ({ error, data }) => {
          if (error) {
            callback({ error });

            return;
          }

          callback({ data: { device: data.savedObject } });
        },
      });
    },
  });
}

// function updateUserDevice({ deviceId, device, callback }) {
//
// }

/**
 * Update device properties. Creates a new device if one doesn't exist with sent deviceId.
 * @param {Object} params - Parameters.
 * @param {Function} params.callback - Callback.
 * @param {Object} params.device - Properties to update in device.
 * @param {string} [params.deviceId] - Device Id. It overrides deviceSocketId and will be used to get and update a device.
 * @param {string} [params.deviceSocketId] - Socket Id of the device. It will be used to get and update a device. deviceId overrides it.
 * @param {Object} [params.options] - Options.
 */
function updateDevice({
  deviceId,
  deviceSocketId,
  device,
  callback,
  options = {},
}) {
  const {
    socketId,
    deviceName,
    deviceType,
    ownerAliasId,
  } = device;
  const {
    resetSocket = false,
    resetOwnerAliasId = false,
  } = options;
  const update = {
    $set: {},
    $unset: {},
  };

  if (resetSocket) {
    update.$unset.socketId = '';
  } else if (socketId) {
    update.$set.socketId = socketId;
  }

  if (deviceType) { update.$set.deviceType = deviceType; }

  if (resetOwnerAliasId) {
    update.$unset.ownerAliasId = '';
  } else if (ownerAliasId) {
    update.$set.ownerAliasId = ownerAliasId;
  }

  if (deviceName) {
    update.$set.deviceName = deviceName;

    doesDeviceExist({
      deviceName,
      callback: (nameData) => {
        if (nameData.error) {
          callback({ error: nameData.error });

          return;
        } else if (nameData.data.exists) {
          callback({ error: new errorCreator.AlreadyExists({ name: `device name ${deviceName}` }) });

          return;
        }

        updateObject({
          deviceSocketId,
          deviceId,
          update,
          callback,
        });
      },
    });

    return;
  }

  updateObject({
    deviceId,
    update,
    callback,
  });
}

/**
 * Add access to the device
 * @param {Object} params - Parameters
 * @param {string[]} [params.userIds] - ID of the users to add
 * @param {string[]} [params.teamIds] - ID of the teams to add
 * @param {string[]} [params.bannedIds] - ID of the blocked Ids to add
 * @param {string[]} [params.teamAdminIds] - Id of the teams to give admin access to. They will also be added to teamIds.
 * @param {string[]} [params.userAdminIds] - Id of the users to give admin access to. They will also be added to userIds.
 * @param {Function} params.callback - Callback
 */
function addAccess({
  deviceId,
  userIds,
  teamIds,
  bannedIds,
  teamAdminIds,
  userAdminIds,
  callback,
}) {
  dbConnector.addObjectAccess({
    userIds,
    teamIds,
    bannedIds,
    teamAdminIds,
    userAdminIds,
    objectId: deviceId,
    object: Device,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ data: { device: data.object } });
    },
  });
}

/**
 * Remove access for teams andusers or unban Ids
 * @param {Object} params - Parameters
 * @param {string} params.deviceId - ID of the device to update
 * @param {string[]} [params.userIds] - ID of the users to remove
 * @param {string[]} [params.teamIds] - ID of the teams to remove
 * @param {string[]} [params.bannedIds] - ID of the blocked Ids to remove
 * @param {string[]} [params.teamAdminIds] - Id of the teams to remove admin access from. They will not be removed from teamIds.
 * @param {string[]} [params.userAdminIds] - Id of the users to remove admin access from. They will not be removed from userIds.
 * @param {Function} params.callback - Callback
 */
function removeAccess({
  deviceId,
  userIds,
  teamIds,
  bannedIds,
  teamAdminIds,
  userAdminIds,
  callback,
}) {
  dbConnector.removeObjectAccess({
    userIds,
    teamIds,
    bannedIds,
    teamAdminIds,
    userAdminIds,
    objectId: deviceId,
    object: Device,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ data: { device: data.object } });
    },
  });
}

/**
 * Get devices that the user has access to
 * @param {Object} params - Parameters.
 * @param {Object} params.user - User retrieving the devices.
 * @param {Function} params.callback - Callback.
 */
function getDevicesByUser({
  full,
  user,
  callback,
}) {
  const query = dbConnector.createUserQuery({ user });
  const filter = !full ? deviceFilter : {};

  getDevices({
    query,
    filter,
    callback,
  });
}

/**
 * Get device by Id.
 * @param {Object} params - Parameters.
 * @param {string} params.deviceId - Id of the device.
 * @param {Function} params.callback - Callback.
 */
function getDeviceById({
  deviceId,
  full,
  callback,
}) {
  const filter = !full ? deviceFilter : {};

  getDevice({
    callback,
    filter,
    query: { _id: deviceId },
  });
}

/**
 * Remove device
 * @param {Object} params - Parameters
 * @param {string} params.deviceId - ID of the device
 * @param {Function} params.callback - Callback
 */
function removeDevice({ deviceId, callback }) {
  dbConnector.removeObject({
    callback,
    object: Device,
    query: { _id: deviceId },
  });
}

/**
 * Get device by socket Id.
 * @param {Object} params - Parameters.
 * @param {string} params.socketId - Socket.io Id.
 * @param {Function} params.callback - Callback.
 */
function getDeviceBySocketId({ socketId, callback }) {
  getDevice({
    callback,
    query: { socketId },
  });
}

exports.addAccessToDevice = addAccess;
exports.removeAccessToDevice = removeAccess;
exports.updateDevice = updateDevice;
exports.createDevice = createDevice;
exports.getDevicesByUser = getDevicesByUser;
exports.getDeviceById = getDeviceById;
exports.removeDevice = removeDevice;
exports.getDeviceBySocketId = getDeviceBySocketId;
