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
const chaiJson = require('chai-json-schema');
const manager = require('../../../socketHelpers/manager');
const testData = require('./testData');
const dbConnector = require('../../../db/databaseConnector');
const dbRoom = require('../../../db/connectors/room');
const dbCommand = require('../../../db/connectors/command');
const dbConfig = require('../../../config/defaults/config').databasePopulation;
const app = require('../../../app');
const authenticateSchemas = require('../schemas/authentications');

chai.should();

chai.use(chaiHttp);
chai.use(chaiJson);

const tokens = {};

before('Clear database', function clearDatabase(done) {
  this.timeout(10000);

  dbConnector.dropDatabase({
    callback: (dropData) => {
      dropData.should.have.property('data');
      done();
    },
  });
});

before('Create all app default commands', function createCommands(done) {
  this.timeout(10000);

  dbCommand.populateDbCommands({
    commands: dbConfig.commands,
    callback: (popData) => {
      popData.should.have.property('data');
      done();
    },
  });
});

before('Create all app default rooms', function createRooms(done) {
  this.timeout(10000);

  dbRoom.populateDbRooms({
    rooms: dbConfig.rooms,
    callback: (popData) => {
      popData.should.have.property('data');
      done();
    },
  });
});

before('Create admin user', (done) => {
  manager.createUser({
    user: testData.userAdmin,
    autoVerifyMail: true,
    callback: (createData) => {
      createData.should.have.property('data');
      done();
    },
  });
});

before('Create unverified user', (done) => {
  manager.createUser({
    user: testData.userUnverified,
    autoVerifyMail: true,
    callback: (createData) => {
      createData.should.have.property('data');
      done();
    },
  });
});

before('Create banned user', (done) => {
  manager.createUser({
    user: testData.userBanned,
    autoVerifyMail: true,
    callback: (createData) => {
      createData.should.have.property('data');
      done();
    },
  });
});

before('Create normal user', (done) => {
  manager.createUser({
    user: testData.userNormal,
    autoVerifyMail: true,
    callback: (createData) => {
      createData.should.have.property('data');
      done();
    },
  });
});

before('Authenticate', (done) => {
  chai
    .request(app)
    .post('/api/authenticate')
    .send({ data: { user: testData.userAdmin } })
    .end((error, response) => {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.jsonSchema(authenticateSchemas.authenticate);

      tokens.admin = response.body.data.token;

      done();
    });
});

before(`Authenticate user ${testData.userNormal.userName}`, (done) => {
  chai
    .request(app)
    .post('/api/authenticate')
    .send({ data: { user: testData.userNormal } })
    .end((error, response) => {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.jsonSchema(authenticateSchemas.authenticate);

      tokens.normal = response.body.data.token;

      done();
    });
});

exports.tokens = tokens;
