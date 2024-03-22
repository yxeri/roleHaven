'use strict';
import chai from 'chai';
import chaiHttp from 'chai-http';
import chaiJson from 'chai-json-schema';
import teamSchemas from './schemas/teams';
import testData from './testData/teams';
import testBuilder from './helper/testBuilder';
chai.should();
chai.use(chaiHttp);
chai.use(chaiJson);
describe('Teams', () => {
    const apiPath = '/api/teams/';
    const objectIdType = 'teamId';
    const objectType = 'team';
    const objectsType = 'teams';
    testBuilder.createTestCreate({
        objectType,
        apiPath,
        objectIdType,
        checkDuplicate: true,
        testData: testData.create,
        schema: teamSchemas.team,
    });
    testBuilder.createTestUpdate({
        objectType,
        objectIdType,
        apiPath,
        testData: testData.update,
        schema: teamSchemas.team,
    });
    testBuilder.createTestGet({
        objectIdType,
        apiPath,
        objectType,
        objectsType,
        testData: testData.create,
        singleLiteSchema: teamSchemas.team,
        multiLiteSchema: teamSchemas.teams,
        singleFullSchema: teamSchemas.fullTeam,
        multiFullSchema: teamSchemas.fullTeams,
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVhbXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ0ZWFtcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFFQSxZQUFZLENBQUM7QUFFYixPQUFPLElBQUksTUFBTSxNQUFNLENBQUM7QUFDeEIsT0FBTyxRQUFRLE1BQU0sV0FBVyxDQUFDO0FBQ2pDLE9BQU8sUUFBUSxNQUFNLGtCQUFrQixDQUFDO0FBQ3hDLE9BQU8sV0FBVyxNQUFNLGlCQUFpQixDQUFDO0FBQzFDLE9BQU8sUUFBUSxNQUFNLGtCQUFrQixDQUFDO0FBQ3hDLE9BQU8sV0FBVyxNQUFNLHNCQUFzQixDQUFDO0FBRS9DLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztBQUNkLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDbkIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUVuQixRQUFRLENBQUMsT0FBTyxFQUFFLEdBQUcsRUFBRTtJQUNyQixNQUFNLE9BQU8sR0FBRyxhQUFhLENBQUM7SUFDOUIsTUFBTSxZQUFZLEdBQUcsUUFBUSxDQUFDO0lBQzlCLE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQztJQUMxQixNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUM7SUFFNUIsV0FBVyxDQUFDLGdCQUFnQixDQUFDO1FBQzNCLFVBQVU7UUFDVixPQUFPO1FBQ1AsWUFBWTtRQUNaLGNBQWMsRUFBRSxJQUFJO1FBQ3BCLFFBQVEsRUFBRSxRQUFRLENBQUMsTUFBTTtRQUN6QixNQUFNLEVBQUUsV0FBVyxDQUFDLElBQUk7S0FDekIsQ0FBQyxDQUFDO0lBRUgsV0FBVyxDQUFDLGdCQUFnQixDQUFDO1FBQzNCLFVBQVU7UUFDVixZQUFZO1FBQ1osT0FBTztRQUNQLFFBQVEsRUFBRSxRQUFRLENBQUMsTUFBTTtRQUN6QixNQUFNLEVBQUUsV0FBVyxDQUFDLElBQUk7S0FDekIsQ0FBQyxDQUFDO0lBRUgsV0FBVyxDQUFDLGFBQWEsQ0FBQztRQUN4QixZQUFZO1FBQ1osT0FBTztRQUNQLFVBQVU7UUFDVixXQUFXO1FBQ1gsUUFBUSxFQUFFLFFBQVEsQ0FBQyxNQUFNO1FBQ3pCLGdCQUFnQixFQUFFLFdBQVcsQ0FBQyxJQUFJO1FBQ2xDLGVBQWUsRUFBRSxXQUFXLENBQUMsS0FBSztRQUNsQyxnQkFBZ0IsRUFBRSxXQUFXLENBQUMsUUFBUTtRQUN0QyxlQUFlLEVBQUUsV0FBVyxDQUFDLFNBQVM7S0FDdkMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMifQ==