/*
 Copyright 2018 Aleksandar Jankovic

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
const app = require('../../../app');
const tokens = require('../testData/tokens');
const baseObjectSchemas = require('../schemas/baseObjects');
const starterData = require('../testData/starter');
const { dbConfig } = require('../../../config/defaults/config');

chai.should();
chai.use(chaiHttp);
chai.use(chaiJson);

/**
 * Create tests for the creation of objects.
 * @param {Object} params - Parameters.
 * @param {Object} params.testData - Data to use in the creation of an object.
 * @param {string} params.objectType - Type of object to create.
 * @param {string} params.apiPath - Path to endpoint.
 * @param {Object} params.schema - Schema to test against.
 */
function createTestCreate({
  testData,
  objectType,
  apiPath,
  schema,
  createByAdmin,
  checkDuplicate = false,
}) {
  describe(`Create ${objectType}`, () => {
    it(`Should NOT create a ${objectType} with incorrect token on ${apiPath} POST`, (done) => {
      const dataToSend = { data: {} };
      dataToSend.data[objectType] = testData.first;

      chai
        .request(app)
        .post(testData.apiCreatePath || apiPath)
        .set('Authorization', tokens.incorrectJwt)
        .send(dataToSend)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(baseObjectSchemas.returnData);

          done();
        });
    });

    it(`Should create a ${objectType} on ${apiPath} POST`, (done) => {
      const dataToSend = { data: {} };
      dataToSend.data[objectType] = testData.first;

      chai
        .request(app)
        .post(testData.apiCreatePath || apiPath)
        .set('Authorization', createByAdmin ? tokens.adminUserOne : tokens.basicUserOne)
        .send(dataToSend)
        .end((error, response) => {
          console.log('created', response.body.data);

          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(baseObjectSchemas.returnData);
          response.body.data[objectType].should.be.jsonSchema(schema);
          response.body.data.changeType.should.equal(dbConfig.ChangeTypes.CREATE);

          done();
        });
    });

    if (checkDuplicate) {
      it(`Should NOT create a ${objectType} that already exists on ${apiPath} POST`, (done) => {
        const dataToSend = { data: {} };
        dataToSend.data[objectType] = testData.first;

        chai
          .request(app)
          .post(testData.apiCreatePath || apiPath)
          .set('Authorization', createByAdmin ? tokens.adminUserOne : tokens.basicUserOne)
          .send(dataToSend)
          .end((error, response) => {
            response.should.have.status(403);
            response.should.be.json;
            response.body.should.be.jsonSchema(baseObjectSchemas.returnData);

            done();
          });
      });
    }

    if (testData.missing) {
      Object.keys(testData.missing).forEach((param) => {
        it(`Should NOT create a ${objectType} with missing parameter ${param} on ${apiPath} POST`, (done) => {
          const dataToSend = { data: {} };
          dataToSend.data[objectType] = Object.assign({}, testData.missing);
          dataToSend.data[objectType][param] = undefined;

          chai
            .request(app)
            .post(testData.apiCreatePath || apiPath)
            .set('Authorization', createByAdmin ? tokens.adminUserOne : tokens.basicUserOne)
            .send(dataToSend)
            .end((error, response) => {
              response.should.have.status(400);
              response.should.be.json;
              response.body.should.be.jsonSchema(baseObjectSchemas.returnData);

              done();
            });
        });
      });
    }
  });
}

/**
 * Create tests for updating objects.
 * @param {Object} params - Parameters.
 * @param {Object} params.testData - Data to use in the update of an object.
 * @param {string} params.objectType - Type of object to update.
 * @param {string} params.objectIdType - Id for the type of object to test.
 * @param {string} params.apiPath - Path to endpoint.
 * @param {Object} params.schema - Schema to test against.
 * @param {boolean} [params.skipCreation] - Should the creation of a test object be skipped? The object tested against will fall back to the basic user object.
 */
function createTestUpdate({
  testData,
  objectType,
  objectIdType,
  apiPath,
  schema,
  createByAdmin,
  skipCreation = false,
}) {
  describe(`Update a ${objectType}`, () => {
    let updateObjectId = testData.customObjectId;

    if (!skipCreation) {
      before(`Create a ${objectType} on ${apiPath} POST`, (done) => {
        const dataToSend = { data: {} };
        dataToSend.data[objectType] = testData.toUpdate;

        chai
          .request(app)
          .post(testData.apiCreatePath || apiPath)
          .set('Authorization', createByAdmin ? tokens.adminUserOne : tokens.basicUserOne)
          .send(dataToSend)
          .end((error, response) => {
            response.should.have.status(200);
            response.should.be.json;
            response.body.should.be.jsonSchema(baseObjectSchemas.returnData);

            updateObjectId = response.body.data[objectType].objectId;

            done();
          });
      });
    }

    it(`Should NOT update a ${objectType} by a user without access on ${apiPath}:${objectIdType} PUT`, (done) => {
      const dataToSend = { data: {} };
      dataToSend.data[objectType] = testData.updateWith;

      chai
        .request(app)
        .put(`${apiPath}${updateObjectId || starterData.basicUserOne.objectId}`)
        .set('Authorization', tokens.moderatorUserOne)
        .send(dataToSend)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(baseObjectSchemas.returnData);

          done();
        });
    });

    it(`Should update a ${objectType} by a user with access on ${apiPath}:${objectIdType} PUT`, (done) => {
      const dataToSend = { data: {} };
      dataToSend.data[objectType] = testData.updateWith;

      chai
        .request(app)
        .put(`${apiPath}${updateObjectId || starterData.basicUserOne.objectId}`)
        .set('Authorization', createByAdmin ? tokens.adminUserOne : tokens.basicUserOne)
        .send(dataToSend)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(baseObjectSchemas.returnData);
          response.body.data[objectType].should.be.jsonSchema(schema);
          response.body.data.changeType.should.equal(dbConfig.ChangeTypes.UPDATE);

          done();
        });
    });
  });
}

/**
 * Create tests for removal of objects.
 * @param {Object} params - Parameters.
 * @param {Object} params.testData - Data to use in the removal of an object.
 * @param {string} params.objectType - Type of object to remove.
 * @param {string} params.objectIdType - Id for the type of object to test.
 * @param {string} params.apiPath - Path to endpoint.
 */
function createTestDelete({
  testData,
  objectType,
  objectIdType,
  apiPath,
  skipCreation,
  skipOwner,
  createByAdmin,
}) {
  describe(`Remove a ${objectType}`, () => {
    let objectIdToRemove;
    let secondObjectId;

    if (!skipCreation) {
      before(`Create a ${objectType} on ${apiPath} POST`, (done) => {
        const dataToSend = { data: {} };
        dataToSend.data[objectType] = testData.toRemove;

        chai
          .request(app)
          .post(testData.apiCreatePath || apiPath)
          .set('Authorization', createByAdmin ? tokens.adminUserOne : tokens.basicUserOne)
          .send(dataToSend)
          .end((error, response) => {
            response.should.have.status(200);
            response.should.be.json;
            response.body.should.be.jsonSchema(baseObjectSchemas.returnData);

            objectIdToRemove = response.body.data[objectType].objectId;

            done();
          });
      });

      before(`Create a ${objectType} on ${apiPath} POST`, (done) => {
        const dataToSend = { data: {} };
        dataToSend.data[objectType] = testData.secondToRemove;

        chai
          .request(app)
          .post(testData.apiCreatePath || apiPath)
          .set('Authorization', createByAdmin ? tokens.adminUserOne : tokens.basicUserOne)
          .send(dataToSend)
          .end((error, response) => {
            response.should.have.status(200);
            response.should.be.json;
            response.body.should.be.jsonSchema(baseObjectSchemas.returnData);

            secondObjectId = response.body.data[objectType].objectId;

            done();
          });
      });
    }

    it(`Should NOT remove a ${objectType} by a non-admin user on ${apiPath}:${objectIdType} DELETE`, (done) => {
      chai
        .request(app)
        .del(`${apiPath}${objectIdToRemove}`)
        .set('Authorization', tokens.basicUserTwo)
        .end((error, response) => {
          response.should.have.status(401);
          response.should.be.json;
          response.body.should.be.jsonSchema(baseObjectSchemas.returnData);

          done();
        });
    });

    it(`Should remove a ${objectType} by a system admin user on ${apiPath}:${objectIdType} DELETE`, (done) => {
      chai
        .request(app)
        .del(`${apiPath}${objectIdToRemove}`)
        .set('Authorization', tokens.adminUserTwo)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(baseObjectSchemas.returnData);
          response.body.data[objectType].should.be.jsonSchema(baseObjectSchemas.remove);
          response.body.data.changeType.should.equal(dbConfig.ChangeTypes.REMOVE);

          done();
        });
    });

    if (!skipOwner) {
      it(`Should remove a ${objectType} by the owner on ${apiPath}:${objectIdType} DELETE`, (done) => {
        chai
          .request(app)
          .del(`${apiPath}${secondObjectId}`)
          .set('Authorization', createByAdmin ? tokens.adminUserOne : tokens.basicUserOne)
          .end((error, response) => {
            response.should.have.status(200);
            response.should.be.json;
            response.body.should.be.jsonSchema(baseObjectSchemas.returnData);
            response.body.data[objectType].should.be.jsonSchema(baseObjectSchemas.remove);
            response.body.data.changeType.should.equal(dbConfig.ChangeTypes.REMOVE);

            done();
          });
      });
    }
  });
}

/**
 * Create tests for updating objects.
 * @param {Object} params - Parameters.
 * @param {string} params.objectType - Type of object to update.
 * @param {string} params.objectIdType - Id for the type of object to test.
 * @param {string} params.apiPath - Path to endpoint.
 * @param {Object} params.singleLiteSchema -
 * @param {Object} params.multiLiteSchema -
 * @param {Object} params.singleFullSchema -
 * @param {Object} params.multiFullSchema -
 * @param {Object} params.testData - Data to use in the creation of a test object.
 * @param {boolean} [params.skipCreation] - Should the creation of a test object be skipped? The object tested against will fall back to the basic user object.
 */
function createTestGet({
  testData,
  objectType,
  objectsType,
  objectIdType,
  apiPath,
  singleLiteSchema,
  multiLiteSchema,
  singleFullSchema,
  multiFullSchema,
  createByAdmin = false,
  skipCreation = false,
}) {
  describe(`Get one or more ${objectsType}`, () => {
    let idOfObject = testData.customObjectId;

    if (!skipCreation) {
      before(`Create a ${objectType} on ${apiPath}`, (done) => {
        const dataToSend = { data: {} };
        dataToSend.data[objectType] = testData.second;

        chai
          .request(app)
          .post(testData.apiCreatePath || apiPath)
          .set('Authorization', createByAdmin ? tokens.adminUserOne : tokens.basicUserTwo)
          .send(dataToSend)
          .end((error, response) => {
            response.should.have.status(200);
            response.should.be.json;
            response.body.should.be.jsonSchema(baseObjectSchemas.returnData);

            idOfObject = response.body.data[objectType].objectId;

            done();
          });
      });
    }

    it(`Should get a stripped ${objectType} by low level user on ${apiPath}:${objectIdType} GET`, (done) => {
      chai
        .request(app)
        .get(`${apiPath}${idOfObject || starterData.basicUserOne.objectId}`)
        .set('Authorization', tokens.basicUserOne)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(baseObjectSchemas.returnData);
          response.body.data[objectType].should.be.jsonSchema(singleLiteSchema);

          done();
        });
    });

    it(`Should get a full ${objectType} by high level user on ${apiPath}:${objectIdType} GET`, (done) => {
      chai
        .request(app)
        .get(`${apiPath}${idOfObject || starterData.basicUserTwo.objectId}`)
        .set('Authorization', tokens.adminUserOne)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(baseObjectSchemas.returnData);
          response.body.data[objectType].should.be.jsonSchema(singleFullSchema);

          done();
        });
    });

    it(`Should get stripped ${objectsType} by low level user on ${apiPath} GET`, (done) => {
      chai
        .request(app)
        .get(apiPath)
        .set('Authorization', tokens.basicUserOne)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(baseObjectSchemas.returnData);
          response.body.data[objectsType].should.be.jsonSchema(multiLiteSchema);

          done();
        });
    });

    it(`Should get full ${objectsType} by high level user on ${apiPath} GET`, (done) => {
      chai
        .request(app)
        .get(apiPath)
        .set('Authorization', tokens.adminUserOne)
        .end((error, response) => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.jsonSchema(baseObjectSchemas.returnData);
          response.body.data[objectsType].should.be.jsonSchema(multiFullSchema);

          done();
        });
    });
  });
}

exports.createTestGet = createTestGet;
exports.createTestDelete = createTestDelete;
exports.createTestCreate = createTestCreate;
exports.createTestUpdate = createTestUpdate;
