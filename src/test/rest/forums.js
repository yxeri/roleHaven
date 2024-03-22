'use strict';
import chai from 'chai';
import chaiHttp from 'chai-http';
import chaiJson from 'chai-json-schema';
import testData from './testData/forums';
import testBuilder from './helper/testBuilder';
import forumSchemas from './schemas/forums';
chai.should();
chai.use(chaiHttp);
chai.use(chaiJson);
describe('Forums', () => {
    const apiPath = '/api/forums/';
    const objectIdType = 'forumId';
    const objectType = 'forum';
    const objectsType = 'forums';
    testBuilder.createTestCreate({
        objectType,
        apiPath,
        objectIdType,
        checkDuplicate: true,
        createByAdmin: true,
        testData: testData.create,
        schema: forumSchemas.forum,
    });
    testBuilder.createTestUpdate({
        objectType,
        objectIdType,
        apiPath,
        createByAdmin: true,
        testData: testData.update,
        schema: forumSchemas.forum,
    });
    testBuilder.createTestGet({
        objectIdType,
        apiPath,
        objectType,
        objectsType,
        createByAdmin: true,
        testData: testData.create,
        singleLiteSchema: forumSchemas.forum,
        multiLiteSchema: forumSchemas.forums,
        singleFullSchema: forumSchemas.fullForum,
        multiFullSchema: forumSchemas.fullForums,
    });
    testBuilder.createTestDelete({
        objectType,
        objectIdType,
        apiPath,
        createByAdmin: true,
        testData: testData.remove,
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9ydW1zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZm9ydW1zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUVBLFlBQVksQ0FBQztBQUViLE9BQU8sSUFBSSxNQUFNLE1BQU0sQ0FBQztBQUN4QixPQUFPLFFBQVEsTUFBTSxXQUFXLENBQUM7QUFDakMsT0FBTyxRQUFRLE1BQU0sa0JBQWtCLENBQUM7QUFDeEMsT0FBTyxRQUFRLE1BQU0sbUJBQW1CLENBQUM7QUFDekMsT0FBTyxXQUFXLE1BQU0sc0JBQXNCLENBQUM7QUFDL0MsT0FBTyxZQUFZLE1BQU0sa0JBQWtCLENBQUM7QUFFNUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBQ2QsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNuQixJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBRW5CLFFBQVEsQ0FBQyxRQUFRLEVBQUUsR0FBRyxFQUFFO0lBQ3RCLE1BQU0sT0FBTyxHQUFHLGNBQWMsQ0FBQztJQUMvQixNQUFNLFlBQVksR0FBRyxTQUFTLENBQUM7SUFDL0IsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDO0lBQzNCLE1BQU0sV0FBVyxHQUFHLFFBQVEsQ0FBQztJQUU3QixXQUFXLENBQUMsZ0JBQWdCLENBQUM7UUFDM0IsVUFBVTtRQUNWLE9BQU87UUFDUCxZQUFZO1FBQ1osY0FBYyxFQUFFLElBQUk7UUFDcEIsYUFBYSxFQUFFLElBQUk7UUFDbkIsUUFBUSxFQUFFLFFBQVEsQ0FBQyxNQUFNO1FBQ3pCLE1BQU0sRUFBRSxZQUFZLENBQUMsS0FBSztLQUMzQixDQUFDLENBQUM7SUFFSCxXQUFXLENBQUMsZ0JBQWdCLENBQUM7UUFDM0IsVUFBVTtRQUNWLFlBQVk7UUFDWixPQUFPO1FBQ1AsYUFBYSxFQUFFLElBQUk7UUFDbkIsUUFBUSxFQUFFLFFBQVEsQ0FBQyxNQUFNO1FBQ3pCLE1BQU0sRUFBRSxZQUFZLENBQUMsS0FBSztLQUMzQixDQUFDLENBQUM7SUFFSCxXQUFXLENBQUMsYUFBYSxDQUFDO1FBQ3hCLFlBQVk7UUFDWixPQUFPO1FBQ1AsVUFBVTtRQUNWLFdBQVc7UUFDWCxhQUFhLEVBQUUsSUFBSTtRQUNuQixRQUFRLEVBQUUsUUFBUSxDQUFDLE1BQU07UUFDekIsZ0JBQWdCLEVBQUUsWUFBWSxDQUFDLEtBQUs7UUFDcEMsZUFBZSxFQUFFLFlBQVksQ0FBQyxNQUFNO1FBQ3BDLGdCQUFnQixFQUFFLFlBQVksQ0FBQyxTQUFTO1FBQ3hDLGVBQWUsRUFBRSxZQUFZLENBQUMsVUFBVTtLQUN6QyxDQUFDLENBQUM7SUFFSCxXQUFXLENBQUMsZ0JBQWdCLENBQUM7UUFDM0IsVUFBVTtRQUNWLFlBQVk7UUFDWixPQUFPO1FBQ1AsYUFBYSxFQUFFLElBQUk7UUFDbkIsUUFBUSxFQUFFLFFBQVEsQ0FBQyxNQUFNO0tBQzFCLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDIn0=