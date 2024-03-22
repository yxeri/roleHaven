'use strict';

const tools = require('../helper/tools');
const { appConfig } = require('../../../config/defaults/config');

const data = {};

data.create = {
  first: {
    aliasName: tools.createRandString({ length: appConfig.usernameMaxLength }),
  },
  second: {
    aliasName: tools.createRandString({ length: appConfig.usernameMaxLength }),
  },
  missing: {
    aliasName: tools.createRandString({ length: appConfig.usernameMaxLength }),
  },
};

data.update = {
  toUpdate: {
    aliasName: tools.createRandString({ length: appConfig.usernameMaxLength }),
  },
  updateWith: {
    aliasName: tools.createRandString({ length: appConfig.usernameMaxLength }),
  },
};

data.remove = {
  toRemove: {
    aliasName: tools.createRandString({ length: appConfig.usernameMaxLength }),
  },
  secondToRemove: {
    aliasName: tools.createRandString({ length: appConfig.usernameMaxLength }),
  },
};

export default data;
