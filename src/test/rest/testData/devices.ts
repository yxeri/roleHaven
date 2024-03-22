'use strict';

const tools = require('../helper/tools');
const { appConfig } = require('../../../config/defaults/config');

const data = {};

data.create = {
  first: {
    deviceName: tools.createRandString({ length: appConfig.deviceAliasMaxLength }),
  },
  second: {
    deviceName: tools.createRandString({ length: appConfig.deviceAliasMaxLength }),
  },
  missing: {
    deviceName: tools.createRandString({ length: appConfig.deviceAliasMaxLength }),
  },
};

data.update = {
  toUpdate: {
    deviceName: tools.createRandString({ length: appConfig.deviceAliasMaxLength }),
  },
  updateWith: {
    deviceName: tools.createRandString({ length: appConfig.deviceAliasMaxLength }),
  },
};

data.remove = {
  toRemove: {
    deviceName: tools.createRandString({ length: appConfig.deviceAliasMaxLength }),
  },
  secondToRemove: {
    deviceName: tools.createRandString({ length: appConfig.deviceAliasMaxLength }),
  },
};

export default data;
