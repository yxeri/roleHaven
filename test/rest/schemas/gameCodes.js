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

const tools = require('../helper/tools');
const { dbConfig } = require('../../../config/defaults/config');

const schemas = {};

schemas.gameCode = tools.buildLiteSchema({
  type: 'object',
  required: [
    'code',
    'codeType',
  ],
  properties: {
    code: { type: 'string' },
    codeType: {
      type: 'string',
      enum: Object.values(dbConfig.GameCodeTypes),
    },
    codeContent: {
      type: 'array',
      items: { type: 'string' },
    },
    used: { type: 'boolean' },
    isRenewable: { type: 'boolean' },
  },
});

schemas.fullGameCode = tools.buildFullSchema({
  type: 'object',
  required: [
    'code',
    'codeType',
  ],
  properties: {
    code: { type: 'string' },
    codeType: {
      type: 'string',
      enum: Object.values(dbConfig.GameCodeTypes),
    },
    codeContent: {
      type: 'array',
      items: { type: 'string' },
    },
    used: { type: 'boolean' },
    isRenewable: { type: 'boolean' },
  },
});

schemas.gameCodes = {
  type: 'array',
  items: schemas.gameCode,
};

schemas.fullGameCodes = {
  type: 'array',
  items: schemas.fullGameCode,
};

module.exports = schemas;
