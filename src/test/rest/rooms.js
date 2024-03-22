'use strict';
import chai from 'chai';
import chaiHttp from 'chai-http';
import chaiJson from 'chai-json-schema';
import roomSchemas from './schemas/rooms';
import testData from './testData/rooms';
import testBuilder from './helper/testBuilder';
chai.should();
chai.use(chaiHttp);
chai.use(chaiJson);
describe('Rooms', () => {
    const apiPath = '/api/rooms/';
    const objectIdType = 'roomId';
    const objectType = 'room';
    const objectsType = 'rooms';
    testBuilder.createTestCreate({
        objectType,
        apiPath,
        objectIdType,
        checkDuplicate: true,
        testData: testData.create,
        schema: roomSchemas.createdRoom,
    });
    testBuilder.createTestUpdate({
        objectType,
        objectIdType,
        apiPath,
        testData: testData.update,
        schema: roomSchemas.room,
    });
    testBuilder.createTestGet({
        objectIdType,
        apiPath,
        objectType,
        objectsType,
        testData: testData.create,
        singleLiteSchema: roomSchemas.room,
        multiLiteSchema: roomSchemas.rooms,
        singleFullSchema: roomSchemas.fullRoom,
        multiFullSchema: roomSchemas.fullRooms,
    });
    testBuilder.createTestDelete({
        objectType,
        objectIdType,
        apiPath,
        skipOwner: true,
        testData: testData.remove,
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm9vbXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJyb29tcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFFQSxZQUFZLENBQUM7QUFFYixPQUFPLElBQUksTUFBTSxNQUFNLENBQUM7QUFDeEIsT0FBTyxRQUFRLE1BQU0sV0FBVyxDQUFDO0FBQ2pDLE9BQU8sUUFBUSxNQUFNLGtCQUFrQixDQUFDO0FBQ3hDLE9BQU8sV0FBVyxNQUFNLGlCQUFpQixDQUFDO0FBQzFDLE9BQU8sUUFBUSxNQUFNLGtCQUFrQixDQUFDO0FBQ3hDLE9BQU8sV0FBVyxNQUFNLHNCQUFzQixDQUFDO0FBRS9DLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztBQUNkLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDbkIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUVuQixRQUFRLENBQUMsT0FBTyxFQUFFLEdBQUcsRUFBRTtJQUNyQixNQUFNLE9BQU8sR0FBRyxhQUFhLENBQUM7SUFDOUIsTUFBTSxZQUFZLEdBQUcsUUFBUSxDQUFDO0lBQzlCLE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQztJQUMxQixNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUM7SUFFNUIsV0FBVyxDQUFDLGdCQUFnQixDQUFDO1FBQzNCLFVBQVU7UUFDVixPQUFPO1FBQ1AsWUFBWTtRQUNaLGNBQWMsRUFBRSxJQUFJO1FBQ3BCLFFBQVEsRUFBRSxRQUFRLENBQUMsTUFBTTtRQUN6QixNQUFNLEVBQUUsV0FBVyxDQUFDLFdBQVc7S0FDaEMsQ0FBQyxDQUFDO0lBRUgsV0FBVyxDQUFDLGdCQUFnQixDQUFDO1FBQzNCLFVBQVU7UUFDVixZQUFZO1FBQ1osT0FBTztRQUNQLFFBQVEsRUFBRSxRQUFRLENBQUMsTUFBTTtRQUN6QixNQUFNLEVBQUUsV0FBVyxDQUFDLElBQUk7S0FDekIsQ0FBQyxDQUFDO0lBRUgsV0FBVyxDQUFDLGFBQWEsQ0FBQztRQUN4QixZQUFZO1FBQ1osT0FBTztRQUNQLFVBQVU7UUFDVixXQUFXO1FBQ1gsUUFBUSxFQUFFLFFBQVEsQ0FBQyxNQUFNO1FBQ3pCLGdCQUFnQixFQUFFLFdBQVcsQ0FBQyxJQUFJO1FBQ2xDLGVBQWUsRUFBRSxXQUFXLENBQUMsS0FBSztRQUNsQyxnQkFBZ0IsRUFBRSxXQUFXLENBQUMsUUFBUTtRQUN0QyxlQUFlLEVBQUUsV0FBVyxDQUFDLFNBQVM7S0FDdkMsQ0FBQyxDQUFDO0lBRUgsV0FBVyxDQUFDLGdCQUFnQixDQUFDO1FBQzNCLFVBQVU7UUFDVixZQUFZO1FBQ1osT0FBTztRQUNQLFNBQVMsRUFBRSxJQUFJO1FBQ2YsUUFBUSxFQUFFLFFBQVEsQ0FBQyxNQUFNO0tBQzFCLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDIn0=