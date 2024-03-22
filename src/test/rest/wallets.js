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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2FsbGV0cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIndhbGxldHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBRUEsWUFBWSxDQUFDO0FBRWIsT0FBTyxJQUFJLE1BQU0sTUFBTSxDQUFDO0FBQ3hCLE9BQU8sUUFBUSxNQUFNLFdBQVcsQ0FBQztBQUNqQyxPQUFPLFFBQVEsTUFBTSxrQkFBa0IsQ0FBQztBQUN4QyxPQUFPLGFBQWEsTUFBTSxtQkFBbUIsQ0FBQztBQUM5QyxPQUFPLFFBQVEsTUFBTSxvQkFBb0IsQ0FBQztBQUMxQyxPQUFPLFdBQVcsTUFBTSxzQkFBc0IsQ0FBQztBQUMvQyxPQUFPLE1BQU0sTUFBTSxtQkFBbUIsQ0FBQztBQUN2QyxPQUFPLEdBQUcsTUFBTSxXQUFXLENBQUM7QUFDNUIsT0FBTyxpQkFBaUIsTUFBTSx1QkFBdUIsQ0FBQztBQUV0RCxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7QUFDZCxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ25CLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7QUFFbkIsUUFBUSxDQUFDLFNBQVMsRUFBRSxHQUFHLEVBQUU7SUFDdkIsTUFBTSxPQUFPLEdBQUcsZUFBZSxDQUFDO0lBQ2hDLE1BQU0sWUFBWSxHQUFHLFVBQVUsQ0FBQztJQUNoQyxNQUFNLFVBQVUsR0FBRyxRQUFRLENBQUM7SUFDNUIsTUFBTSxXQUFXLEdBQUcsU0FBUyxDQUFDO0lBRTlCLE1BQU0sQ0FBQyxrQ0FBa0MsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFO1FBQ2xELE1BQU0sVUFBVSxHQUFHO1lBQ2pCLElBQUksRUFBRTtnQkFDSixJQUFJLEVBQUU7b0JBQ0osUUFBUSxFQUFFLFFBQVE7b0JBQ2xCLFFBQVEsRUFBRSxVQUFVO2lCQUNyQjthQUNGO1NBQ0YsQ0FBQztRQUVGLElBQUk7YUFDRCxPQUFPLENBQUMsR0FBRyxDQUFDO2FBQ1osSUFBSSxDQUFDLFlBQVksQ0FBQzthQUNsQixHQUFHLENBQUMsZUFBZSxFQUFFLE1BQU0sQ0FBQyxZQUFZLENBQUM7YUFDekMsSUFBSSxDQUFDLFVBQVUsQ0FBQzthQUNoQixHQUFHLENBQUMsQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLEVBQUU7WUFDdkIsUUFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2pDLFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQztZQUN4QixRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLGlCQUFpQixDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ2pFLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7WUFFM0MsUUFBUSxDQUFDLGNBQWMsR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDO1lBRTNELFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQztnQkFDM0IsVUFBVTtnQkFDVixZQUFZO2dCQUNaLE9BQU87Z0JBQ1AsWUFBWSxFQUFFLElBQUk7Z0JBQ2xCLFFBQVEsRUFBRSxRQUFRLENBQUMsTUFBTTtnQkFDekIsTUFBTSxFQUFFLGFBQWEsQ0FBQyxNQUFNO2FBQzdCLENBQUMsQ0FBQztZQUVILFdBQVcsQ0FBQyxhQUFhLENBQUM7Z0JBQ3hCLFlBQVk7Z0JBQ1osT0FBTztnQkFDUCxVQUFVO2dCQUNWLFdBQVc7Z0JBQ1gsWUFBWSxFQUFFLElBQUk7Z0JBQ2xCLFFBQVEsRUFBRSxRQUFRLENBQUMsTUFBTTtnQkFDekIsZ0JBQWdCLEVBQUUsYUFBYSxDQUFDLE1BQU07Z0JBQ3RDLGVBQWUsRUFBRSxhQUFhLENBQUMsT0FBTztnQkFDdEMsZ0JBQWdCLEVBQUUsYUFBYSxDQUFDLFVBQVU7Z0JBQzFDLGVBQWUsRUFBRSxhQUFhLENBQUMsV0FBVzthQUMzQyxDQUFDLENBQUM7WUFFSCxJQUFJLEVBQUUsQ0FBQztRQUNULENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyJ9