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
const authenticateSchemas = require('./schemas/authentications');
const errorSchemas = require('./schemas/errors');
const authenticateData = require('./testData/authentications');
const tokens = require('./testData/tokens');
const userSchemas = require('./schemas/users');

chai.should();

chai.use(chaiHttp);
chai.use(chaiJson);

describe('Authenticate', () => {
  before('Create admin user on /users POST', (done) => {
    chai
      .request(app)
      .post('/api/users')
      .set('Authorization', tokens.adminUser)
      .send({ data: { user: authenticateData.adminUserToAuth } })
      .end((error, response) => {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.jsonSchema(userSchemas.user);
        done();
      });
  });

  it('Should get jwt token on /authenticate POST', (done) => {
    chai
      .request(app)
      .post('/api/authenticate')
      .send({ data: { user: authenticateData.adminUserToAuth } })
      .end((error, response) => {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.jsonSchema(authenticateSchemas.authenticate);
        done();
      });
  });

  it('Should NOT get jwt token with unverified user on /authenticate POST', (done) => {
    chai
      .request(app)
      .post('/api/authenticate')
      .send({ data: { user: authenticateData.unverifiedUserToAuth } })
      .end((error, response) => {
        response.should.have.status(401);
        response.should.be.json;
        response.body.should.be.jsonSchema(errorSchemas.error);

        done();
      });
  });

  it('Should NOT get jwt token with banned user on /authenticate POST', (done) => {
    chai
      .request(app)
      .post('/api/authenticate')
      .send({ data: { user: authenticateData.bannedUserToAuth } })
      .end((error, response) => {
        response.should.have.status(401);
        response.should.be.json;
        response.body.should.be.jsonSchema(errorSchemas.error);

        done();
      });
  });

  it('Should NOT get jwt token with non-existent user on /authenticate POST', (done) => {
    chai
      .request(app)
      .post('/api/authenticate')
      .send({ data: { user: authenticateData.userThatDoesNotExist } })
      .end((error, response) => {
        response.should.have.status(401);
        response.should.be.json;
        response.body.should.be.jsonSchema(errorSchemas.error);

        done();
      });
  });
});
