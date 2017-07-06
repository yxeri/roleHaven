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
const schemas = require('./helper/schemas');
const helperData = require('./helper/data');

chai.should();

chai.use(chaiHttp);
chai.use(chaiJson);

describe('Users', () => {
  // jwt token
  let adminToken = '';
  let newUserToken = '';

  before(`Authenticate ${helperData.adminUser.userName}`, (done) => {
    chai
      .request(app)
      .post('/api/authenticate')
      .send({ data: { user: helperData.adminUser } })
      .end((error, response) => {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.jsonSchema(schemas.authenticate);

        adminToken = response.body.data.token;

        done();
      });
  });

  describe('User creation', () => {
    it(`Should create user ${helperData.newUser.userName} by user ${helperData.adminUser.userName} on /users POST`, (done) => {
      chai
        .request(app)
        .post('/api/users')
        .set('Authorization', adminToken)
        .send({ data: { user: helperData.newUser } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(schemas.user);
          done();
        });
    });

    it(`Should NOT create user ${helperData.normalUser.userName} with incorrect authorization on /users POST`, (done) => {
      chai
        .request(app)
        .post('/api/users')
        .set('Authorization', helperData.incorrectJwt)
        .send({ data: { user: helperData.normalUser } })
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          done();
        });
    });

    after(`Authenticate ${helperData.newUser.userName}`, (done) => {
      chai
        .request(app)
        .post('/api/authenticate')
        .send({ data: { user: helperData.newUser } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(schemas.authenticate);

          newUserToken = response.body.data.token;

          done();
        });
    });
  });

  describe('Request password recovery', () => {
    it(`Should create and send password reset to existing user with mail ${helperData.adminUser.mail} on /users/:id/resetPassword POST`, (done) => {
      chai
        .request(app)
        .post(`/api/users/${helperData.adminUser.mail}/resetPassword`)
        .set('Authorization', adminToken)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(schemas.success);

          done();
        });
    });

    it('Should NOT create and send password reset with incorrect authorization on /users/:id/resetPassword POST', (done) => {
      chai
        .request(app)
        .post(`/api/users/${helperData.adminUser.mail}/resetPassword`)
        .set('Authorization', helperData.incorrectJwt)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;

          done();
        });
    });

    it(`Should NOT create and send password reset to non-existing user with mail ${helperData.fakeMail} on /users/:id/resetPassword POST`, (done) => {
      chai
        .request(app)
        .post(`/api/users/${helperData.fakeMail}/resetPassword`)
        .set('Authorization', adminToken)
        .end((error, response) => {
          response.should.have.status(404);
          response.should.be.json;

          done();
        });
    });
  });

  describe('User listing', () => {
    it('Should NOT list users with incorrect authorization set on /users GET', (done) => {
      chai
        .request(app)
        .get('/api/users')
        .set('Authorization', helperData.incorrectJwt)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;

          done();
        });
    });

    it('Should list users on /users GET', (done) => {
      chai
        .request(app)
        .get('/api/users')
        .set('Authorization', adminToken)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(schemas.users);

          // TODO Check that users retrieved have lower access level/visibility

          done();
        });
    });

    it(`Should NOT retrive user ${helperData.adminUser.userName} with incorrect authorization set on /users/:id GET`, (done) => {
      chai
        .request(app)
        .get(`/api/users/${helperData.adminUser.userName}`)
        .set('Authorization', 'incorrect')
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          done();
        });
    });

    it('Should retrieve own user on /users/:id GET', (done) => {
      chai
        .request(app)
        .get(`/api/users/${helperData.adminUser.userName}`)
        .set('Authorization', adminToken)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(schemas.user);
          done();
        });
    });

    it(`Should NOT retrieve user ${helperData.adminUser.userName} by user ${helperData.newUser.userName} due to access level and/or visibility on /users/:id GET`, (done) => {
      chai
        .request(app)
        .get(`/api/users/${helperData.adminUser.userName}`)
        .set('Authorization', newUserToken)
        .end((error, response) => {
          response.should.have.status(404);
          response.should.be.json;
          done();
        });
    });
  });
});
