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
const walletSchemas = require('./schemas/wallets');
const errorSchemas = require('./schemas/errors');
const tokens = require('./testData/tokens');
const walletData = require('./testData/wallets');
const userSchemas = require('./schemas/users');
const authenticateSchemas = require('./schemas/authentications');
const dbWallet = require('../../db/connectors/wallet');
const starterData = require('./testData/starter');
const transactionSchemas = require('./schemas/transactions');
const transactionData = require('./testData/transactions');

chai.should();

chai.use(chaiHttp);
chai.use(chaiJson);

describe('Wallets', () => {
  const walletTokens = {
    user: '',
    teamUser: '',
  };

  before(`Create user ${walletData.userWithoutTeam.userName} on /api/users POST`, (done) => {
    chai
      .request(app)
      .post('/api/users')
      .set('Authorization', tokens.adminUser)
      .send({ data: { user: walletData.userWithoutTeam } })
      .end((error, response) => {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.jsonSchema(userSchemas.user);
        done();
      });
  });

  before(`Create user ${walletData.userWithTeam.userName} on /api/users POST`, (done) => {
    chai
      .request(app)
      .post('/api/users')
      .set('Authorization', tokens.adminUser)
      .send({ data: { user: walletData.userWithTeam } })
      .end((error, response) => {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.jsonSchema(userSchemas.user);
        done();
      });
  });

  before(`Authenticate ${walletData.userWithoutTeam.userName} on /api/authenticate`, (done) => {
    chai
      .request(app)
      .post('/api/authenticate')
      .send({ data: { user: walletData.userWithoutTeam } })
      .end((error, response) => {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.jsonSchema(authenticateSchemas.authenticate);

        walletTokens.user = response.body.data.token;

        done();
      });
  });

  before(`Authenticate ${walletData.userWithTeam.userName} on /api/authenticate`, (done) => {
    chai
      .request(app)
      .post('/api/authenticate')
      .send({ data: { user: walletData.userWithTeam } })
      .end((error, response) => {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.jsonSchema(authenticateSchemas.authenticate);

        walletTokens.teamUser = response.body.data.token;

        done();
      });
  });

  before(`Give ${walletData.userWithoutTeam.userName} user credits`, (done) => {
    dbWallet.increaseAmount({
      owner: walletData.userWithoutTeam.userName,
      amount: 100,
      callback: ({ data }) => {
        data.should.have.property('wallet');
        data.wallet.amount.should.equal(100);

        done();
      },
    });
  });

  before(`Give ${walletData.userWithTeam.userName} user credits`, (done) => {
    dbWallet.increaseAmount({
      owner: walletData.userWithTeam.userName,
      amount: 100,
      callback: ({ data }) => {
        data.should.have.property('wallet');
        data.wallet.amount.should.equal(100);

        done();
      },
    });
  });

  describe('Get user wallet', () => {
    it('Should NOT get user wallet with incorrect authorization on /api/wallets/:owner GET', (done) => {
      chai
        .request(app)
        .get(`/api/wallets/${walletData.userWithoutTeam.userName}`)
        .set('Authorization', tokens.incorrectJwt)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);
          done();
        });
    });

    it('Should get user wallet with lower access level than user\'s on /api/wallets/:owner GET', (done) => {
      chai
        .request(app)
        .get(`/api/wallets/${walletData.userWithoutTeam.userName}`)
        .set('Authorization', tokens.adminUser)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(walletSchemas.wallet);
          done();
        });
    });

    it('Should NOT get user wallet with equal or higher access level than user\'s on /api/wallets/:owner GET', (done) => {
      chai
        .request(app)
        .get(`/api/wallets/${walletData.userWithTeam.userName}`)
        .set('Authorization', tokens.basicUser)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);
          done();
        });
    });
  });

  describe('Increase wallet amount', () => {
    let amount = 0;

    before(`Give ${walletData.userWithTeam.userName} user credits`, (done) => {
      dbWallet.increaseAmount({
        owner: walletData.userWithTeam.userName,
        amount: 2,
        callback: ({ data }) => {
          data.should.have.property('wallet');

          amount = data.wallet.amount;

          done();
        },
      });
    });

    it('Should NOT increase wallet with incorrect authorization on /api/wallets/:owner/increase POST', (done) => {
      chai
        .request(app)
        .post(`/api/wallets/${walletData.userWithoutTeam.userName}/increase`)
        .set('Authorization', tokens.incorrectJwt)
        .send({ data: { amount: 15 } })
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);
          done();
        });
    });

    it('Should NOT increase wallet amount with too low access level on /api/wallets/:owner/increase POST', (done) => {
      chai
        .request(app)
        .post(`/api/wallets/${walletData.userWithTeam.userName}/increase`)
        .set('Authorization', walletTokens.user)
        .send({ data: { amount: 5 } })
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);
          done();
        });
    });

    it('Should increase wallet amount with high enough access level on /api/wallets/:owner/increase POST', (done) => {
      chai
        .request(app)
        .post(`/api/wallets/${walletData.userWithTeam.userName}/increase`)
        .set('Authorization', tokens.adminUser)
        .send({ data: { amount: 7 } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(walletSchemas.wallet);
          response.body.data.wallet.amount.should.equal(amount + 7);
          done();
        });
    });

    it('Should NOT increase wallet amount with negative value on /api/wallets/:owner/increase POST', (done) => {
      chai
        .request(app)
        .post(`/api/wallets/${walletData.userWithoutTeam.userName}/increase`)
        .set('Authorization', tokens.adminUser)
        .send({ data: { amount: -9 } })
        .end((error, response) => {
          response.should.have.status(400);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);
          done();
        });
    });
  });

  describe('Decrease wallet amount', () => {
    let amount = 0;

    before('Get user wallet amount on /api/wallets/:owner GET', (done) => {
      chai
        .request(app)
        .get(`/api/wallets/${walletData.userWithTeam.userName}`)
        .set('Authorization', tokens.adminUser)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(walletSchemas.wallet);

          amount = response.body.data.wallet.amount;

          done();
        });
    });

    it('Should NOT decrease wallet with incorrect authorization on /api/wallets/:owner/decrease POST', (done) => {
      chai
        .request(app)
        .post(`/api/wallets/${walletData.userWithoutTeam.userName}/decrease`)
        .set('Authorization', tokens.incorrectJwt)
        .send({ data: { amount: 2 } })
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);
          done();
        });
    });

    it('Should NOT decrease wallet amount with too low access level on /api/wallets/:owner/decrease POST', (done) => {
      chai
        .request(app)
        .post(`/api/wallets/${walletData.userWithTeam.userName}/decrease`)
        .set('Authorization', walletTokens.user)
        .send({ data: { amount: 2 } })
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);
          done();
        });
    });

    it('Should decrease wallet amount with high enough access level on /api/wallets/:owner/decrease POST', (done) => {
      chai
        .request(app)
        .post(`/api/wallets/${walletData.userWithTeam.userName}/decrease`)
        .set('Authorization', tokens.adminUser)
        .send({ data: { amount: 2 } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(walletSchemas.wallet);
          response.body.data.wallet.amount.should.equal(amount - 2);
          done();
        });
    });

    it('Should NOT decrease wallet amount with negative value on /api/wallets/:owner/decrease POST', (done) => {
      chai
        .request(app)
        .post(`/api/wallets/${walletData.userWithTeam.userName}/decrease`)
        .set('Authorization', tokens.adminUser)
        .send({ data: { amount: -2 } })
        .end((error, response) => {
          response.should.have.status(400);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);
          done();
        });
    });

    it('Should NOT decrease wallet below 0 on /api/wallets/:owner/decrease POST', (done) => {
      chai
        .request(app)
        .post(`/api/wallets/${walletData.userWithoutTeam.userName}/decrease`)
        .set('Authorization', tokens.adminUser)
        .send({ data: { amount: 300 } })
        .end((error, response) => {
          response.should.have.status(400);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);
          done();
        });
    });
  });

  describe('Empty out wallet', () => {
    it('Should NOT empty wallet with incorrect authorization on /api/wallets/:owner/empty POST', (done) => {
      chai
        .request(app)
        .post(`/api/wallets/${walletData.userWithoutTeam.userName}/empty`)
        .set('Authorization', tokens.incorrectJwt)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);
          done();
        });
    });

    it('Should NOT empty wallet with too low access level on /api/wallets/:owner/empty POST', (done) => {
      chai
        .request(app)
        .post(`/api/wallets/${walletData.userWithTeam.userName}/empty`)
        .set('Authorization', walletTokens.user)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);
          done();
        });
    });

    it('Should empty wallet with high enough access level on /api/wallets/:owner/empty POST', (done) => {
      chai
        .request(app)
        .post(`/api/wallets/${walletData.userWithTeam.userName}/empty`)
        .set('Authorization', tokens.adminUser)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(walletSchemas.wallet);
          response.body.data.wallet.amount.should.equal(0);
          done();
        });
    });
  });

  describe('Transactions', () => {
    const transactionTokens = {
      poor: '',
      rich: '',
    };

    before(`Create user ${transactionData.newUserToSendCredits.userName} on /api/users POST`, (done) => {
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

    before(`Create user ${transactionData.newUserToReceiveCredits.userName} on /api/users POST`, (done) => {
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

    before(`Authenticate ${transactionData.newUserToSendCredits.userName} on /api/authenticate`, (done) => {
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

    before(`Authenticate ${transactionData.newUserToReceiveCredits.userName} on /api/authenticate`, (done) => {
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
        callback: ({ data }) => {
          data.should.have.property('wallet');
          done();
        },
      });
    });

    describe('Get transactions', () => {
      it('Should NOT get transactions for user with incorrect authorization on /api/wallets/:owner/transactions GET', (done) => {
        chai
          .request(app)
          .get(`/api/wallets/${starterData.adminUserToAuth.userName}/transactions`)
          .set('Authorization', tokens.incorrectJwt)
          .end((error, response) => {
            response.should.have.status(401);
            response.should.be.json;
            response.body.should.be.jsonSchema(errorSchemas.error);

            done();
          });
      });

      it('Should get transactions for user on /api/wallets/:owner/transactions GET', (done) => {
        chai
          .request(app)
          .get(`/api/wallets/${starterData.adminUserToAuth.userName}/transactions`)
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
      it('Should NOT create transaction with incorrect authorization on /api/transactions POST', (done) => {
        chai
          .request(app)
          .post(`/api/wallets/${starterData.adminUserToAuth.userName}/transactions`)
          .set('Authorization', tokens.incorrectJwt)
          .send({ data: { transaction: { to: transactionData.newUserToReceiveCredits.userName, amount: 10 } } })
          .end((error, response) => {
            response.should.have.status(401);
            response.body.should.be.jsonSchema(errorSchemas.error);

            done();
          });
      });

      it('Should NOT create transaction, due to not having enough currency on /api/transactions POST', (done) => {
        chai
          .request(app)
          .post(`/api/wallets/${transactionData.newUserToReceiveCredits.userName}/transactions`)
          .set('Authorization', transactionTokens.poor)
          .send({ data: { transaction: { to: transactionData.newUserToSendCredits.userName, amount: 25 } } })
          .end((error, response) => {
            response.should.have.status(401);
            response.should.be.json;
            response.body.should.be.jsonSchema(errorSchemas.error);

            done();
          });
      });

      it('Should create transaction from user with enough credits in wallet on /api/transactions POST', (done) => {
        chai
          .request(app)
          .post(`/api/wallets/${transactionData.newUserToSendCredits.userName}/transactions`)
          .set('Authorization', transactionTokens.rich)
          .send({ data: { transaction: { to: transactionData.newUserToReceiveCredits.userName, amount: 10 } } })
          .end((error, response) => {
            response.should.have.status(200);
            response.should.be.json;
            response.body.should.be.jsonSchema(transactionSchemas.fullTransaction);

            done();
          });
      });

      it('Should get sender transactions with new transaction on /api/transactions GET', (done) => {
        chai
          .request(app)
          .get(`/api/wallets/${transactionData.newUserToSendCredits.userName}/transactions`)
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

      it('Should get receiver transactions with new transaction on /api/transactions GET', (done) => {
        chai
          .request(app)
          .get(`/api/wallets/${transactionData.newUserToReceiveCredits.userName}/transactions`)
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

    // TODO Create transaction between teams

    // TODO Create transaction between user and team

    describe('Create transaction with incorrect information', () => {
      it('Should NOT create transaction with self as receiver on /api/transactions POST', (done) => {
        chai
          .request(app)
          .post(`/api/wallets/${transactionData.newUserToSendCredits.userName}/transactions`)
          .set('Authorization', transactionTokens.rich)
          .send({ data: { transaction: { to: transactionData.newUserToSendCredits.userName, amount: 10 } } })
          .end((error, response) => {
            response.should.have.status(400);
            response.should.be.json;
            response.body.should.be.jsonSchema(errorSchemas.error);

            done();
          });
      });

      it('Should NOT create transaction with amount that equals 0 on /api/transactions POST', (done) => {
        chai
          .request(app)
          .post(`/api/wallets/${transactionData.newUserToSendCredits.userName}/transactions`)
          .set('Authorization', transactionTokens.rich)
          .send({ data: { transaction: { to: transactionData.newUserToReceiveCredits.userName, amount: 0 } } })
          .end((error, response) => {
            response.should.have.status(400);
            response.should.be.json;
            response.body.should.be.jsonSchema(errorSchemas.error);

            done();
          });
      });

      it('Should NOT create transaction with amount that is less than 0 on /api/transactions POST', (done) => {
        chai
          .request(app)
          .post(`/api/wallets/${transactionData.newUserToSendCredits.userName}/transactions`)
          .set('Authorization', transactionTokens.rich)
          .send({ data: { transaction: { to: transactionData.newUserToReceiveCredits.userName, amount: -10 } } })
          .end((error, response) => {
            response.should.have.status(400);
            response.should.be.json;
            response.body.should.be.jsonSchema(errorSchemas.error);

            done();
          });
      });
    });
  });
});
