'use strict';

import tools from '../helper/tools';

const schemas = {};

schemas.forumThread = tools.buildLiteSchema({
  type: 'object',
  required: [
    'forumId',
    'title',
    'postIds',
    'text',
  ],
  properties: {
    forumId: { type: 'string' },
    title: { type: 'string' },
    text: {
      type: 'array',
      items: { type: 'string' },
    },
    postIds: {
      type: 'array',
      items: { type: 'string' },
    },
  },
});

schemas.fullForumThread = tools.buildFullSchema({
  type: 'object',
  required: [
    'forumId',
    'title',
    'postIds',
    'text',
  ],
  properties: {
    forumId: { type: 'string' },
    title: { type: 'string' },
    text: {
      type: 'array',
      items: { type: 'string' },
    },
    postIds: {
      type: 'array',
      items: { type: 'string' },
    },
  },
});

schemas.forumThreads = {
  type: 'array',
  items: schemas.forumThread,
};

schemas.fullForumThreads = {
  type: 'array',
  items: schemas.fullForumThread,
};

export default schemas;
