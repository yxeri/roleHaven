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
const forumThreadSchemas = require('./schemas/forumThreads');
const testData = require('./testData/forumThreads');
const testBuilder = require('./helper/testBuilder');
const baseObjectSchemas = require('./schemas/baseObjects');
const forumSchemas = require('./schemas/forums');
const tokens = require('./testData/tokens');
const app = require('../../app');
const starterData = require('./testData/starter');

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
