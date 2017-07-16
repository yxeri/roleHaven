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
const tokens = require('./testData/tokens');

chai.should();
chai.use(chaiHttp);
chai.use(chaiJson);

describe('CalibrationMissions', () => {
  describe('Get active calibration mission', () => {
    it('Should NOT retrieve active calibration mission with incorrect authorization on /api/calibrationMissions GET', (done) => {
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

    it('Should get active calibration mission for user on /api/calibrationMissions GET', (done) => {
      chai
        .request(app)
        .get('/api/calibrationMissions')
        .set('Authorization', tokens.adminUser)
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

    before('Get active calibration mission for user on /api/calibrationMissions GET', (done) => {
      chai
        .request(app)
        .get('/api/calibrationMissions')
        .set('Authorization', tokens.adminUser)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(calibrationMissionSchemas.calibrationMission);

          calibrationMission = response.body.data.mission;

          done();
        });
    });

    it('Should NOT complete active calibration mission with incorrect authorization /api/calibrationMissions/complete POST', (done) => {
      chai
        .request(app)
        .post('/api/calibrationMissions/complete')
        .set('Authorization', tokens.incorrectJwt)
        .send({ data: { mission: calibrationMission } })
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should complete active calibration mission for user on /api/calibrationMissions/complete POST', (done) => {
      chai
        .request(app)
        .post('/api/calibrationMissions/complete')
        .set('Authorization', tokens.adminUser)
        .send({ data: { mission: calibrationMission } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(calibrationMissionSchemas.calibrationMission);

          done();
        });
    });

    describe('Correct completed mission data', () => {
      let activeMission = {};

      before('Get active calibration mission for user on /api/calibrationMissions GET', (done) => {
        chai
          .request(app)
          .get('/api/calibrationMissions')
          .set('Authorization', tokens.adminUser)
          .end((error, response) => {
            response.should.have.status(200);
            response.should.be.json;
            response.body.should.be.jsonSchema(calibrationMissionSchemas.calibrationMission);

            activeMission = response.body.data.mission;

            done();
          });
      });

      before('Complete active calibration mission for user on /api/calibrationMissions/complete POST', (done) => {
        chai
          .request(app)
          .post('/api/calibrationMissions/complete')
          .set('Authorization', tokens.adminUser)
          .send({ data: { mission: activeMission } })
          .end((error, response) => {
            response.should.have.status(200);
            response.should.be.json;
            response.body.should.be.jsonSchema(calibrationMissionSchemas.calibrationMission);

            done();
          });
      });

      it('Should get new active calibration mission for user and it should NOT have the same station ID nor code as the completed mission on /api/calibrationMissions GET', (done) => {
        chai
          .request(app)
          .get('/api/calibrationMissions')
          .set('Authorization', tokens.adminUser)
          .end((error, response) => {
            response.should.have.status(200);
            response.should.be.json;
            response.body.should.be.jsonSchema(calibrationMissionSchemas.calibrationMission);
            response.body.data.mission.stationId.should.not.equal(activeMission.stationId);
            response.body.data.mission.code.should.not.equal(activeMission.code);

            done();
          });
      });
    });
  });

  describe('Cancel active calibration mission', () => {
    let calibrationMission = {};

    it('Should get active calibration mission for user on /api/calibrationMissions GET', (done) => {
      chai
        .request(app)
        .get('/api/calibrationMissions')
        .set('Authorization', tokens.adminUser)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(calibrationMissionSchemas.calibrationMission);

          calibrationMission = response.body.data.mission;

          done();
        });
    });

    it('Should NOT cancel active calibration mission with incorrect authorization /api/calibrationMissions/cancel POST', (done) => {
      chai
        .request(app)
        .post('/api/calibrationMissions/cancel')
        .set('Authorization', tokens.incorrectJwt)
        .send({ data: { mission: calibrationMission } })
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should cancel active calibration mission for user on /api/calibrationMissions/cancel POST', (done) => {
      chai
        .request(app)
        .post('/api/calibrationMissions/cancel')
        .set('Authorization', tokens.adminUser)
        .send({ data: { mission: calibrationMission } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(calibrationMissionSchemas.calibrationMission);

          done();
        });
    });

    it('Should NOT cancel if there is no active calibrationMission for user on /api/calibrationMissions/cancel POST', (done) => {
      chai
        .request(app)
        .post('/api/calibrationMissions/cancel')
        .set('Authorization', tokens.adminUser)
        .send({ data: { mission: calibrationMission } })
        .end((error, response) => {
          response.should.have.status(404);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should get new active calibration mission for user and it should not be the same as the cancelled mission on /api/calibrationMissions GET', (done) => {
      chai
        .request(app)
        .get('/api/calibrationMissions')
        .set('Authorization', tokens.adminUser)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(calibrationMissionSchemas.calibrationMission);
          response.body.data.mission.stationId.should.not.equal(calibrationMission.stationId);
          response.body.data.mission.should.not.equal(calibrationMission);

          done();
        });
    });

    it('Should get new active calibration mission for user and it should NOT have the same station ID as the completed mission on /api/calibrationMissions GET', (done) => {
      chai
        .request(app)
        .get('/api/calibrationMissions')
        .set('Authorization', tokens.adminUser)
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
