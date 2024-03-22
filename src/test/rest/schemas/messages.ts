'use strict';

const tools = require('../helper/tools');
const baseObjects = require('./baseObjects');
const { dbConfig } = require('../../../config/defaults/config');

const schemas = {};

schemas.message = tools.buildLiteSchema({
  type: 'object',
  required: [
    'messageType',
    'text',
    'roomId',
  ],
  properties: {
    roomId: { type: 'string' },
    messageType: {
      type: 'string',
      enum: Object.values(dbConfig.MessageTypes),
    },
    coordinates: baseObjects.coordinates,
    intro: {
      type: 'array',
      items: { type: 'string' },
    },
    extro: {
      type: 'array',
      items: { type: 'string' },
    },
    image: {
      imageName: { type: 'string' },
      fileName: { type: 'string' },
      width: { type: 'number' },
      height: { type: 'number' },
    },
  },
});

schemas.fullMessage = tools.buildFullSchema({
  type: 'object',
  required: [
    'messageType',
    'text',
    'roomId',
  ],
  properties: {
    roomId: { type: 'string' },
    messageType: {
      type: 'string',
      enum: Object.values(dbConfig.MessageTypes),
    },
    coordinates: baseObjects.coordinates,
    intro: {
      type: 'array',
      items: { type: 'string' },
    },
    extro: {
      type: 'array',
      items: { type: 'string' },
    },
    image: {
      imageName: { type: 'string' },
      fileName: { type: 'string' },
      width: { type: 'number' },
      height: { type: 'number' },
    },
  },
});

schemas.messages = {
  type: 'array',
  items: schemas.message,
};

schemas.fullMessages = {
  type: 'array',
  items: schemas.fullMessage,
};

export default schemas;
