'use strict';
import chai from 'chai';
import chaiHttp from 'chai-http';
import chaiJson from 'chai-json-schema';
import app from '../../../app';
import { dbConfig } from '../../../config/defaults/config';
import baseObjectSchemas from '../schemas/baseObjects';
import starterData from '../testData/starter';
import tokens from '../testData/tokens';
chai.should();
chai.use(chaiHttp);
chai.use(chaiJson);
function createTestCreate({ testData, objectType, apiPath, schema, createByAdmin, checkDuplicate = false, }) {
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
                .set('Authorization', createByAdmin
                ?
                    tokens.adminUserOne
                :
                    tokens.basicUserOne)
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
                    .set('Authorization', createByAdmin
                    ?
                        tokens.adminUserOne
                    :
                        tokens.basicUserOne)
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
            Object.keys(testData.missing)
                .forEach((param) => {
                it(`Should NOT create a ${objectType} with missing parameter ${param} on ${apiPath} POST`, (done) => {
                    const dataToSend = { data: {} };
                    dataToSend.data[objectType] = { ...testData.missing };
                    dataToSend.data[objectType][param] = undefined;
                    chai
                        .request(app)
                        .post(testData.apiCreatePath || apiPath)
                        .set('Authorization', createByAdmin
                        ?
                            tokens.adminUserOne
                        :
                            tokens.basicUserOne)
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
function createTestUpdate({ testData, objectType, objectIdType, apiPath, schema, createByAdmin, skipCreation = false, }) {
    describe(`Update a ${objectType}`, () => {
        let updateObjectId = testData.customObjectId;
        if (!skipCreation) {
            before(`Create a ${objectType} on ${apiPath} POST`, (done) => {
                const dataToSend = { data: {} };
                dataToSend.data[objectType] = testData.toUpdate;
                chai
                    .request(app)
                    .post(testData.apiCreatePath || apiPath)
                    .set('Authorization', createByAdmin
                    ?
                        tokens.adminUserOne
                    :
                        tokens.basicUserOne)
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
                .set('Authorization', createByAdmin
                ?
                    tokens.adminUserOne
                :
                    tokens.basicUserOne)
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
function createTestDelete({ testData, objectType, objectIdType, apiPath, skipCreation, skipOwner, createByAdmin, }) {
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
                    .set('Authorization', createByAdmin
                    ?
                        tokens.adminUserOne
                    :
                        tokens.basicUserOne)
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
                    .set('Authorization', createByAdmin
                    ?
                        tokens.adminUserOne
                    :
                        tokens.basicUserOne)
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
                    .set('Authorization', createByAdmin
                    ?
                        tokens.adminUserOne
                    :
                        tokens.basicUserOne)
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
function createTestGet({ testData, objectType, objectsType, objectIdType, apiPath, singleLiteSchema, multiLiteSchema, singleFullSchema, multiFullSchema, createByAdmin = false, skipCreation = false, }) {
    describe(`Get one or more ${objectsType}`, () => {
        let idOfObject = testData.customObjectId;
        if (!skipCreation) {
            before(`Create a ${objectType} on ${apiPath}`, (done) => {
                const dataToSend = { data: {} };
                dataToSend.data[objectType] = testData.second;
                chai
                    .request(app)
                    .post(testData.apiCreatePath || apiPath)
                    .set('Authorization', createByAdmin
                    ?
                        tokens.adminUserOne
                    :
                        tokens.basicUserTwo)
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
export { createTestGet };
export { createTestDelete };
export { createTestCreate };
export { createTestUpdate };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdEJ1aWxkZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ0ZXN0QnVpbGRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFFQSxZQUFZLENBQUM7QUFFYixPQUFPLElBQUksTUFBTSxNQUFNLENBQUM7QUFDeEIsT0FBTyxRQUFRLE1BQU0sV0FBVyxDQUFDO0FBQ2pDLE9BQU8sUUFBUSxNQUFNLGtCQUFrQixDQUFDO0FBQ3hDLE9BQU8sR0FBRyxNQUFNLGNBQWMsQ0FBQztBQUMvQixPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0saUNBQWlDLENBQUM7QUFDM0QsT0FBTyxpQkFBaUIsTUFBTSx3QkFBd0IsQ0FBQztBQUN2RCxPQUFPLFdBQVcsTUFBTSxxQkFBcUIsQ0FBQztBQUM5QyxPQUFPLE1BQU0sTUFBTSxvQkFBb0IsQ0FBQztBQUV4QyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7QUFDZCxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ25CLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7QUFVbkIsU0FBUyxnQkFBZ0IsQ0FBQyxFQUN4QixRQUFRLEVBQ1IsVUFBVSxFQUNWLE9BQU8sRUFDUCxNQUFNLEVBQ04sYUFBYSxFQUNiLGNBQWMsR0FBRyxLQUFLLEdBQ3ZCO0lBQ0MsUUFBUSxDQUFDLFVBQVUsVUFBVSxFQUFFLEVBQUUsR0FBRyxFQUFFO1FBQ3BDLEVBQUUsQ0FBQyx1QkFBdUIsVUFBVSw0QkFBNEIsT0FBTyxPQUFPLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRTtZQUN2RixNQUFNLFVBQVUsR0FBRyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsQ0FBQztZQUNoQyxVQUFVLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUM7WUFFN0MsSUFBSTtpQkFDRCxPQUFPLENBQUMsR0FBRyxDQUFDO2lCQUNaLElBQUksQ0FBQyxRQUFRLENBQUMsYUFBYSxJQUFJ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