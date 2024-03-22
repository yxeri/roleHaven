'use strict';
import chai from 'chai';
import chaiHttp from 'chai-http';
import chaiJson from 'chai-json-schema';
import gameCodeSchemas from './schemas/gameCodes';
import testData from './testData/gameCodes';
import testBuilder from './helper/testBuilder';
chai.should();
chai.use(chaiHttp);
chai.use(chaiJson);
describe('GameCodes', () => {
    const apiPath = '/api/gameCodes/';
    const objectIdType = 'gameCodeId';
    const objectType = 'gameCode';
    const objectsType = 'gameCodes';
    testBuilder.createTestCreate({
        objectType,
        apiPath,
        objectIdType,
        checkDuplicate: true,
        testData: testData.create,
        schema: gameCodeSchemas.gameCode,
    });
    testBuilder.createTestUpdate({
        objectType,
        objectIdType,
        apiPath,
        testData: testData.update,
        schema: gameCodeSchemas.gameCode,
    });
    testBuilder.createTestGet({
        objectIdType,
        apiPath,
        objectType,
        objectsType,
        testData: testData.create,
        singleLiteSchema: gameCodeSchemas.gameCode,
        multiLiteSchema: gameCodeSchemas.gameCodes,
        singleFullSchema: gameCodeSchemas.fullGameCode,
        multiFullSchema: gameCodeSchemas.fullGameCodes,
    });
    testBuilder.createTestDelete({
        objectType,
        objectIdType,
        apiPath,
        testData: testData.remove,
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2FtZUNvZGVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZ2FtZUNvZGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUVBLFlBQVksQ0FBQztBQUViLE9BQU8sSUFBSSxNQUFNLE1BQU0sQ0FBQztBQUN4QixPQUFPLFFBQVEsTUFBTSxXQUFXLENBQUM7QUFDakMsT0FBTyxRQUFRLE1BQU0sa0JBQWtCLENBQUM7QUFDeEMsT0FBTyxlQUFlLE1BQU0scUJBQXFCLENBQUM7QUFDbEQsT0FBTyxRQUFRLE1BQU0sc0JBQXNCLENBQUM7QUFDNUMsT0FBTyxXQUFXLE1BQU0sc0JBQXNCLENBQUM7QUFFL0MsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBQ2QsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNuQixJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBRW5CLFFBQVEsQ0FBQyxXQUFXLEVBQUUsR0FBRyxFQUFFO0lBQ3pCLE1BQU0sT0FBTyxHQUFHLGlCQUFpQixDQUFDO0lBQ2xDLE1BQU0sWUFBWSxHQUFHLFlBQVksQ0FBQztJQUNsQyxNQUFNLFVBQVUsR0FBRyxVQUFVLENBQUM7SUFDOUIsTUFBTSxXQUFXLEdBQUcsV0FBVyxDQUFDO0lBRWhDLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQztRQUMzQixVQUFVO1FBQ1YsT0FBTztRQUNQLFlBQVk7UUFDWixjQUFjLEVBQUUsSUFBSTtRQUNwQixRQUFRLEVBQUUsUUFBUSxDQUFDLE1BQU07UUFDekIsTUFBTSxFQUFFLGVBQWUsQ0FBQyxRQUFRO0tBQ2pDLENBQUMsQ0FBQztJQUVILFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQztRQUMzQixVQUFVO1FBQ1YsWUFBWTtRQUNaLE9BQU87UUFDUCxRQUFRLEVBQUUsUUFBUSxDQUFDLE1BQU07UUFDekIsTUFBTSxFQUFFLGVBQWUsQ0FBQyxRQUFRO0tBQ2pDLENBQUMsQ0FBQztJQUVILFdBQVcsQ0FBQyxhQUFhLENBQUM7UUFDeEIsWUFBWTtRQUNaLE9BQU87UUFDUCxVQUFVO1FBQ1YsV0FBVztRQUNYLFFBQVEsRUFBRSxRQUFRLENBQUMsTUFBTTtRQUN6QixnQkFBZ0IsRUFBRSxlQUFlLENBQUMsUUFBUTtRQUMxQyxlQUFlLEVBQUUsZUFBZSxDQUFDLFNBQVM7UUFDMUMsZ0JBQWdCLEVBQUUsZUFBZSxDQUFDLFlBQVk7UUFDOUMsZUFBZSxFQUFFLGVBQWUsQ0FBQyxhQUFhO0tBQy9DLENBQUMsQ0FBQztJQUVILFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQztRQUMzQixVQUFVO1FBQ1YsWUFBWTtRQUNaLE9BQU87UUFDUCxRQUFRLEVBQUUsUUFBUSxDQUFDLE1BQU07S0FDMUIsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMifQ==