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
const positionSchemas = require('./schemas/positions');
const testData = require('./helper/testData');
const tokens = require('./helper/starter').tokens;

chai.should();
chai.use(chaiHttp);
chai.use(chaiJson);

describe('Positions', () => {
  describe('Update user position', () => {
    it('Should NOT update user position with incorrect authorization on /positions/users POST', (done) => {
      chai
        .request(app)
        .post('/api/positions/users')
        .set('Authorization', testData.incorrectJwt)
        .send({ data: { position: testData.positionUser } })
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should update user position on /positions/users POST', (done) => {
      chai
        .request(app)
        .post('/api/positions/users')
        .set('Authorization', tokens.admin)
        .send({ data: { position: testData.positionUser } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(positionSchemas.positions);

          done();
        });
    });
  });

  describe('Get user position', () => {
    before(`Update user ${testData.userNormal.userName} position`, (done) => {
      chai
        .request(app)
        .post('/api/positions/users')
        .set('Authorization', tokens.normal)
        .send({ data: { position: testData.positionUser } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(positionSchemas.positions);

          done();
        });
    });

    before(`Update user ${testData.userAdmin.userName} position`, (done) => {
      chai
        .request(app)
        .post('/api/positions/users')
        .set('Authorization', tokens.admin)
        .send({ data: { position: testData.positionUser } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(positionSchemas.positions);

          done();
        });
    });

    it('Should NOT get position for non-existent user on /api/positions/users/:id', (done) => {
      chai
        .request(app)
        .get('/api/positions/users/sngpsfnuo')
        .set('Authorization', tokens.admin)
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
        .get(`/api/positions/users/${testData.userNormal.userName}`)
        .set('Authorization', tokens.admin)
        .send({ data: { position: testData.positionUser } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(positionSchemas.positions);

          done();
        });
    });

    it('Should NOT get user position from user with higher visibility than user\'s access level on /api/positions/users/:id', (done) => {
      chai
        .request(app)
        .get(`/api/positions/users/${testData.userAdmin.userName}`)
        .set('Authorization', tokens.normal)
        .end((error, response) => {
          response.should.have.status(404);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });
  });
});
