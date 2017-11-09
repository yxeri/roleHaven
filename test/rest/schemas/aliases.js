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

const appConfig = require('../../../config/defaults/config').app;

const schemas = {};

schemas.aliases = {
  type: 'object',
  required: ['data'],
  properties: {
    data: {
      type: 'object',
      required: ['aliases', 'username'],
      properties: {
        aliases: {
          type: 'array',
          items: {
            type: 'string',
            maxLength: appConfig.usernameMaxLength,
          },
        },
        username: { type: 'string' },
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

schemas.alias = {
  type: 'object',
  required: ['data'],
  properties: {
    data: {
      type: 'object',
      required: ['alias'],
      properties: {
        alias: { type: 'string' },
      },
    },
  },
};

module.exports = schemas;
