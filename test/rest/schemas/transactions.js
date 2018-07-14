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
const baseObjects = require('./baseObjects');

const schemas = {};

schemas.transaction = tools.buildLiteSchema({
  type: 'object',
  required: [
    'amount',
    'toWalletId',
    'fromWalletId',
  ],
  properties: {
    amount: { type: 'number' },
    toWalletId: { type: 'string' },
    fromWalletId: { type: 'string' },
    note: { type: 'string' },
    coordinates: baseObjects.coordinates,
  },
});

schemas.fullTransaction = tools.buildFullSchema({
  type: 'object',
  required: [
    'amount',
    'toWalletId',
    'fromWalletId',
  ],
  properties: {
    amount: { type: 'number' },
    toWalletId: { type: 'string' },
    fromWalletId: { type: 'string' },
    note: { type: 'string' },
    coordinates: baseObjects.coordinates,
  },
});

schemas.transactions = {
  type: 'array',
  items: schemas.transaction,
};

schemas.fullTransactions = {
  type: 'array',
  items: schemas.fullTransaction,
};

module.exports = schemas;
