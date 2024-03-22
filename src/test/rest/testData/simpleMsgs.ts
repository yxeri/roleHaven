'use strict';

const tools = require('../helper/tools');
const { appConfig } = require('../../../config/defaults/config');

const data = {};

data.create = {
  first: {
    text: tools.createRandString({ length: appConfig.messageMaxLength }),
  },
  second: {
    text: tools.createRandString({ length: appConfig.messageMaxLength }),
  },
  missing: {
    text: tools.createRandString({ length: appConfig.messageMaxLength }),
  },
};

data.update = {
  toUpdate: {
    text: tools.createRandString({ length: appConfig.messageMaxLength }),
  },
  updateWith: {
    text: tools.createRandString({ length: appConfig.messageMaxLength }),
  },
};

data.remove = {
  toRemove: {
    text: tools.createRandString({ length: appConfig.messageMaxLength }),
  },
  secondToRemove: {
    text: tools.createRandString({ length: appConfig.messageMaxLength }),
  },
};

export default data;
