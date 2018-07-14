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

const schemas = {};

schemas.createdRoom = tools.buildLiteSchema({
  type: 'object',
  required: [
    'roomName',
  ],
  properties: {
    roomName: { type: 'string' },
    isAnonymous: { type: 'boolean' },
    isWhisper: { type: 'boolean' },
    nameIsLocked: { type: 'boolean' },
    isSystemRoom: { type: 'boolean' },
    password: { type: 'boolean' },
  },
});

schemas.room = tools.buildLiteSchema({
  type: 'object',
  required: [
    'roomName',
  ],
  properties: {
    roomName: { type: 'string' },
    isAnonymous: { type: 'boolean' },
    isWhisper: { type: 'boolean' },
    nameIsLocked: { type: 'boolean' },
    isSystemRoom: { type: 'boolean' },
    participantIds: {
      type: 'array',
      items: { type: 'string ' },
    },
    password: { type: 'boolean' },
  },
});

schemas.fullRoom = tools.buildFullSchema({
  type: 'object',
  required: [
    'roomName',
  ],
  properties: {
    roomName: { type: 'string' },
    isAnonymous: { type: 'boolean' },
    isWhisper: { type: 'boolean' },
    nameIsLocked: { type: 'boolean' },
    isSystemRoom: { type: 'boolean' },
    participantIds: {
      type: 'array',
      items: { type: 'string' },
    },
    password: { type: 'boolean' },
  },
});

schemas.rooms = {
  type: 'array',
  items: schemas.room,
};

schemas.followedRooms = {
  type: 'array',
  items: schemas.followedRoom,
};

schemas.fullRooms = {
  type: 'array',
  items: schemas.fullRoom,
};

module.exports = schemas;
