/* eslint-disable no-unused-expressions */

'use strict';

import chai from 'chai';
import chaiHttp from 'chai-http';
import chaiJson from 'chai-json-schema';
import forumPostSchemas from './schemas/forumPosts';
import testData from './testData/forumPosts';
import testBuilder from './helper/testBuilder';
import baseObjectSchemas from './schemas/baseObjects';
import forumThreadSchemas from './schemas/forumThreads';
import forumSchemas from './schemas/forums';
import tokens from './testData/tokens';
import app from '../../app';
import starterData from './testData/starter';

chai.should();
chai.use(chaiHttp);
chai.use(chaiJson);

describe('Forum posts', () => {
  const apiPath = '/api/forumPosts/';
  const objectIdType = 'postId';
  const objectType = 'post';
  const objectsType = 'posts';

  let forumId;
  let threadId;

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
      .put(`/api/forums/${forumId}/permissions`)
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

        threadId = response.body.data.thread.objectId;
        testData.update.toUpdate.threadId = threadId;
        testData.create.apiCreatePath = `/api/forumThreads/${threadId}/posts`;
        testData.update.apiCreatePath = `/api/forumThreads/${threadId}/posts`;
        testData.remove.apiCreatePath = `/api/forumThreads/${threadId}/posts`;

        done();
      });
  });

  before('Update permissions on /api/forumThreads/:id/permissions', (done) => {
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
      .put(`/api/forumThreads/${threadId}/permissions`)
      .set('Authorization', tokens.adminUserOne)
      .send(dataToSend)
      .end((error, response) => {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.jsonSchema(baseObjectSchemas.returnData);
        response.body.data.thread.should.be.jsonSchema(forumThreadSchemas.forumThread);

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
