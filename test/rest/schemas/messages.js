/*
 Copyright 2018 Carmilla Mina Jankovic

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
const { dbConfig } = require('../../../config/defaults/config');

const schemas = {};

schemas.message = tools.buildLiteSchema({
  type: 'object',
  required: [
    'messageType',
    'text',
    'roomId',
  ],
  properties: {
    roomId: { type: 'string' },
    messageType: {
      type: 'string',
      enum: Object.values(dbConfig.MessageTypes),
    },
    coordinates: baseObjects.coordinates,
    intro: {
      type: 'array',
      items: { type: 'string' },
    },
    extro: {
      type: 'array',
      items: { type: 'string' },
    },
    image: {
      imageName: { type: 'string' },
      fileName: { type: 'string' },
      width: { type: 'number' },
      height: { type: 'number' },
    },
  },
});

schemas.fullMessage = tools.buildFullSchema({
  type: 'object',
  required: [
    'messageType',
    'text',
    'roomId',
  ],
  properties: {
    roomId: { type: 'string' },
    messageType: {
      type: 'string',
      enum: Object.values(dbConfig.MessageTypes),
    },
    coordinates: baseObjects.coordinates,
    intro: {
      type: 'array',
      items: { type: 'string' },
    },
    extro: {
      type: 'array',
      items: { type: 'string' },
    },
    image: {
      imageName: { type: 'string' },
      fileName: { type: 'string' },
      width: { type: 'number' },
      height: { type: 'number' },
    },
  },
});

schemas.messages = {
  type: 'array',
  items: schemas.message,
};

schemas.fullMessages = {
  type: 'array',
  items: schemas.fullMessage,
};

module.exports = schemas;
