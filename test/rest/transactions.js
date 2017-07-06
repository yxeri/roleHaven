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
const schemas = require('./helper/schemas');
const helperData = require('./helper/data');
const dbWallet = require('../../db/connectors/wallet');

chai.should();

chai.use(chaiHttp);
chai.use(chaiJson);

describe('Transactions', () => {
  // jwt token
  let adminToken = '';
  let normalToken = '';

  before('Give admin user credits', (done) => {
    dbWallet.increaseAmount({
      owner: helperData.adminUser.userName,
      amount: 100,
      callback: (walletData) => {
        walletData.should.have.property('data');
        done();
      },
    });
  });

  before('Authenticate admin user', (done) => {
    chai
      .request(app)
      .post('/api/authenticate')
      .send({ data: { user: helperData.adminUser } })
      .end((error, response) => {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.jsonSchema(schemas.authenticate);

        adminToken = response.body.data.token;

        done();
      });
  });

  before('Authenticate receiver user', (done) => {
    chai
      .request(app)
      .post('/api/authenticate')
      .send({ data: { user: helperData.normalUser } })
      .end((error, response) => {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.jsonSchema(schemas.authenticate);

        normalToken = response.body.data.token;

        done();
      });
  });

  describe('Transaction from admin user to normal user', () => {
    it(`Should create transaction from user ${helperData.adminUser.userName} to user ${helperData.normalUser.userName} with enough credits in wallet on /transactions POST`, (done) => {
      chai
        .request(app)
        .post('/api/transactions')
        .set('Authorization', adminToken)
        .send({ data: { transaction: { to: helperData.normalUser.userName, amount: 10 } } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(schemas.fullTransaction);

          done();
        });
    });

    it('Should NOT create transaction with incorrect authorization on /transactions POST', (done) => {
      chai
        .request(app)
        .post('/api/transactions')
        .set('Authorization', helperData.incorrectJwt)
        .send({ data: { transaction: { to: helperData.normalUser.userName, amount: 10 } } })
        .end((error, response) => {
          response.should.have.status(401);

          done();
        });
    });

    it('Should NOT list transactions with incorrect authoriszation on /transactions GET', (done) => {
      chai
        .request(app)
        .get('/api/transactions')
        .set('Authorization', helperData.incorrectJwt)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;

          done();
        });
    });

    it(`Should list user ${helperData.adminUser.userName} transactions with new transaction on /transactions GET`, (done) => {
      chai
        .request(app)
        .get('/api/transactions')
        .set('Authorization', adminToken)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(schemas.allTransactions);
          response.body.data.fromTransactions.should.have.lengthOf(1);
          // TODO Should check info in transaction

          done();
        });
    });

    it(`Should list user ${helperData.normalUser.userName} transactions with new transaction on /transactions GET`, (done) => {
      chai
        .request(app)
        .get('/api/transactions')
        .set('Authorization', normalToken)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(schemas.allTransactions);
          response.body.data.toTransactions.should.have.lengthOf(1);
          // TODO Should check info in transaction

          done();
        });
    });
  });

  describe('Transaction from user without enough currency', () => {
    it('Should NOT create transaction, due to not having enough currency on /transactions POST', (done) => {
      chai
        .request(app)
        .post('/api/transactions')
        .set('Authorization', normalToken)
        .send({ data: { transaction: { to: helperData.adminUser.userName, amount: 15 } } })
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;

          done();
        });
    });
  });

  describe('Incorrect sender/receiver information', () => {
    it('Should NOT create transaction with self as receiver on /transactions POST', (done) => {
      chai
        .request(app)
        .post('/api/transactions')
        .set('Authorization', adminToken)
        .send({ data: { transaction: { to: helperData.adminUser.userName, amount: 10 } } })
        .end((error, response) => {
          response.should.have.status(400);
          response.should.be.json;

          done();
        });
    });
  });
});
