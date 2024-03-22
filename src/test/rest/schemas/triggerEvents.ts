'use strict';

const tools = require('../helper/tools');

const schemas = {};

schemas.triggerEvent = tools.buildLiteSchema({
  type: 'object',
  required: [
    'content',
    'eventType',
    'changeType',
    'triggerType',
  ],
  properties: {
    content: { type: 'object' },
    eventType: { type: 'string' },
    startTime: { type: 'date' },
    terminationTime: { type: 'date' },
    coordinates: { type: 'object' },
    iterations: { type: 'number' },
    isRecurring: { type: 'boolean' },
    isActive: { type: 'boolean' },
    changeType: { type: 'string' },
    triggerType: { type: 'string' },
    singleUse: { type: 'boolean' },
    duration: { type: 'number' },
    triggeredBy: {
      type: 'array',
      items: { type: 'string' },
    },
    shouldTargetSingle: { type: 'boolean' },
  },
});

schemas.fullTriggerEvent = tools.buildFullSchema({
  type: 'object',
  required: [
    'content',
    'eventType',
    'changeType',
    'triggerType',
  ],
  properties: {
    content: { type: 'object' },
    eventType: { type: 'string' },
    startTime: { type: 'date' },
    terminationTime: { type: 'date' },
    coordinates: { type: 'object' },
    iterations: { type: 'number' },
    isRecurring: { type: 'boolean' },
    isActive: { type: 'boolean' },
    changeType: { type: 'string' },
    triggerType: { type: 'string' },
    singleUse: { type: 'boolean' },
    duration: { type: 'number' },
    triggeredBy: {
      type: 'array',
      items: { type: 'string' },
    },
    shouldTargetSingle: { type: 'boolean' },
  },
});

schemas.triggerEvents = {
  type: 'array',
  items: schemas.triggerEvent,
};

schemas.fullTriggerEvents = {
  type: 'array',
  items: schemas.fullTriggerEvent,
};

export default schemas;
