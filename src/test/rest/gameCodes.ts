/* eslint-disable no-unused-expressions */

'use strict';

import chai from 'chai';
import chaiHttp from 'chai-http';
import chaiJson from 'chai-json-schema';
import gameCodeSchemas from './schemas/gameCodes';
import testData from './testData/gameCodes';
import testBuilder from './helper/testBuilder';

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
    checkDuplicate: true,
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
