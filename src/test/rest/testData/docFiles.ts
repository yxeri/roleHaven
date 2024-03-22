'use strict';

const tools = require('../helper/tools');
const { appConfig } = require('../../../config/defaults/config');

const data = {};

data.create = {
  first: {
    code: 'first',
    title: tools.createRandString({ length: appConfig.docFileTitleMaxLength }),
    text: [
      tools.createRandString({ length: appConfig.docFileMaxLength / 2 }),
      tools.createRandString({ length: appConfig.docFileMaxLength / 2 }),
    ],
  },
  second: {
    code: 'second',
    title: tools.createRandString({ length: appConfig.docFileTitleMaxLength }),
    text: [
      tools.createRandString({ length: appConfig.docFileMaxLength / 2 }),
      tools.createRandString({ length: appConfig.docFileMaxLength / 2 }),
    ],
  },
  missing: {
    code: 'missing',
    title: tools.createRandString({ length: appConfig.docFileTitleMaxLength }),
    text: [
      tools.createRandString({ length: appConfig.docFileMaxLength / 2 }),
      tools.createRandString({ length: appConfig.docFileMaxLength / 2 }),
    ],
  },
};

data.update = {
  toUpdate: {
    code: 'third',
    title: tools.createRandString({ length: appConfig.docFileTitleMaxLength }),
    text: [
      tools.createRandString({ length: appConfig.docFileMaxLength / 2 }),
      tools.createRandString({ length: appConfig.docFileMaxLength / 2 }),
    ],
  },
  updateWith: {
    title: tools.createRandString({ length: appConfig.docFileTitleMaxLength }),
    text: [
      tools.createRandString({ length: appConfig.docFileMaxLength / 2 }),
      tools.createRandString({ length: appConfig.docFileMaxLength / 2 }),
    ],
  },
};

data.remove = {
  toRemove: {
    code: 'fifth',
    title: tools.createRandString({ length: appConfig.docFileTitleMaxLength }),
    text: [
      tools.createRandString({ length: appConfig.docFileMaxLength / 2 }),
      tools.createRandString({ length: appConfig.docFileMaxLength / 2 }),
    ],
  },
  secondToRemove: {
    code: 'sixth',
    title: tools.createRandString({ length: appConfig.docFileTitleMaxLength }),
    text: [
      tools.createRandString({ length: appConfig.docFileMaxLength / 2 }),
      tools.createRandString({ length: appConfig.docFileMaxLength / 2 }),
    ],
  },
};

export default data;
