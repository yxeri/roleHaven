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
const errorSchemas = require('./schemas/errors');
const userSchemas = require('./schemas/users');
const positionSchemas = require('./schemas/positions');
const tokens = require('./testData/tokens');
const positionData = require('./testData/positions');
const authenticateSchemas = require('./schemas/authentications');

chai.should();
chai.use(chaiHttp);
chai.use(chaiJson);

describe('Positions', () => {
  const positionTokens = {
    basic: '',
    admin: '',
  };

  before('Create admin user on /api/users POST', (done) => {
    chai
      .request(app)
      .post('/api/users')
      .set('Authorization', tokens.adminUser)
      .send({ data: { user: positionData.adminUserToCreateAndGetPositionFrom } })
      .end((error, response) => {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.jsonSchema(userSchemas.user);

        done();
      });
  });

  before('Create basic user on /api/users POST', (done) => {
    chai
      .request(app)
      .post('/api/users')
      .set('Authorization', tokens.adminUser)
      .send({ data: { user: positionData.basicUserToCreateAndGetPositionFrom } })
      .end((error, response) => {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.jsonSchema(userSchemas.user);

        done();
      });
  });

  before('Authenticate admin user on /api/authenticate POST', (done) => {
    chai
      .request(app)
      .post('/api/authenticate')
      .send({ data: { user: positionData.adminUserToCreateAndGetPositionFrom } })
      .end((error, response) => {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.jsonSchema(authenticateSchemas.authenticate);

        positionTokens.admin = response.body.data.token;

        done();
      });
  });

  before('Authenticate basic user on /api/authenticate POST', (done) => {
    chai
      .request(app)
      .post('/api/authenticate')
      .send({ data: { user: positionData.basicUserToCreateAndGetPositionFrom } })
      .end((error, response) => {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.jsonSchema(authenticateSchemas.authenticate);

        positionTokens.basic = response.body.data.token;

        done();
      });
  });

  describe('Update user position', () => {
    it('Should NOT update user position with incorrect authorization on /api/positions/users POST', (done) => {
      chai
        .request(app)
        .post('/api/positions/users')
        .set('Authorization', tokens.incorrectJwt)
        .send({ data: { position: positionData.userPositionToUpdateWith } })
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should update basic user position on /api/positions/users POST', (done) => {
      chai
        .request(app)
        .post('/api/positions/users')
        .set('Authorization', positionTokens.basic)
        .send({ data: { position: positionData.userPositionToUpdateWith } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(positionSchemas.position);

          done();
        });
    });

    it('Should update admin user position on /api/positions/users POST', (done) => {
      chai
        .request(app)
        .post('/api/positions/users')
        .set('Authorization', positionTokens.admin)
        .send({ data: { position: positionData.otherUserPositionToUpdateWith } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(positionSchemas.position);

          done();
        });
    });
  });

  describe('Get user position', () => {
    it('Should NOT get position for non-existent user on /api/positions/users/:id', (done) => {
      chai
        .request(app)
        .get(`/api/positions/users/${positionData.userThatDoesNotExist}`)
        .set('Authorization', tokens.adminUser)
        .end((error, response) => {
          response.should.have.status(404);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should get user position on /api/positions/users/:id', (done) => {
      chai
        .request(app)
        .get(`/api/positions/users/${positionData.basicUserToCreateAndGetPositionFrom.userName}`)
        .set('Authorization', positionTokens.admin)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(positionSchemas.position);

          done();
        });
    });

    it('Should NOT get user position from user with higher visibility than user\'s access level on /api/positions/users/:id', (done) => {
      chai
        .request(app)
        .get(`/api/positions/users/${positionData.adminUserToCreateAndGetPositionFrom.userName}`)
        .set('Authorization', positionTokens.basic)
        .end((error, response) => {
          response.should.have.status(404);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });
  });

  describe('List user positions', () => {
    it('Should NOT list user positions with incorrect authorization on /api/positions/users', (done) => {
      chai
        .request(app)
        .get('/api/positions/users')
        .set('Authorization', tokens.incorrectJwt)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should list user positions on /api/positions/users', (done) => {
      chai
        .request(app)
        .get('/api/positions/users')
        .set('Authorization', positionTokens.basic)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(positionSchemas.positions);

          done();
        });
    });
  });
});
