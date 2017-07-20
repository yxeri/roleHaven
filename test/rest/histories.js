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
const historySchemas = require('./schemas/histories');
const roomSchemas = require('./schemas/rooms');
const errorSchemas = require('./schemas/errors');
const tokens = require('./testData/tokens');
const historyData = require('./testData/histories');

chai.should();
chai.use(chaiHttp);
chai.use(chaiJson);

describe('Histories', () => {
  before(`Create ${historyData.roomToCreate.roomName} room on /api/rooms`, (done) => {
    chai
      .request(app)
      .post('/api/rooms')
      .set('Authorization', tokens.adminUser)
      .send({ data: { room: historyData.roomToCreate } })
      .end((error, response) => {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.jsonSchema(roomSchemas.room);

        done();
      });
  });

  before(`Create ${historyData.unfollowedRoomToCreate.roomName} room on /api/rooms`, (done) => {
    chai
      .request(app)
      .post('/api/rooms')
      .set('Authorization', tokens.basicUser)
      .send({ data: { room: historyData.unfollowedRoomToCreate } })
      .end((error, response) => {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.jsonSchema(roomSchemas.room);

        done();
      });
  });

  describe('Get specific history', () => {
    it('Should NOT retrieve specific history with incorrect authorization on /api/histories/:id GET', (done) => {
      chai
        .request(app)
        .get(`/api/histories/${historyData.roomToCreate.roomName}`)
        .set('Authorization', tokens.incorrectJwt)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should retrieve specific history from followed room on /api/histories/:id GET', (done) => {
      chai
        .request(app)
        .get(`/api/histories/${historyData.roomToCreate.roomName}`)
        .set('Authorization', tokens.adminUser)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(historySchemas.histories);

          done();
        });
    });

    it('Should NOT retrieve specific history from unfollowed room on /api/histories/:id GET', (done) => {
      chai
        .request(app)
        .get(`/api/histories/${historyData.unfollowedRoomToCreate.roomName}`)
        .set('Authorization', tokens.adminUser)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should NOT retrieve specific history from room that does not exist on /api/histories/:id GET', (done) => {
      chai
        .request(app)
        .get(`/api/histories/${historyData.roomThatDoesNotExist}`)
        .set('Authorization', tokens.adminUser)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });
  });

  describe('List histories', () => {
    it('Should NOT retrieve histories with incorrect authorization on /api/histories GET', (done) => {
      chai
        .request(app)
        .get('/api/histories')
        .set('Authorization', tokens.incorrectJwt)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should retrieve histories from followed rooms on /api/histories GET', (done) => {
      chai
        .request(app)
        .get('/api/histories')
        .set('Authorization', tokens.adminUser)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(historySchemas.histories);

          done();
        });
    });
  });
});
