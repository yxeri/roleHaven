'use strict';

const tools = require('../helper/tools');

const schemas = {};

schemas.liteUser = tools.buildLiteSchema({
  type: 'object',
  required: [
    'username',
  ],
  properties: {
    username: { type: 'string' },
    usernameLowerCase: { type: 'string' },
    isVerified: { type: 'boolean' },
    isBanned: { type: 'boolean' },
    isOnline: { type: 'boolean' },
  },
  not: {
    required: [
      'password',
      'mailAddress',
      'hasFullAccess',
      'socketId',
      'isLootable',
      'defaultRoomId',
      'followingRooms',
      'registerDevice',
    ],
  },
});

schemas.fullUser = tools.buildFullSchema({
  type: 'object',
  required: [
    'username',
    'isVerified',
    'isBanned',
    'isOnline',
    'hasFullAccess',
    'isLootable',
    'defaultRoomId',
    'followingRooms',
    'registerDevice',
  ],
  properties: {
    password: { type: 'boolean' },
    socketId: { type: 'string' },
    username: { type: 'string' },
    usernameLowerCase: { type: 'string' },
    isVerified: { type: 'boolean' },
    isBanned: { type: 'boolean' },
    isOnline: { type: 'boolean' },
    hasFullAccess: { type: 'boolean' },
    isLootable: { type: 'boolean' },
    defaultRoomId: { type: 'string' },
    registerDevice: { type: 'string' },
    followingRooms: {
      type: 'array',
      items: { type: 'string' },
    },
  },
});

schemas.users = {
  type: 'array',
  items: schemas.liteUser,
};

schemas.fullUsers = {
  type: 'array',
  items: schemas.fullUser,
};

export default schemas;
