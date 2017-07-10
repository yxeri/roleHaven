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
const docFileSchemas = require('./schemas/docFiles');
const errorSchemas = require('./schemas/errors');
const testData = require('./helper/testData');
const tokens = require('./helper/starter').tokens;

chai.should();
chai.use(chaiHttp);
chai.use(chaiJson);

describe('DocFiles', () => {
  describe('List DocFiles', () => {
    it('Should NOT list docFiles with incorrect authorization on /docFiles GET', (done) => {
      chai
        .request(app)
        .get('/api/docFiles')
        .set('Authorization', testData.incorrectJwt)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should list docFiles on /docFiles GET', (done) => {
      chai
        .request(app)
        .get('/api/docFiles')
        .set('Authorization', tokens.admin)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(docFileSchemas.docFilesList);

          done();
        });
    });
  });

  describe('Create DocFile', () => {
    it('Should NOT create docFile with incorrect authorization on /docFiles POST', (done) => {
      chai
        .request(app)
        .post('/api/docFiles')
        .set('Authorization', testData.incorrectJwt)
        .send({ data: { docFile: testData.docFilePrivate } })
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should create new private docFile on /docFiles POST', (done) => {
      chai
        .request(app)
        .post('/api/docFiles')
        .set('Authorization', tokens.admin)
        .send({ data: { docFile: testData.docFilePrivate } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(docFileSchemas.docFile);

          done();
        });
    });

    it('Should NOT create docFile with existing docFileId on /docFiles POST', (done) => {
      chai
        .request(app)
        .post('/api/docFiles')
        .set('Authorization', tokens.admin)
        .send({ data: { docFile: testData.docFilePrivateChangedTitle } })
        .end((error, response) => {
          response.should.have.status(403);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should NOT create docFile with existing title on /docFiles POST', (done) => {
      chai
        .request(app)
        .post('/api/docFiles')
        .set('Authorization', tokens.admin)
        .send({ data: { docFile: testData.docFilePrivateChangedId } })
        .end((error, response) => {
          response.should.have.status(403);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should create new public docFile on /docFiles POST', (done) => {
      chai
        .request(app)
        .post('/api/docFiles')
        .set('Authorization', tokens.admin)
        .send({ data: { docFile: testData.docFilePublic } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(docFileSchemas.docFile);

          done();
        });
    });
  });

  describe('Get specific DocFile', () => {
    before('Create private docFile', (done) => {
      chai
        .request(app)
        .post('/api/docFiles')
        .set('Authorization', tokens.admin)
        .send({ data: { docFile: testData.docFileNewPrivate } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(docFileSchemas.docFile);

          done();
        });
    });

    before('Create public docFile', (done) => {
      chai
        .request(app)
        .post('/api/docFiles')
        .set('Authorization', tokens.admin)
        .send({ data: { docFile: testData.docFileNewPublic } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(docFileSchemas.docFile);

          done();
        });
    });

    it('Should get specific public docFile on /docFiles/:id GET', (done) => {
      chai
        .request(app)
        .get(`/api/docFiles/${testData.docFileNewPublic.docFileId}`)
        .set('Authorization', tokens.normal)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(docFileSchemas.docFile);

          done();
        });
    });

    it('Should get specific private docFile on /docFiles/:id GET', (done) => {
      chai
        .request(app)
        .get(`/api/docFiles/${testData.docFileNewPrivate.docFileId}`)
        .set('Authorization', tokens.normal)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(docFileSchemas.docFile);

          done();
        });
    });
  });
});
