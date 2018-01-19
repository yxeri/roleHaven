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
const authenticateSchemas = require('./schemas/authentications');
const starterData = require('./testData/starter');
const baseObjectSchemas = require('./schemas/baseObjects');

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
        response.should.have.status(404);
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
        response.should.have.status(404);
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
