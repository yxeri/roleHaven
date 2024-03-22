'use strict';
import chai from 'chai';
import chaiHttp from 'chai-http';
import chaiJson from 'chai-json-schema';
import aliasSchemas from './schemas/aliases';
import testData from './testData/aliases';
import testBuilder from './helper/testBuilder';
chai.should();
chai.use(chaiHttp);
chai.use(chaiJson);
describe('Aliases', () => {
    const apiPath = '/api/aliases/';
    const objectIdType = 'aliasId';
    const objectType = 'alias';
    const objectsType = 'aliases';
    testBuilder.createTestCreate({
        objectType,
        apiPath,
        checkDuplicate: true,
        testData: testData.create,
        schema: aliasSchemas.alias,
    });
    testBuilder.createTestUpdate({
        objectType,
        objectIdType,
        apiPath,
        testData: testData.update,
        schema: aliasSchemas.alias,
    });
    testBuilder.createTestGet({
        objectIdType,
        apiPath,
        objectType,
        objectsType,
        testData: testData.create,
        singleLiteSchema: aliasSchemas.alias,
        multiLiteSchema: aliasSchemas.aliases,
        singleFullSchema: aliasSchemas.fullAlias,
        multiFullSchema: aliasSchemas.fullAliases,
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWxpYXNlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImFsaWFzZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBRUEsWUFBWSxDQUFDO0FBRWIsT0FBTyxJQUFJLE1BQU0sTUFBTSxDQUFDO0FBQ3hCLE9BQU8sUUFBUSxNQUFNLFdBQVcsQ0FBQztBQUNqQyxPQUFPLFFBQVEsTUFBTSxrQkFBa0IsQ0FBQztBQUN4QyxPQUFPLFlBQVksTUFBTSxtQkFBbUIsQ0FBQztBQUM3QyxPQUFPLFFBQVEsTUFBTSxvQkFBb0IsQ0FBQztBQUMxQyxPQUFPLFdBQVcsTUFBTSxzQkFBc0IsQ0FBQztBQUUvQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7QUFDZCxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ25CLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7QUFFbkIsUUFBUSxDQUFDLFNBQVMsRUFBRSxHQUFHLEVBQUU7SUFDdkIsTUFBTSxPQUFPLEdBQUcsZUFBZSxDQUFDO0lBQ2hDLE1BQU0sWUFBWSxHQUFHLFNBQVMsQ0FBQztJQUMvQixNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUM7SUFDM0IsTUFBTSxXQUFXLEdBQUcsU0FBUyxDQUFDO0lBRTlCLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQztRQUMzQixVQUFVO1FBQ1YsT0FBTztRQUNQLGNBQWMsRUFBRSxJQUFJO1FBQ3BCLFFBQVEsRUFBRSxRQUFRLENBQUMsTUFBTTtRQUN6QixNQUFNLEVBQUUsWUFBWSxDQUFDLEtBQUs7S0FDM0IsQ0FBQyxDQUFDO0lBRUgsV0FBVyxDQUFDLGdCQUFnQixDQUFDO1FBQzNCLFVBQVU7UUFDVixZQUFZO1FBQ1osT0FBTztRQUNQLFFBQVEsRUFBRSxRQUFRLENBQUMsTUFBTTtRQUN6QixNQUFNLEVBQUUsWUFBWSxDQUFDLEtBQUs7S0FDM0IsQ0FBQyxDQUFDO0lBRUgsV0FBVyxDQUFDLGFBQWEsQ0FBQztRQUN4QixZQUFZO1FBQ1osT0FBTztRQUNQLFVBQVU7UUFDVixXQUFXO1FBQ1gsUUFBUSxFQUFFLFFBQVEsQ0FBQyxNQUFNO1FBQ3pCLGdCQUFnQixFQUFFLFlBQVksQ0FBQyxLQUFLO1FBQ3BDLGVBQWUsRUFBRSxZQUFZLENBQUMsT0FBTztRQUNyQyxnQkFBZ0IsRUFBRSxZQUFZLENBQUMsU0FBUztRQUN4QyxlQUFlLEVBQUUsWUFBWSxDQUFDLFdBQVc7S0FDMUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMifQ==