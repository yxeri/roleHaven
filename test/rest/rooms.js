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

chai.should();

chai.use(chaiHttp);
chai.use(chaiJson);

describe('Rooms', () => {
  describe('Create room', () => {
    it('Should NOT create room with incorrect authorization on /rooms POST', (done) => {
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

    it('Should NOT create room with existing name on /rooms POST', (done) => {
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

    after(`Create room ${roomData.publicRoomToCreate.roomName}`, (done) => {
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

    after(`Create room ${roomData.highAccessLevelRoomToCreate.roomName}`, (done) => {
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

    after(`Create room ${roomData.passwordProtectedRoomToCreate.roomName}`, (done) => {
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

    after(`Create room ${roomData.invisibleRoomToCreate.roomName}`, (done) => {
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

    after(`Unfollow room ${roomData.passwordProtectedRoomToCreate.roomName} /rooms/follow POST`, (done) => {
      chai
        .request(app)
        .post('/api/rooms/unfollow')
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
    it('Should NOT list rooms with incorrect authorization on /rooms GET', (done) => {
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

  describe('Get specific room', () => {
    it('Should NOT get room with incorrect authorization on /rooms/:id GET', (done) => {
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

    it('Should get room with lower visibility level than user\'s access level on /rooms/:id GET', (done) => {
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

    it('Should get room with higher access level to user\'s access level on /rooms/:id GET', (done) => {
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

    it('Should get room with lower access level to user\'s access level on /rooms/:id GET', (done) => {
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

    it('Should NOT get room with higher visiblity level than user\'s access level on /rooms/:id GET', (done) => {
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

  describe('Follow room', () => {
    it('Should follow room with lower or equal access level to user\'s access level on /rooms/follow POST', (done) => {
      chai
        .request(app)
        .post('/api/rooms/follow')
        .set('Authorization', tokens.basicUser)
        .send({ data: { room: { roomName: roomData.publicRoomToCreate.roomName } } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(roomSchemas.room);
          response.body.data.room.accessLevel.should.satisfy(value => value <= roomData.publicRoomToCreate.accessLevel);

          done();
        });
    });

    it('Should NOT follow room with higher access level than user\'s access level on /rooms/follow POST', (done) => {
      chai
        .request(app)
        .post('/api/rooms/follow')
        .set('Authorization', tokens.basicUser)
        .send({ data: { room: { roomName: roomData.highAccessLevelRoomToCreate.roomName } } })
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should follow room with higher visibility than user\'s access level on /rooms/follow POST', (done) => {
      chai
        .request(app)
        .post('/api/rooms/follow')
        .set('Authorization', tokens.basicUser)
        .send({ data: { room: { roomName: roomData.invisibleRoomToCreate.roomName } } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(roomSchemas.room);

          done();
        });
    });
  });

  describe('Follow password-protected room', () => {
    it('Should NOT follow password-protected room with incorrect password on /rooms/follow POST', (done) => {
      chai
        .request(app)
        .post('/api/rooms/follow')
        .set('Authorization', tokens.basicUser)
        .send({ data: { room: { roomName: roomData.passwordProtectedRoomToCreate.roomName, password: roomData.incorrectPassword } } })
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should follow password-protected room with correct password on /rooms/follow POST', (done) => {
      chai
        .request(app)
        .post('/api/rooms/follow')
        .set('Authorization', tokens.basicUser)
        .send({ data: { room: { roomName: roomData.passwordProtectedRoomToCreate.roomName, password: roomData.passwordProtectedRoomToCreate.password } } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(roomSchemas.room);

          done();
        });
    });

    it('Should follow password-protected room without password if owner on /rooms/follow POST', (done) => {
      chai
        .request(app)
        .post('/api/rooms/follow')
        .set('Authorization', tokens.adminUser)
        .send({ data: { room: { roomName: roomData.passwordProtectedRoomToCreate.roomName } } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(roomSchemas.room);

          done();
        });
    });
  });

  describe('Unfollow room', () => {
    before(`Follow room ${roomData.roomToCreate.roomName}`, (done) => {
      chai
        .request(app)
        .post('/api/rooms/follow')
        .set('Authorization', tokens.basicUser)
        .send({ data: { room: { roomName: roomData.roomToCreate.roomName } } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(roomSchemas.room);

          done();
        });
    });

    it('Should unfollow room that is followed /rooms/follow POST', (done) => {
      chai
        .request(app)
        .post('/api/rooms/unfollow')
        .set('Authorization', tokens.basicUser)
        .send({ data: { room: { roomName: roomData.roomToCreate.roomName } } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(roomSchemas.unfollowRoom);

          done();
        });
    });

    it('Should NOT unfollow room that is not followed /rooms/follow POST', (done) => {
      chai
        .request(app)
        .post('/api/rooms/unfollow')
        .set('Authorization', tokens.adminUser)
        .send({ data: { room: roomData.roomThatDoesNotExist } })
        .end((error, response) => {
          response.should.have.status(404);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });
  });
});
