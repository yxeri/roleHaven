'use strict';

import tools from '../helper/tools';
import baseObjects from './baseObjects';

const schemas = {};

schemas.position = tools.buildLiteSchema({
  type: 'object',
  required: [
    'positionName',
    'positionType',
    'radius',
  ],
  properties: {
    deviceId: { type: 'string' },
    coordinatesHistory: {
      type: 'array',
      items: baseObjects.coordinates,
    },
    positionName: { type: 'string' },
    positionType: { type: 'string' },
    radius: { type: 'number' },
    isStationary: { type: 'boolean' },
    description: {
      type: 'array',
      items: { type: 'string' },
    },
  },
});

schemas.fullPosition = tools.buildFullSchema({
  type: 'object',
  required: [
    'positionName',
    'positionType',
    'radius',
  ],
  properties: {
    deviceId: { type: 'string' },
    coordinatesHistory: {
      type: 'array',
      items: baseObjects.coordinates,
    },
    positionName: { type: 'string' },
    positionType: { type: 'string' },
    radius: { type: 'number' },
    isStationary: { type: 'boolean' },
    description: {
      type: 'array',
      items: { type: 'string' },
    },
  },
});

schemas.positions = {
  type: 'array',
  items: schemas.position,
};

schemas.fullPositions = {
  type: 'array',
  items: schemas.fullPosition,
};

export default schemas;
