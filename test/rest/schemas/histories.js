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

const messageBase = {
  type: 'object',
  required: [
    'text',
    'time',
    'roomName',
    'username',
  ],
  properties: {
    text: { type: 'array', items: { type: 'string' } },
    time: { type: 'string' },
    roomName: { type: 'string' },
    username: { type: 'string' },
  },
};

schemas.message = {
  type: 'object',
  required: ['data'],
  properties: {
    data: {
      type: 'object',
      required: ['message', 'roomName', 'timeZoneOffset'],
      properties: {
        message: messageBase,
        roomName: { type: 'string' },
        timeZoneOffset: { type: 'number' },
      },
    },
  },
};

schemas.history = {
  type: 'object',
  required: ['data'],
  properties: {
    data: {
      type: 'object',
      required: ['history'],
      properties: {
        history: {
          type: 'object',
          required: [
            'roomName',
            'messages',
            'timeZoneOffset',
            'anonymous',
            'isWhisper',
          ],
          properties: {
            roomName: { type: 'string' },
            messages: {
              type: 'array',
              items: messageBase,
            },
            timeZoneOffset: { type: 'number' },
            anonymous: { type: 'boolean' },
            isWhisper: { type: 'boolean' },
          },
        },
      },
    },
  },
};

module.exports = schemas;
