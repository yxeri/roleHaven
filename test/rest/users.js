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
const userSchemas = require('./schemas/users');
const authenticateSchemas = require('./schemas/authentications');
const successSchemas = require('./schemas/successes');
const errorSchemas = require('./schemas/errors');
const tokens = require('./testData/tokens');
const userData = require('./testData/users');
const aliasData = require('./testData/aliases');
const aliasSchemas = require('./schemas/aliases');
const roomSchemas = require('./schemas/rooms');
const starterData = require('./testData/starter');
// const calibrationMissionSchemas = require('./schemas/calibrationMissions');
const dbMailEvent = require('../../db/connectors/mailEvent');
const positionSchemas = require('./schemas/positions');
const positionData = require('./testData/positions');
// const lanternStationSchemas = require('./schemas/lanternStations');

chai.should();

chai.use(chaiHttp);
chai.use(chaiJson);

describe('Users', () => {
  const userTokens = {
    newUser: '',
    adminUser: '',
  };

  // /users POST Create user
  // /users GET Get users
  // /users/:userName GET Get specific user

  // /users/:userName/resetPassword POST Send password recovery mail

  describe('Create user', () => {
    it('Should NOT create user with incorrect authorization on /api/users POST', (done) => {
      chai
        .request(app)
        .post('/api/users')
        .set('Authorization', tokens.incorrectJwt)
        .send({ data: { user: userData.newUserToCreate } })
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);
          done();
        });
    });

    it('Should create user on /api/users POST', (done) => {
      chai
        .request(app)
        .post('/api/users')
        .set('Authorization', tokens.adminUser)
        .send({ data: { user: userData.newUserToCreate } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(userSchemas.user);
          done();
        });
    });

    after('Create admin user on /api/users POST', (done) => {
      chai
        .request(app)
        .post('/api/users')
        .set('Authorization', tokens.adminUser)
        .send({ data: { user: userData.newAdminUserToCreate } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(userSchemas.user);
          done();
        });
    });

    after(`Authenticate ${userData.newUserToCreate.userName} on /api/authenticate`, (done) => {
      chai
        .request(app)
        .post('/api/authenticate')
        .send({ data: { user: userData.newUserToCreate } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(authenticateSchemas.authenticate);

          userTokens.newUser = response.body.data.token;

          done();
        });
    });

    after(`Authenticate ${userData.newAdminUserToCreate.userName} on /api/authenticate`, (done) => {
      chai
        .request(app)
        .post('/api/authenticate')
        .send({ data: { user: userData.newAdminUserToCreate } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(authenticateSchemas.authenticate);

          userTokens.adminUser = response.body.data.token;

          done();
        });
    });
  });

  describe('Request password recovery for user', () => {
    it('Should NOT create and send password reset with incorrect authorization on /api/users/:userName/password/reset POST', (done) => {
      chai
        .request(app)
        .post(`/api/users/${userData.newUserToCreate.userName}/password/reset`)
        .set('Authorization', tokens.incorrectJwt)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should create and send password reset mail to existing user on /api/users/:userName/password/reset POST', (done) => {
      chai
        .request(app)
        .post(`/api/users/${userData.newUserToCreate.userName}/password/reset`)
        .set('Authorization', userTokens.newUser)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(successSchemas.success);

          done();
        });
    });

    it('Should NOT create and send password reset to non-existing user by mail on /api/users/:userName/password/reset POST', (done) => {
      chai
        .request(app)
        .post(`/api/users/${userData.nonExistingUser.userName}/password/reset`)
        .set('Authorization', tokens.adminUser)
        .end((error, response) => {
          response.should.have.status(404);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });
  });

  describe('Change password', () => {
    let passwordKey = '';

    before('Create and send password reset mail to existing user on /api/users/:userName/password/reset POST', (done) => {
      chai
        .request(app)
        .post(`/api/users/${userData.newAdminUserToCreate.userName}/password/reset`)
        .set('Authorization', userTokens.adminUser)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(successSchemas.success);

          dbMailEvent.getMailEvent({
            owner: userData.newAdminUserToCreate.userName,
            eventType: 'password',
            callback: ({ data }) => {
              passwordKey = data.event.key;

              done();
            },
          });
        });
    });

    it('Should NOT change password with user name and event owner mismatch on /api/users/:userName/password POST', (done) => {
      chai
        .request(app)
        .post(`/api/users/${userData.newUserToCreate.userName}/password`)
        .send({ data: { key: passwordKey, password: '1234' } })
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should NOT change password with incorrect key on /api/users/:userName/password POST', (done) => {
      chai
        .request(app)
        .post(`/api/users/${userData.newAdminUserToCreate.userName}/password`)
        .send({ data: { key: `${passwordKey}a`, password: '1234' } })
        .end((error, response) => {
          response.should.have.status(404);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should change password with correct key on /api/users/:userName/password POST', (done) => {
      chai
        .request(app)
        .post(`/api/users/${userData.newAdminUserToCreate.userName}/password`)
        .send({ data: { key: passwordKey, password: '1234' } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(successSchemas.success);

          done();
        });
    });
  });

  describe('Get users', () => {
    it('Should NOT get users with incorrect authorization set on /api/users GET', (done) => {
      chai
        .request(app)
        .get('/api/users')
        .set('Authorization', tokens.incorrectJwt)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should get users on /api/users GET', (done) => {
      chai
        .request(app)
        .get('/api/users')
        .set('Authorization', tokens.adminUser)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(userSchemas.users);

          // TODO Check that users retrieved have lower access level/visibility

          done();
        });
    });
  });

  describe('Get banned users', () => {
    it('Should NOT get banned users with incorrect authorization set on /api/users/banned GET', (done) => {
      chai
        .request(app)
        .get('/api/users/banned')
        .set('Authorization', tokens.incorrectJwt)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should get banned users on /api/users/banned GET', (done) => {
      chai
        .request(app)
        .get('/api/users/banned')
        .set('Authorization', tokens.adminUser)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(userSchemas.userNames);

          // TODO Check that users retrieved have lower access level/visibility

          done();
        });
    });
  });

  describe('Get specific user', () => {
    it('Should NOT retrieve specific user with incorrect authorization set on /api/users/:userName GET', (done) => {
      chai
        .request(app)
        .get(`/api/users/${userData.newUserToCreate.userName}`)
        .set('Authorization', tokens.incorrectJwt)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);
          done();
        });
    });

    it('Should retrieve own user on /api/users/:userName GET', (done) => {
      chai
        .request(app)
        .get(`/api/users/${userData.newUserToCreate.userName}`)
        .set('Authorization', userTokens.newUser)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(userSchemas.user);
          done();
        });
    });

    it('Should NOT get user with higher access level than user on /api/users/:userName GET', (done) => {
      chai
        .request(app)
        .get(`/api/users/${userData.newAdminUserToCreate.userName}`)
        .set('Authorization', userTokens.newUser)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);
          done();
        });
    });

    it('Should NOT get non-existing user on /api/users/:userName GET', (done) => {
      chai
        .request(app)
        .get(`/api/users/${userData.nonExistingUser.userName}`)
        .set('Authorization', userTokens.newUser)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);
          done();
        });
    });
  });

  describe('Aliases', () => {
    describe('Create alias on self', () => {
      it('Should NOT create an alias on self that is too long /api/users/:userName/aliases POST', (done) => {
        chai
          .request(app)
          .post(`/api/users/${userData.newUserToCreate.userName}/aliases`)
          .send({ data: { alias: aliasData.tooLongAlias } })
          .set('Authorization', userTokens.newUser)
          .end((error, response) => {
            response.should.have.status(400);
            response.should.be.json;
            response.body.should.be.jsonSchema(errorSchemas.error);

            done();
          });
      });

      it('Should NOT create an alias on self with incorrect authorization on /api/users/:userName/aliases POST', (done) => {
        chai
          .request(app)
          .post(`/api/users/${userData.newUserToCreate.userName}/aliases`)
          .send({ data: { alias: aliasData.aliasToCreate } })
          .set('Authorization', tokens.incorrectJwt)
          .end((error, response) => {
            response.should.have.status(401);
            response.should.be.json;
            response.body.should.be.jsonSchema(errorSchemas.error);

            done();
          });
      });

      it('Should create an alias on self on /api/users/:userName/aliases POST', (done) => {
        chai
          .request(app)
          .post(`/api/users/${userData.newUserToCreate.userName}/aliases`)
          .send({ data: { alias: aliasData.aliasToCreate } })
          .set('Authorization', userTokens.newUser)
          .end((error, response) => {
            response.should.have.status(200);
            response.should.be.json;
            response.body.should.be.jsonSchema(aliasSchemas.alias);

            done();
          });
      });

      describe('Create existing alias', () => {
        before('Create an alias on self on /api/users/:userName/aliases POST', (done) => {
          chai
            .request(app)
            .post(`/api/users/${userData.newUserToCreate.userName}/aliases`)
            .send({ data: { alias: aliasData.aliasThatExists } })
            .set('Authorization', tokens.adminUser)
            .end((error, response) => {
              response.should.have.status(200);
              response.should.be.json;
              response.body.should.be.jsonSchema(aliasSchemas.alias);

              done();
            });
        });

        it('Should NOT create an existing alias on self on /api/users/:userName/aliases POST', (done) => {
          chai
            .request(app)
            .post(`/api/users/${userData.newUserToCreate.userName}/aliases`)
            .send({ data: { alias: aliasData.aliasThatExists } })
            .set('Authorization', userTokens.adminUser)
            .end((error, response) => {
              response.should.have.status(403);
              response.should.be.json;
              response.body.should.be.jsonSchema(errorSchemas.error);

              done();
            });
        });
      });
    });

    describe('Create alias on user', () => {
      it('Should create an alias on user on /api/users/:userName/aliases POST', (done) => {
        chai
          .request(app)
          .post(`/api/users/${userData.newUserToCreate.userName}/aliases`)
          .send({ data: { alias: aliasData.otherAliasToCreate } })
          .set('Authorization', tokens.adminUser)
          .end((error, response) => {
            response.should.have.status(200);
            response.should.be.json;
            response.body.should.be.jsonSchema(aliasSchemas.alias);

            done();
          });
      });
    });

    describe('Get aliases from user', () => {
      it('Should NOT retrieve aliases with incorrect authorization on /api/users/:userName/aliases GET', (done) => {
        chai
          .request(app)
          .get(`/api/users/${userData.newUserToCreate.userName}/aliases`)
          .set('Authorization', tokens.incorrectJwt)
          .end((error, response) => {
            response.should.have.status(401);
            response.should.be.json;
            response.body.should.be.jsonSchema(errorSchemas.error);

            done();
          });
      });

      it('Should retrieve aliases from user on /api/users/:userName/aliases GET', (done) => {
        chai
          .request(app)
          .get(`/api/users/${userData.newUserToCreate.userName}/aliases`)
          .set('Authorization', tokens.adminUser)
          .end((error, response) => {
            response.should.have.status(200);
            response.should.be.json;
            response.body.should.be.jsonSchema(aliasSchemas.aliases);

            done();
          });
      });
    });

    describe('Match partial alias from user', () => {
      it('Should NOT match partial alias with incorrect authorization on /api/users/:userName/aliases/:partialName/match GET', (done) => {
        chai
          .request(app)
          .get(`/api/users/${userData.newUserToCreate.userName}/aliases/${userData.alias}/match`)
          .set('Authorization', tokens.incorrectJwt)
          .end((error, response) => {
            response.should.have.status(401);
            response.should.be.json;
            response.body.should.be.jsonSchema(errorSchemas.error);

            done();
          });
      });

      it('Should match partial alias for user on /api/users/:userName/aliases GET', (done) => {
        chai
          .request(app)
          .get(`/api/users/${starterData.adminUserToAuth.userName}/aliases/${userData.alias}/match`)
          .set('Authorization', tokens.adminUser)
          .end((error, response) => {
            response.should.have.status(200);
            response.should.be.json;
            response.body.should.be.jsonSchema(aliasSchemas.matches);

            done();
          });
      });
    });
  });

  describe('Rooms', () => {
    describe('Follow room on user', () => {
      before(`Create room ${userData.publicRoomToCreate.roomName} on /api/rooms`, (done) => {
        chai
          .request(app)
          .post('/api/rooms')
          .set('Authorization', tokens.adminUser)
          .send({ data: { room: userData.publicRoomToCreate } })
          .end((error, response) => {
            response.should.have.status(200);
            response.should.be.json;
            response.body.should.be.jsonSchema(roomSchemas.room);

            done();
          });
      });

      before(`Create room ${userData.highAccessLevelRoomToCreate.roomName} on /api/rooms`, (done) => {
        chai
          .request(app)
          .post('/api/rooms')
          .set('Authorization', tokens.adminUser)
          .send({ data: { room: userData.highAccessLevelRoomToCreate } })
          .end((error, response) => {
            response.should.have.status(200);
            response.should.be.json;
            response.body.should.be.jsonSchema(roomSchemas.room);

            done();
          });
      });

      before(`Create room ${userData.invisibleRoomToCreate.roomName} on /api/rooms`, (done) => {
        chai
          .request(app)
          .post('/api/rooms')
          .set('Authorization', tokens.adminUser)
          .send({ data: { room: userData.invisibleRoomToCreate } })
          .end((error, response) => {
            response.should.have.status(200);
            response.should.be.json;
            response.body.should.be.jsonSchema(roomSchemas.room);

            done();
          });
      });

      it('Should NOT follow room with incorrect authorization on /api/users/:userName/rooms/:roomName/follow GET', (done) => {
        chai
          .request(app)
          .post(`/api/users/${starterData.basicUserToAuth.userName}/rooms/${userData.publicRoomToCreate.roomName}/follow`)
          .set('Authorization', tokens.incorrectJwt)
          .end((error, response) => {
            response.should.have.status(401);
            response.should.be.json;
            response.body.should.be.jsonSchema(errorSchemas.error);

            done();
          });
      });

      it('Should follow room with lower or equal access level to user\'s access level on /api/users/:userName/rooms/:roomName/follow POST', (done) => {
        chai
          .request(app)
          .post(`/api/users/${starterData.basicUserToAuth.userName}/rooms/${userData.publicRoomToCreate.roomName}/follow`)
          .set('Authorization', tokens.basicUser)
          .end((error, response) => {
            response.should.have.status(200);
            response.should.be.json;
            response.body.should.be.jsonSchema(roomSchemas.room);
            response.body.data.room.accessLevel.should.satisfy(value => value <= userData.publicRoomToCreate.accessLevel);

            done();
          });
      });

      it('Should NOT follow room with higher access level than user\'s access level on /api/users/:userName/rooms/:roomName/follow POST', (done) => {
        chai
          .request(app)
          .post(`/api/users/${starterData.basicUserToAuth.userName}/rooms/${userData.highAccessLevelRoomToCreate.roomName}/follow`)
          .set('Authorization', tokens.basicUser)
          .end((error, response) => {
            response.should.have.status(401);
            response.should.be.json;
            response.body.should.be.jsonSchema(errorSchemas.error);

            done();
          });
      });

      it('Should follow room with higher visibility than user\'s access level on /api/users/:userName/rooms/:roomName/follow POST', (done) => {
        chai
          .request(app)
          .post(`/api/users/${starterData.basicUserToAuth.userName}/rooms/${userData.invisibleRoomToCreate.roomName}/follow`)
          .set('Authorization', tokens.basicUser)
          .end((error, response) => {
            response.should.have.status(200);
            response.should.be.json;
            response.body.should.be.jsonSchema(roomSchemas.room);

            done();
          });
      });
    });

    describe('Follow password-protected room', () => {
      before(`Create room ${userData.passwordProtectedRoomToCreate.roomName} on /api/rooms`, (done) => {
        chai
          .request(app)
          .post('/api/rooms')
          .set('Authorization', tokens.adminUser)
          .send({ data: { room: userData.passwordProtectedRoomToCreate } })
          .end((error, response) => {
            response.should.have.status(200);
            response.should.be.json;
            response.body.should.be.jsonSchema(roomSchemas.room);

            done();
          });
      });

      it('Should NOT follow password-protected with incorrect authorization on /api/users/:userName/rooms/:roomName/follow POST', (done) => {
        chai
          .request(app)
          .post(`/api/users/${starterData.basicUserToAuth.userName}/rooms/${userData.passwordProtectedRoomToCreate.roomName}/follow`)
          .set('Authorization', tokens.incorrectJwt)
          .send({ data: { room: { password: userData.passwordProtectedRoomToCreate.password } } })
          .end((error, response) => {
            response.should.have.status(401);
            response.should.be.json;
            response.body.should.be.jsonSchema(errorSchemas.error);

            done();
          });
      });

      it('Should NOT follow password-protected room with incorrect password on /api/users/:userName/rooms/:roomName/follow POST', (done) => {
        chai
          .request(app)
          .post(`/api/users/${starterData.basicUserToAuth.userName}/rooms/${userData.passwordProtectedRoomToCreate.roomName}/follow`)
          .set('Authorization', tokens.basicUser)
          .send({ data: { room: { password: userData.incorrectPassword } } })
          .end((error, response) => {
            response.should.have.status(401);
            response.should.be.json;
            response.body.should.be.jsonSchema(errorSchemas.error);

            done();
          });
      });

      it('Should follow password-protected room with correct password on /api/users/:userName/rooms/:roomName/follow POST', (done) => {
        chai
          .request(app)
          .post(`/api/users/${starterData.basicUserToAuth.userName}/rooms/${userData.passwordProtectedRoomToCreate.roomName}/follow`)
          .set('Authorization', tokens.basicUser)
          .send({ data: { room: { password: userData.passwordProtectedRoomToCreate.password } } })
          .end((error, response) => {
            response.should.have.status(200);
            response.should.be.json;
            response.body.should.be.jsonSchema(roomSchemas.room);

            done();
          });
      });

      it('Should follow password-protected room without password if owner on /api/users/:userName/rooms/:roomName/follow POST', (done) => {
        chai
          .request(app)
          .post(`/api/users/${starterData.adminUserToAuth.userName}/rooms/${userData.passwordProtectedRoomToCreate.roomName}/follow`)
          .set('Authorization', tokens.adminUser)
          .end((error, response) => {
            response.should.have.status(200);
            response.should.be.json;
            response.body.should.be.jsonSchema(roomSchemas.room);

            done();
          });
      });
    });

    describe('Unfollow room', () => {
      before(`Create room ${userData.roomToCreate.roomName} on /api/rooms`, (done) => {
        chai
          .request(app)
          .post('/api/rooms')
          .set('Authorization', tokens.basicUser)
          .send({ data: { room: userData.roomToCreate } })
          .end((error, response) => {
            response.should.have.status(200);
            response.should.be.json;
            response.body.should.be.jsonSchema(roomSchemas.room);

            done();
          });
      });

      it('Follow room on /api/users/:userName/rooms/:roomName/follow POST', (done) => {
        chai
          .request(app)
          .post(`/api/users/${starterData.basicUserToAuth.userName}/rooms/${userData.roomToCreate.roomName}/follow`)
          .set('Authorization', tokens.basicUser)
          .end((error, response) => {
            response.should.have.status(200);
            response.should.be.json;
            response.body.should.be.jsonSchema(roomSchemas.room);

            done();
          });
      });

      it('Should NOT unfollow with incorrect authorization on /api/users/:userName/rooms/:roomName/unfollow GET', (done) => {
        chai
          .request(app)
          .post(`/api/users/${starterData.basicUserToAuth.userName}/rooms/${userData.roomToCreate.roomName}/unfollow`)
          .set('Authorization', tokens.incorrectJwt)
          .end((error, response) => {
            response.should.have.status(401);
            response.should.be.json;
            response.body.should.be.jsonSchema(errorSchemas.error);

            done();
          });
      });

      it('Should unfollow room that is followed /api/users/:userName/rooms/:roomName/unfollow POST', (done) => {
        chai
          .request(app)
          .post(`/api/users/${starterData.basicUserToAuth.userName}/rooms/${userData.roomToCreate.roomName}/unfollow`)
          .set('Authorization', tokens.basicUser)
          .end((error, response) => {
            response.should.have.status(200);
            response.should.be.json;
            response.body.should.be.jsonSchema(roomSchemas.unfollowRoom);

            done();
          });
      });

      it('Should NOT unfollow room that is not followed /api/users/rooms/:roomName/unfollow POST', (done) => {
        chai
          .request(app)
          .post(`/api/users/${starterData.basicUserToAuth.userName}/rooms/${userData.roomThatDoesNotExist.roomName}/unfollow`)
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

  // describe('Update calibration mission', () => {
  //   before('Create lantern station on /api/lanternStations POST', (done) => {
  //     chai
  //       .request(app)
  //       .post('/api/lanternStations/')
  //       .send({ data: { station: userData.lanternStationToCreate } })
  //       .set('Authorization', tokens.adminUser)
  //       .end((error, response) => {
  //         response.should.have.status(200);
  //         response.should.be.json;
  //         response.body.should.be.jsonSchema(lanternStationSchemas.lanternStation);
  //
  //         done();
  //       });
  //   });
  //
  //   before('Create lantern station on /api/lanternStations POST', (done) => {
  //     chai
  //       .request(app)
  //       .post('/api/lanternStations/')
  //       .send({ data: { station: userData.anotherLanternStationToCreate } })
  //       .set('Authorization', tokens.adminUser)
  //       .end((error, response) => {
  //         response.should.have.status(200);
  //         response.should.be.json;
  //         response.body.should.be.jsonSchema(lanternStationSchemas.lanternStation);
  //
  //         done();
  //       });
  //   });
  //
  //   before('Create lantern station on /api/lanternStations POST', (done) => {
  //     chai
  //       .request(app)
  //       .post('/api/lanternStations/')
  //       .send({ data: { station: userData.aThirdLanternStationToCreate } })
  //       .set('Authorization', tokens.adminUser)
  //       .end((error, response) => {
  //         response.should.have.status(200);
  //         response.should.be.json;
  //         response.body.should.be.jsonSchema(lanternStationSchemas.lanternStation);
  //
  //         done();
  //       });
  //   });
  //
  //   describe('Get calibration mission', () => {
  //     it('Should NOT retrieve active calibration mission for user with incorrect authorization on /api/users/:userName/calibrationMission GET', (done) => {
  //       chai
  //         .request(app)
  //         .get(`/api/users/${userData.newUserToCreate.userName}/calibrationMission`)
  //         .set('Authorization', tokens.incorrectJwt)
  //         .end((error, response) => {
  //           response.should.have.status(401);
  //           response.should.be.json;
  //           response.body.should.be.jsonSchema(errorSchemas.error);
  //
  //           done();
  //         });
  //     });
  //
  //     it('Should get active calibration mission for other user with enough permission on /api/users/:userName/calibrationMission GET', (done) => {
  //       chai
  //         .request(app)
  //         .get(`/api/users/${userData.newUserToCreate.userName}/calibrationMission`)
  //         .set('Authorization', tokens.adminUser)
  //         .end((error, response) => {
  //           response.should.have.status(200);
  //           response.should.be.json;
  //           response.body.should.be.jsonSchema(calibrationMissionSchemas.calibrationMission);
  //           response.body.data.mission.owner.should.equal(userData.newUserToCreate.userName);
  //
  //           done();
  //         });
  //     });
  //
  //     it('Should get active calibration mission for self on /api/users/:userName/calibrationMission GET', (done) => {
  //       chai
  //         .request(app)
  //         .get(`/api/users/${userData.newUserToCreate.userName}/calibrationMission`)
  //         .set('Authorization', userTokens.newUser)
  //         .end((error, response) => {
  //           response.should.have.status(200);
  //           response.should.be.json;
  //           response.body.should.be.jsonSchema(calibrationMissionSchemas.calibrationMission);
  //           response.body.data.mission.owner.should.equal(userData.newUserToCreate.userName);
  //
  //           done();
  //         });
  //     });
  //   });
  //
  //   describe('Complete calibration mission', () => {
  //     before('Get calibration mission for user on /api/users/:userName/calibrationMission GET', (done) => {
  //       chai
  //         .request(app)
  //         .get(`/api/users/${userData.newUserToCreate.userName}/calibrationMission`)
  //         .set('Authorization', tokens.adminUser)
  //         .end((error, response) => {
  //           response.should.have.status(200);
  //           response.should.be.json;
  //           response.body.should.be.jsonSchema(calibrationMissionSchemas.calibrationMission);
  //
  //           done();
  //         });
  //     });
  //
  //     it('Should NOT complete calibration mission with incorrect authorization /api/users/:userName/calibrationMission/complete POST', (done) => {
  //       chai
  //         .request(app)
  //         .post(`/api/users/${userData.newUserToCreate.userName}/calibrationMission/complete`)
  //         .set('Authorization', tokens.incorrectJwt)
  //         .end((error, response) => {
  //           response.should.have.status(401);
  //           response.should.be.json;
  //           response.body.should.be.jsonSchema(errorSchemas.error);
  //
  //           done();
  //         });
  //     });
  //
  //     it('Should complete calibration mission for user on /api/users/:userName/calibrationMission/complete POST', (done) => {
  //       chai
  //         .request(app)
  //         .post(`/api/users/${userData.newUserToCreate.userName}/calibrationMission/complete`)
  //         .set('Authorization', tokens.adminUser)
  //         .end((error, response) => {
  //           response.should.have.status(200);
  //           response.should.be.json;
  //           response.body.should.be.jsonSchema(calibrationMissionSchemas.calibrationMission);
  //           response.body.data.mission.completed.should.equal(true);
  //           response.body.data.mission.timeCompleted.should.exist;
  //
  //           done();
  //         });
  //     });
  //
  //     describe('Correct completed mission data', () => {
  //       let completedMission = {};
  //
  //       before('Get active calibration mission for user on /api/users/:userName/calibrationMission GET', (done) => {
  //         chai
  //           .request(app)
  //           .get(`/api/users/${userData.newUserToCreate.userName}/calibrationMission`)
  //           .set('Authorization', tokens.adminUser)
  //           .end((error, response) => {
  //             response.should.have.status(200);
  //             response.should.be.json;
  //             response.body.should.be.jsonSchema(calibrationMissionSchemas.calibrationMission);
  //
  //             completedMission = response.body.data.mission;
  //
  //             done();
  //           });
  //       });
  //
  //       before('Complete calibration mission for user on /api/users/:userName/calibrationMission/complete POST', (done) => {
  //         chai
  //           .request(app)
  //           .post(`/api/users/${userData.newUserToCreate.userName}/calibrationMission/complete`)
  //           .set('Authorization', tokens.adminUser)
  //           .end((error, response) => {
  //             response.should.have.status(200);
  //             response.should.be.json;
  //             response.body.should.be.jsonSchema(calibrationMissionSchemas.calibrationMission);
  //
  //             completedMission = response.body.data.mission;
  //
  //             done();
  //           });
  //       });
  //
  //       it('Should get new active calibration mission for user and it should NOT have the same station ID nor code as the completed mission on /api/users/:userName/calibrationMissions GET', (done) => {
  //         chai
  //           .request(app)
  //           .get(`/api/users/${userData.newUserToCreate.userName}/calibrationMission`)
  //           .set('Authorization', tokens.adminUser)
  //           .end((error, response) => {
  //             response.should.have.status(200);
  //             response.should.be.json;
  //             response.body.should.be.jsonSchema(calibrationMissionSchemas.calibrationMission);
  //             response.body.data.mission.stationId.should.not.equal(completedMission.stationId);
  //             response.body.data.mission.code.should.not.equal(completedMission.code);
  //             response.body.data.mission.owner.should.equal(userData.newUserToCreate.userName);
  //
  //             done();
  //           });
  //       });
  //     });
  //   });
  //
  //   describe('Cancel calibration mission', () => {
  //     before('Get active calibration mission for user on /api/users/:userName/calibrationMission GET', (done) => {
  //       chai
  //         .request(app)
  //         .get(`/api/users/${userData.newUserToCreate.userName}/calibrationMission`)
  //         .set('Authorization', tokens.adminUser)
  //         .end((error, response) => {
  //           response.should.have.status(200);
  //           response.should.be.json;
  //           response.body.should.be.jsonSchema(calibrationMissionSchemas.calibrationMission);
  //
  //           done();
  //         });
  //     });
  //
  //     it('Should NOT cancel calibration mission with incorrect authorization on /api/users/:userName/calibrationMission/cancel POST', (done) => {
  //       chai
  //         .request(app)
  //         .post(`/api/users/${userData.newUserToCreate.userName}/calibrationMission/cancel`)
  //         .set('Authorization', tokens.incorrectJwt)
  //         .end((error, response) => {
  //           response.should.have.status(401);
  //           response.should.be.json;
  //           response.body.should.be.jsonSchema(errorSchemas.error);
  //
  //           done();
  //         });
  //     });
  //
  //     it('Should cancel active calibration mission on /api/users/:userName/calibrationMission/cancel POST', (done) => {
  //       chai
  //         .request(app)
  //         .post(`/api/users/${userData.newUserToCreate.userName}/calibrationMission/cancel`)
  //         .set('Authorization', tokens.adminUser)
  //         .end((error, response) => {
  //           response.should.have.status(200);
  //           response.should.be.json;
  //           response.body.should.be.jsonSchema(calibrationMissionSchemas.calibrationMission);
  //
  //           done();
  //         });
  //     });
  //
  //     it('Should NOT cancel non-existing calibrationMission on /api/users/:userName/calibrationMission/cancel POST', (done) => {
  //       chai
  //         .request(app)
  //         .post(`/api/users/${starterData.adminUserToAuth.userName}/calibrationMission/cancel`)
  //         .set('Authorization', tokens.adminUser)
  //         .end((error, response) => {
  //           response.should.have.status(404);
  //           response.should.be.json;
  //           response.body.should.be.jsonSchema(errorSchemas.error);
  //
  //           done();
  //         });
  //     });
  //
  //     describe('Correct cancelled mission data', () => {
  //       let cancelledMission = {};
  //
  //       before('Get active calibration mission for user on /api/users/:userName/calibrationMissions GET', (done) => {
  //         chai
  //           .request(app)
  //           .get(`/api/users/${userData.newUserToCreate.userName}/calibrationMission`)
  //           .set('Authorization', tokens.adminUser)
  //           .end((error, response) => {
  //             response.should.have.status(200);
  //             response.should.be.json;
  //             response.body.should.be.jsonSchema(calibrationMissionSchemas.calibrationMission);
  //
  //             cancelledMission = response.body.data.mission;
  //
  //             done();
  //           });
  //       });
  //
  //       before('Cancel active calibration mission for user on /api/users/:userName/calibrationMissions/cancel POST', (done) => {
  //         chai
  //           .request(app)
  //           .post(`/api/users/${userData.newUserToCreate.userName}/calibrationMission/cancel`)
  //           .set('Authorization', tokens.adminUser)
  //           .end((error, response) => {
  //             response.should.have.status(200);
  //             response.should.be.json;
  //             response.body.should.be.jsonSchema(calibrationMissionSchemas.calibrationMission);
  //
  //             cancelledMission = response.body.data.mission;
  //
  //             done();
  //           });
  //       });
  //
  //       it('Should get new active calibration mission for current user and it should NOT be the same as the cancelled mission on /api/users/:userName/calibrationMission GET', (done) => {
  //         chai
  //           .request(app)
  //           .get(`/api/users/${userData.newUserToCreate.userName}/calibrationMission`)
  //           .set('Authorization', userTokens.newUser)
  //           .end((error, response) => {
  //             response.should.have.status(200);
  //             response.should.be.json;
  //             response.body.should.be.jsonSchema(calibrationMissionSchemas.calibrationMission);
  //             response.body.data.mission.stationId.should.not.equal(cancelledMission.stationId);
  //             response.body.data.mission.should.not.equal(cancelledMission);
  //
  //             done();
  //           });
  //       });
  //     });
  //   });
  // });

  describe('User positions', () => {
    const positionTokens = {
      basic: '',
      admin: '',
    };

    before('Create admin user on /api/users POST', (done) => {
      chai
        .request(app)
        .post('/api/users')
        .set('Authorization', tokens.adminUser)
        .send({ data: { user: positionData.adminUserToCreateAndGetPositionFrom } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(userSchemas.user);

          done();
        });
    });

    before('Create basic user on /api/users POST', (done) => {
      chai
        .request(app)
        .post('/api/users')
        .set('Authorization', tokens.adminUser)
        .send({ data: { user: positionData.basicUserToCreateAndGetPositionFrom } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(userSchemas.user);

          done();
        });
    });

    before('Authenticate admin user on /api/authenticate POST', (done) => {
      chai
        .request(app)
        .post('/api/authenticate')
        .send({ data: { user: positionData.adminUserToCreateAndGetPositionFrom } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(authenticateSchemas.authenticate);

          positionTokens.admin = response.body.data.token;

          done();
        });
    });

    before('Authenticate basic user on /api/authenticate POST', (done) => {
      chai
        .request(app)
        .post('/api/authenticate')
        .send({ data: { user: positionData.basicUserToCreateAndGetPositionFrom } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(authenticateSchemas.authenticate);

          positionTokens.basic = response.body.data.token;

          done();
        });
    });

    describe('Update user position', () => {
      it('Should NOT update user position with incorrect authorization on /api/users/:userName/position POST', (done) => {
        chai
          .request(app)
          .post(`/api/users/${positionData.basicUserToCreateAndGetPositionFrom.userName}/position`)
          .set('Authorization', tokens.incorrectJwt)
          .send({ data: { position: positionData.userPositionToUpdateWith } })
          .end((error, response) => {
            response.should.have.status(401);
            response.should.be.json;
            response.body.should.be.jsonSchema(errorSchemas.error);

            done();
          });
      });

      it('Should update basic user position on /api/users/:userName/position POST', (done) => {
        chai
          .request(app)
          .post(`/api/users/${positionData.basicUserToCreateAndGetPositionFrom.userName}/position`)
          .set('Authorization', positionTokens.basic)
          .send({ data: { position: positionData.userPositionToUpdateWith } })
          .end((error, response) => {
            response.should.have.status(200);
            response.should.be.json;
            response.body.should.be.jsonSchema(positionSchemas.position);

            done();
          });
      });

      it('Should update admin user position on /api/users/:userName/position POST', (done) => {
        chai
          .request(app)
          .post(`/api/users/${positionData.adminUserToCreateAndGetPositionFrom.userName}/position`)
          .set('Authorization', positionTokens.admin)
          .send({ data: { position: positionData.userPositionToUpdateWith } })
          .end((error, response) => {
            response.should.have.status(200);
            response.should.be.json;
            response.body.should.be.jsonSchema(positionSchemas.position);

            done();
          });
      });
    });

    describe('Get user position', () => {
      it('Should NOT get position for non-existent user on /api/users/:userName/position GET', (done) => {
        chai
          .request(app)
          .get(`/api/users/${positionData.userThatDoesNotExist.userName}/position`)
          .set('Authorization', tokens.adminUser)
          .end((error, response) => {
            response.should.have.status(404);
            response.should.be.json;
            response.body.should.be.jsonSchema(errorSchemas.error);

            done();
          });
      });

      it('Should get user position on /api/users/:userName/position', (done) => {
        chai
          .request(app)
          .get(`/api/users/${positionData.basicUserToCreateAndGetPositionFrom.userName}/position`)
          .set('Authorization', positionTokens.admin)
          .end((error, response) => {
            response.should.have.status(200);
            response.should.be.json;
            response.body.should.be.jsonSchema(positionSchemas.position);

            done();
          });
      });

      it('Should NOT get user position from user with higher visibility than user\'s access level on /api/users/:userName/position', (done) => {
        chai
          .request(app)
          .get(`/api/users/${positionData.adminUserToCreateAndGetPositionFrom.userName}/position`)
          .set('Authorization', positionTokens.basic)
          .end((error, response) => {
            response.should.have.status(404);
            response.should.be.json;
            response.body.should.be.jsonSchema(errorSchemas.error);

            done();
          });
      });
    });

    describe('Get user positions', () => {
      it('Should NOT get user positions with incorrect authorization on /api/users/positions', (done) => {
        chai
          .request(app)
          .get('/api/users/positions')
          .set('Authorization', tokens.incorrectJwt)
          .end((error, response) => {
            response.should.have.status(401);
            response.should.be.json;
            response.body.should.be.jsonSchema(errorSchemas.error);

            done();
          });
      });

      it('Should list user positions on /api/users/positions', (done) => {
        chai
          .request(app)
          .get('/api/users/positions')
          .set('Authorization', positionTokens.basic)
          .end((error, response) => {
            response.should.have.status(200);
            response.should.be.json;
            response.body.should.be.jsonSchema(positionSchemas.positions);

            done();
          });
      });
    });
  });

  // /users/:userName/team/leave POST Leave team
});
