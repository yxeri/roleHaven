'use strict';

const tools = require('../helper/tools');

const schemas = {};

schemas.simpleMsg = tools.buildLiteSchema({
  type: 'object',
  required: ['text'],
  properties: {
    text: { type: 'string' },
  },
});

schemas.fullSimpleMsg = tools.buildFullSchema({
  type: 'object',
  required: ['text'],
  properties: {
    text: { type: 'string' },
  },
});

schemas.simpleMsgs = {
  type: 'array',
  items: schemas.simpleMsg,
};

schemas.fullSimpleMsgs = {
  type: 'array',
  items: schemas.fullSimpleMsg,
};

export default schemas;
