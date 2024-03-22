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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNhY3Rpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidHJhbnNhY3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUVBLFlBQVksQ0FBQztBQUViLE9BQU8sSUFBSSxNQUFNLE1BQU0sQ0FBQztBQUN4QixPQUFPLFFBQVEsTUFBTSxXQUFXLENBQUM7QUFDakMsT0FBTyxRQUFRLE1BQU0sa0JBQWtCLENBQUM7QUFDeEMsT0FBTyxrQkFBa0IsTUFBTSx3QkFBd0IsQ0FBQztBQUN4RCxPQUFPLFFBQVEsTUFBTSx5QkFBeUIsQ0FBQztBQUMvQyxPQUFPLFdBQVcsTUFBTSxzQkFBc0IsQ0FBQztBQUMvQyxPQUFPLE1BQU0sTUFBTSxtQkFBbUIsQ0FBQztBQUN2QyxPQUFPLGlCQUFpQixNQUFNLHVCQUF1QixDQUFDO0FBQ3RELE9BQU8sV0FBVyxNQUFNLGlCQUFpQixDQUFDO0FBQzFDLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSw4QkFBOEIsQ0FBQztBQUV6RCxPQUFPLEtBQUssTUFBTSxnQkFBZ0IsQ0FBQztBQUNuQyxPQUFPLEdBQUcsTUFBTSxXQUFXLENBQUM7QUFFNUIsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBQ2QsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNuQixJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBRW5CLFFBQVEsQ0FBQyxjQUFjLEVBQUUsR0FBRyxFQUFFO0lBQzVCLE1BQU0sT0FBTyxHQUFHLG9CQUFvQixDQUFDO0lBQ3JDLE1BQU0sWUFBWSxHQUFHLGVBQWUsQ0FBQztJQUNyQyxNQUFNLFVBQVUsR0FBRyxhQUFhLENBQUM7SUFDakMsTUFBTSxXQUFXLEdBQUcsY0FBYyxDQUFDO0lBRW5DLE1BQU0sQ0FBQyxrQ0FBa0MsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFO1FBQ2xELE1BQU0sVUFBVSxHQUFHO1lBQ2pCLElBQUksRUFBRTtnQkFDSixJQUFJLEVBQUU7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