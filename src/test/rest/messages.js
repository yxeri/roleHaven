'use strict';
import chai from 'chai';
import chaiHttp from 'chai-http';
import chaiJson from 'chai-json-schema';
import messageSchemas from './schemas/messages';
import roomSchemas from './schemas/rooms';
import testData from './testData/messages';
import testBuilder from './helper/testBuilder';
import tokens from './testData/tokens';
import baseObjectSchemas from './schemas/baseObjects';
import app from '../../app';
import starterData from './testData/starter';
chai.should();
chai.use(chaiHttp);
chai.use(chaiJson);
describe('Messages', () => {
    const apiPath = '/api/messages/';
    const objectIdType = 'messageId';
    const objectType = 'message';
    const objectsType = 'messages';
    before('Create a room on /api/rooms POST', (done) => {
        const dataToSend = {
            data: {
                room: { roomName: 'roomOne' },
            },
        };
        chai
            .request(app)
            .post('/api/rooms')
            .set('Authorization', tokens.basicUserOne)
            .send(dataToSend)
            .end((error, response) => {
            response.should.have.status(200);
            response.should.be.json;
            response.body.should.be.jsonSchema(baseObjectSchemas.returnData);
            response.body.data.room.should.be.jsonSchema(roomSchemas.room);
            const roomId = response.body.data.room.objectId;
            testData.create.first.roomId = roomId;
            testData.create.second.roomId = roomId;
            testData.update.toUpdate.roomId = roomId;
            testData.remove.toRemove.roomId = roomId;
            testData.remove.secondToRemove.roomId = roomId;
            console.log('room created for messages', response.body.data.room);
            done();
        });
    });
    before('Update room permissions on /api/rooms/:id/permissions', (done) => {
        const dataToSend = {
            data: {
                userIds: [starterData.basicUserTwo.objectId],
            },
        };
        chai
            .request(app)
            .put(`/api/rooms/${testData.create.first.roomId}/permissions`)
            .set('Authorization', tokens.basicUserOne)
            .send(dataToSend)
            .end((error, response) => {
            response.should.have.status(200);
            response.should.be.json;
            response.body.should.be.jsonSchema(baseObjectSchemas.returnData);
            response.body.data.room.should.be.jsonSchema(roomSchemas.room);
            console.log('room permissions updated for messages', response.body.data.room);
            done();
        });
    });
    testBuilder.createTestCreate({
        objectType,
        apiPath,
        objectIdType,
        testData: testData.create,
        schema: messageSchemas.message,
    });
    testBuilder.createTestUpdate({
        objectType,
        objectIdType,
        apiPath,
        testData: testData.update,
        schema: messageSchemas.message,
    });
    testBuilder.createTestGet({
        objectIdType,
        objectType,
        objectsType,
        apiPath,
        testData: testData.create,
        singleLiteSchema: messageSchemas.message,
        multiLiteSchema: messageSchemas.messages,
        singleFullSchema: messageSchemas.fullMessage,
        multiFullSchema: messageSchemas.fullMessages,
    });
    testBuilder.createTestDelete({
        objectType,
        objectIdType,
        apiPath,
        testData: testData.remove,
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVzc2FnZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJtZXNzYWdlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFFQSxZQUFZLENBQUM7QUFFYixPQUFPLElBQUksTUFBTSxNQUFNLENBQUM7QUFDeEIsT0FBTyxRQUFRLE1BQU0sV0FBVyxDQUFDO0FBQ2pDLE9BQU8sUUFBUSxNQUFNLGtCQUFrQixDQUFDO0FBQ3hDLE9BQU8sY0FBYyxNQUFNLG9CQUFvQixDQUFDO0FBQ2hELE9BQU8sV0FBVyxNQUFNLGlCQUFpQixDQUFDO0FBQzFDLE9BQU8sUUFBUSxNQUFNLHFCQUFxQixDQUFDO0FBQzNDLE9BQU8sV0FBVyxNQUFNLHNCQUFzQixDQUFDO0FBQy9DLE9BQU8sTUFBTSxNQUFNLG1CQUFtQixDQUFDO0FBQ3ZDLE9BQU8saUJBQWlCLE1BQU0sdUJBQXVCLENBQUM7QUFDdEQsT0FBTyxHQUFHLE1BQU0sV0FBVyxDQUFDO0FBQzVCLE9BQU8sV0FBVyxNQUFNLG9CQUFvQixDQUFDO0FBRTdDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztBQUNkLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDbkIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUVuQixRQUFRLENBQUMsVUFBVSxFQUFFLEdBQUcsRUFBRTtJQUN4QixNQUFNLE9BQU8sR0FBRyxnQkFBZ0IsQ0FBQztJQUNqQyxNQUFNLFlBQVksR0FBRyxXQUFXLENBQUM7SUFDakMsTUFBTSxVQUFVLEdBQUcsU0FBUyxDQUFDO0lBQzdCLE1BQU0sV0FBVyxHQUFHLFVBQVUsQ0FBQztJQUUvQixNQUFNLENBQUMsa0NBQWtDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRTtRQUNsRCxNQUFNLFVBQVUsR0FBRztZQUNqQixJQUFJLEVBQUU7Z0JBQ0osSUFBSSxFQUFFLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBRTthQUM5QjtTQUNGLENBQUM7UUFFRixJQUFJO2FB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