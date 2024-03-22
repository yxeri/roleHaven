/* eslint-disable no-unused-expressions */

'use strict';

import chai from 'chai';
import chaiHttp from 'chai-http';
import chaiJson from 'chai-json-schema';
import roomSchemas from './schemas/rooms';
import testData from './testData/rooms';
import testBuilder from './helper/testBuilder';

chai.should();
chai.use(chaiHttp);
chai.use(chaiJson);

describe('Rooms', () => {
  const apiPath = '/api/rooms/';
  const objectIdType = 'roomId';
  const objectType = 'room';
  const objectsType = 'rooms';

  testBuilder.createTestCreate({
    objectType,
    apiPath,
    objectIdType,
    checkDuplicate: true,
    testData: testData.create,
    schema: roomSchemas.createdRoom,
  });

  testBuilder.createTestUpdate({
    objectType,
    objectIdType,
    apiPath,
    testData: testData.update,
    schema: roomSchemas.room,
  });

  testBuilder.createTestGet({
    objectIdType,
    apiPath,
    objectType,
    objectsType,
    testData: testData.create,
    singleLiteSchema: roomSchemas.room,
    multiLiteSchema: roomSchemas.rooms,
    singleFullSchema: roomSchemas.fullRoom,
    multiFullSchema: roomSchemas.fullRooms,
  });

  testBuilder.createTestDelete({
    objectType,
    objectIdType,
    apiPath,
    skipOwner: true,
    testData: testData.remove,
  });
});
