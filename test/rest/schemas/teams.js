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

module.exports = schemas;
