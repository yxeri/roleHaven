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
const chaiJson = require('chai-json-schema');
const transactionSchemas = require('./schemas/transactions');
const testData = require('./testData/transactions');
const testBuilder = require('./helper/testBuilder');
const tokens = require('./testData/tokens');
const baseObjectSchemas = require('./schemas/baseObjects');
const userSchemas = require('./schemas/users');
const { appConfig } = require('../../config/defaults/config');
const tools = require('./helper/tools');
const app = require('../../app');

chai.should();
chai.use(chaiHttp);
chai.use(chaiJson);

describe('Transactions', () => {
  const apiPath = '/api/transactions/';
  const objectIdType = 'transactionId';
  const objectType = 'transaction';
  const objectsType = 'transactions';

  before('Create a user on /api/users POST', (done) => {
    const dataToSend = {
      data: {
        user: {
          username: tools.createRandString({ length: appConfig.usernameMaxLength }),
          password: tools.createRandString({ length: appConfig.passwordMaxLength }),
          registerDevice: tools.createRandString({ length: appConfig.deviceIdLength }),
        },
      },
    };

    chai
      .request(app)
      .post('/api/users')
      .set('Authorization', tokens.basicUserOne)
      .send(dataToSend)
      .end((error, response) => {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.jsonSchema(baseObjectSchemas.returnData);
        response.body.data.user.should.be.jsonSchema(userSchemas.liteUser);

        const walletId = response.body.data.user.objectId;

        testData.create.first.fromWalletId = walletId;
        testData.create.second.fromWalletId = walletId;
        testData.update.toUpdate.fromWalletId = walletId;
        testData.remove.toRemove.fromWalletId = walletId;
        testData.remove.secondToRemove.fromWalletId = walletId;

        done();
      });
  });

  before('Create another user on /api/users POST', (done) => {
    const dataToSend = {
      data: {
        user: {
          username: tools.createRandString({ length: appConfig.usernameMaxLength }),
          password: tools.createRandString({ length: appConfig.passwordMaxLength }),
          registerDevice: tools.createRandString({ length: appConfig.deviceIdLength }),
        },
      },
    };

    chai
      .request(app)
      .post('/api/users')
      .set('Authorization', tokens.basicUserOne)
      .send(dataToSend)
      .end((error, response) => {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.jsonSchema(baseObjectSchemas.returnData);
        response.body.data.user.should.be.jsonSchema(userSchemas.liteUser);

        const walletId = response.body.data.user.objectId;

        testData.create.first.toWalletId = walletId;
        testData.create.second.toWalletId = walletId;
        testData.update.toUpdate.toWalletId = walletId;
        testData.remove.toRemove.toWalletId = walletId;
        testData.remove.secondToRemove.toWalletId = walletId;

        done();
      });
  });

  testBuilder.createTestCreate({
    objectType,
    apiPath,
    objectIdType,
    testData: testData.create,
    schema: transactionSchemas.transaction,
  });

  testBuilder.createTestUpdate({
    objectType,
    objectIdType,
    apiPath,
    createByAdmin: true,
    testData: testData.update,
    schema: transactionSchemas.transaction,
  });

  testBuilder.createTestGet({
    objectIdType,
    apiPath,
    objectType,
    objectsType,
    testData: testData.create,
    singleLiteSchema: transactionSchemas.transaction,
    multiLiteSchema: transactionSchemas.transactions,
    singleFullSchema: transactionSchemas.fullTransaction,
    multiFullSchema: transactionSchemas.fullTransactions,
  });

  testBuilder.createTestDelete({
    objectType,
    objectIdType,
    apiPath,
    skipOwner: true,
    createByAdmin: true,
    testData: testData.remove,
  });
});
