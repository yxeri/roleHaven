'use strict';

const tools = require('../helper/tools');
const { appConfig } = require('../../../config/defaults/config');

const data = {};

data.create = {
  first: {
    teamName: tools.createRandString({ length: appConfig.teamNameMaxLength }),
    shortName: tools.createRandString({ length: appConfig.shortTeamMaxLength }),
  },
  second: {
    teamName: tools.createRandString({ length: appConfig.teamNameMaxLength }),
    shortName: tools.createRandString({ length: appConfig.shortTeamMaxLength }),
  },
  missing: {
    teamName: tools.createRandString({ length: appConfig.teamNameMaxLength }),
    shortName: tools.createRandString({ length: appConfig.shortTeamMaxLength }),
  },
};

data.update = {
  toUpdate: {
    teamName: tools.createRandString({ length: appConfig.teamNameMaxLength }),
    shortName: tools.createRandString({ length: appConfig.shortTeamMaxLength }),
  },
  updateWith: {
    teamName: tools.createRandString({ length: appConfig.teamNameMaxLength }),
    shortName: tools.createRandString({ length: appConfig.shortTeamMaxLength }),
  },
};

data.remove = {
  toRemove: {
    teamName: tools.createRandString({ length: appConfig.teamNameMaxLength }),
    shortName: tools.createRandString({ length: appConfig.shortTeamMaxLength }),
  },
  secondToRemove: {
    teamName: tools.createRandString({ length: appConfig.teamNameMaxLength }),
    shortName: tools.createRandString({ length: appConfig.shortTeamMaxLength }),
  },
};

export default data;
