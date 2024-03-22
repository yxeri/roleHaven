'use strict';
import chai from 'chai';
import chaiHttp from 'chai-http';
import chaiJson from 'chai-json-schema';
import userSchemas from './schemas/users';
import testData from './testData/users';
import testBuilder from './helper/testBuilder';
chai.should();
chai.use(chaiHttp);
chai.use(chaiJson);
describe('Users', () => {
    const apiPath = '/api/users/';
    const objectIdType = 'userId';
    const objectType = 'user';
    const objectsType = 'users';
    testBuilder.createTestCreate({
        objectType,
        apiPath,
        checkDuplicate: true,
        testData: testData.create,
        schema: userSchemas.liteUser,
    });
    testBuilder.createTestUpdate({
        objectType,
        objectIdType,
        apiPath,
        skipCreation: true,
        testData: testData.update,
        schema: userSchemas.fullUser,
    });
    testBuilder.createTestGet({
        objectIdType,
        apiPath,
        objectType,
        objectsType,
        skipCreation: true,
        testData: testData.create,
        singleLiteSchema: userSchemas.liteUser,
        multiLiteSchema: userSchemas.users,
        singleFullSchema: userSchemas.fullUser,
        multiFullSchema: userSchemas.fullUsers,
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlcnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ1c2Vycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFFQSxZQUFZLENBQUM7QUFFYixPQUFPLElBQUksTUFBTSxNQUFNLENBQUM7QUFDeEIsT0FBTyxRQUFRLE1BQU0sV0FBVyxDQUFDO0FBQ2pDLE9BQU8sUUFBUSxNQUFNLGtCQUFrQixDQUFDO0FBQ3hDLE9BQU8sV0FBVyxNQUFNLGlCQUFpQixDQUFDO0FBQzFDLE9BQU8sUUFBUSxNQUFNLGtCQUFrQixDQUFDO0FBQ3hDLE9BQU8sV0FBVyxNQUFNLHNCQUFzQixDQUFDO0FBRS9DLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztBQUNkLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDbkIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUVuQixRQUFRLENBQUMsT0FBTyxFQUFFLEdBQUcsRUFBRTtJQUNyQixNQUFNLE9BQU8sR0FBRyxhQUFhLENBQUM7SUFDOUIsTUFBTSxZQUFZLEdBQUcsUUFBUSxDQUFDO0lBQzlCLE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQztJQUMxQixNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUM7SUFFNUIsV0FBVyxDQUFDLGdCQUFnQixDQUFDO1FBQzNCLFVBQVU7UUFDVixPQUFPO1FBQ1AsY0FBYyxFQUFFLElBQUk7UUFDcEIsUUFBUSxFQUFFLFFBQVEsQ0FBQyxNQUFNO1FBQ3pCLE1BQU0sRUFBRSxXQUFXLENBQUMsUUFBUTtLQUM3QixDQUFDLENBQUM7SUFFSCxXQUFXLENBQUMsZ0JBQWdCLENBQUM7UUFDM0IsVUFBVTtRQUNWLFlBQVk7UUFDWixPQUFPO1FBQ1AsWUFBWSxFQUFFLElBQUk7UUFDbEIsUUFBUSxFQUFFLFFBQVEsQ0FBQyxNQUFNO1FBQ3pCLE1BQU0sRUFBRSxXQUFXLENBQUMsUUFBUTtLQUM3QixDQUFDLENBQUM7SUFFSCxXQUFXLENBQUMsYUFBYSxDQUFDO1FBQ3hCLFlBQVk7UUFDWixPQUFPO1FBQ1AsVUFBVTtRQUNWLFdBQVc7UUFDWCxZQUFZLEVBQUUsSUFBSTtRQUNsQixRQUFRLEVBQUUsUUFBUSxDQUFDLE1BQU07UUFDekIsZ0JBQWdCLEVBQUUsV0FBVyxDQUFDLFFBQVE7UUFDdEMsZUFBZSxFQUFFLFdBQVcsQ0FBQyxLQUFLO1FBQ2xDLGdCQUFnQixFQUFFLFdBQVcsQ0FBQyxRQUFRO1FBQ3RDLGVBQWUsRUFBRSxXQUFXLENBQUMsU0FBUztLQUN2QyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyJ9