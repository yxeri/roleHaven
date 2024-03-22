/* eslint-disable no-unused-expressions */

'use strict';

import chai from 'chai';
import chaiHttp from 'chai-http';
import chaiJson from 'chai-json-schema';
import deviceSchemas from './schemas/devices';
import testData from './testData/devices';
import testBuilder from './helper/testBuilder';

chai.should();
chai.use(chaiHttp);
chai.use(chaiJson);

describe('Devices', () => {
  const apiPath = '/api/devices/';
  const objectIdType = 'deviceId';
  const objectType = 'device';
  const objectsType = 'devices';

  testBuilder.createTestCreate({
    objectType,
    objectIdType,
    apiPath,
    checkDuplicate: true,
    testData: testData.create,
    schema: deviceSchemas.device,
  });

  testBuilder.createTestUpdate({
    objectType,
    objectIdType,
    apiPath,
    testData: testData.update,
    schema: deviceSchemas.device,
  });

  testBuilder.createTestGet({
    objectIdType,
    apiPath,
    objectType,
    objectsType,
    testData: testData.create,
    singleLiteSchema: deviceSchemas.device,
    multiLiteSchema: deviceSchemas.devices,
    singleFullSchema: deviceSchemas.fullDevice,
    multiFullSchema: deviceSchemas.fullDevices,
  });

  testBuilder.createTestDelete({
    objectType,
    objectIdType,
    apiPath,
    testData: testData.remove,
  });
});
