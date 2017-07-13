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
const transactionSchemas = require('./schemas/transactions');
const errorSchemas = require('./schemas/errors');
const userSchemas = require('./schemas/users');
const dbWallet = require('../../db/connectors/wallet');
const tokens = require('./testData/tokens');
const transactionData = require('./testData/transactions');
const authenticateSchemas = require('./schemas/authentications');

chai.should();

chai.use(chaiHttp);
chai.use(chaiJson);

describe('Transactions', () => {
  const transactionTokens = {
    poor: '',
    rich: '',
  };

  before(`Create user ${transactionData.newUserToSendCredits.userName} on /users POST`, (done) => {
    chai
      .request(app)
      .post('/api/users')
      .set('Authorization', tokens.adminUser)
      .send({ data: { user: transactionData.newUserToSendCredits } })
      .end((error, response) => {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.jsonSchema(userSchemas.user);
        done();
      });
  });

  before(`Create user ${transactionData.newUserToReceiveCredits.userName} on /users POST`, (done) => {
    chai
      .request(app)
      .post('/api/users')
      .set('Authorization', tokens.adminUser)
      .send({ data: { user: transactionData.newUserToReceiveCredits } })
      .end((error, response) => {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.jsonSchema(userSchemas.user);
        done();
      });
  });

  before(`Authenticate ${transactionData.newUserToSendCredits.userName}`, (done) => {
    chai
      .request(app)
      .post('/api/authenticate')
      .send({ data: { user: transactionData.newUserToSendCredits } })
      .end((error, response) => {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.jsonSchema(authenticateSchemas.authenticate);

        transactionTokens.rich = response.body.data.token;

        done();
      });
  });

  before(`Authenticate ${transactionData.newUserToReceiveCredits.userName}`, (done) => {
    chai
      .request(app)
      .post('/api/authenticate')
      .send({ data: { user: transactionData.newUserToReceiveCredits } })
      .end((error, response) => {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.jsonSchema(authenticateSchemas.authenticate);

        transactionTokens.poor = response.body.data.token;

        done();
      });
  });

  before(`Give ${transactionData.newUserToSendCredits.userName} user credits`, (done) => {
    dbWallet.increaseAmount({
      owner: transactionData.newUserToSendCredits.userName,
      amount: 100,
      callback: (walletData) => {
        walletData.should.have.property('data');
        done();
      },
    });
  });

  describe('List transasctions', () => {
    it('Should NOT list transactions for user with incorrect authorization on /transactions GET', (done) => {
      chai
        .request(app)
        .get('/api/transactions')
        .set('Authorization', tokens.incorrectJwt)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should list transactions for user on /transactions GET', (done) => {
      chai
        .request(app)
        .get('/api/transactions')
        .set('Authorization', tokens.adminUser)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(transactionSchemas.allTransactions);

          done();
        });
    });
  });

  describe('Create transaction between users', () => {
    it('Should NOT create transaction with incorrect authorization on /transactions POST', (done) => {
      chai
        .request(app)
        .post('/api/transactions')
        .set('Authorization', tokens.incorrectJwt)
        .send({ data: { transaction: { to: transactionData.newUserToReceiveCredits.userName, amount: 10 } } })
        .end((error, response) => {
          response.should.have.status(401);
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should NOT create transaction, due to not having enough currency on /transactions POST', (done) => {
      chai
        .request(app)
        .post('/api/transactions')
        .set('Authorization', transactionTokens.poor)
        .send({ data: { transaction: { to: transactionData.newUserToSendCredits.userName, amount: 15 } } })
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should create transaction from user with enough credits in wallet on /transactions POST', (done) => {
      chai
        .request(app)
        .post('/api/transactions')
        .set('Authorization', transactionTokens.rich)
        .send({ data: { transaction: { to: transactionData.newUserToReceiveCredits.userName, amount: 10 } } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(transactionSchemas.fullTransaction);

          done();
        });
    });

    it('Should list sender transactions with new transaction on /transactions GET', (done) => {
      chai
        .request(app)
        .get('/api/transactions')
        .set('Authorization', transactionTokens.rich)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(transactionSchemas.allTransactions);
          response.body.data.fromTransactions.should.have.lengthOf(1);
          // TODO Should check info in transaction

          done();
        });
    });

    it('Should list receiver transactions with new transaction on /transactions GET', (done) => {
      chai
        .request(app)
        .get('/api/transactions')
        .set('Authorization', transactionTokens.poor)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(transactionSchemas.allTransactions);
          response.body.data.toTransactions.should.have.lengthOf(1);
          // TODO Should check info in transaction

          done();
        });
    });
  });

  describe('Create transaction with incorrect information', () => {
    it('Should NOT create transaction with self as receiver on /transactions POST', (done) => {
      chai
        .request(app)
        .post('/api/transactions')
        .set('Authorization', transactionTokens.rich)
        .send({ data: { transaction: { to: transactionData.newUserToSendCredits.userName, amount: 10 } } })
        .end((error, response) => {
          response.should.have.status(400);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });
  });
});
