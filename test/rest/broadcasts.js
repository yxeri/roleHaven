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
const broadcastSchemas = require('./schemas/broadcasts');
const errorSchemas = require('./schemas/errors');
const testData = require('./helper/testData');
const tokens = require('./0- starter').tokens;

chai.should();
chai.use(chaiHttp);
chai.use(chaiJson);

describe('Send broadcast', () => {
  it('Should NOT send broadcast message with incorrect authorization on /broadcasts POST', (done) => {
    chai
      .request(app)
      .post('/api/broadcasts')
      .set('Authorization', testData.incorrectJwt)
      .send({ data: { message: testData.broadcast } })
      .end((error, response) => {
        response.should.have.status(401);
        response.should.be.json;
        response.body.should.be.jsonSchema(errorSchemas.error);

        done();
      });
  });

  it('Should NOT send broadcast message that is too long on /broadcasts POST', (done) => {
    chai
      .request(app)
      .post('/api/broadcasts')
      .set('Authorization', tokens.admin)
      .send({ data: { message: testData.broadcastTooLong } })
      .end((error, response) => {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.jsonSchema(broadcastSchemas.broadcast);

        done();
      });
  });

  it('Should send broadcast message on /broadcasts POST', (done) => {
    chai
      .request(app)
      .post('/api/broadcasts')
      .set('Authorization', tokens.admin)
      .send({ data: { message: testData.broadcast } })
      .end((error, response) => {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.jsonSchema(broadcastSchemas.broadcast);

        done();
      });
  });
});
