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
const docFileData = require('./testData/docFiles');
const starterData = require('./testData/starter');
const gameCodeData = require('./testData/gameCodes');
const gameCodeSchemas = require('./schemas/gameCodes');
const userSchemas = require('./schemas/users');
const authenticateSchemas = require('./schemas/authentications');

chai.should();
chai.use(chaiHttp);
chai.use(chaiJson);

describe('GameCodes', () => {
  describe('Create game code', () => {
    it('Should NOT create new game code on other user with incorrect auth on /api/users/:username/gameCodes/:codeType POST', (done) => {
      chai
        .request(app)
        .post(`/api/users/${starterData.basicUserToAuth.username}/gameCodes/${gameCodeData.GameCodeTypes.LOOT}`)
        .set('Authorization', tokens.incorrectJwt)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should create new game code on other user with enough access on /api/users/:username/gameCodes/:codeType POST', (done) => {
      chai
        .request(app)
        .post(`/api/users/${starterData.basicUserToAuth.username}/gameCodes/${gameCodeData.GameCodeTypes.LOOT}`)
        .set('Authorization', tokens.adminUser)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(gameCodeSchemas.gameCode);

          done();
        });
    });

    it('Should NOT create new game code on other user without enough access on /api/users/:username/gameCodes/:codeType POST', (done) => {
      chai
        .request(app)
        .post(`/api/users/${starterData.adminUserToAuth.username}/gameCodes/${gameCodeData.GameCodeTypes.LOOT}`)
        .set('Authorization', tokens.basicUser)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should create new game code on self on /api/users/:username/gameCodes/:codeType POST', (done) => {
      chai
        .request(app)
        .post(`/api/users/${starterData.adminUserToAuth.username}/gameCodes/${gameCodeData.GameCodeTypes.LOOT}`)
        .set('Authorization', tokens.adminUser)
        .send({ data: { docFile: docFileData.privateDocFileToCreate } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(gameCodeSchemas.gameCode);

          done();
        });
    });
  });

  describe('Create profile game code', () => {
    it('Should NOT create new or get existing profile game code with incorrect auth on /api/users/:username/gameCodes/profile GET', (done) => {
      chai
        .request(app)
        .post(`/api/users/${starterData.basicUserToAuth.username}/gameCodes/profile`)
        .set('Authorization', tokens.incorrectJwt)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should NOT create new or get existing profile game code on other user with too low access on /api/users/:username/gameCodes/profile GET', (done) => {
      chai
        .request(app)
        .get(`/api/users/${starterData.adminUserToAuth.username}/gameCodes/profile`)
        .set('Authorization', tokens.basicUser)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should create new or get existing profile game code on self on /api/users/:username/gameCodes/profile GET', (done) => {
      chai
        .request(app)
        .get(`/api/users/${starterData.basicUserToAuth.username}/gameCodes/profile`)
        .set('Authorization', tokens.basicUser)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(gameCodeSchemas.gameCode);

          done();
        });
    });

    it('Should create new or get existing profile game code on other user with enough access on /api/users/:username/gameCodes/profile GET', (done) => {
      chai
        .request(app)
        .get(`/api/users/${starterData.basicUserToAuth.username}/gameCodes/profile`)
        .set('Authorization', tokens.adminUser)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(gameCodeSchemas.gameCode);

          done();
        });
    });
  });

  describe('Get profile game code', () => {
    let gameCode = {};

    before('Create new profile game code on self on /api/users/:username/gameCodes/profile GET', (done) => {
      chai
        .request(app)
        .get(`/api/users/${starterData.basicUserToAuth.username}/gameCodes/profile`)
        .set('Authorization', tokens.basicUser)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(gameCodeSchemas.gameCode);

          gameCode = response.body.data.gameCode;

          done();
        });
    });

    it('Should get existing profile game code on self on /api/users/:username/gameCodes/profile GET', (done) => {
      chai
        .request(app)
        .get(`/api/users/${starterData.basicUserToAuth.username}/gameCodes/profile`)
        .set('Authorization', tokens.basicUser)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(gameCodeSchemas.gameCode);
          response.body.data.gameCode.code.should.equal(gameCode.code);

          done();
        });
    });
  });

  describe('Use profile game code', () => {
    const walletTokens = {
      first: '',
      second: '',
    };
    let gameCode = {};

    before(`Create user ${gameCodeData.userWithWallet.username} on /api/users POST`, (done) => {
      chai
        .request(app)
        .post('/api/users')
        .set('Authorization', tokens.adminUser)
        .send({ data: { user: gameCodeData.userWithWallet } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(userSchemas.user);
          done();
        });
    });

    before(`Create user ${gameCodeData.otherUserWithWallet.username} on /api/users POST`, (done) => {
      chai
        .request(app)
        .post('/api/users')
        .set('Authorization', tokens.adminUser)
        .send({ data: { user: gameCodeData.otherUserWithWallet } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(userSchemas.user);
          done();
        });
    });

    before('Authenticate user on /api/authenticate', (done) => {
      chai
        .request(app)
        .post('/api/authenticate')
        .send({ data: { user: gameCodeData.userWithWallet } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(authenticateSchemas.authenticate);

          walletTokens.first = response.body.data.token;

          done();
        });
    });

    before('Authenticate user on /api/authenticate', (done) => {
      chai
        .request(app)
        .post('/api/authenticate')
        .send({ data: { user: gameCodeData.otherUserWithWallet } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(authenticateSchemas.authenticate);

          walletTokens.second = response.body.data.token;

          done();
        });
    });

    before('Create new profile game code on self on /api/users/:username/gameCodes/profile GET', (done) => {
      chai
        .request(app)
        .get(`/api/users/${gameCodeData.userWithWallet.username}/gameCodes/profile`)
        .set('Authorization', walletTokens.first)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(gameCodeSchemas.gameCode);

          gameCode = response.body.data.gameCode;

          done();
        });
    });

    it('Should NOT use profile game code on self on /api/gameCodes/:code POST', (done) => {
      chai
        .request(app)
        .post(`/api/gameCodes/${gameCode.code}/use`)
        .set('Authorization', walletTokens.first)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should use profile game code on /api/gameCodes/:code POST', (done) => {
      chai
        .request(app)
        .post(`/api/gameCodes/${gameCode.code}/use`)
        .set('Authorization', walletTokens.second)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(gameCodeSchemas.usedGameCode);

          done();
        });
    });
  });
});
