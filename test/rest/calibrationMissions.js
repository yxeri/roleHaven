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
const calibrationMissionSchemas = require('./schemas/calibrationMissions');
const lanternStationSchemas = require('./schemas/lanternStations');
const calibrationMissionData = require('./testData/calibrationMissions');

chai.should();
chai.use(chaiHttp);
chai.use(chaiJson);

describe('Calibration Missions', () => {
  before('Create lantern station on /api/lanternStations POST', (done) => {
    chai
      .request(app)
      .post('/api/lanternStations/')
      .send({ data: { station: calibrationMissionData.lanternStationToCreate } })
      .set('Authorization', tokens.adminUser)
      .end((error, response) => {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.jsonSchema(lanternStationSchemas.lanternStation);

        done();
      });
  });

  before('Create lantern station on /api/lanternStations POST', (done) => {
    chai
      .request(app)
      .post('/api/lanternStations/')
      .send({ data: { station: calibrationMissionData.anotherLanternStationToCreate } })
      .set('Authorization', tokens.adminUser)
      .end((error, response) => {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.jsonSchema(lanternStationSchemas.lanternStation);

        done();
      });
  });

  before('Create lantern station on /api/lanternStations POST', (done) => {
    chai
      .request(app)
      .post('/api/lanternStations/')
      .send({ data: { station: calibrationMissionData.aThirdLanternStationToCreate } })
      .set('Authorization', tokens.adminUser)
      .end((error, response) => {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.jsonSchema(lanternStationSchemas.lanternStation);

        done();
      });
  });

  describe('Get calibration missions', () => {
    it('Should NOT get calibration missions with incorrect auth on /api/calibrationMissions GET', (done) => {
      chai
        .request(app)
        .get('/api/calibrationMissions')
        .set('Authorization', tokens.incorrectJwt)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should NOT get active calibration missions with incorrect auth on /api/calibrationMissions GET', (done) => {
      chai
        .request(app)
        .get('/api/calibrationMissions/active')
        .set('Authorization', tokens.incorrectJwt)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should get calibration missions on /api/calibrationMissions GET', (done) => {
      chai
        .request(app)
        .get('/api/calibrationMissions')
        .set('Authorization', tokens.adminUser)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(calibrationMissionSchemas.calibrationMissions);

          done();
        });
    });

    it('Should get active calibration missions on /api/calibrationMissions/active GET', (done) => {
      chai
        .request(app)
        .get('/api/calibrationMissions/active')
        .set('Authorization', tokens.adminUser)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(calibrationMissionSchemas.calibrationMissions);

          done();
        });
    });
  });
});
