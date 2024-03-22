'use strict';

const { appConfig } = require('../../../config/defaults/config');
const tools = require('../helper/tools');

const data = {};

data.create = {
  first: {
    username: tools.createRandString({ length: appConfig.usernameMaxLength }),
    password: tools.createRandString({ length: appConfig.passwordMaxLength }),
    registerDevice: tools.createRandString({ length: appConfig.deviceIdLength }),
  },
  second: {
    username: tools.createRandString({ length: appConfig.usernameMaxLength }),
    password: tools.createRandString({ length: appConfig.passwordMaxLength }),
    registerDevice: tools.createRandString({ length: appConfig.deviceIdLength }),
  },
  missing: {
    username: tools.createRandString({ length: appConfig.usernameMaxLength }),
    password: tools.createRandString({ length: appConfig.passwordMaxLength }),
  },
};

data.update = {
  toUpdate: {
    username: tools.createRandString({ length: appConfig.usernameMaxLength }),
    password: tools.createRandString({ length: appConfig.passwordMaxLength }),
    registerDevice: tools.createRandString({ length: appConfig.deviceIdLength }),
  },
  updateWith: {
    username: tools.createRandString({ length: appConfig.usernameMaxLength }),
  },
};

data.remove = {
  toRemove: {
    username: tools.createRandString({ length: appConfig.usernameMaxLength }),
    password: tools.createRandString({ length: appConfig.passwordMaxLength }),
    registerDevice: tools.createRandString({ length: appConfig.deviceIdLength }),
  },
  secondToRemove: {
    username: tools.createRandString({ length: appConfig.usernameMaxLength }),
    password: tools.createRandString({ length: appConfig.passwordMaxLength }),
    registerDevice: tools.createRandString({ length: appConfig.deviceIdLength }),
  },
};

export default data;
