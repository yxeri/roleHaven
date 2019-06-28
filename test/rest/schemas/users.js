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

schemas.liteUser = tools.buildLiteSchema({
  type: 'object',
  required: [
    'username',
  ],
  properties: {
    username: { type: 'string' },
    usernameLowerCase: { type: 'string' },
    isVerified: { type: 'boolean' },
    isBanned: { type: 'boolean' },
    isOnline: { type: 'boolean' },
  },
  not: {
    required: [
      'password',
      'mailAddress',
      'hasFullAccess',
      'socketId',
      'isLootable',
      'defaultRoomId',
      'followingRooms',
      'registerDevice',
    ],
  },
});

schemas.fullUser = tools.buildFullSchema({
  type: 'object',
  required: [
    'username',
    'isVerified',
    'isBanned',
    'isOnline',
    'hasFullAccess',
    'isLootable',
    'defaultRoomId',
    'followingRooms',
    'registerDevice',
  ],
  properties: {
    password: { type: 'boolean' },
    socketId: { type: 'string' },
    username: { type: 'string' },
    usernameLowerCase: { type: 'string' },
    isVerified: { type: 'boolean' },
    isBanned: { type: 'boolean' },
    isOnline: { type: 'boolean' },
    hasFullAccess: { type: 'boolean' },
    isLootable: { type: 'boolean' },
    defaultRoomId: { type: 'string' },
    registerDevice: { type: 'string' },
    followingRooms: {
      type: 'array',
      items: { type: 'string' },
    },
  },
});

schemas.users = {
  type: 'array',
  items: schemas.liteUser,
};

schemas.fullUsers = {
  type: 'array',
  items: schemas.fullUser,
};

module.exports = schemas;
