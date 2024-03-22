'use strict';

const tools = require('../helper/tools');
const { dbConfig } = require('../../../config/defaults/config');

const schemas = {};

schemas.device = tools.buildLiteSchema({
  type: 'object',
  required: [
    'deviceName',
    'deviceType',
  ],
  properties: {
    deviceName: { type: 'string' },
    deviceType: {
      type: 'string',
      enum: Object.values(dbConfig.DeviceTypes),
    },
    lastUserId: { type: 'string' },
    socketId: { type: 'string' },
  },
});

schemas.fullDevice = tools.buildFullSchema({
  type: 'object',
  required: [
    'deviceName',
    'deviceType',
  ],
  properties: {
    deviceName: { type: 'string' },
    deviceType: {
      type: 'string',
      enum: Object.values(dbConfig.DeviceTypes),
    },
    lastUserId: { type: 'string' },
    socketId: { type: 'string' },
  },
});

schemas.devices = {
  type: 'array',
  items: schemas.device,
};

schemas.fullDevices = {
  type: 'array',
  items: schemas.fullDevice,
};

export default schemas;
