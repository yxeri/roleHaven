/*
 Copyright 2017 Aleksandar Jankovic

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


const schemas = {};

schemas.docFilesList = {
  type: 'object',
  required: ['data'],
  properties: {
    data: {
      type: 'object',
      required: ['docFiles'],
      properties: {
        docFiles: {
          type: 'array',
          items: {
            type: 'object',
            required: [
              'isPublic',
              'docFileId',
              'title',
              'creator',
            ],
            properties: {
              docFileId: { type: 'string' },
              title: { type: 'string' },
              creator: { type: 'string' },
              isPublic: { type: 'boolean' },
            },
          },
        },
      },
    },
  },
};

schemas.docFile = {
  type: 'object',
  required: ['data'],
  properties: {
    data: {
      type: 'object',
      required: ['docFile'],
      properties: {
        docFile: {
          type: 'object',
          required: [
            'isPublic',
            'docFileId',
            'title',
            'creator',
            'text',
          ],
          properties: {
            docFileId: { type: 'string' },
            title: { type: 'string' },
            creator: { type: 'string' },
            isPublic: { type: 'boolean' },
            text: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
  },
};

module.exports = schemas;
