'use strict';

import tools from '../helper/tools';

const schemas = {};

schemas.wallet = tools.buildLiteSchema({
  type: 'object',
  required: [
    'amount',
  ],
  properties: {
    amount: { type: 'number' },
    isProtected: { type: 'boolean' },
  },
});

schemas.fullWallet = tools.buildFullSchema({
  type: 'object',
  required: [
    'amount',
  ],
  properties: {
    amount: { type: 'number' },
    isProtected: { type: 'boolean' },
  },
});

schemas.wallets = {
  type: 'array',
  items: schemas.wallet,
};

schemas.fullWallets = {
  type: 'array',
  items: schemas.fullWallet,
};

export default schemas;
