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
const app = require('../../app');
const chaiJson = require('chai-json-schema');
const messageSchemas = require('./schemas/messages');
const errorSchemas = require('./schemas/errors');
const roomSchemas = require('./schemas/rooms');
const tokens = require('./testData/tokens');
const messageData = require('./testData/messages');

chai.should();
chai.use(chaiHttp);
chai.use(chaiJson);

describe('Messages', () => {
  describe('Send message', () => {
    before(`Create room ${messageData.roomToCreateAndSendMessagesTo.roomName}`, (done) => {
      chai
        .request(app)
        .post('/api/rooms')
        .set('Authorization', tokens.adminUser)
        .send({ data: { room: messageData.roomToCreateAndSendMessagesTo } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(roomSchemas.room);

          done();
        });
    });

    it('Should NOT send message with incorrect authorization on /messages POST', (done) => {
      chai
        .request(app)
        .post('/api/messages')
        .set('Authorization', tokens.incorrectJwt)
        .send({ data: { message: messageData.messageToSend } })
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should NOT send message to a non-existent room on /messages POST', (done) => {
      chai
        .request(app)
        .post('/api/messages')
        .set('Authorization', tokens.adminUser)
        .send({ data: { message: messageData.roomThatDoesNotExist } })
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should NOT send message to an unfollowed room on /messages POST', (done) => {
      chai
        .request(app)
        .post('/api/messages')
        .set('Authorization', tokens.basicUser)
        .send({ data: { message: messageData.messageToSend } })
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should NOT send message that is too long on /messages POST', (done) => {
      chai
        .request(app)
        .post('/api/messages')
        .set('Authorization', tokens.adminUser)
        .send({ data: { message: messageData.tooLongMessage } })
        .end((error, response) => {
          response.should.have.status(400);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should send message on /messages POST', (done) => {
      chai
        .request(app)
        .post('/api/messages')
        .set('Authorization', tokens.adminUser)
        .send({ data: { message: messageData.messageToSend } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(messageSchemas.messages);

          done();
        });
    });
  });
});
