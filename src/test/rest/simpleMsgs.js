'use strict';
import chai from 'chai';
import chaiHttp from 'chai-http';
import chaiJson from 'chai-json-schema';
import simpleMsgSchemas from './schemas/simpleMsgs';
import testData from './testData/simpleMsgs';
import testBuilder from './helper/testBuilder';
chai.should();
chai.use(chaiHttp);
chai.use(chaiJson);
describe('SimpleMsgs', () => {
    const apiPath = '/api/simpleMsgs/';
    const objectIdType = 'simpleMsgId';
    const objectType = 'simpleMsg';
    const objectsType = 'simpleMsgs';
    testBuilder.createTestCreate({
        objectType,
        apiPath,
        objectIdType,
        testData: testData.create,
        schema: simpleMsgSchemas.simpleMsg,
    });
    testBuilder.createTestUpdate({
        objectType,
        objectIdType,
        apiPath,
        testData: testData.update,
        schema: simpleMsgSchemas.simpleMsg,
    });
    testBuilder.createTestGet({
        objectIdType,
        apiPath,
        objectType,
        objectsType,
        testData: testData.create,
        singleLiteSchema: simpleMsgSchemas.simpleMsg,
        multiLiteSchema: simpleMsgSchemas.simpleMsgs,
        singleFullSchema: simpleMsgSchemas.fullSimpleMsg,
        multiFullSchema: simpleMsgSchemas.fullSimpleMsgs,
    });
    testBuilder.createTestDelete({
        objectType,
        objectIdType,
        apiPath,
        testData: testData.remove,
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2ltcGxlTXNncy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNpbXBsZU1zZ3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBRUEsWUFBWSxDQUFDO0FBRWIsT0FBTyxJQUFJLE1BQU0sTUFBTSxDQUFDO0FBQ3hCLE9BQU8sUUFBUSxNQUFNLFdBQVcsQ0FBQztBQUNqQyxPQUFPLFFBQVEsTUFBTSxrQkFBa0IsQ0FBQztBQUN4QyxPQUFPLGdCQUFnQixNQUFNLHNCQUFzQixDQUFDO0FBQ3BELE9BQU8sUUFBUSxNQUFNLHVCQUF1QixDQUFDO0FBQzdDLE9BQU8sV0FBVyxNQUFNLHNCQUFzQixDQUFDO0FBRS9DLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztBQUNkLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDbkIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUVuQixRQUFRLENBQUMsWUFBWSxFQUFFLEdBQUcsRUFBRTtJQUMxQixNQUFNLE9BQU8sR0FBRyxrQkFBa0IsQ0FBQztJQUNuQyxNQUFNLFlBQVksR0FBRyxhQUFhLENBQUM7SUFDbkMsTUFBTSxVQUFVLEdBQUcsV0FBVyxDQUFDO0lBQy9CLE1BQU0sV0FBVyxHQUFHLFlBQVksQ0FBQztJQUVqQyxXQUFXLENBQUMsZ0JBQWdCLENBQUM7UUFDM0IsVUFBVTtRQUNWLE9BQU87UUFDUCxZQUFZO1FBQ1osUUFBUSxFQUFFLFFBQVEsQ0FBQyxNQUFNO1FBQ3pCLE1BQU0sRUFBRSxnQkFBZ0IsQ0FBQyxTQUFTO0tBQ25DLENBQUMsQ0FBQztJQUVILFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQztRQUMzQixVQUFVO1FBQ1YsWUFBWTtRQUNaLE9BQU87UUFDUCxRQUFRLEVBQUUsUUFBUSxDQUFDLE1BQU07UUFDekIsTUFBTSxFQUFFLGdCQUFnQixDQUFDLFNBQVM7S0FDbkMsQ0FBQyxDQUFDO0lBRUgsV0FBVyxDQUFDLGFBQWEsQ0FBQztRQUN4QixZQUFZO1FBQ1osT0FBTztRQUNQLFVBQVU7UUFDVixXQUFXO1FBQ1gsUUFBUSxFQUFFLFFBQVEsQ0FBQyxNQUFNO1FBQ3pCLGdCQUFnQixFQUFFLGdCQUFnQixDQUFDLFNBQVM7UUFDNUMsZUFBZSxFQUFFLGdCQUFnQixDQUFDLFVBQVU7UUFDNUMsZ0JBQWdCLEVBQUUsZ0JBQWdCLENBQUMsYUFBYTtRQUNoRCxlQUFlLEVBQUUsZ0JBQWdCLENBQUMsY0FBYztLQUNqRCxDQUFDLENBQUM7SUFFSCxXQUFXLENBQUMsZ0JBQWdCLENBQUM7UUFDM0IsVUFBVTtRQUNWLFlBQVk7UUFDWixPQUFPO1FBQ1AsUUFBUSxFQUFFLFFBQVEsQ0FBQyxNQUFNO0tBQzFCLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDIn0=