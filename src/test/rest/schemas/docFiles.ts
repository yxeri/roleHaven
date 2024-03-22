'use strict';

const tools = require('../helper/tools');

const schemas = {};

schemas.liteDocFile = tools.buildLiteSchema({
  type: 'object',
  required: [
    'title',
  ],
  properties: {
    title: { type: 'string' },
    code: { type: 'string' },
  },
});

schemas.docFile = tools.buildLiteSchema({
  type: 'object',
  required: [
    'code',
    'title',
    'text',
  ],
  properties: {
    code: { type: 'string' },
    title: { type: 'string' },
    text: {
      type: 'array',
      items: { type: 'string' },
    },
  },
});

schemas.fullDocFile = tools.buildFullSchema({
  type: 'object',
  required: [
    'code',
    'title',
    'text',
  ],
  properties: {
    code: { type: 'string' },
    title: { type: 'string' },
    text: {
      type: 'array',
      items: { type: 'string' },
    },
  },
});

schemas.docFiles = {
  type: 'array',
  items: schemas.docFile,
};

schemas.fullDocFiles = {
  type: 'array',
  items: schemas.fullDocFile,
};

schemas.liteDocFiles = {
  type: 'array',
  items: schemas.liteDocFile,
};

export default schemas;
