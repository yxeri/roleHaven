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

const lanternRoundBase = {
  type: 'object',
  required: ['startTime', 'endTime', 'roundId'],
  properties: {
    endTime: { type: 'string' },
    startTime: { type: 'string' },
    roundId: { type: 'number' },
  },
};

schemas.lanternRound = {
  type: 'object',
  required: ['data'],
  properties: {
    data: {
      type: 'object',
      required: ['round'],
      properties: {
        station: lanternRoundBase,
      },
    },
  },
};

schemas.lanternRounds = {
  type: 'object',
  required: ['data'],
  properties: {
    data: {
      type: 'object',
      required: ['rounds'],
      properties: {
        stations: {
          type: 'array',
          items: lanternRoundBase,
        },
      },
    },
  },
};

module.exports = schemas;
