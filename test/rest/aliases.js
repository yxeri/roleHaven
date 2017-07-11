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
const aliasSchemas = require('./schemas/aliases');
const errorSchemas = require('./schemas/errors');
const tokens = require('./testData/tokens');
const aliasData = require('./testData/aliases');

chai.should();
chai.use(chaiHttp);
chai.use(chaiJson);

describe('Aliases', () => {
  describe('Create alias', () => {
    it('Should NOT create an alias that is too long /aliases POST', (done) => {
      chai
        .request(app)
        .post('/api/aliases')
        .send({ data: { alias: aliasData.tooLongAlias } })
        .set('Authorization', tokens.incorrectJwt)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should NOT create an alias with incorrect authorization on /aliases POST', (done) => {
      chai
        .request(app)
        .post('/api/aliases')
        .send({ data: { alias: aliasData.aliasToCreate } })
        .set('Authorization', tokens.incorrectJwt)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should create an alias on self on /aliases POST', (done) => {
      chai
        .request(app)
        .post('/api/aliases')
        .send({ data: { alias: aliasData.aliasToCreate } })
        .set('Authorization', tokens.adminUser)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(aliasSchemas.alias);

          done();
        });
    });

    it('Should NOT create an existing alias on /aliases POST', (done) => {
      chai
        .request(app)
        .post('/api/aliases')
        .send({ data: { alias: aliasData.aliasToCreate } })
        .set('Authorization', tokens.adminUser)
        .end((error, response) => {
          response.should.have.status(403);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });
  });

  describe('List aliases', () => {
    it('Should NOT retrieve aliases with incorrect authorization on /aliases GET', (done) => {
      chai
        .request(app)
        .get('/api/aliases')
        .set('Authorization', tokens.incorrectJwt)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should retrieve aliases and user name from self on /aliases GET', (done) => {
      chai
        .request(app)
        .get('/api/aliases')
        .set('Authorization', tokens.adminUser)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(aliasSchemas.aliases);

          done();
        });
    });
  });
});
