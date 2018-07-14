/*
 Copyright 2017 Carmilla Mina Jankovic

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
const deviceSchemas = require('./schemas/devices');
const testData = require('./testData/devices');
const testBuilder = require('./helper/testBuilder');

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
