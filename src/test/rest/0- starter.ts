/* eslint-disable no-unused-expressions */

'use strict';

import chai from 'chai';
import chaiHttp from 'chai-http';
import chaiJson from 'chai-json-schema';
import bcrypt from 'bcrypt';
import dbConnector from '../../db/databaseConnector';
import dbRoom from '../../db/connectors/room';
import { dbConfig } from '../../config/defaults/config';

import tokens from './testData/tokens';
import starterData from './testData/starter';
import app from '../../app';
import authenticateSchemas from './schemas/authentications';
import dbUser from '../../db/connectors/user';
import baseObjectSchemas from './schemas/baseObjects';

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
    const user = { ...starterData.adminUserOne };
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
    const user = { ...starterData.adminUserTwo };
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
    const user = { ...starterData.basicUserOne };
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
    const user = { ...starterData.basicUserTwo };
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
    const user = { ...starterData.moderatorUserOne };
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
    const user = { ...starterData.moderatorUserTwo };
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
    const user = { ...starterData.unverifiedUser };
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
    const user = { ...starterData.bannedUser };
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
