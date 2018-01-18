/*
 Copyright 2018 Aleksandar Jankovic

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

module.exports = schemas;
