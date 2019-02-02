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
    triggeredBy: { type: 'array', items: { type: 'string' } },
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
    triggeredBy: { type: 'array', items: { type: 'string' } },
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

module.exports = schemas;
