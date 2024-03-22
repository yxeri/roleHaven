'use strict';
import chai from 'chai';
import chaiHttp from 'chai-http';
import chaiJson from 'chai-json-schema';
import forumThreadSchemas from './schemas/forumThreads';
import testData from './testData/forumThreads';
import testBuilder from './helper/testBuilder';
import baseObjectSchemas from './schemas/baseObjects';
import forumSchemas from './schemas/forums';
import tokens from './testData/tokens';
import app from '../../app';
import starterData from './testData/starter';
chai.should();
chai.use(chaiHttp);
chai.use(chaiJson);
describe('Forum threads', () => {
    const objectIdType = 'threadId';
    const objectType = 'thread';
    const objectsType = 'threads';
    const apiPath = '/api/forumThreads/';
    before('Create a forum on /api/forums POST', (done) => {
        const dataToSend = {
            data: {
                forum: { title: 'Forum threads' },
            },
        };
        chai
            .request(app)
            .post('/api/forums')
            .set('Authorization', tokens.adminUserOne)
            .send(dataToSend)
            .end((error, response) => {
            response.should.have.status(200);
            response.should.be.json;
            response.body.should.be.jsonSchema(baseObjectSchemas.returnData);
            response.body.data.forum.should.be.jsonSchema(forumSchemas.forum);
            const forumId = response.body.data.forum.objectId;
            testData.forumId = forumId;
            testData.create.apiCreatePath = `/api/forums/${forumId}/threads`;
            testData.update.apiCreatePath = `/api/forums/${forumId}/threads`;
            testData.remove.apiCreatePath = `/api/forums/${forumId}/threads`;
            done();
        });
    });
    before('Update permissions on /api/forums/:id/permissions', (done) => {
        const dataToSend = {
            data: {
                userIds: [
                    starterData.basicUserOne.objectId,
                    starterData.basicUserTwo.objectId,
                ],
            },
        };
        chai
            .request(app)
            .put(`/api/forums/${testData.forumId}/permissions`)
            .set('Authorization', tokens.adminUserOne)
            .send(dataToSend)
            .end((error, response) => {
            response.should.have.status(200);
            response.should.be.json;
            response.body.should.be.jsonSchema(baseObjectSchemas.returnData);
            response.body.data.forum.should.be.jsonSchema(forumSchemas.forum);
            done();
        });
    });
    testBuilder.createTestCreate({
        objectType,
        apiPath,
        objectIdType,
        testData: testData.create,
        schema: forumThreadSchemas.forumThread,
    });
    testBuilder.createTestUpdate({
        objectType,
        objectIdType,
        apiPath,
        testData: testData.update,
        schema: forumThreadSchemas.forumThread,
    });
    testBuilder.createTestGet({
        objectIdType,
        apiPath,
        objectType,
        objectsType,
        testData: testData.create,
        singleLiteSchema: forumThreadSchemas.forumThread,
        multiLiteSchema: forumThreadSchemas.forumThreads,
        singleFullSchema: forumThreadSchemas.fullForumThread,
        multiFullSchema: forumThreadSchemas.fullForumThreads,
    });
    testBuilder.createTestDelete({
        objectType,
        objectIdType,
        apiPath,
        testData: testData.remove,
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9ydW1UaHJlYWRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZm9ydW1UaHJlYWRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUVBLFlBQVksQ0FBQztBQUViLE9BQU8sSUFBSSxNQUFNLE1BQU0sQ0FBQztBQUN4QixPQUFPLFFBQVEsTUFBTSxXQUFXLENBQUM7QUFDakMsT0FBTyxRQUFRLE1BQU0sa0JBQWtCLENBQUM7QUFDeEMsT0FBTyxrQkFBa0IsTUFBTSx3QkFBd0IsQ0FBQztBQUN4RCxPQUFPLFFBQVEsTUFBTSx5QkFBeUIsQ0FBQztBQUMvQyxPQUFPLFdBQVcsTUFBTSxzQkFBc0IsQ0FBQztBQUMvQyxPQUFPLGlCQUFpQixNQUFNLHVCQUF1QixDQUFDO0FBQ3RELE9BQU8sWUFBWSxNQUFNLGtCQUFrQixDQUFDO0FBQzVDLE9BQU8sTUFBTSxNQUFNLG1CQUFtQixDQUFDO0FBQ3ZDLE9BQU8sR0FBRyxNQUFNLFdBQVcsQ0FBQztBQUM1QixPQUFPLFdBQVcsTUFBTSxvQkFBb0IsQ0FBQztBQUU3QyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7QUFDZCxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ25CLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7QUFFbkIsUUFBUSxDQUFDLGVBQWUsRUFBRSxHQUFHLEVBQUU7SUFDN0IsTUFBTSxZQUFZLEdBQUcsVUFBVSxDQUFDO0lBQ2hDLE1BQU0sVUFBVSxHQUFHLFFBQVEsQ0FBQztJQUM1QixNQUFNLFdBQVcsR0FBRyxTQUFTLENBQUM7SUFDOUIsTUFBTSxPQUFPLEdBQUcsb0JBQW9CLENBQUM7SUFFckMsTUFBTSxDQUFDLG9DQUFvQyxFQUFFLENBQUMsSUFBSSxFQUFFLEVBQUU7UUFDcEQsTUFBTSxVQUFVLEdBQUc7WUFDakIsSUFBSSxFQUFFO2dCQUNKLEtBQUssRUFBRSxFQUFFLEtBQUssRUFBRSxlQUFlLEVBQUU7YUFDbEM7U0FDRixDQUFDO1FB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