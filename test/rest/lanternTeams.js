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
const testData = require('./helper/testData');
const tokens = require('./0- starter').tokens;

chai.should();
chai.use(chaiHttp);
chai.use(chaiJson);

describe('LanternTeams', () => {
  describe('List lantern teams', () => {
    it('Should NOT list lantern teams with incorrect authorization on /lanternStations GET', (done) => {
      chai
        .request(app)
        .get('/api/lanternTeams')
        .set('Authorization', testData.incorrectJwt)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should list lantern teams on /lanternStations GET', (done) => {
      chai
        .request(app)
        .get('/api/lanternTeams')
        .set('Authorization', tokens.admin)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(lanternTeamSchemas.lanternTeams);

          done();
        });
    });
  });

  describe('Create lantern team', () => {
    it('Should NOT create lantern team with incorrect authorization on /lanternTeams POST', (done) => {
      chai
        .request(app)
        .post('/api/lanternTeams')
        .send({ data: { team: testData.lanternTeamNew } })
        .set('Authorization', testData.incorrectJwt)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should create lantern team /lanternTeams POST', (done) => {
      chai
        .request(app)
        .post('/api/lanternTeams/')
        .send({ data: { team: testData.lanternTeamNew } })
        .set('Authorization', tokens.admin)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(lanternTeamSchemas.lanternTeam);

          done();
        });
    });

    it('Should NOT create existing lantern team /lanternTeams POST', (done) => {
      chai
        .request(app)
        .post('/api/lanternTeams/')
        .send({ data: { team: testData.lanternTeamNew } })
        .set('Authorization', tokens.admin)
        .end((error, response) => {
          response.should.have.status(403);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });
  });

  describe('Update lantern team', () => {
    before('Create lantern team /lanternTeams POST', (done) => {
      chai
        .request(app)
        .post('/api/lanternTeams/')
        .send({ data: { team: testData.lanternTeamModify } })
        .set('Authorization', tokens.admin)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(lanternTeamSchemas.lanternTeam);

          done();
        });
    });

    it('Should NOT update lantern team with incorrect authorization on /lanternTeams/:id POST', (done) => {
      chai
        .request(app)
        .post(`/api/lanternTeams/${testData.lanternTeamModify.teamName}`)
        .send({ data: { team: testData.lanternTeamModifyPoints } })
        .set('Authorization', testData.incorrectJwt)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should NOT update points on inactive lantern team', (done) => {
      chai
        .request(app)
        .post(`/api/lanternTeams/${testData.lanternTeamModify.teamName}`)
        .send({ data: { team: testData.lanternTeamModifyPoints } })
        .set('Authorization', tokens.admin)
        .end((error, response) => {
          response.should.have.status(404);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should update active on lantern team on /lanternTeams/:id POST', (done) => {
      chai
        .request(app)
        .post(`/api/lanternTeams/${testData.lanternTeamModify.teamName}`)
        .send({ data: { team: testData.lanternTeamModifyActive } })
        .set('Authorization', tokens.admin)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(lanternTeamSchemas.lanternTeam);
          response.body.data.team.isActive.should.not.equal(testData.lanternTeamModify.isActive);
          response.body.data.team.isActive.should.equal(testData.lanternTeamModifyActive.isActive);

          done();
        });
    });

    it('Should update points on active lantern team on /lanternTeams/:id POST', (done) => {
      chai
        .request(app)
        .post(`/api/lanternTeams/${testData.lanternTeamModify.teamName}`)
        .send({ data: { team: testData.lanternTeamModifyPoints } })
        .set('Authorization', tokens.admin)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(lanternTeamSchemas.lanternTeam);
          response.body.data.team.points.should.not.equal(testData.lanternTeamModify.points);
          response.body.data.team.points.should.equal(testData.lanternTeamModifyPoints.points);

          done();
        });
    });

    it('Should reset points to 0 and ignore points parameter on lantern team on /lanternTeams/:id POST', (done) => {
      chai
        .request(app)
        .post(`/api/lanternTeams/${testData.lanternTeamModify.teamName}`)
        .send({ data: { team: testData.lanternTeamModifyResetPoints } })
        .set('Authorization', tokens.admin)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(lanternTeamSchemas.lanternTeam);
          response.body.data.team.points.should.not.equal(testData.lanternTeamModify.points);
          response.body.data.team.points.should.equal(0);

          done();
        });
    });

    it('Should NOT update non-existing lantern team /lanternTeams/:id POST', (done) => {
      chai
        .request(app)
        .post(`/api/lanternTeams/${testData.lanternTeamDoesNotExist.teamName}`)
        .send({ data: { team: testData.lanternTeamModifyActive } })
        .set('Authorization', tokens.admin)
        .end((error, response) => {
          response.should.have.status(404);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });
  });
});
