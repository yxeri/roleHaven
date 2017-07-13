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
const lanternStationSchemas = require('./schemas/lanternStations');
const errorSchemas = require('./schemas/errors');
const lanternStationData = require('./testData/lanternStations');
const tokens = require('./testData/tokens');

chai.should();
chai.use(chaiHttp);
chai.use(chaiJson);

describe('LanternStations', () => {
  describe('Create lantern station', () => {
    it('Should NOT create lantern station with incorrect authorization on /lanternStations POST', (done) => {
      chai
        .request(app)
        .post('/api/lanternStations')
        .send({ data: { station: lanternStationData.lanternStationToCreate } })
        .set('Authorization', tokens.incorrectJwt)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should create lantern station /lanternStations POST', (done) => {
      chai
        .request(app)
        .post('/api/lanternStations/')
        .send({ data: { station: lanternStationData.lanternStationToCreate } })
        .set('Authorization', tokens.adminUser)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(lanternStationSchemas.lanternStation);

          done();
        });
    });

    it('Should NOT create existing lantern station /lanternStations POST', (done) => {
      chai
        .request(app)
        .post('/api/lanternStations/')
        .send({ data: { station: lanternStationData.lanternStationToCreate } })
        .set('Authorization', tokens.adminUser)
        .end((error, response) => {
          response.should.have.status(403);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });
  });

  describe('List lantern stations', () => {
    it('Should NOT list lantern stations with incorrect authorization on /lanternStations GET', (done) => {
      chai
        .request(app)
        .get('/api/lanternStations')
        .set('Authorization', tokens.incorrectJwt)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should retrieve lantern stations on /lanternStations GET', (done) => {
      chai
        .request(app)
        .get('/api/lanternStations')
        .set('Authorization', tokens.adminUser)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(lanternStationSchemas.lanternStations);

          done();
        });
    });
  });

  describe('Update lantern station', () => {
    before('Create lantern station /lanternStations POST', (done) => {
      chai
        .request(app)
        .post('/api/lanternStations/')
        .send({ data: { station: lanternStationData.lanternStationToCreateAndModify } })
        .set('Authorization', tokens.adminUser)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(lanternStationSchemas.lanternStation);

          done();
        });
    });

    it('Should NOT update lantern station with incorrect authorization on /lanternStations/:id POST', (done) => {
      chai
        .request(app)
        .post(`/api/lanternStations/${lanternStationData.lanternStationToCreateAndModify.stationId}`)
        .send({ data: { station: lanternStationData.lanternStationWithNewOwner } })
        .set('Authorization', tokens.incorrectJwt)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should update owner on lantern station on /lanternStations/:id POST', (done) => {
      chai
        .request(app)
        .post(`/api/lanternStations/${lanternStationData.lanternStationToCreateAndModify.stationId}`)
        .send({ data: { station: lanternStationData.lanternStationWithNewOwner } })
        .set('Authorization', tokens.adminUser)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(lanternStationSchemas.lanternStation);

          done();
        });
    });

    it('Should update attacker on lantern station on /lanternStations/:id POST', (done) => {
      chai
        .request(app)
        .post(`/api/lanternStations/${lanternStationData.lanternStationToCreateAndModify.stationId}`)
        .send({ data: { station: lanternStationData.lanternStationWithNewAttacker } })
        .set('Authorization', tokens.adminUser)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(lanternStationSchemas.lanternStation);

          done();
        });
    });

    it('Should NOT update non-existing lantern station /lanternStations/:id POST', (done) => {
      chai
        .request(app)
        .post(`/api/lanternStations/${lanternStationData.lanternStationThatDoesNotExist.stationId}`)
        .send({ data: { station: lanternStationData.lanternStationWithNewOwner } })
        .set('Authorization', tokens.adminUser)
        .end((error, response) => {
          response.should.have.status(404);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });
  });
});
