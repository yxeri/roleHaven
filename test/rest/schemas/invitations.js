/*
 Copyright 2017 Carmilla Mina Jankovic

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
const { dbConfig } = require('../../../config/defaults/config');

const schemas = {};

schemas.invitation = tools.buildLiteSchema({
  type: 'object',
  required: [
    'invitationType',
    'itemId',
    'receiverId',
  ],
  properties: {
    invitationType: {
      type: 'string',
      enum: Object.keys(dbConfig.InvitationTypes),
    },
    itemId: { type: 'string' },
    receiverId: { type: 'string' },
  },
});

schemas.fullInvitation = tools.buildFullSchema({
  type: 'object',
  required: [
    'invitationType',
    'itemId',
    'receiverId',
  ],
  properties: {
    invitationType: {
      type: 'string',
      enum: Object.keys(dbConfig.InvitationTypes),
    },
    itemId: { type: 'string' },
    receiverId: { type: 'string' },
  },
});

schemas.invitations = {
  type: 'array',
  items: schemas.invitation,
};

schemas.fullInvitations = {
  type: 'array',
  items: schemas.fullInvitation,
};

module.exports = schemas;
