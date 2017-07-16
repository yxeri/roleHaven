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

// owner: { type: String, unique: true },
// amount: { type: Number, default: 0 },
// accessLevel: { type: Number, default: 1 },
// protected: { type: Boolean, default: false },
// team: String,

const walletBase = {
  type: 'object',
  required: ['wallet'],
  properties: {
    room: {
      type: 'object',
      required: [
        'owner',
        'amount',
        'accessLevel',
        'protected',
      ],
      properties: {
        owner: { type: 'string' },
        accessLevel: { type: 'number' },
        amount: { type: 'number' },
        protected: { type: 'boolean' },
      },
    },
  },
};
const teamWalletBase = {
  type: 'object',
  required: ['wallet'],
  properties: {
    room: {
      type: 'object',
      required: [
        'owner',
        'amount',
        'accessLevel',
        'protected',
        'team',
      ],
      properties: {
        owner: { type: 'string' },
        accessLevel: { type: 'number' },
        amount: { type: 'number' },
        protected: { type: 'boolean' },
        team: { type: 'string' },
      },
    },
  },
};

schemas.wallet = {
  type: 'object',
  required: ['data'],
  properties: {
    data: walletBase,
  },
};

schemas.teamWallet = {
  type: 'object',
  required: ['data'],
  properties: {
    data: teamWalletBase,
  },
};

module.exports = schemas;
