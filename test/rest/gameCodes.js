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
const gameCodeSchemas = require('./schemas/gameCodes');
const testData = require('./testData/gameCodes');
const testBuilder = require('./helper/testBuilder');

chai.should();
chai.use(chaiHttp);
chai.use(chaiJson);

describe('GameCodes', () => {
  const apiPath = '/api/gameCodes/';
  const objectIdType = 'gameCodeId';
  const objectType = 'gameCode';
  const objectsType = 'gameCodes';

  testBuilder.createTestCreate({
    objectType,
    apiPath,
    objectIdType,
    testData: testData.create,
    schema: gameCodeSchemas.gameCode,
  });

  testBuilder.createTestUpdate({
    objectType,
    objectIdType,
    apiPath,
    testData: testData.update,
    schema: gameCodeSchemas.gameCode,
  });

  testBuilder.createTestGet({
    objectIdType,
    apiPath,
    objectType,
    objectsType,
    ignoreMultiFull: true,
    testData: testData.create,
    singleLiteSchema: gameCodeSchemas.gameCode,
    multiLiteSchema: gameCodeSchemas.gameCodes,
    singleFullSchema: gameCodeSchemas.fullGameCode,
    multiFullSchema: gameCodeSchemas.fullGameCodes,
  });

  testBuilder.createTestDelete({
    objectType,
    objectIdType,
    apiPath,
    testData: testData.remove,
  });
});
