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
const userSchemas = require('./schemas/users');
const authenticateSchemas = require('./schemas/authentications');
const successSchemas = require('./schemas/successes');
const errorSchemas = require('./schemas/errors');
const tokens = require('./testData/tokens');
const userData = require('./testData/users');

chai.should();

chai.use(chaiHttp);
chai.use(chaiJson);

describe('Users', () => {
  const usersToken = {
    newUser: '',
  };

  describe('Create user', () => {
    it('Should NOT create user with incorrect authorization on /users POST', (done) => {
      chai
        .request(app)
        .post('/api/users')
        .set('Authorization', tokens.incorrectJwt)
        .send({ data: { user: userData.newUserToCreate } })
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);
          done();
        });
    });

    it('Should create user on /users POST', (done) => {
      chai
        .request(app)
        .post('/api/users')
        .set('Authorization', tokens.adminUser)
        .send({ data: { user: userData.newUserToCreate } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(userSchemas.user);
          done();
        });
    });

    after('Create admin user on /users POST', (done) => {
      chai
        .request(app)
        .post('/api/users')
        .set('Authorization', tokens.adminUser)
        .send({ data: { user: userData.newAdminUserToCreate } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(userSchemas.user);
          done();
        });
    });

    after(`Authenticate ${userData.newUserToCreate.userName}`, (done) => {
      chai
        .request(app)
        .post('/api/authenticate')
        .send({ data: { user: userData.newUserToCreate } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(authenticateSchemas.authenticate);

          usersToken.newUser = response.body.data.token;

          done();
        });
    });
  });

  describe('Request password recovery', () => {
    it('Should NOT create and send password reset with incorrect authorization on /users/:id/resetPassword POST', (done) => {
      chai
        .request(app)
        .post(`/api/users/${userData.newUserToCreate.mail}/resetPassword`)
        .set('Authorization', tokens.incorrectJwt)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should create and send password reset to existing user by mail on /users/:id/resetPassword POST', (done) => {
      chai
        .request(app)
        .post(`/api/users/${userData.newUserToCreate.mail}/resetPassword`)
        .set('Authorization', usersToken.newUser)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(successSchemas.success);

          done();
        });
    });

    it('Should NOT create and send password reset to non-existing user by mail on /users/:id/resetPassword POST', (done) => {
      chai
        .request(app)
        .post(`/api/users/${userData.fakeMail}/resetPassword`)
        .set('Authorization', tokens.adminUser)
        .end((error, response) => {
          response.should.have.status(404);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });
  });

  describe('List users', () => {
    it('Should NOT list users with incorrect authorization set on /users GET', (done) => {
      chai
        .request(app)
        .get('/api/users')
        .set('Authorization', tokens.incorrectJwt)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should list users on /users GET', (done) => {
      chai
        .request(app)
        .get('/api/users')
        .set('Authorization', tokens.adminUser)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(userSchemas.users);

          // TODO Check that users retrieved have lower access level/visibility

          done();
        });
    });
  });

  describe('Get specific user', () => {
    it('Should NOT retrieve specific user with incorrect authorization set on /users/:id GET', (done) => {
      chai
        .request(app)
        .get(`/api/users/${userData.newUserToCreate.userName}`)
        .set('Authorization', tokens.incorrectJwt)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);
          done();
        });
    });

    it('Should retrieve own user on /users/:id GET', (done) => {
      chai
        .request(app)
        .get(`/api/users/${userData.newUserToCreate.userName}`)
        .set('Authorization', usersToken.newUser)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(userSchemas.user);
          done();
        });
    });

    it('Should NOT get user with higher access level than user on /users/:id GET', (done) => {
      chai
        .request(app)
        .get(`/api/users/${userData.newAdminUserToCreate.userName}`)
        .set('Authorization', usersToken.newUser)
        .end((error, response) => {
          response.should.have.status(404);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);
          done();
        });
    });
  });
});
