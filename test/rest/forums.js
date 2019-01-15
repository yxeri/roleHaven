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
const testData = require('./testData/forums');
const testBuilder = require('./helper/testBuilder');
const forumSchemas = require('./schemas/forums');

chai.should();
chai.use(chaiHttp);
chai.use(chaiJson);

describe('Forums', () => {
  const apiPath = '/api/forums/';
  const objectIdType = 'forumId';
  const objectType = 'forum';
  const objectsType = 'forums';

  testBuilder.createTestCreate({
    objectType,
    apiPath,
    objectIdType,
    checkDuplicate: true,
    createByAdmin: true,
    testData: testData.create,
    schema: forumSchemas.forum,
  });

  testBuilder.createTestUpdate({
    objectType,
    objectIdType,
    apiPath,
    createByAdmin: true,
    testData: testData.update,
    schema: forumSchemas.forum,
  });

  testBuilder.createTestGet({
    objectIdType,
    apiPath,
    objectType,
    objectsType,
    createByAdmin: true,
    testData: testData.create,
    singleLiteSchema: forumSchemas.forum,
    multiLiteSchema: forumSchemas.forums,
    singleFullSchema: forumSchemas.fullForum,
    multiFullSchema: forumSchemas.fullForums,
  });

  testBuilder.createTestDelete({
    objectType,
    objectIdType,
    apiPath,
    createByAdmin: true,
    testData: testData.remove,
  });
});
