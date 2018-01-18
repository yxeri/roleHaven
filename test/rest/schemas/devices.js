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

const tools = require('../helper/tools');
const dbConfig = require('../../../config/defaults/config').databasePopulation;

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

module.exports = schemas;
