'use strict';

const tools = require('../helper/tools');

const schemas = {};

schemas.createdRoom = tools.buildLiteSchema({
  type: 'object',
  required: [
    'roomName',
  ],
  properties: {
    roomName: { type: 'string' },
    isAnonymous: { type: 'boolean' },
    isWhisper: { type: 'boolean' },
    nameIsLocked: { type: 'boolean' },
    isSystemRoom: { type: 'boolean' },
    password: { type: 'boolean' },
  },
});

schemas.room = tools.buildLiteSchema({
  type: 'object',
  required: [
    'roomName',
  ],
  properties: {
    roomName: { type: 'string' },
    isAnonymous: { type: 'boolean' },
    isWhisper: { type: 'boolean' },
    nameIsLocked: { type: 'boolean' },
    isSystemRoom: { type: 'boolean' },
    participantIds: {
      type: 'array',
      items: { type: 'string ' },
    },
    password: { type: 'boolean' },
  },
});

schemas.fullRoom = tools.buildFullSchema({
  type: 'object',
  required: [
    'roomName',
  ],
  properties: {
    roomName: { type: 'string' },
    isAnonymous: { type: 'boolean' },
    isWhisper: { type: 'boolean' },
    nameIsLocked: { type: 'boolean' },
    isSystemRoom: { type: 'boolean' },
    participantIds: {
      type: 'array',
      items: { type: 'string' },
    },
    password: { type: 'boolean' },
  },
});

schemas.rooms = {
  type: 'array',
  items: schemas.room,
};

schemas.followedRooms = {
  type: 'array',
  items: schemas.followedRoom,
};

schemas.fullRooms = {
  type: 'array',
  items: schemas.fullRoom,
};

export default schemas;
