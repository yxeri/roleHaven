'use strict';

import tools from '../helper/tools';
import { dbConfig } from '../../../config/defaults/config';

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

export default schemas;
