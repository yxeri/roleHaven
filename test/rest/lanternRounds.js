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
const lanternRoundSchemas = require('./schemas/lanternRounds');
const errorSchemas = require('./schemas/errors');
const lanternRoundData = require('./testData/lanternRounds');
const tokens = require('./testData/tokens');

chai.should();
chai.use(chaiHttp);
chai.use(chaiJson);

describe('LanternRounds', () => {
  describe('Create lantern round', () => {
    it('Should NOT create lantern round with incorrect authorization on /api/lanternRounds POST', (done) => {
      chai
        .request(app)
        .post('/api/lanternRounds')
        .send({ data: { round: lanternRoundData.lanternRoundToCreate } })
        .set('Authorization', tokens.incorrectJwt)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should create lantern round on /api/lanternRounds POST', (done) => {
      chai
        .request(app)
        .post('/api/lanternRounds/')
        .send({ data: { round: lanternRoundData.lanternRoundToCreate } })
        .set('Authorization', tokens.adminUser)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(lanternRoundSchemas.lanternRound);

          done();
        });
    });

    it('Should NOT create existing lantern round on /api/lanternRounds POST', (done) => {
      chai
        .request(app)
        .post('/api/lanternRounds/')
        .send({ data: { round: lanternRoundData.lanternRoundToCreate } })
        .set('Authorization', tokens.adminUser)
        .end((error, response) => {
          response.should.have.status(403);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });
  });

  describe('Update lantern round', () => {
    before('Create lantern round on /api/lanternRounds POST', (done) => {
      chai
        .request(app)
        .post('/api/lanternRounds/')
        .send({ data: { round: lanternRoundData.lanternRoundToCreateAndModify } })
        .set('Authorization', tokens.adminUser)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(lanternRoundSchemas.lanternRound);

          done();
        });
    });

    it('Should NOT update lantern round with incorrect authorization on /api/lanternRounds/:id POST', (done) => {
      chai
        .request(app)
        .post(`/api/lanternRounds/${lanternRoundData.lanternRoundToCreateAndModify.roundId}`)
        .send({ data: { round: lanternRoundData.lanternRoundWithNewEndTime } })
        .set('Authorization', tokens.incorrectJwt)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should update start time on lantern round on /api/lanternRounds/:id POST', (done) => {
      chai
        .request(app)
        .post(`/api/lanternRounds/${lanternRoundData.lanternRoundToCreateAndModify.roundId}`)
        .send({ data: { round: lanternRoundData.lantertRoundWithNewStartTime } })
        .set('Authorization', tokens.adminUser)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(lanternRoundSchemas.lanternRound);

          done();
        });
    });

    it('Should update end time on lantern round on /api/lanternRounds/:id POST', (done) => {
      chai
        .request(app)
        .post(`/api/lanternRounds/${lanternRoundData.lanternRoundToCreateAndModify.roundId}`)
        .send({ data: { round: lanternRoundData.lanternRoundWithNewEndTime } })
        .set('Authorization', tokens.adminUser)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(lanternRoundSchemas.lanternRound);

          done();
        });
    });

    // TODO 'Should NOT update start time on active lantern round on /lanternRounds/:id POST'

    it('Should NOT update non-existing lantern round /api/lanternRounds/:id POST', (done) => {
      chai
        .request(app)
        .post(`/api/lanternRounds/${lanternRoundData.lanternRoundToCreateAndModify.roundId}`)
        .send({ data: { round: lanternRoundData.lanternRoundWithNewEndTime } })
        .set('Authorization', tokens.incorrectJwt)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });
  });

  describe('List lantern rounds', () => {
    it('Should NOT list lantern rounds with incorrect authorization on /api/lanternRounds GET', (done) => {
      chai
        .request(app)
        .get('/api/lanternRounds')
        .set('Authorization', tokens.incorrectJwt)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should list lantern rounds on /api/lanternRounds GET', (done) => {
      chai
        .request(app)
        .get('/api/lanternRounds')
        .set('Authorization', tokens.adminUser)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(lanternRoundSchemas.lanternRounds);

          done();
        });
    });
  });
});
