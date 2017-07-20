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

const roomListBase = {
  type: 'array',
  items: {
    type: 'object',
    required: ['roomName', 'password'],
    properties: {
      roomName: { type: 'string' },
      password: { type: 'boolean' },
    },
  },
};

schemas.rooms = {
  type: 'object',
  required: ['data'],
  properties: {
    data: {
      type: 'object',
      required: [
        'rooms',
        'whisperRooms',
        'followedRooms',
        'ownedRooms',
        'protectedRooms',
      ],
      properties: {
        rooms: roomListBase,
        whisperRooms: roomListBase,
        followedRooms: roomListBase,
        protectedRooms: roomListBase,
        ownedRooms: roomListBase,
      },
    },
  },
};

schemas.room = {
  type: 'object',
  required: ['data'],
  properties: {
    data: {
      type: 'object',
      required: ['room'],
      properties: {
        room: {
          type: 'object',
          required: [
            'roomName',
            'accessLevel',
            'visibility',
            'owner',
            'anonymous',
          ],
          properties: {
            roomName: { type: 'string' },
            accessLevel: { type: 'number' },
            visibility: { type: 'number' },
            owner: { type: 'string' },
            anonymous: { type: 'boolean' },
          },
        },
      },
    },
  },
};

schemas.unfollowRoom = {
  type: 'object',
  required: ['data'],
  properties: {
    data: {
      type: 'object',
      required: ['room'],
      properties: {
        room: {
          type: 'object',
          required: ['roomName'],
          properties: {
            roomName: { type: 'string' },
          },
        },
      },
    },
  },
};

schemas.matched = {
  type: 'object',
  required: ['data'],
  properties: {
    data: {
      type: 'object',
      required: ['matched'],
      properties: {
        matched: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
  },
};

module.exports = schemas;
