/*
 Copyright 2017 Carmilla Mina Jankovic

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
const baseObjects = require('./baseObjects');

const schemas = {};

schemas.position = tools.buildLiteSchema({
  type: 'object',
  required: [
    'positionName',
    'positionType',
    'radius',
  ],
  properties: {
    deviceId: { type: 'string' },
    connectedToUser: { type: 'string' },
    coordinatesHistory: {
      type: 'array',
      items: baseObjects.coordinates,
    },
    positionName: { type: 'string' },
    positionType: { type: 'string' },
    radius: { type: 'number' },
    isStationary: { type: 'boolean' },
    description: {
      type: 'array',
      items: { type: 'string' },
    },
  },
});

schemas.fullPosition = tools.buildFullSchema({
  type: 'object',
  required: [
    'positionName',
    'positionType',
    'radius',
  ],
  properties: {
    deviceId: { type: 'string' },
    connectedToUser: { type: 'string' },
    coordinatesHistory: {
      type: 'array',
      items: baseObjects.coordinates,
    },
    positionName: { type: 'string' },
    positionType: { type: 'string' },
    radius: { type: 'number' },
    isStationary: { type: 'boolean' },
    description: {
      type: 'array',
      items: { type: 'string' },
    },
  },
});

schemas.positions = {
  type: 'array',
  items: schemas.position,
};

schemas.fullPositions = {
  type: 'array',
  items: schemas.fullPosition,
};

module.exports = schemas;
