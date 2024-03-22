'use strict';
import chai from 'chai';
import chaiHttp from 'chai-http';
import chaiJson from 'chai-json-schema';
import positionSchemas from './schemas/positions';
import testData from './testData/positions';
import testBuilder from './helper/testBuilder';
chai.should();
chai.use(chaiHttp);
chai.use(chaiJson);
describe('Positions', () => {
    const apiPath = '/api/positions/';
    const objectIdType = 'positionId';
    const objectType = 'position';
    const objectsType = 'positions';
    testBuilder.createTestCreate({
        objectType,
        apiPath,
        objectIdType,
        checkDuplicate: true,
        testData: testData.create,
        schema: positionSchemas.position,
    });
    testBuilder.createTestUpdate({
        objectType,
        objectIdType,
        apiPath,
        testData: testData.update,
        schema: positionSchemas.position,
    });
    testBuilder.createTestGet({
        objectIdType,
        apiPath,
        objectType,
        objectsType,
        testData: testData.create,
        singleLiteSchema: positionSchemas.position,
        multiLiteSchema: positionSchemas.positions,
        singleFullSchema: positionSchemas.fullPosition,
        multiFullSchema: positionSchemas.fullPositions,
    });
    testBuilder.createTestDelete({
        objectType,
        objectIdType,
        apiPath,
        testData: testData.remove,
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9zaXRpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicG9zaXRpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUVBLFlBQVksQ0FBQztBQUViLE9BQU8sSUFBSSxNQUFNLE1BQU0sQ0FBQztBQUN4QixPQUFPLFFBQVEsTUFBTSxXQUFXLENBQUM7QUFDakMsT0FBTyxRQUFRLE1BQU0sa0JBQWtCLENBQUM7QUFDeEMsT0FBTyxlQUFlLE1BQU0scUJBQXFCLENBQUM7QUFDbEQsT0FBTyxRQUFRLE1BQU0sc0JBQXNCLENBQUM7QUFDNUMsT0FBTyxXQUFXLE1BQU0sc0JBQXNCLENBQUM7QUFFL0MsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBQ2QsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNuQixJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBRW5CLFFBQVEsQ0FBQyxXQUFXLEVBQUUsR0FBRyxFQUFFO0lBQ3pCLE1BQU0sT0FBTyxHQUFHLGlCQUFpQixDQUFDO0lBQ2xDLE1BQU0sWUFBWSxHQUFHLFlBQVksQ0FBQztJQUNsQyxNQUFNLFVBQVUsR0FBRyxVQUFVLENBQUM7SUFDOUIsTUFBTSxXQUFXLEdBQUcsV0FBVyxDQUFDO0lBSWhDLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQztRQUMzQixVQUFVO1FBQ1YsT0FBTztRQUNQLFlBQVk7UUFDWixjQUFjLEVBQUUsSUFBSTtRQUNwQixRQUFRLEVBQUUsUUFBUSxDQUFDLE1BQU07UUFDekIsTUFBTSxFQUFFLGVBQWUsQ0FBQyxRQUFRO0tBQ2pDLENBQUMsQ0FBQztJQUVILFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQztRQUMzQixVQUFVO1FBQ1YsWUFBWTtRQUNaLE9BQU87UUFDUCxRQUFRLEVBQUUsUUFBUSxDQUFDLE1BQU07UUFDekIsTUFBTSxFQUFFLGVBQWUsQ0FBQyxRQUFRO0tBQ2pDLENBQUMsQ0FBQztJQUVILFdBQVcsQ0FBQyxhQUFhLENBQUM7UUFDeEIsWUFBWTtRQUNaLE9BQU87UUFDUCxVQUFVO1FBQ1YsV0FBVztRQUNYLFFBQVEsRUFBRSxRQUFRLENBQUMsTUFBTTtRQUN6QixnQkFBZ0IsRUFBRSxlQUFlLENBQUMsUUFBUTtRQUMxQyxlQUFlLEVBQUUsZUFBZSxDQUFDLFNBQVM7UUFDMUMsZ0JBQWdCLEVBQUUsZUFBZSxDQUFDLFlBQVk7UUFDOUMsZUFBZSxFQUFFLGVBQWUsQ0FBQyxhQUFhO0tBQy9DLENBQUMsQ0FBQztJQUVILFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQztRQUMzQixVQUFVO1FBQ1YsWUFBWTtRQUNaLE9BQU87UUFDUCxRQUFRLEVBQUUsUUFBUSxDQUFDLE1BQU07S0FDMUIsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMifQ==