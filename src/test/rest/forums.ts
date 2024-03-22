/* eslint-disable no-unused-expressions */

'use strict';

import chai from 'chai';
import chaiHttp from 'chai-http';
import chaiJson from 'chai-json-schema';
import testData from './testData/forums';
import testBuilder from './helper/testBuilder';
import forumSchemas from './schemas/forums';

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
