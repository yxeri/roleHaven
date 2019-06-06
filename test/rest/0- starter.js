/*
 Copyright 2017 Carmilla Mina Jankovic

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
const bcrypt = require('bcrypt');
const dbConnector = require('../../db/databaseConnector');
const dbRoom = require('../../db/connectors/room');
const { dbConfig } = require('../../config/defaults/config');
const tokens = require('./testData/tokens');
const starterData = require('./testData/starter');
const app = require('../../app');
const authenticateSchemas = require('./schemas/authentications');
const dbUser = require('../../db/connectors/user');
const baseObjectSchemas = require('./schemas/baseObjects');

chai.should();

chai.use(chaiHttp);
chai.use(chaiJson);

before('Create all app default rooms', function createRooms(done) {
  this.timeout(10000);

  dbRoom.populateDbRooms({
    rooms: dbConfig.rooms,
    callback: (popData) => {
      popData.should.be.jsonSchema(baseObjectSchemas.returnData);
      popData.should.have.property('data');
      popData.data.should.have.property('success', true);
      done();
    },
  });
});

before('Create admin user 1', (done) => {
  bcrypt.hash(starterData.adminUserOne.password, 10, (hashError, hash) => {
    const user = Object.assign({}, starterData.adminUserOne);
    user.password = hash;

    dbUser.createUser({
      user,
      callback: (createData) => {
        createData.should.be.jsonSchema(baseObjectSchemas.returnData);
        createData.should.have.property('data');

        starterData.adminUserOne.objectId = createData.data.user.objectId;

        done();
      },
    });
  });
});

before('Create admin user 2', (done) => {
  bcrypt.hash(starterData.adminUserTwo.password, 10, (hashError, hash) => {
    const user = Object.assign({}, starterData.adminUserTwo);
    user.password = hash;

    dbUser.createUser({
      user,
      callback: (createData) => {
        createData.should.be.jsonSchema(baseObjectSchemas.returnData);
        createData.should.have.property('data');

        starterData.adminUserTwo.objectId = createData.data.user.objectId;

        done();
      },
    });
  });
});

before('Create basic user 1', (done) => {
  bcrypt.hash(starterData.basicUserOne.password, 10, (hashError, hash) => {
    const user = Object.assign({}, starterData.basicUserOne);
    user.password = hash;

    dbUser.createUser({
      user,
      callback: (createData) => {
        createData.should.be.jsonSchema(baseObjectSchemas.returnData);
        createData.should.have.property('data');

        starterData.basicUserOne.objectId = createData.data.user.objectId;

        done();
      },
    });
  });
});

before('Create basic user 2', (done) => {
  bcrypt.hash(starterData.basicUserTwo.password, 10, (hashError, hash) => {
    const user = Object.assign({}, starterData.basicUserTwo);
    user.password = hash;

    dbUser.createUser({
      user,
      callback: (createData) => {
        createData.should.be.jsonSchema(baseObjectSchemas.returnData);
        createData.should.have.property('data');

        starterData.basicUserTwo.objectId = createData.data.user.objectId;

        done();
      },
    });
  });
});

before('Create moderator user 1', (done) => {
  bcrypt.hash(starterData.moderatorUserOne.password, 10, (hashError, hash) => {
    const user = Object.assign({}, starterData.moderatorUserOne);
    user.password = hash;

    dbUser.createUser({
      user,
      callback: (createData) => {
        createData.should.be.jsonSchema(baseObjectSchemas.returnData);
        createData.should.have.property('data');

        starterData.moderatorUserOne.objectId = createData.data.user.objectId;

        done();
      },
    });
  });
});

before('Create moderator user 2', (done) => {
  bcrypt.hash(starterData.moderatorUserTwo.password, 10, (hashError, hash) => {
    const user = Object.assign({}, starterData.moderatorUserTwo);
    user.password = hash;
    dbUser.createUser({
      user,
      callback: (createData) => {
        createData.should.be.jsonSchema(baseObjectSchemas.returnData);
        createData.should.have.property('data');

        starterData.moderatorUserTwo.objectId = createData.data.user.objectId;

        done();
      },
    });
  });
});

before('Create unverified user', (done) => {
  bcrypt.hash(starterData.unverifiedUser.password, 10, (hashError, hash) => {
    const user = Object.assign({}, starterData.unverifiedUser);
    user.password = hash;

    dbUser.createUser({
      user,
      callback: (createData) => {
        createData.should.be.jsonSchema(baseObjectSchemas.returnData);
        createData.should.have.property('data');

        starterData.unverifiedUser.objectId = createData.data.user.objectId;

        done();
      },
    });
  });
});

before('Create banned user', (done) => {
  bcrypt.hash(starterData.bannedUser.password, 10, (hashError, hash) => {
    const user = Object.assign({}, starterData.bannedUser);
    user.password = hash;

    dbUser.createUser({
      user,
      callback: (createData) => {
        createData.should.be.jsonSchema(baseObjectSchemas.returnData);
        createData.should.have.property('data');

        starterData.bannedUser.objectId = createData.data.user.objectId;

        done();
      },
    });
  });
});

before('Authenticate admin user one on /api/authenticate', (done) => {
  chai
    .request(app)
    .post('/api/authenticate')
    .send({ data: { user: starterData.adminUserOne } })
    .end((error, response) => {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.jsonSchema(baseObjectSchemas.returnData);
      response.body.data.should.be.jsonSchema(authenticateSchemas.authenticate);

      tokens.adminUserOne = response.body.data.token;

      done();
    });
});

before('Authenticate admin user two on /api/authenticate', (done) => {
  chai
    .request(app)
    .post('/api/authenticate')
    .send({ data: { user: starterData.adminUserTwo } })
    .end((error, response) => {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.jsonSchema(baseObjectSchemas.returnData);
      response.body.data.should.be.jsonSchema(authenticateSchemas.authenticate);

      tokens.adminUserTwo = response.body.data.token;

      done();
    });
});

before('Authenticate basic user one on /api/authenticate', (done) => {
  chai
    .request(app)
    .post('/api/authenticate')
    .send({ data: { user: starterData.basicUserOne } })
    .end((error, response) => {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.jsonSchema(baseObjectSchemas.returnData);
      response.body.data.should.be.jsonSchema(authenticateSchemas.authenticate);

      tokens.basicUserOne = response.body.data.token;

      done();
    });
});

before('Authenticate basic user two on /api/authenticate', (done) => {
  chai
    .request(app)
    .post('/api/authenticate')
    .send({ data: { user: starterData.basicUserTwo } })
    .end((error, response) => {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.jsonSchema(baseObjectSchemas.returnData);
      response.body.data.should.be.jsonSchema(authenticateSchemas.authenticate);

      tokens.basicUserTwo = response.body.data.token;

      done();
    });
});

before('Authenticate moderator user one on /api/authenticate', (done) => {
  chai
    .request(app)
    .post('/api/authenticate')
    .send({ data: { user: starterData.moderatorUserOne } })
    .end((error, response) => {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.jsonSchema(baseObjectSchemas.returnData);
      response.body.data.should.be.jsonSchema(authenticateSchemas.authenticate);

      tokens.moderatorUserOne = response.body.data.token;

      done();
    });
});

before('Authenticate moderator user two on /api/authenticate', (done) => {
  chai
    .request(app)
    .post('/api/authenticate')
    .send({ data: { user: starterData.moderatorUserTwo } })
    .end((error, response) => {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.jsonSchema(baseObjectSchemas.returnData);
      response.body.data.should.be.jsonSchema(authenticateSchemas.authenticate);

      tokens.moderatorUserTwo = response.body.data.token;

      done();
    });
});

after('Clear database', function clearDatabase(done) {
  this.timeout(10000);

  dbConnector.dropDatabase({
    callback: (dropData) => {
      dropData.should.be.jsonSchema(baseObjectSchemas.returnData);
      done();
    },
  });
});
