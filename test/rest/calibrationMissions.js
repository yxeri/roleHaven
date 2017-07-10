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
const calibrationMissionSchemas = require('./schemas/calibrationMissions');
const errorSchemas = require('./schemas/errors');
const testData = require('./helper/testData');
const tokens = require('./helper/starter').tokens;

chai.should();
chai.use(chaiHttp);
chai.use(chaiJson);

describe('CalibrationMissions', () => {
  describe('Get active calibration mission', () => {
    it('Should NOT retrieve active calibration mission with incorrect authorization on /calibrationMissions GET', (done) => {
      chai
        .request(app)
        .get('/api/calibrationMissions')
        .set('Authorization', testData.incorrectJwt)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should get active calibration mission for user on /calibrationMissions GET', (done) => {
      chai
        .request(app)
        .get('/api/calibrationMissions')
        .set('Authorization', tokens.admin)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(calibrationMissionSchemas.calibrationMission);

          done();
        });
    });
  });

  describe('Complete active calibration mission', () => {
    let calibrationMission = {};

    it('Should get active calibration mission for user on /calibrationMissions GET', (done) => {
      chai
        .request(app)
        .get('/api/calibrationMissions')
        .set('Authorization', tokens.admin)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(calibrationMissionSchemas.calibrationMission);

          calibrationMission = response.body.data.mission;

          done();
        });
    });

    it('Should NOT complete active calibration mission with incorrect authorization /calibrationMissions/complete POST', (done) => {
      chai
        .request(app)
        .post('/api/calibrationMissions/complete')
        .set('Authorization', testData.incorrectJwt)
        .send({ data: { mission: calibrationMission } })
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should complete active calibration mission for user on /calibrationMissions/complete POST', (done) => {
      chai
        .request(app)
        .post('/api/calibrationMissions/complete')
        .set('Authorization', tokens.admin)
        .send({ data: { mission: calibrationMission } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(calibrationMissionSchemas.calibrationMission);

          done();
        });
    });

    it('Should get new active calibration mission for user and it should NOT be the same as the completed mission on /calibrationMissions GET', (done) => {
      chai
        .request(app)
        .get('/api/calibrationMissions')
        .set('Authorization', tokens.admin)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(calibrationMissionSchemas.calibrationMission);
          response.body.data.mission.should.not.equal(calibrationMission);

          done();
        });
    });

    it('Should get new active calibration mission for user and it should NOT have the same station ID as the completed mission on /calibrationMissions GET', (done) => {
      chai
        .request(app)
        .get('/api/calibrationMissions')
        .set('Authorization', tokens.admin)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(calibrationMissionSchemas.calibrationMission);
          response.body.data.mission.stationId.should.not.equal(calibrationMission.stationId);

          done();
        });
    });
  });

  describe('Cancel active calibration mission', () => {
    let calibrationMission = {};

    it('Should get active calibration mission for user on /calibrationMissions GET', (done) => {
      chai
        .request(app)
        .get('/api/calibrationMissions')
        .set('Authorization', tokens.admin)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(calibrationMissionSchemas.calibrationMission);

          calibrationMission = response.body.data.mission;

          done();
        });
    });

    it('Should NOT cancel active calibration mission with incorrect authorization /calibrationMissions/cancel POST', (done) => {
      chai
        .request(app)
        .post('/api/calibrationMissions/cancel')
        .set('Authorization', testData.incorrectJwt)
        .send({ data: { mission: calibrationMission } })
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should cancel active calibration mission for user on /calibrationMissions/cancel POST', (done) => {
      chai
        .request(app)
        .post('/api/calibrationMissions/cancel')
        .set('Authorization', tokens.admin)
        .send({ data: { mission: calibrationMission } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(calibrationMissionSchemas.calibrationMission);

          done();
        });
    });

    it('Should NOT cancel if there is no active calibrationMission for user on /calibrationMissions/cancel POST', (done) => {
      chai
        .request(app)
        .post('/api/calibrationMissions/cancel')
        .set('Authorization', tokens.admin)
        .send({ data: { mission: calibrationMission } })
        .end((error, response) => {
          response.should.have.status(404);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should get new active calibration mission for user and it should not be the same as the cancelled mission on /calibrationMissions GET', (done) => {
      chai
        .request(app)
        .get('/api/calibrationMissions')
        .set('Authorization', tokens.admin)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(calibrationMissionSchemas.calibrationMission);
          response.body.data.mission.stationId.should.not.equal(calibrationMission.stationId);
          response.body.data.mission.should.not.equal(calibrationMission);

          done();
        });
    });

    it('Should get new active calibration mission for user and it should NOT have the same station ID as the completed mission on /calibrationMissions GET', (done) => {
      chai
        .request(app)
        .get('/api/calibrationMissions')
        .set('Authorization', tokens.admin)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(calibrationMissionSchemas.calibrationMission);
          response.body.data.mission.stationId.should.not.equal(calibrationMission.stationId);

          done();
        });
    });
  });
});
