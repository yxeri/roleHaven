'use strict';

import mongoose from 'mongoose';
import { DeviceType } from 'src/config/defaults/dbConfig.js';
import { UserSchema } from 'src/db/connectors/user.js';

import dbConnector, { BaseSchema } from 'src/db/databaseConnector.js';
import errorCreator from 'src/error/errorCreator.js';

type DeviceSchema = BaseSchema & {
  deviceName: string,
  socketId: string,
  lastUserId: string,
  connectedToUser: string,
  deviceType: DeviceType,
};

const deviceSchema = new mongoose.Schema<DeviceSchema>({
  deviceName: {
    type: String,
    unique: true,
  },
  socketId: String,
  lastUserId: String,
  connectedToUser: {
    type: String,
    unique: true,
    sparse: true,
  },
  deviceType: {
    type: mongoose.SchemaTypes.Mixed,
    default: DeviceType.USERDEVICE,
  },
}, { collection: 'devices' });

const Device = mongoose.model('Device', deviceSchema);

async function updateObject({
  deviceId,
  deviceSocketId,
  update,
  suppressError,
}: {
  deviceId?: string,
  deviceSocketId?: string,
  update: mongoose.UpdateQuery<DeviceSchema>,
  suppressError?: boolean,
}) {
  const query: mongoose.FilterQuery<DeviceSchema> = {};

  if (deviceId) {
    query._id = deviceId;
  } else {
    query.socketId = deviceSocketId;
  }

  const { error, data } = await dbConnector.updateObject({
    update,
    query,
    suppressError,
    object: Device,
    errorNameContent: 'updateDeviceObject',
  });

  if (error) {
    return { error };
  }

  if (!data?.object) {
    return { error: new errorCreator.DoesNotExist({ name: `device ${JSON.stringify(query, null, 4)}` }) };
  }

  return { data: { device: data.object } };
}

async function getDevices({
  query,
}: {
  query: mongoose.FilterQuery<DeviceSchema>,
}) {
  const { error, data } = await dbConnector.getObjects({
    query,
    object: Device,
  });

  if (error) {
    return { error };
  }

  return { data: { devices: data?.objects } };
}

async function getDevice({
  query,
}: {
  query: mongoose.FilterQuery<DeviceSchema>,
}) {
  const { error, data } = await dbConnector.getObject({
    query,
    object: Device,
  });

  if (error) {
    return { error };
  }

  if (!data?.object) {
    return { error: new errorCreator.DoesNotExist({ name: `device ${JSON.stringify(query, null, 4)}` }) };
  }

  return { data: { device: data.object } };
}

async function doesDeviceExist({
  deviceName,
}: {
  deviceName: string,
}) {
  return dbConnector.doesObjectExist({
    query: { deviceName },
    object: Device,
  });
}

async function createDevice({
  device,
}: {
  device: Partial<DeviceSchema> & { deviceName: string },

}) {
  const { error, data } = await doesDeviceExist({
    deviceName: device.deviceName,
  });

  if (error) {
    return { error };
  }

  if (data.exists) {
    return { error: new errorCreator.AlreadyExists({ name: `device ${device.deviceName}` }) };
  }

  const { error: saveError, data: saveData } = await dbConnector.saveObject({
    object: Device,
    objectData: device,
    objectType: 'device',
  });

  if (saveError) {
    return { error: saveError };
  }

  return { data: { device: saveData.savedObject } };
}

async function updateDevice({
  deviceId,
  deviceSocketId,
  device,
  suppressError,
  options = {},
}: {
  deviceId?: string,
  deviceSocketId?: string
  device: Partial<DeviceSchema>,
  suppressError?: boolean,
  options?: {
    resetSocket?: boolean,
    resetOwnerAliasId?: boolean,
  },
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
  const update: mongoose.UpdateQuery<DeviceSchema> = {};
  const set: mongoose.UpdateQuery<DeviceSchema>['$set'] = {};
  const unset: mongoose.UpdateQuery<DeviceSchema>['$unset'] = {};

  if (resetSocket) {
    unset.socketId = '';
  } else if (socketId) {
    set.socketId = socketId;
  }

  if (deviceType) {
    set.deviceType = deviceType;
  }
  if (deviceName) {
    set.deviceName = deviceName;
  }

  if (resetOwnerAliasId) {
    unset.ownerAliasId = '';
  } else if (ownerAliasId) {
    set.ownerAliasId = ownerAliasId;
  }

  if (Object.keys(set).length > 0) {
    update.$set = set;
  }
  if (Object.keys(unset).length > 0) {
    update.$unset = unset;
  }

  if (deviceName) {
    const { error, data } = await doesDeviceExist({
      deviceName,
    });

    if (error) {
      return { error };
    }

    if (data.exists) {
      return { error: new errorCreator.AlreadyExists({ name: `device name ${deviceName}` }) };
    }

    return updateObject({
      suppressError,
      deviceSocketId,
      deviceId,
      update,
    });
  }

  return updateObject({
    deviceId,
    deviceSocketId,
    update,
    suppressError,
  });
}

async function getDevicesByUser({
  user,
}: {
  user: Partial<UserSchema>,
}) {
  const query = dbConnector.createUserQuery({ user });

  return getDevices({
    query,
  });
}

async function getDeviceById({
  deviceId,
}: {
  deviceId: string,

}) {
  return getDevice({
    query: { _id: deviceId },
  });
}

async function removeDevice({
  deviceId,
}: {
  deviceId: string,
}) {
  return dbConnector.removeObject({
    object: Device,
    query: { _id: deviceId },
  });
}

async function getDeviceBySocketId({
  socketId,
}: {
  socketId: string,
}) {
  return getDevice({
    query: { socketId },
  });
}

export default {
  updateDevice,
  createDevice,
  getDevicesByUser,
  getDeviceById,
  removeDevice,
  getDeviceBySocketId,
};
