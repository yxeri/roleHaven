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
const dbConfig = require('../../config/defaults/config').databasePopulation;
const dbConnector = require('../databaseConnector');

const deviceSchema = new mongoose.Schema(dbConnector.createSchema({
  deviceName: { type: String, unique: true },
  socketId: String,
  lastUserId: String,
  deviceType: { type: String, default: dbConfig.DeviceTypes.USERDEVICE },
}), { collection: 'devices' });

const Device = mongoose.model('Device', deviceSchema);

/**
 * Update device fields
 * @param {Object} params - Parameters
 * @param {string} params.objectId - ID of the device to update
 * @param {Object} params.update - Update
 * @param {Function} params.callback - Callback
 */
function updateObject({ objectId, update, callback }) {
  dbConnector.updateObject({
    update,
    object: Device,
    query: { _id: objectId },
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
 * Get devices
 * @private
 * @param {Object} params - Parameters
 * @param {Object} params.query - Query to get devices
 * @param {Function} params.callback - Callback
 */
function getDevices({ query, callback }) {
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
 * Get device
 * @private
 * @param {Object} params - Parameters
 * @param {string} params.query - Query to get device
 * @param {Function} params.callback - Callback
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
        callback({ error: new errorCreator.DoesNotExist({ name: `device ${query.toString()}` }) });

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

/**
 * Update device properties. Creates a new device if one doesn't exist with sent objectId
 * @param {Object} params - Parameters
 * @param {Object} params.device - Properties to update in device
 * @param {string} params.device.objectId - Device ID
 * @param {string} [params.device.socketId] - Socket.IO socket ID
 * @param {Object} [params.options] - Options
 * @param {Function} params.callback - Callback
 */
function updateDevice({ device, options, callback }) {
  const {
    objectId,
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
  } else if (device.socketId) {
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
          objectId,
          update,
          callback,
        });
      },
    });

    return;
  }

  updateObject({
    objectId,
    update,
    callback,
  });
}

/**
 * Add access to the device
 * @param {Object} params - Parameters
 * @param {string[]} [params.userIds] - ID of the users to add
 * @param {string[]} [params.teamIds] - ID of the teams to add
 * @param {string[]} [params.blockedIds] - ID of the blocked Ids to add
 * @param {boolean} [params.isAdmin] - Should the teams and/or users be added as admins?
 * @param {Function} params.callback - Callback
 */
function addAccess({
  objectId,
  userIds,
  teamIds,
  blockedIds,
  isAdmin,
  callback,
}) {
  if (!userIds && !teamIds && !blockedIds) {
    callback({ error: new errorCreator.InvalidData({ expected: 'teamIds || userIds || blockedIds' }) });

    return;
  }

  dbConnector.addObjectAccess({
    objectId,
    userIds,
    teamIds,
    blockedIds,
    isAdmin,
    callback,
    object: Device,
  });
}

/**
 * Remove access for teams andusers or unban Ids
 * @param {Object} params - Parameters
 * @param {string} params.objectId - ID of the device to update
 * @param {string[]} [params.userIds] - ID of the users to remove
 * @param {string[]} [params.teamIds] - ID of the teams to remove
 * @param {string[]} [params.blockedIds] - ID of the blocked Ids to remove
 * @param {boolean} [params.isAdmin] - Should the teams and/or users be removed from admins?
 * @param {Function} params.callback - Callback
 */
function removeAccess({
  objectId,
  userIds,
  teamIds,
  blockedIds,
  isAdmin,
  callback,
}) {
  if (!userIds && !teamIds) {
    callback({ error: new errorCreator.InvalidData({ expected: 'teamIds || userIds || blockedIds' }) });

    return;
  }

  dbConnector.removeObjectAccess({
    userIds,
    teamIds,
    blockedIds,
    objectId,
    callback,
    isAdmin,
    object: Device,
  });
}

/**
 * Get all devices
 * @param {Object} params - Parameters
 * @param {Function} params.callback - Callback
 */
function getAllDevices({ callback }) {
  getDevices({ callback });
}

/**
 * Get devices that the teams have access to
 * @param {Object} params - Parameters
 * @param {Object} params.teamIds - IDs of the team retrieving the devices
 * @param {Function} params.callback - Callback
 */
function getDevicesByTeams({ teamIds, callback }) {
  getDevices({
    callback,
    query: { teamIds: { $in: teamIds } },
  });
}

/**
 * Get devices that the user has access to
 * @param {Object} params - Parameters
 * @param {Object} params.userId - ID of the user retrieving the devices
 * @param {Function} params.callback - Callback
 */
function getDevicesByUser({ userId, callback }) {
  const query = {
    $or: [
      { ownerId: userId },
      { userIds: { $in: [userId] } },
    ],
  };

  getDevices({
    query,
    callback,
  });
}

/**
 * Get devices by type
 * @param {Object} params - Parameters
 * @param {string} params.deviceType - Device type
 * @param {Function} params.callback - Callback
 */
function getDevicesByType({ deviceType, callback }) {
  getDevices({
    callback,
    query: { deviceType },
  });
}

/**
 * Get device by id
 * @param {Object} params - Parameters
 * @param {string} params.objectId - ID of the device
 * @param {Function} params.callback - Callback
 */
function getDeviceById({ objectId, callback }) {
  getDevice({
    callback,
    query: { _id: objectId },
  });
}

exports.addAccessToDevice = addAccess;
exports.removeAccessToDevice = removeAccess;
exports.updateDevice = updateDevice;
exports.getAllDevices = getAllDevices;
exports.createDevice = createDevice;
exports.getDevicesByUser = getDevicesByUser;
exports.getDevicesByType = getDevicesByType;
exports.getDevicesByTeams = getDevicesByTeams;
exports.getDeviceById = getDeviceById;
