/*
 Copyright 2017 Aleksandar Jankovic

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
const messageSchemas = require('./schemas/messages');
const roomSchemas = require('./schemas/rooms');
const testData = require('./testData/messages');
const testBuilder = require('./helper/testBuilder');
const tokens = require('./testData/tokens');
const baseObjectSchemas = require('./schemas/baseObjects');
const app = require('../../app');

chai.should();
chai.use(chaiHttp);
chai.use(chaiJson);

describe('Messages', () => {
  const apiPath = '/api/messages/';
  const objectIdType = 'messageId';
  const objectType = 'message';
  const objectsType = 'messages';

  before('Create a room on /api/rooms POST', (done) => {
    const dataToSend = {
      data: {
        room: { roomName: 'roomOne' },
      },
    };

    chai
      .request(app)
      .post('/api/rooms')
      .set('Authorization', tokens.basicUserOne)
      .send(dataToSend)
      .end((error, response) => {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.jsonSchema(baseObjectSchemas.returnData);
        response.body.data.room.should.be.jsonSchema(roomSchemas.room);

        const roomId = response.body.data.room.objectId;

        testData.create.first.roomId = roomId;
        testData.create.second.roomId = roomId;
        testData.update.toUpdate.roomId = roomId;
        testData.remove.toRemove.roomId = roomId;
        testData.remove.secondToRemove.roomId = roomId;

        done();
      });
  });

  testBuilder.createTestCreate({
    objectType,
    apiPath,
    objectIdType,
    testData: testData.create,
    schema: messageSchemas.message,
  });

  testBuilder.createTestUpdate({
    objectType,
    objectIdType,
    apiPath,
    testData: testData.update,
    schema: messageSchemas.message,
  });

  testBuilder.createTestGet({
    objectIdType,
    objectType,
    objectsType,
    apiPath,
    ignoreMultiFull: true,
    testData: testData.create,
    singleLiteSchema: messageSchemas.message,
    multiLiteSchema: messageSchemas.messages,
    singleFullSchema: messageSchemas.fullMessage,
    multiFullSchema: messageSchemas.fullMessages,
  });

  testBuilder.createTestDelete({
    objectType,
    objectIdType,
    apiPath,
    testData: testData.remove,
  });
});
