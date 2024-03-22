/* eslint-disable no-unused-expressions */

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
