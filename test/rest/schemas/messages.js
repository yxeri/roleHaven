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

schemas.messages = {
  type: 'object',
  required: ['data'],
  properties: {
    data: {
      type: 'object',
      required: ['messages'],
      properties: {
        messages: {
          type: 'array',
          items: {
            type: 'object',
            required: ['text', 'time', 'userName', 'roomName'],
            properties: {
              userName: { type: 'string' },
              roomName: { type: 'string' },
              time: { type: 'string' },
              text: {
                type: 'array',
                items: { type: 'string' },
              },
            },
          },
        },
      },
    },
  },
};

module.exports = schemas;
