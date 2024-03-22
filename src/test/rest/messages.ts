/* eslint-disable no-unused-expressions */

'use strict';

import chai from 'chai';
import chaiHttp from 'chai-http';
import chaiJson from 'chai-json-schema';
import messageSchemas from './schemas/messages';
import roomSchemas from './schemas/rooms';
import testData from './testData/messages';
import testBuilder from './helper/testBuilder';
import tokens from './testData/tokens';
import baseObjectSchemas from './schemas/baseObjects';
import app from '../../app';
import starterData from './testData/starter';

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

        console.log('room created for messages', response.body.data.room);

        done();
      });
  });

  before('Update room permissions on /api/rooms/:id/permissions', (done) => {
    const dataToSend = {
      data: {
        userIds: [starterData.basicUserTwo.objectId],
      },
    };

    chai
      .request(app)
      .put(`/api/rooms/${testData.create.first.roomId}/permissions`)
      .set('Authorization', tokens.basicUserOne)
      .send(dataToSend)
      .end((error, response) => {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.jsonSchema(baseObjectSchemas.returnData);
        response.body.data.room.should.be.jsonSchema(roomSchemas.room);

        console.log('room permissions updated for messages', response.body.data.room);

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
