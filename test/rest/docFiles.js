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
const tokens = require('./testData/tokens');
const docFileData = require('./testData/docFiles');

chai.should();
chai.use(chaiHttp);
chai.use(chaiJson);

describe('DocFiles', () => {
  describe('Create DocFile', () => {
    it('Should NOT create docFile with incorrect authorization on /api/docFiles POST', (done) => {
      chai
        .request(app)
        .post('/api/docFiles')
        .set('Authorization', tokens.incorrectJwt)
        .send({ data: { docFile: docFileData.privateDocFileToCreate } })
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should create new private docFile on /api/docFiles POST', (done) => {
      chai
        .request(app)
        .post('/api/docFiles')
        .set('Authorization', tokens.adminUser)
        .send({ data: { docFile: docFileData.privateDocFileToCreate } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(docFileSchemas.docFile);

          done();
        });
    });

    it('Should NOT create docFile with existing docFileId on /api/docFiles POST', (done) => {
      chai
        .request(app)
        .post('/api/docFiles')
        .set('Authorization', tokens.adminUser)
        .send({ data: { docFile: docFileData.privateDocWithSameId } })
        .end((error, response) => {
          response.should.have.status(403);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should NOT create docFile with existing title on /api/docFiles POST', (done) => {
      chai
        .request(app)
        .post('/api/docFiles')
        .set('Authorization', tokens.adminUser)
        .send({ data: { docFile: docFileData.privateDocWithSameTitle } })
        .end((error, response) => {
          response.should.have.status(403);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should NOT create docFile with empty docFileId on /api/docFiles POST', (done) => {
      chai
        .request(app)
        .post('/api/docFiles')
        .set('Authorization', tokens.adminUser)
        .send({ data: { docFile: docFileData.docWithNoDocFileId } })
        .end((error, response) => {
          response.should.have.status(400);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should NOT create docFile with empty text on /api/docFiles POST', (done) => {
      chai
        .request(app)
        .post('/api/docFiles')
        .set('Authorization', tokens.adminUser)
        .send({ data: { docFile: docFileData.docWithNoText } })
        .end((error, response) => {
          response.should.have.status(400);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should NOT create docFile with empty title on /api/docFiles POST', (done) => {
      chai
        .request(app)
        .post('/api/docFiles')
        .set('Authorization', tokens.adminUser)
        .send({ data: { docFile: docFileData.docWithNoTitle } })
        .end((error, response) => {
          response.should.have.status(400);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should create new public docFile on /api/docFiles POST', (done) => {
      chai
        .request(app)
        .post('/api/docFiles')
        .set('Authorization', tokens.adminUser)
        .send({ data: { docFile: docFileData.publicDocToCreate } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(docFileSchemas.docFile);

          done();
        });
    });
  });

  describe('List DocFiles', () => {
    it('Should NOT list docFiles with incorrect authorization on /api/docFiles GET', (done) => {
      chai
        .request(app)
        .get('/api/docFiles')
        .set('Authorization', tokens.incorrectJwt)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should list docFiles on /api/docFiles GET', (done) => {
      chai
        .request(app)
        .get('/api/docFiles')
        .set('Authorization', tokens.adminUser)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(docFileSchemas.docFilesList);

          done();
        });
    });
  });

  describe('Get specific DocFile', () => {
    before('Create private docFile on /api/docFiles', (done) => {
      chai
        .request(app)
        .post('/api/docFiles')
        .set('Authorization', tokens.adminUser)
        .send({ data: { docFile: docFileData.privateDocFileToCreateAndGet } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(docFileSchemas.docFile);

          done();
        });
    });

    before('Create public docFile on /api/docFiles', (done) => {
      chai
        .request(app)
        .post('/api/docFiles')
        .set('Authorization', tokens.adminUser)
        .send({ data: { docFile: docFileData.publicDocFileToCreateAndGet } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(docFileSchemas.docFile);

          done();
        });
    });

    it('Should get specific public docFile on /api/docFiles/:id GET', (done) => {
      chai
        .request(app)
        .get(`/api/docFiles/${docFileData.publicDocFileToCreateAndGet.docFileId}`)
        .set('Authorization', tokens.basicUser)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(docFileSchemas.docFile);

          done();
        });
    });

    it('Should get specific private docFile on /api/docFiles/:id GET', (done) => {
      chai
        .request(app)
        .get(`/api/docFiles/${docFileData.privateDocFileToCreateAndGet.docFileId}`)
        .set('Authorization', tokens.basicUser)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(docFileSchemas.docFile);

          done();
        });
    });
  });
});
