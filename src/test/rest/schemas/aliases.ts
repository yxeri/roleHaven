'use strict';

const tools = require('../helper/tools');

const schemas = {};

schemas.alias = tools.buildLiteSchema({
  type: 'object',
  required: [
    'aliasName',
  ],
  properties: {
    aliasName: { type: 'string' },
    aliasNameLowerCase: { type: 'string' },
  },
});

schemas.fullAlias = tools.buildFullSchema({
  type: 'object',
  required: [
    'aliasName',
  ],
  properties: {
    aliasName: { type: 'string' },
    aliasNameLowerCase: { type: 'string' },
  },
});

schemas.aliases = {
  type: 'array',
  items: schemas.alias,
};

schemas.fullAliases = {
  type: 'array',
  items: schemas.fullAlias,
};
export default schemas;
