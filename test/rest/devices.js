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
const deviceSchemas = require('./schemas/devices');
const errorSchemas = require('./schemas/errors');
const tokens = require('./testData/tokens');
const deviceData = require('./testData/devices');
const userSchemas = require('./schemas/users');
const authenticateSchemas = require('./schemas/authentications');

chai.should();
chai.use(chaiHttp);
chai.use(chaiJson);

describe('Devices', () => {
  describe('Update device', () => {
    const userTokens = {
      adminUser: '',
    };

    before('Create admin user on /api/users POST', (done) => {
      chai
        .request(app)
        .post('/api/users')
        .set('Authorization', tokens.adminUser)
        .send({ data: { user: deviceData.adminUserToChangeDeviceAliasWith } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(userSchemas.user);

          done();
        });
    });

    before('Authenticate admin user user on /api/authenticate', (done) => {
      chai
        .request(app)
        .post('/api/authenticate')
        .send({ data: { user: deviceData.adminUserToChangeDeviceAliasWith } })
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(authenticateSchemas.authenticate);

          userTokens.adminUser = response.body.data.token;

          done();
        });
    });

    it('Should update device without user auth on /api/devices/:deviceId POST', (done) => {
      chai
        .request(app)
        .post(`/api/devices/${deviceData.deviceWithoutUser}`)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(deviceSchemas.device);

          done();
        });
    });

    it('Should update device with user authentication on /api/devices/:deviceId POST', (done) => {
      chai
        .request(app)
        .post(`/api/devices/${deviceData.deviceWithUser.deviceId}`)
        .set('Authorization', userTokens.adminUser)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(deviceSchemas.device);
          response.body.data.device.lastUser.should.equal(deviceData.adminUserToChangeDeviceAliasWith.username);

          done();
        });
    });

    describe('Update device alias', () => {
      before('Update device without user on /api/devices/:deviceId POST', (done) => {
        chai
          .request(app)
          .post(`/api/devices/${deviceData.deviceWithoutUser.deviceId}`)
          .end((error, response) => {
            response.should.have.status(200);
            response.should.be.json;
            response.body.should.be.jsonSchema(deviceSchemas.device);

            done();
          });
      });

      it('Should update device alias on existing device /api/devices/:deviceId/alias POST', (done) => {
        chai
          .request(app)
          .post(`/api/devices/${deviceData.deviceWithoutUser.deviceId}/alias`)
          .send({ data: { device: deviceData.deviceWithNewAlias } })
          .set('Authorization', userTokens.adminUser)
          .end((error, response) => {
            response.should.have.status(200);
            response.should.be.json;
            response.body.should.be.jsonSchema(deviceSchemas.device);
            response.body.data.device.deviceAlias.should.equal(deviceData.deviceWithNewAlias.deviceAlias);

            done();
          });
      });
    });
  });

  describe('Get devices', () => {
    it('Should NOT retrieve devices with incorrect authorization on /api/devices GET', (done) => {
      chai
        .request(app)
        .get('/api/devices')
        .set('Authorization', tokens.incorrectJwt)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(errorSchemas.error);

          done();
        });
    });

    it('Should get devices on /api/devices GET', (done) => {
      chai
        .request(app)
        .get('/api/devices')
        .set('Authorization', tokens.adminUser)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(deviceSchemas.devices);

          done();
        });
    });
  });
});
