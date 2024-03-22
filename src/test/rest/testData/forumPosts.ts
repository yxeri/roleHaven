'use strict';

const tools = require('../helper/tools');
const { appConfig } = require('../../../config/defaults/config');

const data = {};

data.create = {
  first: {
    text: [
      'first',
      tools.createRandString({ length: appConfig.messageMaxLength / 2 }),
    ],
  },
  second: {
    text: [
      'second',
      tools.createRandString({ length: appConfig.messageMaxLength / 2 }),
    ],
  },
  missing: {
    text: [tools.createRandString({ length: appConfig.messageMaxLength / 2 })],
  },
};

data.update = {
  toUpdate: {
    text: [
      'toUpdate',
      tools.createRandString({ length: appConfig.messageMaxLength / 2 }),
    ],
  },
  updateWith: {
    text: [
      'updateWith',
      tools.createRandString({ length: appConfig.messageMaxLength / 2 }),
    ],
  },
};

data.remove = {
  toRemove: {
    text: [
      'toRemove',
      tools.createRandString({ length: appConfig.messageMaxLength / 2 }),
    ],
  },
  secondToRemove: {
    text: [
      'secondToRemove',
      tools.createRandString({ length: appConfig.messageMaxLength / 2 }),
    ],
  },
};

export default data;
