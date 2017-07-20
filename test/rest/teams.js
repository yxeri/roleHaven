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
const teamData = require('./testData/teams');
const teamSchemas = require('./schemas/teams');
const authenticateSchemas = require('./schemas/authentications');
const userSchemas = require('./schemas/users');
const invitationSchemas = require('./schemas/invitations');

chai.should();
chai.use(chaiHttp);
chai.use(chaiJson);

describe('Teams', () => {
  const teamTokens = {
    teamCreator: '',
    teamInviter: '',
    teamInvitee: '',
  };

  describe('Create team', () => {
    before(`Create user ${teamData.userToCreateTeamWith.userName} on /api/users POST`, (done) => {
      chai
        .request(app)
        .post('/api/users')
        .send({ data: { user: teamData.userToCreateTeamWith } })
        .set('Authorization', tokens.adminUser)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(userSchemas.user);
          done();
        });
    });

    before(`Authenticate ${teamData.userToCreateTeamWith.userName} on /api/authenticate`, (done) => {
      chai
        .request(app)
        .post('/api/authenticate')
        .send({ data: { user: teamData.userToCreateTeamWith } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(authenticateSchemas.authenticate);

          teamTokens.teamCreator = response.body.data.token;

          done();
        });
    });

    it('Should NOT create team with incorrect authorization on /api/teams POST', (done) => {
      chai
        .request(app)
        .post('/api/teams')
        .send({ data: { team: teamData.teamToCreate } })
        .set('Authorization', tokens.incorrectJwt)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should create team on /api/teams POST', (done) => {
      chai
        .request(app)
        .post('/api/teams/')
        .send({ data: { team: teamData.teamToCreate } })
        .set('Authorization', teamTokens.teamCreator)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(teamSchemas.team);
          response.body.data.team.owner.should.equal(teamData.userToCreateTeamWith.userName);

          done();
        });
    });

    describe('Create existing team', () => {
      let token = '';

      before(`Create user ${teamData.anotherUserToCreateTeam.userName} on /api/users POST`, (done) => {
        chai
          .request(app)
          .post('/api/users')
          .send({ data: { user: teamData.anotherUserToCreateTeam } })
          .set('Authorization', tokens.adminUser)
          .end((error, response) => {
            response.should.have.status(200);
            response.should.be.json;
            response.body.should.be.jsonSchema(userSchemas.user);
            done();
          });
      });

      before(`Authenticate ${teamData.anotherUserToCreateTeam.userName} on /api/authenticate`, (done) => {
        chai
          .request(app)
          .post('/api/authenticate')
          .send({ data: { user: teamData.anotherUserToCreateTeam } })
          .end((error, response) => {
            response.should.have.status(200);
            response.should.be.json;
            response.body.should.be.jsonSchema(authenticateSchemas.authenticate);

            token = response.body.data.token;

            done();
          });
      });

      before(`Create team ${teamData.teamToTryAndCreateTwice.teamName} on /api/teams POST`, (done) => {
        chai
          .request(app)
          .post('/api/teams/')
          .send({ data: { team: teamData.teamToTryAndCreateTwice } })
          .set('Authorization', token)
          .end((error, response) => {
            response.should.have.status(200);
            response.should.be.json;
            response.body.should.be.jsonSchema(teamSchemas.team);
            response.body.data.team.owner.should.equal(teamData.anotherUserToCreateTeam.userName);

            done();
          });
      });

      it('Should NOT create team with existing team name on /api/teams POST', (done) => {
        chai
          .request(app)
          .post('/api/teams/')
          .send({ data: { team: teamData.teamWithExistingTeamName } })
          .set('Authorization', tokens.basicUser)
          .end((error, response) => {
            response.should.have.status(403);
            response.should.be.json;
            response.body.should.be.jsonSchema(errorSchemas.error);

            done();
          });
      });

      it('Should NOT create team with existing short name on /api/teams POST', (done) => {
        chai
          .request(app)
          .post('/api/teams/')
          .send({ data: { team: teamData.teamWithExistingShortName } })
          .set('Authorization', tokens.basicUser)
          .end((error, response) => {
            response.should.have.status(403);
            response.should.be.json;
            response.body.should.be.jsonSchema(errorSchemas.error);

            done();
          });
      });
    });
  });

  describe('List teams', () => {
    it('Should NOT list teams with incorrect authorization on /api/teams GET', (done) => {
      chai
        .request(app)
        .get('/api/teams')
        .set('Authorization', tokens.incorrectJwt)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should list teams on /api/lanternStations GET', (done) => {
      chai
        .request(app)
        .get('/api/teams')
        .set('Authorization', tokens.adminUser)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(teamSchemas.teams);

          done();
        });
    });
  });

  describe('Get team', () => {
    it('Should NOT get team with incorrect authorization on /api/teams/:id GET', (done) => {
      chai
        .request(app)
        .get(`/api/teams/${teamData.teamToCreate.teamName}`)
        .set('Authorization', tokens.incorrectJwt)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should get existing team on /api/teams/:id GET', (done) => {
      chai
        .request(app)
        .get(`/api/teams/${teamData.teamToCreate.teamName}`)
        .set('Authorization', tokens.incorrectJwt)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should NOT get non-existing team on /api/teams/:id GET', (done) => {
      chai
        .request(app)
        .get(`/api/teams/${teamData.teamDoesNotExist.teamName}`)
        .set('Authorization', tokens.adminUser)
        .end((error, response) => {
          response.should.have.status(404);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });
  });

  describe('Invite user to team', () => {
    before('Create user to create team with on /api/users POST', (done) => {
      chai
        .request(app)
        .post('/api/users')
        .set('Authorization', tokens.adminUser)
        .send({ data: { user: teamData.userToCreateTeamAndSendInvitation } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(userSchemas.user);
          done();
        });
    });

    before('Create user to invite on /api/users POST', (done) => {
      chai
        .request(app)
        .post('/api/users')
        .set('Authorization', tokens.adminUser)
        .send({ data: { user: teamData.userToInvite } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(userSchemas.user);
          done();
        });
    });

    before(`Authenticate ${teamData.userToCreateTeamAndSendInvitation.userName} on /api/authenticate`, (done) => {
      chai
        .request(app)
        .post('/api/authenticate')
        .send({ data: { user: teamData.userToCreateTeamAndSendInvitation } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(authenticateSchemas.authenticate);

          teamTokens.teamInviter = response.body.data.token;

          done();
        });
    });

    before(`Authenticate ${teamData.userToInvite.userName} on /api/authenticate`, (done) => {
      chai
        .request(app)
        .post('/api/authenticate')
        .send({ data: { user: teamData.userToInvite } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(authenticateSchemas.authenticate);

          teamTokens.teamInvitee = response.body.data.token;

          done();
        });
    });

    before('Create team on /api/teams POST', (done) => {
      chai
        .request(app)
        .post('/api/teams/')
        .send({ data: { team: teamData.teamToCreateAndInviteTo } })
        .set('Authorization', teamTokens.teamInviter)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(teamSchemas.team);
          response.body.data.team.owner.should.equal(teamData.userToCreateTeamAndSendInvitation.userName);

          done();
        });
    });

    it('Should NOT send team invite with incorrect authorization on /api/teams/:id/invite POST', (done) => {
      chai
        .request(app)
        .post(`/api/teams/users/${teamData.userToInvite.userName}/invite`)
        .set('Authorization', tokens.incorrectJwt)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should NOT send team invite if not in team on /api/teams/:id/invite POST', (done) => {
      chai
        .request(app)
        .post(`/api/teams/users/${teamData.userToInvite.userName}/invite`)
        .set('Authorization', tokens.adminUser)
        .end((error, response) => {
          response.should.have.status(404);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should send team invite on /api/teams/:id/invite POST', (done) => {
      chai
        .request(app)
        .post(`/api/teams/users/${teamData.userToInvite.userName}/invite`)
        .set('Authorization', teamTokens.teamInviter)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(invitationSchemas.invitation);

          done();
        });
    });

    // TODO Should NOT send invite already exists
  });
});
