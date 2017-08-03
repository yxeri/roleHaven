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
const tokens = require('./testData/tokens');
const gameItemData = require('./testData/gameItems');
const gameItemSchemas = require('./schemas/gameItems');

chai.should();
chai.use(chaiHttp);
chai.use(chaiJson);

describe('GameItems', () => {
  describe('Create fake passwords', () => {
    it('Should NOT create fake passwords with incorrect auth on /api/gameItems/gamePasswords POST', (done) => {
      chai
        .request(app)
        .post('/api/gameItems/fakePasswords')
        .send({ data: { passwords: gameItemData.fakePasswords } })
        .set('Authorization', tokens.incorrectJwt)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should create fake passwords with enough access on /api/gameItems/gamePasswords POST', (done) => {
      chai
        .request(app)
        .post('/api/gameItems/fakePasswords')
        .send({ data: { passwords: gameItemData.fakePasswords } })
        .set('Authorization', tokens.adminUser)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(gameItemSchemas.fakePasswords);

          done();
        });
    });

    it('Should NOT create new game passwords without enough access on /api/gameItems/gameUser POST', (done) => {
      chai
        .request(app)
        .post('/api/gameItems/fakePasswords')
        .send({ data: { passwords: gameItemData.fakePasswords } })
        .set('Authorization', tokens.basicUser)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });
  });

  describe('Create game users', () => {
    it('Should NOT create game users with incorrect auth on /api/gameItems/gameUsers POST', (done) => {
      chai
        .request(app)
        .post('/api/gameItems/gameUsers')
        .send({ data: { gameUsers: gameItemData.gameUsersToCreate } })
        .set('Authorization', tokens.incorrectJwt)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should create game users with enough access on /api/gameItems/gameUsers POST', (done) => {
      chai
        .request(app)
        .post('/api/gameItems/gameUsers')
        .send({ data: { gameUsers: gameItemData.gameUsersToCreate } })
        .set('Authorization', tokens.adminUser)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;

          done();
        });
    });

    it('Should NOT create new game users without enough access on /api/gameItems/gameUsers POST', (done) => {
      chai
        .request(app)
        .post('/api/gameItems/gameUsers')
        .send({ data: { gameUsers: gameItemData.gameUsersToCreate } })
        .set('Authorization', tokens.basicUser)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });
  });

  describe('Get game users', () => {
    it('Should NOT get game users with incorrect auth on /api/gameItems/gameUsers GET', (done) => {
      chai
        .request(app)
        .get('/api/gameItems/gameUsers/1')
        .set('Authorization', tokens.incorrectJwt)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should get game users with enough access on /api/gameItems/gameUsers GET', (done) => {
      chai
        .request(app)
        .get('/api/gameItems/gameUsers/1')
        .set('Authorization', tokens.adminUser)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(gameItemSchemas.gameUsers);

          done();
        });
    });

    it('Should NOT get game users without enough access on /api/gameItems/gameUsers GET', (done) => {
      chai
        .request(app)
        .get('/api/gameItems/gameUsers/1')
        .set('Authorization', tokens.basicUser)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });
  });

  describe('Get fake passwords', () => {
    it('Should NOT get fake passwords with incorrect auth on /api/gameItems/fakePasswords GET', (done) => {
      chai
        .request(app)
        .get('/api/gameItems/fakePasswords')
        .set('Authorization', tokens.incorrectJwt)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should get fake passwords with enough access on /api/gameItems/fakePasswords GET', (done) => {
      chai
        .request(app)
        .get('/api/gameItems/fakePasswords')
        .set('Authorization', tokens.adminUser)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(gameItemSchemas.fakePasswords);

          done();
        });
    });

    it('Should NOT get fake passwords without enough access on /api/gameItems/fakePasswords GET', (done) => {
      chai
        .request(app)
        .get('/api/gameItems/fakePasswords')
        .set('Authorization', tokens.basicUser)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });
  });
});
