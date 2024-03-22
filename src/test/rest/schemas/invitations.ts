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

export default schemas;
