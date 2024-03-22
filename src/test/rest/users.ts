/* eslint-disable no-unused-expressions */

'use strict';

import chai from 'chai';
import chaiHttp from 'chai-http';
import chaiJson from 'chai-json-schema';
import userSchemas from './schemas/users';
import testData from './testData/users';
import testBuilder from './helper/testBuilder';

chai.should();
chai.use(chaiHttp);
chai.use(chaiJson);

describe('Users', () => {
  const apiPath = '/api/users/';
  const objectIdType = 'userId';
  const objectType = 'user';
  const objectsType = 'users';

  testBuilder.createTestCreate({
    objectType,
    apiPath,
    checkDuplicate: true,
    testData: testData.create,
    schema: userSchemas.liteUser,
  });

  testBuilder.createTestUpdate({
    objectType,
    objectIdType,
    apiPath,
    skipCreation: true,
    testData: testData.update,
    schema: userSchemas.fullUser,
  });

  testBuilder.createTestGet({
    objectIdType,
    apiPath,
    objectType,
    objectsType,
    skipCreation: true,
    testData: testData.create,
    singleLiteSchema: userSchemas.liteUser,
    multiLiteSchema: userSchemas.users,
    singleFullSchema: userSchemas.fullUser,
    multiFullSchema: userSchemas.fullUsers,
  });
});
