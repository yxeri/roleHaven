/* eslint-disable no-unused-expressions */

'use strict';

import chai from 'chai';
import chaiHttp from 'chai-http';
import chaiJson from 'chai-json-schema';
import testBuilder from './helper/testBuilder';
import eventSchemas from './schemas/triggerEvents';
import testData from './testData/triggerEvents';

chai.should();
chai.use(chaiHttp);
chai.use(chaiJson);

describe('TriggerEvents', () => {
  const apiPath = '/api/triggerEvents/';
  const objectIdType = 'eventId';
  const objectType = 'triggerEvent';
  const objectsType = 'triggerEvents';

  testBuilder.createTestCreate({
    objectType,
    apiPath,
    testData: testData.create,
    schema: eventSchemas.triggerEvent,

  });

  testBuilder.createTestUpdate({
    objectType,
    objectIdType,
    apiPath,
    testData: testData.update,
    schema: eventSchemas.triggerEvent,
  });

  testBuilder.createTestGet({
    objectIdType,
    apiPath,
    objectType,
    objectsType,
    testData: testData.create,
    singleLiteSchema: eventSchemas.triggerEvent,
    multiLiteSchema: eventSchemas.triggerEvents,
    singleFullSchema: eventSchemas.fullTriggerEvent,
    multiFullSchema: eventSchemas.fullTriggerEvents,
  });
});
