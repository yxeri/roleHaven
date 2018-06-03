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
const forumPostSchemas = require('./schemas/forumPosts');
const testData = require('./testData/forumPosts');
const testBuilder = require('./helper/testBuilder');
const baseObjectSchemas = require('./schemas/baseObjects');
const forumThreadSchemas = require('./schemas/forumThreads');
const forumSchemas = require('./schemas/forums');
const tokens = require('./testData/tokens');
const app = require('../../app');

chai.should();
chai.use(chaiHttp);
chai.use(chaiJson);

describe('Forum posts', () => {
  const apiPath = '/api/forumPosts/';
  const objectIdType = 'postId';
  const objectType = 'post';
  const objectsType = 'posts';

  let forumId;

  before('Create a forum on /api/forums POST', (done) => {
    const dataToSend = {
      data: {
        forum: { title: 'Forum' },
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

        forumId = response.body.data.forum.objectId;

        done();
      });
  });

  before('Create a forum thread on /api/forumThreads POST', (done) => {
    const dataToSend = {
      data: {
        thread: {
          title: 'Forum posts',
          text: ['text'],
        },
      },
    };

    chai
      .request(app)
      .post(`/api/forums/${forumId}/threads`)
      .set('Authorization', tokens.adminUserOne)
      .send(dataToSend)
      .end((error, response) => {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.jsonSchema(baseObjectSchemas.returnData);
        response.body.data.thread.should.be.jsonSchema(forumThreadSchemas.forumThread);

        const threadId = response.body.data.thread.objectId;
        testData.create.apiCreatePath = `/api/forumThreads/${threadId}/posts`;
        testData.update.apiCreatePath = `/api/forumThreads/${threadId}/posts`;
        testData.remove.apiCreatePath = `/api/forumThreads/${threadId}/posts`;

        done();
      });
  });

  testBuilder.createTestCreate({
    objectType,
    apiPath,
    objectIdType,
    testData: testData.create,
    schema: forumPostSchemas.forumPost,
  });

  testBuilder.createTestUpdate({
    objectType,
    objectIdType,
    apiPath,
    testData: testData.update,
    schema: forumPostSchemas.forumPost,
  });

  testBuilder.createTestGet({
    objectIdType,
    apiPath,
    objectType,
    objectsType,
    testData: testData.create,
    singleLiteSchema: forumPostSchemas.forumPost,
    multiLiteSchema: forumPostSchemas.forumPosts,
    singleFullSchema: forumPostSchemas.fullForumPost,
    multiFullSchema: forumPostSchemas.fullForumPosts,
  });

  testBuilder.createTestDelete({
    objectType,
    objectIdType,
    apiPath,
    testData: testData.remove,
  });
});
