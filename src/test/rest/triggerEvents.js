'use strict';
import chai from 'chai';
import chaiHttp from 'chai-http';
import chaiJson from 'chai-json-schema';
import testBuilder from './helper/testBuilder';
import eventSchemas from './schemas/triggerEvents';
import testData from './testData/triggerEvents';
chai.should();
chai.use(chaiHttp);
chai.use(chaiJson);
describe('TriggerEvents', () => {
    const apiPath = '/api/triggerEvents/';
    const objectIdType = 'eventId';
    const objectType = 'triggerEvent';
    const objectsType = 'triggerEvents';
    testBuilder.createTestCreate({
        objectType,
        apiPath,
        testData: testData.create,
        schema: eventSchemas.triggerEvent,
    });
    testBuilder.createTestUpdate({
        objectType,
        objectIdType,
        apiPath,
        testData: testData.update,
        schema: eventSchemas.triggerEvent,
    });
    testBuilder.createTestGet({
        objectIdType,
        apiPath,
        objectType,
        objectsType,
        testData: testData.create,
        singleLiteSchema: eventSchemas.triggerEvent,
        multiLiteSchema: eventSchemas.triggerEvents,
        singleFullSchema: eventSchemas.fullTriggerEvent,
        multiFullSchema: eventSchemas.fullTriggerEvents,
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJpZ2dlckV2ZW50cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInRyaWdnZXJFdmVudHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBRUEsWUFBWSxDQUFDO0FBRWIsT0FBTyxJQUFJLE1BQU0sTUFBTSxDQUFDO0FBQ3hCLE9BQU8sUUFBUSxNQUFNLFdBQVcsQ0FBQztBQUNqQyxPQUFPLFFBQVEsTUFBTSxrQkFBa0IsQ0FBQztBQUN4QyxPQUFPLFdBQVcsTUFBTSxzQkFBc0IsQ0FBQztBQUMvQyxPQUFPLFlBQVksTUFBTSx5QkFBeUIsQ0FBQztBQUNuRCxPQUFPLFFBQVEsTUFBTSwwQkFBMEIsQ0FBQztBQUVoRCxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7QUFDZCxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ25CLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7QUFFbkIsUUFBUSxDQUFDLGVBQWUsRUFBRSxHQUFHLEVBQUU7SUFDN0IsTUFBTSxPQUFPLEdBQUcscUJBQXFCLENBQUM7SUFDdEMsTUFBTSxZQUFZLEdBQUcsU0FBUyxDQUFDO0lBQy9CLE1BQU0sVUFBVSxHQUFHLGNBQWMsQ0FBQztJQUNsQyxNQUFNLFdBQVcsR0FBRyxlQUFlLENBQUM7SUFFcEMsV0FBVyxDQUFDLGdCQUFnQixDQUFDO1FBQzNCLFVBQVU7UUFDVixPQUFPO1FBQ1AsUUFBUSxFQUFFLFFBQVEsQ0FBQyxNQUFNO1FBQ3pCLE1BQU0sRUFBRSxZQUFZLENBQUMsWUFBWTtLQUVsQyxDQUFDLENBQUM7SUFFSCxXQUFXLENBQUMsZ0JBQWdCLENBQUM7UUFDM0IsVUFBVTtRQUNWLFlBQVk7UUFDWixPQUFPO1FBQ1AsUUFBUSxFQUFFLFFBQVEsQ0FBQyxNQUFNO1FBQ3pCLE1BQU0sRUFBRSxZQUFZLENBQUMsWUFBWTtLQUNsQyxDQUFDLENBQUM7SUFFSCxXQUFXLENBQUMsYUFBYSxDQUFDO1FBQ3hCLFlBQVk7UUFDWixPQUFPO1FBQ1AsVUFBVTtRQUNWLFdBQVc7UUFDWCxRQUFRLEVBQUUsUUFBUSxDQUFDLE1BQU07UUFDekIsZ0JBQWdCLEVBQUUsWUFBWSxDQUFDLFlBQVk7UUFDM0MsZUFBZSxFQUFFLFlBQVksQ0FBQyxhQUFhO1FBQzNDLGdCQUFnQixFQUFFLFlBQVksQ0FBQyxnQkFBZ0I7UUFDL0MsZUFBZSxFQUFFLFlBQVksQ0FBQyxpQkFBaUI7S0FDaEQsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMifQ==