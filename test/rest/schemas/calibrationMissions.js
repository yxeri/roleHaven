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

const transactionSchemas = require('./transactions');

const schemas = {};

const calibrationMissionBase = {
  type: 'object',
  required: ['owner', 'stationId', 'code', 'completed'],
  properties: {
    owner: { type: 'string' },
    stationId: { type: 'number' },
    code: {
      type: 'number',
      minLength: 8,
      maxLength: 8,
    },
    completed: { type: 'boolean' },
  },
};

schemas.calibrationMissions = {
  type: 'object',
  required: ['data'],
  properties: {
    data: {
      type: 'object',
      required: ['missions'],
      properties: {
        missions: {
          type: 'array',
          items: calibrationMissionBase,
        },
      },
    },
  },
};

schemas.calibrationMission = {
  type: 'object',
  required: ['data'],
  properties: {
    data: {
      type: 'object',
      required: ['mission'],
      properties: {
        mission: calibrationMissionBase,
      },
    },
  },
};

schemas.completedCalibrationMission = {
  type: 'object',
  required: ['data'],
  properties: {
    data: {
      type: 'object',
      required: ['mission', 'transaction'],
      properties: {
        mission: calibrationMissionBase,
        transaction: transactionSchemas.baseTransaction,
      },
    },
  },
};

schemas.cancelledCalibrationMission = {
  type: 'object',
  required: ['data'],
  properties: {
    data: {
      type: 'object',
      required: ['mission', 'cancelled'],
      properties: {
        mission: calibrationMissionBase,
        cancelled: {
          type: 'boolean',
          enum: [true],
        },
      },
    },
  },
};

module.exports = schemas;
