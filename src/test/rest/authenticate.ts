/* eslint-disable no-unused-expressions */

'use strict';

import chai from 'chai';
import chaiHttp from 'chai-http';
import chaiJson from 'chai-json-schema';
import app from '../../app';
import authenticateSchemas from './schemas/authentications';
import starterData from './testData/starter';
import baseObjectSchemas from './schemas/baseObjects';

chai.should();

chai.use(chaiHttp);
chai.use(chaiJson);

describe('Authenticate', () => {
  it('Should get jwt token on /api/authenticate POST', (done) => {
    chai
      .request(app)
      .post('/api/authenticate')
      .send({ data: { user: starterData.moderatorUserTwo } })
      .end((error, response) => {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.jsonSchema(baseObjectSchemas.returnData);
        response.body.data.should.be.jsonSchema(authenticateSchemas.authenticate);
        done();
      });
  });

  it('Should NOT get jwt token with unverified user on /api/authenticate POST', (done) => {
    chai
      .request(app)
      .post('/api/authenticate')
      .send({ data: { user: starterData.unverifiedUser } })
      .end((error, response) => {
        response.should.have.status(401);
        response.should.be.json;
        response.body.should.be.jsonSchema(baseObjectSchemas.returnData);

        done();
      });
  });

  it('Should NOT get jwt token with banned user on /api/authenticate POST', (done) => {
    chai
      .request(app)
      .post('/api/authenticate')
      .send({ data: { user: starterData.bannedUser } })
      .end((error, response) => {
        response.should.have.status(401);
        response.should.be.json;
        response.body.should.be.jsonSchema(baseObjectSchemas.returnData);

        done();
      });
  });

  it('Should NOT get jwt token with non-existent user on /api/authenticate POST', (done) => {
    chai
      .request(app)
      .post('/api/authenticate')
      .send({ data: { user: starterData.nonExistingUser } })
      .end((error, response) => {
        response.should.have.status(404);
        response.should.be.json;
        response.body.should.be.jsonSchema(baseObjectSchemas.returnData);

        done();
      });
  });
});
