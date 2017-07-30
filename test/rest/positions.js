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
const errorSchemas = require('./schemas/errors');
const tokens = require('./testData/tokens');
const positionSchemas = require('./schemas/positions');
const positionData = require('./testData/positions');

chai.should();

chai.use(chaiHttp);
chai.use(chaiJson);

describe('Positions', () => {
  describe('Create position', () => {
    it('Should NOT create position with incorrect authorization on /api/positions POST', (done) => {
      chai
        .request(app)
        .post('/api/positions')
        .send({ data: { position: positionData.updatePositionData } })
        .set('Authorization', tokens.incorrectJwt)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should create position on /api/positions POST', (done) => {
      chai
        .request(app)
        .post('/api/positions')
        .send({ data: { position: positionData.updatePositionData } })
        .set('Authorization', tokens.adminUser)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(positionSchemas.position);

          done();
        });
    });
  });

  describe('Get positions', () => {
    it('Should NOT get positions with incorrect authorization on /api/positions GET', (done) => {
      chai
        .request(app)
        .get('/api/positions')
        .set('Authorization', tokens.incorrectJwt)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should get positions on /api/positions GET', (done) => {
      chai
        .request(app)
        .get('/api/positions')
        .set('Authorization', tokens.basicUser)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(positionSchemas.positions);

          done();
        });
    });
  });
});
