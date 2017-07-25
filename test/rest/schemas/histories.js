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

schemas.histories = {
  type: 'object',
  required: ['data'],
  properties: {
    data: {
      type: 'object',
      required: ['histories', 'timeZoneOffset'],
      properties: {
        timeZoneOffset: { type: 'number' },
        histories: {
          required: [
            'messages',
            'anonymous',
            'isWhisper',
          ],
          properties: {
            messages: { type: 'array', items: { type: 'object' } },
            anonymous: { type: 'boolean' },
            timeZoneOffset: { type: 'number' },
            isWhisper: { type: 'boolean' },
          },
        },
      },
    },
  },
};

schemas.messages = {
  type: 'object',
  required: ['data'],
  properties: {
    data: {
      type: 'object',
      required: ['messages', 'timeZoneOffset'],
      properties: {
        messages: {
          required: [
            'messages',
            'anonymous',
            'isWhisper',
          ],
          properties: {
            messages: {
              type: 'array',
              items: {
                type: 'object',
                required: [
                  'text',
                  'time',
                  'roomName',
                  'userName',
                ],
                properties: {
                  text: { type: 'array', items: { type: 'string' } },
                  time: { type: 'string' },
                  roomName: { type: 'string' },
                  userName: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  },
};

module.exports = schemas;
