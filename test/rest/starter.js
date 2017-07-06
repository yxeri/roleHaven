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
const helperData = require('./helper/data');
const dbConnector = require('../../db/databaseConnector');
const dbUser = require('../../db/connectors/user');
const dbRoom = require('../../db/connectors/room');
const dbCommand = require('../../db/connectors/command');
const dbConfig = require('../../config/defaults/config').databasePopulation;

chai.should();

chai.use(chaiHttp);
chai.use(chaiJson);


before('Clear database', (done) => {
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

before('Create all app default users', function createUsers(done) {
  this.timeout(10000);

  dbUser.populateDbUsers({
    users: dbConfig.users,
    callback: (popData) => {
      popData.should.have.property('data');
      done();
    },
  });
});

before('Create admin user', (done) => {
  manager.createUser({
    user: helperData.adminUser,
    autoVerifyMail: true,
    callback: (createData) => {
      createData.should.have.property('data');
      done();
    },
  });
});

before('Create unverified user', (done) => {
  manager.createUser({
    user: helperData.unverifiedUser,
    autoVerifyMail: true,
    callback: (createData) => {
      createData.should.have.property('data');
      done();
    },
  });
});

before('Create banned user', (done) => {
  manager.createUser({
    user: helperData.bannedUser,
    autoVerifyMail: true,
    callback: (createData) => {
      createData.should.have.property('data');
      done();
    },
  });
});

before('Create normal user', (done) => {
  manager.createUser({
    user: helperData.normalUser,
    autoVerifyMail: true,
    callback: (createData) => {
      createData.should.have.property('data');
      done();
    },
  });
});
