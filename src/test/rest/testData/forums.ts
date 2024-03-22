'use strict';

const tools = require('../helper/tools');
const { appConfig } = require('../../../config/defaults/config');

const data = {};

data.create = {
  first: {
    title: 'createOne',
    text: [
      tools.createRandString({ length: appConfig.messageMaxLength / 2 }),
      tools.createRandString({ length: appConfig.messageMaxLength / 2 }),
    ],
  },
  second: {
    title: 'createTwo',
    text: [
      tools.createRandString({ length: appConfig.messageMaxLength / 2 }),
      tools.createRandString({ length: appConfig.messageMaxLength / 2 }),
    ],
  },
  missing: {
    title: 'missing',
  },
};

data.update = {
  toUpdate: {
    title: 'createThree',
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
    title: 'createFour',
    text: [
      tools.createRandString({ length: appConfig.messageMaxLength / 2 }),
      tools.createRandString({ length: appConfig.messageMaxLength / 2 }),
    ],
  },
  secondToRemove: {
    title: 'createFive',
    text: [
      tools.createRandString({ length: appConfig.messageMaxLength / 2 }),
      tools.createRandString({ length: appConfig.messageMaxLength / 2 }),
    ],
  },
};

export default data;
