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


const schemas = {};

schemas.users = {
  type: 'object',
  required: ['data'],
  properties: {
    data: {
      type: 'object',
      required: ['users'],
      properties: {
        users: {
          type: 'array',
          items: {
            type: 'object',
            required: ['username'],
            properties: {
              username: { type: 'string' },
              online: { type: 'boolean' },
            },
          },
        },
      },
    },
  },
};

schemas.usernames = {
  type: 'object',
  required: ['data'],
  properties: {
    data: {
      type: 'object',
      required: ['users'],
      properties: {
        users: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
  },
};

schemas.matches = {
  type: 'object',
  required: ['data'],
  properties: {
    data: {
      type: 'object',
      required: ['matches'],
      properties: {
        matches: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
  },
};

schemas.user = {
  type: 'object',
  required: ['data'],
  properties: {
    data: {
      type: 'object',
      required: ['user'],
      properties: {
        user: {
          required: [
            'username',
            'verified',
            'banned',
            'online',
            'lootable',
            'accessLevel',
            'visibility',
            'warnings',
            'mail',
            'rooms',
            'whisperRooms',
            'registeredAt',
            'registerDevice',
            'aliases',
          ],
          properties: {
            username: { type: 'string' },
            verified: { type: 'boolean' },
            banned: { type: 'boolean' },
            online: { type: 'boolean' },
            lootable: { type: 'boolean' },
            accessLevel: { type: 'number' },
            visibility: { type: 'number' },
            warnings: { type: 'number' },
            mail: { type: ['boolean', 'string'] },
            rooms: { type: 'array', items: { type: 'string' } },
            whisperRooms: { type: 'array', items: { type: 'string' } },
            registeredAt: { type: 'string' },
            registerDevice: { type: 'string' },
            aliases: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
  },
};

module.exports = schemas;
