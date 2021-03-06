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

/* eslint-disable no-unused-expressions */

'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const chaiJson = require('chai-json-schema');
const simpleMsgSchemas = require('./schemas/simpleMsgs');
const testData = require('./testData/simpleMsgs');
const testBuilder = require('./helper/testBuilder');

chai.should();
chai.use(chaiHttp);
chai.use(chaiJson);

describe('SimpleMsgs', () => {
  const apiPath = '/api/simpleMsgs/';
  const objectIdType = 'simpleMsgId';
  const objectType = 'simpleMsg';
  const objectsType = 'simpleMsgs';

  testBuilder.createTestCreate({
    objectType,
    apiPath,
    objectIdType,
    testData: testData.create,
    schema: simpleMsgSchemas.simpleMsg,
  });

  testBuilder.createTestUpdate({
    objectType,
    objectIdType,
    apiPath,
    testData: testData.update,
    schema: simpleMsgSchemas.simpleMsg,
  });

  testBuilder.createTestGet({
    objectIdType,
    apiPath,
    objectType,
    objectsType,
    testData: testData.create,
    singleLiteSchema: simpleMsgSchemas.simpleMsg,
    multiLiteSchema: simpleMsgSchemas.simpleMsgs,
    singleFullSchema: simpleMsgSchemas.fullSimpleMsg,
    multiFullSchema: simpleMsgSchemas.fullSimpleMsgs,
  });

  testBuilder.createTestDelete({
    objectType,
    objectIdType,
    apiPath,
    testData: testData.remove,
  });
});
