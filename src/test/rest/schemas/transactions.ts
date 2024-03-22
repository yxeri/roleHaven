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

export default schemas;
