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

/* eslint-disable no-unused-expressions */

'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const chaiJson = require('chai-json-schema');
const docFileSchemas = require('./schemas/docFiles');
const testData = require('./testData/docFiles');
const testBuilder = require('./helper/testBuilder');

chai.should();
chai.use(chaiHttp);
chai.use(chaiJson);

describe('DocFiles', () => {
  const apiPath = '/api/docFiles/';
  const objectIdType = 'docFileId';
  const objectType = 'docFile';
  const objectsType = 'docFiles';

  testBuilder.createTestCreate({
    objectType,
    apiPath,
    objectIdType,
    checkDuplicate: true,
    testData: testData.create,
    schema: docFileSchemas.docFile,
  });

  testBuilder.createTestUpdate({
    objectType,
    objectIdType,
    apiPath,
    testData: testData.update,
    schema: docFileSchemas.docFile,
  });

  testBuilder.createTestGet({
    objectIdType,
    apiPath,
    objectType,
    objectsType,
    testData: testData.create,
    singleLiteSchema: docFileSchemas.liteDocFile,
    multiLiteSchema: docFileSchemas.liteDocFiles,
    singleFullSchema: docFileSchemas.fullDocFile,
    multiFullSchema: docFileSchemas.fullDocFiles,
  });

  testBuilder.createTestDelete({
    objectType,
    objectIdType,
    apiPath,
    testData: testData.remove,
  });
});
