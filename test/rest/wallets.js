/*
 Copyright 2017 Carmilla Mina Jankovic

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
const walletSchemas = require('./schemas/wallets');
const testData = require('./testData/wallets');
const testBuilder = require('./helper/testBuilder');
const tokens = require('./testData/tokens');
const app = require('../../app');
const baseObjectSchemas = require('./schemas/baseObjects');

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
