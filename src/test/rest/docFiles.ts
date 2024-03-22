/* eslint-disable no-unused-expressions */

'use strict';

import chai from 'chai';
import chaiHttp from 'chai-http';
import chaiJson from 'chai-json-schema';
import docFileSchemas from './schemas/docFiles';
import testData from './testData/docFiles';
import testBuilder from './helper/testBuilder';

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
