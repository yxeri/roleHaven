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
const testData = require('./helper/testData');
const tokens = require('./0- starter').tokens;

chai.should();

chai.use(chaiHttp);
chai.use(chaiJson);

describe('Rooms', () => {
  before(`Create room ${testData.roomPublic.roomName}`, (done) => {
    chai
      .request(app)
      .post('/api/rooms')
      .set('Authorization', tokens.admin)
      .send({ data: { room: testData.roomPublic } })
      .end((error, response) => {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.jsonSchema(roomSchemas.room);

        done();
      });
  });

  before(`Create room ${testData.roomAccess.roomName}`, (done) => {
    chai
      .request(app)
      .post('/api/rooms')
      .set('Authorization', tokens.admin)
      .send({ data: { room: testData.roomAccess } })
      .end((error, response) => {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.jsonSchema(roomSchemas.room);

        done();
      });
  });

  before(`Create room ${testData.roomPassword.roomName}`, (done) => {
    chai
      .request(app)
      .post('/api/rooms')
      .set('Authorization', tokens.admin)
      .send({ data: { room: testData.roomPassword } })
      .end((error, response) => {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.jsonSchema(roomSchemas.room);

        done();
      });
  });

  before(`Create room ${testData.roomInvisible.roomName}`, (done) => {
    chai
      .request(app)
      .post('/api/rooms')
      .set('Authorization', tokens.admin)
      .send({ data: { room: testData.roomInvisible } })
      .end((error, response) => {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.jsonSchema(roomSchemas.room);

        done();
      });
  });

  describe('List rooms', () => {
    it('Should list rooms on /rooms GET', (done) => {
      chai
        .request(app)
        .get('/api/rooms')
        .set('Authorization', tokens.admin)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(roomSchemas.rooms);
          // TODO Check access level and visiblity

          done();
        });
    });

    it('Should NOT list rooms with incorrect authorization on /rooms GET', (done) => {
      chai
        .request(app)
        .get('/api/rooms')
        .set('Authorization', testData.incorrectJwt)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });
  });

  describe('Create room', () => {
    it('Should create room on /rooms POST', (done) => {
      chai
        .request(app)
        .post('/api/rooms')
        .set('Authorization', tokens.admin)
        .send({ data: { room: testData.roomNew } })
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
        .set('Authorization', tokens.admin)
        .send({ data: { room: testData.roomNew } })
        .end((error, response) => {
          response.should.have.status(403);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should NOT create room with incorrect authorization on /rooms POST', (done) => {
      chai
        .request(app)
        .post('/api/rooms')
        .set('Authorization', testData.incorrectJwt)
        .send({ data: { room: testData.roomNew } })
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });
  });

  describe('Get specific room', () => {
    it('Should NOT get room with incorrect authorization on /rooms/:id GET', (done) => {
      chai
        .request(app)
        .get(`/api/rooms/${testData.userNormal.roomName}`)
        .set('Authorization', testData.incorrectJwt)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should get room with lower access level than user\'s on /rooms/:id GET', (done) => {
      chai
        .request(app)
        .get(`/api/rooms/${testData.roomPublic.roomName}`)
        .set('Authorization', tokens.admin)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(roomSchemas.room);

          done();
        });
    });

    it('Should get room with higher access level than user\'s on /rooms/:id GET', (done) => {
      chai
        .request(app)
        .get(`/api/rooms/${testData.roomAccess.roomName}`)
        .set('Authorization', tokens.normal)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(roomSchemas.room);

          done();
        });
    });

    it('Should get room with equal visibility level to user\'s access level on /rooms/:id GET', (done) => {
      chai
        .request(app)
        .get(`/api/rooms/${testData.roomInvisible.roomName}`)
        .set('Authorization', tokens.admin)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(roomSchemas.room);

          done();
        });
    });

    it('Should get room with lower visibility level to user\'s access level on /rooms/:id GET', (done) => {
      chai
        .request(app)
        .get(`/api/rooms/${testData.roomPublic.roomName}`)
        .set('Authorization', tokens.normal)
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
        .get(`/api/rooms/${testData.roomInvisible.roomName}`)
        .set('Authorization', tokens.normal)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });
  });

  describe('Follow room', () => {
    it('Should follow room with equal access level to user\'s access level on /rooms/follow POST', (done) => {
      chai
        .request(app)
        .post('/api/rooms/follow')
        .set('Authorization', tokens.admin)
        .send({ data: { room: { roomName: testData.roomAccess.roomName } } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(roomSchemas.room);
          response.body.data.room.accessLevel.should.equal(testData.userAdmin.accessLevel);

          done();
        });
    });

    it('Should follow room with lower or equal access level to user\'s access level on /rooms/follow POST', (done) => {
      chai
        .request(app)
        .post('/api/rooms/follow')
        .set('Authorization', tokens.normal)
        .send({ data: { room: { roomName: testData.roomPublic.roomName } } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(roomSchemas.room);
          response.body.data.room.accessLevel.should.satisfy(value => value <= testData.userNormal.accessLevel);

          done();
        });
    });

    it('Should NOT follow room with higher access level than user\'s access level on /rooms/follow POST', (done) => {
      chai
        .request(app)
        .post('/api/rooms/follow')
        .set('Authorization', tokens.normal)
        .send({ data: { room: { roomName: testData.roomAccess.roomName } } })
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
        .set('Authorization', tokens.normal)
        .send({ data: { room: { roomName: testData.roomInvisible.roomName } } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(roomSchemas.room);

          done();
        });
    });
  });

  describe('Follow password-protected room', () => {
    it('Should follow password-protected room with correct password on /rooms/follow POST', (done) => {
      chai
        .request(app)
        .post('/api/rooms/follow')
        .set('Authorization', tokens.normal)
        .send({ data: { room: { roomName: testData.roomPassword.roomName, password: testData.roomPassword.password } } })
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
        .set('Authorization', tokens.admin)
        .send({ data: { room: { roomName: testData.roomPassword.roomName } } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(roomSchemas.room);

          done();
        });
    });

    it('Should NOT follow password-protected room with incorrect password on /rooms/follow POST', (done) => {
      chai
        .request(app)
        .post('/api/rooms/follow')
        .set('Authorization', tokens.normal)
        .send({ data: { room: { roomName: testData.roomPassword.roomName, password: testData.incorrectJwt } } })
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });
  });

  describe('Unfollow room', () => {
    before(`Create room ${testData.roomFollow.roomName}`, (done) => {
      chai
        .request(app)
        .post('/api/rooms')
        .set('Authorization', tokens.admin)
        .send({ data: { room: testData.roomFollow } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(roomSchemas.room);

          done();
        });
    });

    before(`Follow room ${testData.roomFollow.roomName}`, (done) => {
      chai
        .request(app)
        .post('/api/rooms/follow')
        .set('Authorization', tokens.normal)
        .send({ data: { room: { roomName: testData.roomFollow.roomName } } })
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
        .set('Authorization', tokens.normal)
        .send({ data: { room: { roomName: testData.roomFollow.roomName } } })
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
        .set('Authorization', tokens.admin)
        .send({ data: { room: testData.roomNoExist } })
        .end((error, response) => {
          response.should.have.status(404);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });
  });
});
