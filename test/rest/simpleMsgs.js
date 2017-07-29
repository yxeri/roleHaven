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
const simpleMsgSchemas = require('./schemas/simpleMsgs');
const errorSchemas = require('./schemas/errors');
const simpleMsgData = require('./testData/simpleMsgs');
const tokens = require('./testData/tokens');

chai.should();
chai.use(chaiHttp);
chai.use(chaiJson);

describe('Simple messages', () => {
  describe('Send simple message', () => {
    it('Should NOT send simple message with incorrect authorization on /api/simpleMsgs POST', (done) => {
      chai
        .request(app)
        .post('/api/simpleMsgs')
        .set('Authorization', tokens.incorrectJwt)
        .send({ data: { simpleMsg: simpleMsgData.simpleMsgToSend } })
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should NOT send simple message that is too long on /api/simpleMsgs POST', (done) => {
      chai
        .request(app)
        .post('/api/simpleMsgs')
        .set('Authorization', tokens.adminUser)
        .send({ data: { simpleMsg: simpleMsgData.tooLongMsg } })
        .end((error, response) => {
          response.should.have.status(400);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should send simple message on /api/simpleMsgs POST', (done) => {
      chai
        .request(app)
        .post('/api/simpleMsgs')
        .set('Authorization', tokens.adminUser)
        .send({ data: { simpleMsg: simpleMsgData.simpleMsgToSend } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(simpleMsgSchemas.simpleMsg);

          done();
        });
    });
  });

  describe('Get simple messages', () => {
    it('Should NOT get simple message with incorrect authorization on /api/simpleMsgs GET', (done) => {
      chai
        .request(app)
        .get('/api/simpleMsgs')
        .set('Authorization', tokens.incorrectJwt)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should get simple messages on /api/simpleMsgs GET', (done) => {
      chai
        .request(app)
        .get('/api/simpleMsgs')
        .set('Authorization', tokens.adminUser)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(simpleMsgSchemas.simpleMsgs);

          done();
        });
    });
  });
});
