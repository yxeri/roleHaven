'use strict';

const tools = require('../helper/tools');

const schemas = {};

schemas.forumPost = tools.buildLiteSchema({
  type: 'object',
  required: [
    'text',
  ],
  properties: {
    parentPostId: { type: 'string' },
    depth: { type: 'number' },
    text: {
      type: 'array',
      items: { type: 'string' },
    },
  },
});

schemas.fullForumPost = tools.buildFullSchema({
  type: 'object',
  required: [
    'text',
  ],
  properties: {
    parentPostId: { type: 'string' },
    depth: { type: 'number' },
    text: {
      type: 'array',
      items: { type: 'string' },
    },
  },
});

schemas.forumPosts = {
  type: 'array',
  items: schemas.forumPost,
};

schemas.fullForumPosts = {
  type: 'array',
  items: schemas.fullForumPost,
};

export default schemas;
