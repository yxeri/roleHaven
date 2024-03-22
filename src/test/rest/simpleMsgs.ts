/* eslint-disable no-unused-expressions */

'use strict';

import chai from 'chai';
import chaiHttp from 'chai-http';
import chaiJson from 'chai-json-schema';
import simpleMsgSchemas from './schemas/simpleMsgs';
import testData from './testData/simpleMsgs';
import testBuilder from './helper/testBuilder';

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
