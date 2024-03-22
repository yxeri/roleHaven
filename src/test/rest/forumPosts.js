'use strict';
import chai from 'chai';
import chaiHttp from 'chai-http';
import chaiJson from 'chai-json-schema';
import forumPostSchemas from './schemas/forumPosts';
import testData from './testData/forumPosts';
import testBuilder from './helper/testBuilder';
import baseObjectSchemas from './schemas/baseObjects';
import forumThreadSchemas from './schemas/forumThreads';
import forumSchemas from './schemas/forums';
import tokens from './testData/tokens';
import app from '../../app';
import starterData from './testData/starter';
chai.should();
chai.use(chaiHttp);
chai.use(chaiJson);
describe('Forum posts', () => {
    const apiPath = '/api/forumPosts/';
    const objectIdType = 'postId';
    const objectType = 'post';
    const objectsType = 'posts';
    let forumId;
    let threadId;
    before('Create a forum on /api/forums POST', (done) => {
        const dataToSend = {
            data: {
                forum: { title: 'Forum' },
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
            forumId = response.body.data.forum.objectId;
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
            .put(`/api/forums/${forumId}/permissions`)
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
    before('Create a forum thread on /api/forumThreads POST', (done) => {
        const dataToSend = {
            data: {
                thread: {
                    title: 'Forum posts',
                    text: ['text'],
                },
            },
        };
        chai
            .request(app)
            .post(`/api/forums/${forumId}/threads`)
            .set('Authorization', tokens.adminUserOne)
            .send(dataToSend)
            .end((error, response) => {
            response.should.have.status(200);
            response.should.be.json;
            response.body.should.be.jsonSchema(baseObjectSchemas.returnData);
            response.body.data.thread.should.be.jsonSchema(forumThreadSchemas.forumThread);
            threadId = response.body.data.thread.objectId;
            testData.update.toUpdate.threadId = threadId;
            testData.create.apiCreatePath = `/api/forumThreads/${threadId}/posts`;
            testData.update.apiCreatePath = `/api/forumThreads/${threadId}/posts`;
            testData.remove.apiCreatePath = `/api/forumThreads/${threadId}/posts`;
            done();
        });
    });
    before('Update permissions on /api/forumThreads/:id/permissions', (done) => {
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
            .put(`/api/forumThreads/${threadId}/permissions`)
            .set('Authorization', tokens.adminUserOne)
            .send(dataToSend)
            .end((error, response) => {
            response.should.have.status(200);
            response.should.be.json;
            response.body.should.be.jsonSchema(baseObjectSchemas.returnData);
            response.body.data.thread.should.be.jsonSchema(forumThreadSchemas.forumThread);
            done();
        });
    });
    testBuilder.createTestCreate({
        objectType,
        apiPath,
        objectIdType,
        testData: testData.create,
        schema: forumPostSchemas.forumPost,
    });
    testBuilder.createTestUpdate({
        objectType,
        objectIdType,
        apiPath,
        testData: testData.update,
        schema: forumPostSchemas.forumPost,
    });
    testBuilder.createTestGet({
        objectIdType,
        apiPath,
        objectType,
        objectsType,
        testData: testData.create,
        singleLiteSchema: forumPostSchemas.forumPost,
        multiLiteSchema: forumPostSchemas.forumPosts,
        singleFullSchema: forumPostSchemas.fullForumPost,
        multiFullSchema: forumPostSchemas.fullForumPosts,
    });
    testBuilder.createTestDelete({
        objectType,
        objectIdType,
        apiPath,
        testData: testData.remove,
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9ydW1Qb3N0cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImZvcnVtUG9zdHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBRUEsWUFBWSxDQUFDO0FBRWIsT0FBTyxJQUFJLE1BQU0sTUFBTSxDQUFDO0FBQ3hCLE9BQU8sUUFBUSxNQUFNLFdBQVcsQ0FBQztBQUNqQyxPQUFPLFFBQVEsTUFBTSxrQkFBa0IsQ0FBQztBQUN4QyxPQUFPLGdCQUFnQixNQUFNLHNCQUFzQixDQUFDO0FBQ3BELE9BQU8sUUFBUSxNQUFNLHVCQUF1QixDQUFDO0FBQzdDLE9BQU8sV0FBVyxNQUFNLHNCQUFzQixDQUFDO0FBQy9DLE9BQU8saUJBQWlCLE1BQU0sdUJBQXVCLENBQUM7QUFDdEQsT0FBTyxrQkFBa0IsTUFBTSx3QkFBd0IsQ0FBQztBQUN4RCxPQUFPLFlBQVksTUFBTSxrQkFBa0IsQ0FBQztBQUM1QyxPQUFPLE1BQU0sTUFBTSxtQkFBbUIsQ0FBQztBQUN2QyxPQUFPLEdBQUcsTUFBTSxXQUFXLENBQUM7QUFDNUIsT0FBTyxXQUFXLE1BQU0sb0JBQW9CLENBQUM7QUFFN0MsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBQ2QsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNuQixJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBRW5CLFFBQVEsQ0FBQyxhQUFhLEVBQUUsR0FBRyxFQUFFO0lBQzNCLE1BQU0sT0FBTyxHQUFHLGtCQUFrQixDQUFDO0lBQ25DLE1BQU0sWUFBWSxHQUFHLFFBQVEsQ0FBQztJQUM5QixNQUFNLFVBQVUsR0FBRyxNQUFNLENBQUM7SUFDMUIsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDO0lBRTVCLElBQUksT0FBTyxDQUFDO0lBQ1osSUFBSSxRQUFRLENBQUM7SUFFYixNQUFNLENBQUMsb0NBQW9DLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRTtRQUNwRCxNQUFNLFVBQVUsR0FBRztZQUNq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