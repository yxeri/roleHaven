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
const roomSchemas = require('./schemas/rooms');
const errorSchemas = require('./schemas/errors');
const tokens = require('./testData/tokens');
const roomData = require('./testData/rooms');
const starterData = require('./testData/starter');
const historyData = require('./testData/histories');
const historySchemas = require('./schemas/histories');
const messageData = require('./testData/messages');

chai.should();

chai.use(chaiHttp);
chai.use(chaiJson);

describe('Rooms', () => {
  describe('Create room', () => {
    it('Should NOT create room with incorrect authorization on /api/rooms POST', (done) => {
      chai
        .request(app)
        .post('/api/rooms')
        .set('Authorization', tokens.incorrectJwt)
        .send({ data: { room: roomData.roomToCreate } })
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should create room on /rooms POST', (done) => {
      chai
        .request(app)
        .post('/api/rooms')
        .set('Authorization', tokens.adminUser)
        .send({ data: { room: roomData.roomToCreate } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(roomSchemas.room);

          done();
        });
    });

    it('Should NOT create room with existing name on /api/rooms POST', (done) => {
      chai
        .request(app)
        .post('/api/rooms')
        .set('Authorization', tokens.adminUser)
        .send({ data: { room: roomData.roomToCreate } })
        .end((error, response) => {
          response.should.have.status(403);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    after(`Create room ${roomData.publicRoomToCreate.roomName} on /api/rooms`, (done) => {
      chai
        .request(app)
        .post('/api/rooms')
        .set('Authorization', tokens.adminUser)
        .send({ data: { room: roomData.publicRoomToCreate } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(roomSchemas.room);

          done();
        });
    });

    after(`Create room ${roomData.highAccessLevelRoomToCreate.roomName} on /api/rooms`, (done) => {
      chai
        .request(app)
        .post('/api/rooms')
        .set('Authorization', tokens.adminUser)
        .send({ data: { room: roomData.highAccessLevelRoomToCreate } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(roomSchemas.room);

          done();
        });
    });

    after(`Create room ${roomData.passwordProtectedRoomToCreate.roomName} on /api/rooms`, (done) => {
      chai
        .request(app)
        .post('/api/rooms')
        .set('Authorization', tokens.adminUser)
        .send({ data: { room: roomData.passwordProtectedRoomToCreate } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(roomSchemas.room);

          done();
        });
    });

    after(`Create room ${roomData.invisibleRoomToCreate.roomName} on /api/rooms`, (done) => {
      chai
        .request(app)
        .post('/api/rooms')
        .set('Authorization', tokens.adminUser)
        .send({ data: { room: roomData.invisibleRoomToCreate } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(roomSchemas.room);

          done();
        });
    });

    after(`Unfollow room ${roomData.passwordProtectedRoomToCreate.roomName} /api/users/:username/rooms/:roomName/unfollow POST`, (done) => {
      chai
        .request(app)
        .post(`/api/users/${starterData.adminUserToAuth.username}/rooms/${roomData.passwordProtectedRoomToCreate.roomName}/unfollow`)
        .set('Authorization', tokens.adminUser)
        .send({ data: { room: { roomName: roomData.passwordProtectedRoomToCreate.roomName } } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(roomSchemas.unfollowRoom);

          done();
        });
    });
  });

  describe('List rooms', () => {
    it('Should NOT list rooms with incorrect authorization on /api/rooms GET', (done) => {
      chai
        .request(app)
        .get('/api/rooms')
        .set('Authorization', tokens.incorrectJwt)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should list rooms on /rooms GET', (done) => {
      chai
        .request(app)
        .get('/api/rooms')
        .set('Authorization', tokens.adminUser)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(roomSchemas.rooms);
          // TODO Check access level and visiblity

          done();
        });
    });
  });

  describe('Get room', () => {
    it('Should NOT get room with incorrect authorization on /api/rooms/:roomName GET', (done) => {
      chai
        .request(app)
        .get(`/api/rooms/${roomData.roomToCreate.roomName}`)
        .set('Authorization', tokens.incorrectJwt)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should get room with lower visibility level than user\'s access level on /api/rooms/:roomName GET', (done) => {
      chai
        .request(app)
        .get(`/api/rooms/${roomData.publicRoomToCreate.roomName}`)
        .set('Authorization', tokens.basicUser)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(roomSchemas.room);

          done();
        });
    });

    it('Should get room with higher access level to user\'s access level on /api/rooms/:id GET', (done) => {
      chai
        .request(app)
        .get(`/api/rooms/${roomData.highAccessLevelRoomToCreate.roomName}`)
        .set('Authorization', tokens.basicUser)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(roomSchemas.room);

          done();
        });
    });

    it('Should get room with lower access level to user\'s access level on /api/rooms/:id GET', (done) => {
      chai
        .request(app)
        .get(`/api/rooms/${roomData.publicRoomToCreate.roomName}`)
        .set('Authorization', tokens.basicUser)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(roomSchemas.room);

          done();
        });
    });

    it('Should NOT get room with higher visiblity level than user\'s access level on /api/rooms/:id GET', (done) => {
      chai
        .request(app)
        .get(`/api/rooms/${roomData.invisibleRoomToCreate.roomName}`)
        .set('Authorization', tokens.basicUser)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });
  });

  describe('Match partial room name', () => {
    before(`Create room ${roomData.roomStartingWithZz.roomName} on /api/rooms`, (done) => {
      chai
        .request(app)
        .post('/api/rooms')
        .set('Authorization', tokens.adminUser)
        .send({ data: { room: roomData.roomStartingWithZz } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(roomSchemas.room);

          done();
        });
    });

    before(`Create room ${roomData.secondRoomStartingWithZz.roomName} on /api/rooms`, (done) => {
      chai
        .request(app)
        .post('/api/rooms')
        .set('Authorization', tokens.adminUser)
        .send({ data: { room: roomData.secondRoomStartingWithZz } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(roomSchemas.room);

          done();
        });
    });

    it('Should NOT match partial room name with incorrect authorization on /api/rooms/:roomName/match GET', (done) => {
      chai
        .request(app)
        .get(`/api/rooms/${roomData.partialRoomName}/match`)
        .set('Authorization', tokens.incorrectJwt)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should NOT match partial followed room name with incorrect authorization on /api/rooms/:roomName/match GET', (done) => {
      chai
        .request(app)
        .get(`/api/rooms/${roomData.partialRoomName}/match`)
        .set('Authorization', tokens.incorrectJwt)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should match partial name to rooms on /api/rooms/:roomName/match GET', (done) => {
      chai
        .request(app)
        .get(`/api/rooms/${roomData.partialRoomName}/match`)
        .set('Authorization', tokens.basicUser)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(roomSchemas.matched);
          response.body.data.matched.should.have.lengthOf(2);

          done();
        });
    });

    it('Should match partial name to followed rooms on /api/rooms/:roomName/match/followed GET', (done) => {
      chai
        .request(app)
        .get(`/api/rooms/${roomData.partialRoomName}/match/followed`)
        .set('Authorization', tokens.adminUser)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(roomSchemas.matched);
          response.body.data.matched.should.have.lengthOf(2);

          done();
        });
    });
  });

  describe('Messages', () => {
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

    describe('Get messages from room', () => {
      it('Should NOT get messages with incorrect authorization on /api/histories/:id GET', (done) => {
        chai
          .request(app)
          .get(`/api/rooms/${roomData.roomToCreate.roomName}/messages`)
          .set('Authorization', tokens.incorrectJwt)
          .end((error, response) => {
            response.should.have.status(401);
            response.should.be.json;
            response.body.should.be.jsonSchema(errorSchemas.error);

            done();
          });
      });

      it('Should get messages from followed room on /api/rooms/:roomName/messages GET', (done) => {
        chai
          .request(app)
          .get(`/api/rooms/${roomData.roomToCreate.roomName}/messages`)
          .set('Authorization', tokens.adminUser)
          .end((error, response) => {
            response.should.have.status(200);
            response.should.be.json;
            response.body.should.be.jsonSchema(historySchemas.history);

            done();
          });
      });

      it('Should NOT get messages from unfollowed room on /api/rooms/:roomName/messages GET', (done) => {
        chai
          .request(app)
          .get(`/api/rooms/${historyData.unfollowedRoomToCreate.roomName}/messages`)
          .set('Authorization', tokens.adminUser)
          .end((error, response) => {
            response.should.have.status(401);
            response.should.be.json;
            response.body.should.be.jsonSchema(errorSchemas.error);

            done();
          });
      });

      it('Should NOT get messages from room that does not exist on /api/rooms/:roomName/messages GET', (done) => {
        chai
          .request(app)
          .get(`/api/rooms/${historyData.roomThatDoesNotExist.roomName}/messages`)
          .set('Authorization', tokens.adminUser)
          .end((error, response) => {
            response.should.have.status(401);
            response.should.be.json;
            response.body.should.be.jsonSchema(errorSchemas.error);

            done();
          });
      });
    });

    describe('Send message', () => {
      before(`Create room ${messageData.roomToCreateAndSendMessagesTo.roomName} on /api/rooms`, (done) => {
        chai
          .request(app)
          .post('/api/rooms')
          .set('Authorization', tokens.adminUser)
          .send({ data: { room: messageData.roomToCreateAndSendMessagesTo } })
          .end((error, response) => {
            response.should.have.status(200);
            response.should.be.json;
            response.body.should.be.jsonSchema(roomSchemas.room);

            done();
          });
      });

      it('Should NOT send message with incorrect authorization on /api/rooms/:roomName/messages POST', (done) => {
        chai
          .request(app)
          .post(`/api/rooms/${messageData.messageToSend.roomName}/messages`)
          .set('Authorization', tokens.incorrectJwt)
          .send({ data: { message: messageData.messageToSend } })
          .end((error, response) => {
            response.should.have.status(401);
            response.should.be.json;
            response.body.should.be.jsonSchema(errorSchemas.error);

            done();
          });
      });

      it('Should NOT send message to a non-existent room on /api/rooms/:roomName/messages POST', (done) => {
        chai
          .request(app)
          .post(`/api/rooms/${messageData.roomThatDoesNotExist.roomName}/messages`)
          .set('Authorization', tokens.adminUser)
          .send({ data: { message: messageData.roomThatDoesNotExist } })
          .end((error, response) => {
            response.should.have.status(401);
            response.should.be.json;
            response.body.should.be.jsonSchema(errorSchemas.error);

            done();
          });
      });

      it('Should NOT send message to an unfollowed room on /api/rooms/:roomName/messages POST', (done) => {
        chai
          .request(app)
          .post(`/api/rooms/${messageData.messageToSend.roomName}/messages`)
          .set('Authorization', tokens.basicUser)
          .send({ data: { message: messageData.messageToSend } })
          .end((error, response) => {
            response.should.have.status(401);
            response.should.be.json;
            response.body.should.be.jsonSchema(errorSchemas.error);

            done();
          });
      });

      it('Should NOT send message that is too long on /api/rooms/:roomName/messages POST', (done) => {
        chai
          .request(app)
          .post(`/api/rooms/${messageData.messageToSend.roomName}/messages`)
          .set('Authorization', tokens.adminUser)
          .send({ data: { message: messageData.tooLongMessage } })
          .end((error, response) => {
            response.should.have.status(400);
            response.should.be.json;
            response.body.should.be.jsonSchema(errorSchemas.error);

            done();
          });
      });

      it('Should send message on /api/rooms/:roomName/messages POST', (done) => {
        chai
          .request(app)
          .post(`/api/rooms/${messageData.messageToSend.roomName}/messages`)
          .set('Authorization', tokens.adminUser)
          .send({ data: { message: messageData.messageToSend } })
          .end((error, response) => {
            response.should.have.status(200);
            response.should.be.json;
            response.body.should.be.jsonSchema(historySchemas.message);

            done();
          });
      });
    });
  });
});
