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
const manager = require('../../socketHelpers/manager');
const dbConnector = require('../../db/databaseConnector');
const dbRoom = require('../../db/connectors/room');
const dbCommand = require('../../db/connectors/command');
const dbConfig = require('../../config/defaults/config').databasePopulation;
const tokens = require('./testData/tokens');
const starterData = require('./testData/starter');
const app = require('../../app');
const authenticateSchemas = require('./schemas/authentications');

chai.should();

chai.use(chaiHttp);
chai.use(chaiJson);

describe('App preparation', () => {
  it('Should clear database', function clearDatabase(done) {
    this.timeout(10000);

    dbConnector.dropDatabase({
      callback: (dropData) => {
        dropData.should.have.property('data');
        done();
      },
    });
  });

  it('Should create all app default commands', function createCommands(done) {
    this.timeout(10000);

    dbCommand.populateDbCommands({
      commands: dbConfig.commands,
      callback: (popData) => {
        popData.should.have.property('data');
        done();
      },
    });
  });

  it('Should create all app default rooms', function createRooms(done) {
    this.timeout(10000);

    dbRoom.populateDbRooms({
      rooms: dbConfig.rooms,
      callback: (popData) => {
        popData.should.have.property('data');
        done();
      },
    });
  });
});

describe('Create test users', () => {
  it('Should create adminUser user', (done) => {
    manager.createUser({
      user: starterData.adminUserToAuth,
      callback: (createData) => {
        createData.should.have.property('data');
        done();
      },
    });
  });

  it('Should create unverified user', (done) => {
    manager.createUser({
      user: starterData.unverifiedUserToAuth,
      callback: (createData) => {
        createData.should.have.property('data');
        done();
      },
    });
  });

  it('Should create banned user', (done) => {
    manager.createUser({
      user: starterData.bannedUserToAuth,
      callback: (createData) => {
        createData.should.have.property('data');
        done();
      },
    });
  });

  it('Should create basicUser user', (done) => {
    manager.createUser({
      user: starterData.basicUserToAuth,
      callback: (createData) => {
        createData.should.have.property('data');
        done();
      },
    });
  });
});

describe('Authenticate test users and store tokens', () => {
  it('Should authenticate adminUser user on /api/authenticate', (done) => {
    chai
      .request(app)
      .post('/api/authenticate')
      .send({ data: { user: starterData.adminUserToAuth } })
      .end((error, response) => {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.jsonSchema(authenticateSchemas.authenticate);

        tokens.adminUser = response.body.data.token;

        done();
      });
  });

  it('Should authenticate basic user on /api/authenticate', (done) => {
    chai
      .request(app)
      .post('/api/authenticate')
      .send({ data: { user: starterData.basicUserToAuth } })
      .end((error, response) => {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.jsonSchema(authenticateSchemas.authenticate);

        tokens.basicUser = response.body.data.token;

        done();
      });
  });
});
