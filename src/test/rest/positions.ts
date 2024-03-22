/* eslint-disable no-unused-expressions */

'use strict';

import chai from 'chai';
import chaiHttp from 'chai-http';
import chaiJson from 'chai-json-schema';
import positionSchemas from './schemas/positions';
import testData from './testData/positions';
import testBuilder from './helper/testBuilder';

chai.should();
chai.use(chaiHttp);
chai.use(chaiJson);

describe('Positions', () => {
  const apiPath = '/api/positions/';
  const objectIdType = 'positionId';
  const objectType = 'position';
  const objectsType = 'positions';

  // TODO Test that connectedToUser sets position type to user and to device when removed.

  testBuilder.createTestCreate({
    objectType,
    apiPath,
    objectIdType,
    checkDuplicate: true,
    testData: testData.create,
    schema: positionSchemas.position,
  });

  testBuilder.createTestUpdate({
    objectType,
    objectIdType,
    apiPath,
    testData: testData.update,
    schema: positionSchemas.position,
  });

  testBuilder.createTestGet({
    objectIdType,
    apiPath,
    objectType,
    objectsType,
    testData: testData.create,
    singleLiteSchema: positionSchemas.position,
    multiLiteSchema: positionSchemas.positions,
    singleFullSchema: positionSchemas.fullPosition,
    multiFullSchema: positionSchemas.fullPositions,
  });

  testBuilder.createTestDelete({
    objectType,
    objectIdType,
    apiPath,
    testData: testData.remove,
  });
});
