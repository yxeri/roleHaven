/*
 Copyright 2018 Carmilla Mina Jankovic

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

module.exports = schemas;
