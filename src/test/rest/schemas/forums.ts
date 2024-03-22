'use strict';

const tools = require('../helper/tools');

const schemas = {};

schemas.forum = tools.buildLiteSchema({
  type: 'object',
  required: [
    'title',
    'text',
  ],
  properties: {
    title: { type: 'string' },
    text: {
      type: 'array',
      items: { type: 'string' },
    },
    threadIds: {
      type: 'array',
      items: { type: 'string' },
    },
  },
});

schemas.fullForum = tools.buildFullSchema({
  type: 'object',
  required: [
    'title',
    'text',
  ],
  properties: {
    title: { type: 'string' },
    text: {
      type: 'array',
      items: { type: 'string' },
    },
    threadIds: {
      type: 'array',
      items: { type: 'string' },
    },
  },
});

schemas.forums = {
  type: 'array',
  items: schemas.forum,
};

schemas.fullForums = {
  type: 'array',
  items: schemas.fullForum,
};

export default schemas;
