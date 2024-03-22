'use strict';

const tools = require('../helper/tools');
const { appConfig } = require('../../../config/defaults/config');

const data = {};

data.create = {
  first: {
    text: [
      tools.createRandString({ length: appConfig.messageMaxLength / 2 }),
      tools.createRandString({ length: appConfig.messageMaxLength / 2 }),
    ],
  },
  second: {
    text: [
      tools.createRandString({ length: appConfig.messageMaxLength / 2 }),
      tools.createRandString({ length: appConfig.messageMaxLength / 2 }),
    ],
  },
  missing: {
    text: [
      tools.createRandString({ length: appConfig.messageMaxLength / 2 }),
      tools.createRandString({ length: appConfig.messageMaxLength / 2 }),
    ],
  },
};

data.update = {
  toUpdate: {
    text: [
      tools.createRandString({ length: appConfig.messageMaxLength / 2 }),
      tools.createRandString({ length: appConfig.messageMaxLength / 2 }),
    ],
  },
  updateWith: {
    text: [
      tools.createRandString({ length: appConfig.messageMaxLength / 2 }),
      tools.createRandString({ length: appConfig.messageMaxLength / 2 }),
    ],
  },
};

data.remove = {
  toRemove: {
    text: [
      tools.createRandString({ length: appConfig.messageMaxLength / 2 }),
      tools.createRandString({ length: appConfig.messageMaxLength / 2 }),
    ],
  },
  secondToRemove: {
    text: [
      tools.createRandString({ length: appConfig.messageMaxLength / 2 }),
      tools.createRandString({ length: appConfig.messageMaxLength / 2 }),
    ],
  },
};

export default data;
