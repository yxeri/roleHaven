/*
 Copyright 2019 Carmilla Mina Jankovic

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

/* eslint-disable no-unused-expressions */

'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const chaiJson = require('chai-json-schema');
const eventSchemas = require('./schemas/triggerEvents');
const testData = require('./testData/triggerEvents');
const testBuilder = require('./helper/testBuilder');

chai.should();
chai.use(chaiHttp);
chai.use(chaiJson);

describe('TriggerEvents', () => {
  const apiPath = '/api/triggerEvents/';
  const objectIdType = 'eventId';
  const objectType = 'triggerEvent';
  const objectsType = 'triggerEvents';

  testBuilder.createTestCreate({
    objectType,
    apiPath,
    testData: testData.create,
    schema: eventSchemas.triggerEvent,

  });

  testBuilder.createTestUpdate({
    objectType,
    objectIdType,
    apiPath,
    testData: testData.update,
    schema: eventSchemas.triggerEvent,
  });

  testBuilder.createTestGet({
    objectIdType,
    apiPath,
    objectType,
    objectsType,
    testData: testData.create,
    singleLiteSchema: eventSchemas.triggerEvent,
    multiLiteSchema: eventSchemas.triggerEvents,
    singleFullSchema: eventSchemas.fullTriggerEvent,
    multiFullSchema: eventSchemas.fullTriggerEvents,
  });
});
