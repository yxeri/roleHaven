'use strict';

const tools = require('../helper/tools');

const schemas = {};

schemas.team = tools.buildLiteSchema({
  type: 'object',
  required: [
    'teamName',
    'shortName',
  ],
  properties: {
    teamName: { type: 'string' },
    shortName: { type: 'string' },
    isVerified: { type: 'boolean' },
    isProtected: { type: 'boolean' },
  },
});

schemas.fullTeam = tools.buildFullSchema({
  type: 'object',
  required: [
    'teamName',
    'shortName',
  ],
  properties: {
    teamName: { type: 'string' },
    shortName: { type: 'string' },
    isVerified: { type: 'boolean' },
    isProtected: { type: 'boolean' },
  },
});

schemas.teams = {
  type: 'array',
  items: schemas.team,
};

schemas.fullTeams = {
  type: 'array',
  items: schemas.fullTeam,
};

export default schemas;
