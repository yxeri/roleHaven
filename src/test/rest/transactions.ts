/* eslint-disable no-unused-expressions */

'use strict';

import chai from 'chai';
import chaiHttp from 'chai-http';
import chaiJson from 'chai-json-schema';
import transactionSchemas from './schemas/transactions';
import testData from './testData/transactions';
import testBuilder from './helper/testBuilder';
import tokens from './testData/tokens';
import baseObjectSchemas from './schemas/baseObjects';
import userSchemas from './schemas/users';
import { appConfig } from '../../config/defaults/config';

import tools from './helper/tools';
import app from '../../app';

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
