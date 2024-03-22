'use strict';
import chai from 'chai';
import chaiHttp from 'chai-http';
import chaiJson from 'chai-json-schema';
import docFileSchemas from './schemas/docFiles';
import testData from './testData/docFiles';
import testBuilder from './helper/testBuilder';
chai.should();
chai.use(chaiHttp);
chai.use(chaiJson);
describe('DocFiles', () => {
    const apiPath = '/api/docFiles/';
    const objectIdType = 'docFileId';
    const objectType = 'docFile';
    const objectsType = 'docFiles';
    testBuilder.createTestCreate({
        objectType,
        apiPath,
        objectIdType,
        checkDuplicate: true,
        testData: testData.create,
        schema: docFileSchemas.docFile,
    });
    testBuilder.createTestUpdate({
        objectType,
        objectIdType,
        apiPath,
        testData: testData.update,
        schema: docFileSchemas.docFile,
    });
    testBuilder.createTestGet({
        objectIdType,
        apiPath,
        objectType,
        objectsType,
        testData: testData.create,
        singleLiteSchema: docFileSchemas.liteDocFile,
        multiLiteSchema: docFileSchemas.liteDocFiles,
        singleFullSchema: docFileSchemas.fullDocFile,
        multiFullSchema: docFileSchemas.fullDocFiles,
    });
    testBuilder.createTestDelete({
        objectType,
        objectIdType,
        apiPath,
        testData: testData.remove,
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9jRmlsZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJkb2NGaWxlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFFQSxZQUFZLENBQUM7QUFFYixPQUFPLElBQUksTUFBTSxNQUFNLENBQUM7QUFDeEIsT0FBTyxRQUFRLE1BQU0sV0FBVyxDQUFDO0FBQ2pDLE9BQU8sUUFBUSxNQUFNLGtCQUFrQixDQUFDO0FBQ3hDLE9BQU8sY0FBYyxNQUFNLG9CQUFvQixDQUFDO0FBQ2hELE9BQU8sUUFBUSxNQUFNLHFCQUFxQixDQUFDO0FBQzNDLE9BQU8sV0FBVyxNQUFNLHNCQUFzQixDQUFDO0FBRS9DLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztBQUNkLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDbkIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUVuQixRQUFRLENBQUMsVUFBVSxFQUFFLEdBQUcsRUFBRTtJQUN4QixNQUFNLE9BQU8sR0FBRyxnQkFBZ0IsQ0FBQztJQUNqQyxNQUFNLFlBQVksR0FBRyxXQUFXLENBQUM7SUFDakMsTUFBTSxVQUFVLEdBQUcsU0FBUyxDQUFDO0lBQzdCLE1BQU0sV0FBVyxHQUFHLFVBQVUsQ0FBQztJQUUvQixXQUFXLENBQUMsZ0JBQWdCLENBQUM7UUFDM0IsVUFBVTtRQUNWLE9BQU87UUFDUCxZQUFZO1FBQ1osY0FBYyxFQUFFLElBQUk7UUFDcEIsUUFBUSxFQUFFLFFBQVEsQ0FBQyxNQUFNO1FBQ3pCLE1BQU0sRUFBRSxjQUFjLENBQUMsT0FBTztLQUMvQixDQUFDLENBQUM7SUFFSCxXQUFXLENBQUMsZ0JBQWdCLENBQUM7UUFDM0IsVUFBVTtRQUNWLFlBQVk7UUFDWixPQUFPO1FBQ1AsUUFBUSxFQUFFLFFBQVEsQ0FBQyxNQUFNO1FBQ3pCLE1BQU0sRUFBRSxjQUFjLENBQUMsT0FBTztLQUMvQixDQUFDLENBQUM7SUFFSCxXQUFXLENBQUMsYUFBYSxDQUFDO1FBQ3hCLFlBQVk7UUFDWixPQUFPO1FBQ1AsVUFBVTtRQUNWLFdBQVc7UUFDWCxRQUFRLEVBQUUsUUFBUSxDQUFDLE1BQU07UUFDekIsZ0JBQWdCLEVBQUUsY0FBYyxDQUFDLFdBQVc7UUFDNUMsZUFBZSxFQUFFLGNBQWMsQ0FBQyxZQUFZO1FBQzVDLGdCQUFnQixFQUFFLGNBQWMsQ0FBQyxXQUFXO1FBQzVDLGVBQWUsRUFBRSxjQUFjLENBQUMsWUFBWTtLQUM3QyxDQUFDLENBQUM7SUFFSCxXQUFXLENBQUMsZ0JBQWdCLENBQUM7UUFDM0IsVUFBVTtRQUNWLFlBQVk7UUFDWixPQUFPO1FBQ1AsUUFBUSxFQUFFLFFBQVEsQ0FBQyxNQUFNO0tBQzFCLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDIn0=