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
const lanternTeamSchemas = require('./schemas/lanternTeams');
const errorSchemas = require('./schemas/errors');
const tokens = require('./testData/tokens');
const lanternTeamData = require('./testData/lanternTeams');

chai.should();
chai.use(chaiHttp);
chai.use(chaiJson);

describe('LanternTeams', () => {
  describe('Create lantern team', () => {
    it('Should NOT create lantern team with incorrect authorization on /api/lanternTeams POST', (done) => {
      chai
        .request(app)
        .post('/api/lanternTeams')
        .send({ data: { team: lanternTeamData.lanternTeamToCreate } })
        .set('Authorization', tokens.incorrectJwt)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should create lantern team on /api/lanternTeams POST', (done) => {
      chai
        .request(app)
        .post('/api/lanternTeams/')
        .send({ data: { team: lanternTeamData.lanternTeamToCreate } })
        .set('Authorization', tokens.adminUser)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(lanternTeamSchemas.lanternTeam);

          done();
        });
    });

    it('Should NOT create existing lantern team on /api/lanternTeams POST', (done) => {
      chai
        .request(app)
        .post('/api/lanternTeams/')
        .send({ data: { team: lanternTeamData.lanternTeamToCreate } })
        .set('Authorization', tokens.adminUser)
        .end((error, response) => {
          response.should.have.status(403);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });
  });

  describe('Get lantern teams', () => {
    it('Should NOT get lantern teams with incorrect authorization on /api/lanternTeams GET', (done) => {
      chai
        .request(app)
        .get('/api/lanternTeams')
        .set('Authorization', tokens.incorrectJwt)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should get lantern teams on /api/lanternTeams GET', (done) => {
      chai
        .request(app)
        .get('/api/lanternTeams')
        .set('Authorization', tokens.adminUser)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(lanternTeamSchemas.lanternTeams);

          done();
        });
    });
  });

  describe('Update lantern team', () => {
    before('Create lantern team on /api/lanternTeams POST', (done) => {
      chai
        .request(app)
        .post('/api/lanternTeams/')
        .send({ data: { team: lanternTeamData.lanternTeamToCreateAndModify } })
        .set('Authorization', tokens.adminUser)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(lanternTeamSchemas.lanternTeam);

          done();
        });
    });

    it('Should NOT update lantern team with incorrect authorization on /api/lanternTeams/:shortName POST', (done) => {
      chai
        .request(app)
        .post(`/api/lanternTeams/${lanternTeamData.lanternTeamToCreateAndModify.shortName}`)
        .send({ data: { team: lanternTeamData.lanternTeamWithNewPoints } })
        .set('Authorization', tokens.incorrectJwt)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should NOT update points on inactive lantern team on /api/lanternTeams/:shortName', (done) => {
      chai
        .request(app)
        .post(`/api/lanternTeams/${lanternTeamData.lanternTeamToCreateAndModify.shortName}`)
        .send({ data: { team: lanternTeamData.lanternTeamWithNewPoints } })
        .set('Authorization', tokens.adminUser)
        .end((error, response) => {
          response.should.have.status(404);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should update active on lantern team on /api/lanternTeams/:shortName POST', (done) => {
      chai
        .request(app)
        .post(`/api/lanternTeams/${lanternTeamData.lanternTeamToCreateAndModify.shortName}`)
        .send({ data: { team: lanternTeamData.lanternTeamWithIsActive } })
        .set('Authorization', tokens.adminUser)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(lanternTeamSchemas.lanternTeam);
          response.body.data.team.isActive.should.not.equal(lanternTeamData.lanternTeamToCreateAndModify.isActive);
          response.body.data.team.isActive.should.equal(lanternTeamData.lanternTeamWithIsActive.isActive);

          done();
        });
    });

    it('Should update points on active lantern team on /api/lanternTeams/:shortName POST', (done) => {
      chai
        .request(app)
        .post(`/api/lanternTeams/${lanternTeamData.lanternTeamToCreateAndModify.shortName}`)
        .send({ data: { team: lanternTeamData.lanternTeamWithNewPoints } })
        .set('Authorization', tokens.adminUser)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(lanternTeamSchemas.lanternTeam);
          response.body.data.team.points.should.not.equal(lanternTeamData.lanternTeamToCreateAndModify.points);
          response.body.data.team.points.should.equal(lanternTeamData.lanternTeamWithNewPoints.points);

          done();
        });
    });

    it('Should reset points to 0 and ignore points parameter on lantern team on /api/lanternTeams/:shortName POST', (done) => {
      chai
        .request(app)
        .post(`/api/lanternTeams/${lanternTeamData.lanternTeamToCreateAndModify.shortName}`)
        .send({ data: { team: lanternTeamData.lanternTeamWithResetPoints } })
        .set('Authorization', tokens.adminUser)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(lanternTeamSchemas.lanternTeam);
          response.body.data.team.points.should.not.equal(lanternTeamData.lanternTeamToCreateAndModify.points);
          response.body.data.team.points.should.equal(0);

          done();
        });
    });

    it('Should NOT update non-existing lantern team on /api/lanternTeams/:shortName POST', (done) => {
      chai
        .request(app)
        .post(`/api/lanternTeams/${lanternTeamData.lanternTeamThatDoesNotExist.shortName}`)
        .send({ data: { team: lanternTeamData.lanternTeamWithIsActive } })
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
