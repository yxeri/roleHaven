/* eslint-disable no-unused-expressions */

'use strict';

import chai from 'chai';
import chaiHttp from 'chai-http';
import chaiJson from 'chai-json-schema';
import aliasSchemas from './schemas/aliases';
import testData from './testData/aliases';
import testBuilder from './helper/testBuilder';

chai.should();
chai.use(chaiHttp);
chai.use(chaiJson);

describe('Aliases', () => {
  const apiPath = '/api/aliases/';
  const objectIdType = 'aliasId';
  const objectType = 'alias';
  const objectsType = 'aliases';

  testBuilder.createTestCreate({
    objectType,
    apiPath,
    checkDuplicate: true,
    testData: testData.create,
    schema: aliasSchemas.alias,
  });

  testBuilder.createTestUpdate({
    objectType,
    objectIdType,
    apiPath,
    testData: testData.update,
    schema: aliasSchemas.alias,
  });

  testBuilder.createTestGet({
    objectIdType,
    apiPath,
    objectType,
    objectsType,
    testData: testData.create,
    singleLiteSchema: aliasSchemas.alias,
    multiLiteSchema: aliasSchemas.aliases,
    singleFullSchema: aliasSchemas.fullAlias,
    multiFullSchema: aliasSchemas.fullAliases,
  });
});
