/* eslint-disable no-unused-expressions */

'use strict';

import chai from 'chai';
import chaiHttp from 'chai-http';
import chaiJson from 'chai-json-schema';
import forumThreadSchemas from './schemas/forumThreads';
import testData from './testData/forumThreads';
import testBuilder from './helper/testBuilder';
import baseObjectSchemas from './schemas/baseObjects';
import forumSchemas from './schemas/forums';
import tokens from './testData/tokens';
import app from '../../app';
import starterData from './testData/starter';

chai.should();
chai.use(chaiHttp);
chai.use(chaiJson);

describe('Forum threads', () => {
  const objectIdType = 'threadId';
  const objectType = 'thread';
  const objectsType = 'threads';
  const apiPath = '/api/forumThreads/';

  before('Create a forum on /api/forums POST', (done) => {
    const dataToSend = {
      data: {
        forum: { title: 'Forum threads' },
      },
    };

    chai
      .request(app)
      .post('/api/forums')
      .set('Authorization', tokens.adminUserOne)
      .send(dataToSend)
      .end((error, response) => {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.jsonSchema(baseObjectSchemas.returnData);
        response.body.data.forum.should.be.jsonSchema(forumSchemas.forum);

        const forumId = response.body.data.forum.objectId;
        testData.forumId = forumId;
        testData.create.apiCreatePath = `/api/forums/${forumId}/threads`;
        testData.update.apiCreatePath = `/api/forums/${forumId}/threads`;
        testData.remove.apiCreatePath = `/api/forums/${forumId}/threads`;

        done();
      });
  });

  before('Update permissions on /api/forums/:id/permissions', (done) => {
    const dataToSend = {
      data: {
        userIds: [
          starterData.basicUserOne.objectId,
          starterData.basicUserTwo.objectId,
        ],
      },
    };

    chai
      .request(app)
      .put(`/api/forums/${testData.forumId}/permissions`)
      .set('Authorization', tokens.adminUserOne)
      .send(dataToSend)
      .end((error, response) => {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.jsonSchema(baseObjectSchemas.returnData);
        response.body.data.forum.should.be.jsonSchema(forumSchemas.forum);

        done();
      });
  });

  testBuilder.createTestCreate({
    objectType,
    apiPath,
    objectIdType,
    testData: testData.create,
    schema: forumThreadSchemas.forumThread,
  });

  testBuilder.createTestUpdate({
    objectType,
    objectIdType,
    apiPath,
    testData: testData.update,
    schema: forumThreadSchemas.forumThread,
  });

  testBuilder.createTestGet({
    objectIdType,
    apiPath,
    objectType,
    objectsType,
    testData: testData.create,
    singleLiteSchema: forumThreadSchemas.forumThread,
    multiLiteSchema: forumThreadSchemas.forumThreads,
    singleFullSchema: forumThreadSchemas.fullForumThread,
    multiFullSchema: forumThreadSchemas.fullForumThreads,
  });

  testBuilder.createTestDelete({
    objectType,
    objectIdType,
    apiPath,
    testData: testData.remove,
  });
});
