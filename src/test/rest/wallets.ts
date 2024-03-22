/* eslint-disable no-unused-expressions */

'use strict';

import chai from 'chai';
import chaiHttp from 'chai-http';
import chaiJson from 'chai-json-schema';
import walletSchemas from './schemas/wallets';
import testData from './testData/wallets';
import testBuilder from './helper/testBuilder';
import tokens from './testData/tokens';
import app from '../../app';
import baseObjectSchemas from './schemas/baseObjects';

chai.should();
chai.use(chaiHttp);
chai.use(chaiJson);

describe('Wallets', () => {
  const apiPath = '/api/wallets/';
  const objectIdType = 'walletId';
  const objectType = 'wallet';
  const objectsType = 'wallets';

  before('Create a user on /api/users POST', (done) => {
    const dataToSend = {
      data: {
        user: {
          username: 'wallet',
          password: 'password',
        },
      },
    };

    chai
      .request(app)
      .post('/api/users')
      .set('Authorization', tokens.adminUserOne)
      .send(dataToSend)
      .end((error, response) => {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.jsonSchema(baseObjectSchemas.returnData);
        response.body.should.have.property('data');

        testData.customObjectId = response.body.data.user.objectId;

        testBuilder.createTestUpdate({
          objectType,
          objectIdType,
          apiPath,
          skipCreation: true,
          testData: testData.update,
          schema: walletSchemas.wallet,
        });

        testBuilder.createTestGet({
          objectIdType,
          apiPath,
          objectType,
          objectsType,
          skipCreation: true,
          testData: testData.create,
          singleLiteSchema: walletSchemas.wallet,
          multiLiteSchema: walletSchemas.wallets,
          singleFullSchema: walletSchemas.fullWallet,
          multiFullSchema: walletSchemas.fullWallets,
        });

        done();
      });
  });
});
