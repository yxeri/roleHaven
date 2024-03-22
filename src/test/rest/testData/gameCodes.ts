'use strict';

const tools = require('../helper/tools');
const {
  appConfig,
  dbConfig,
} = require('../../../config/defaults/config');

/**
 * code: { type: String, unique: true },
 codeType: { type: String, default: dbConfig.GameCodeTypes.TRANSACTION },
 codeContent: { type: [String], default: [] },
 isRenewable: { type: Boolean, default: false },
 used: { type: Boolean, default: false },
 * @type {{}}
 */

const data = {};

data.create = {
  first: {
    code: tools.createRandString({ length: appConfig.gameCodeLength }),
  },
  second: {
    codeType: dbConfig.GameCodeTypes.TEXT,
    codeContent: ['Two lines', 'of text'],
  },
};

data.update = {
  toUpdate: {
    codeType: dbConfig.GameCodeTypes.TEXT,
    codeContent: ['Two lines', 'of text'],
  },
  updateWith: {
    codeContent: ['Three lines', 'of text', 'in it'],
  },
};

data.remove = {
  toRemove: {
    codeType: dbConfig.GameCodeTypes.TEXT,
    codeContent: ['Two lines', 'of text'],
  },
  secondToRemove: {
    codeType: dbConfig.GameCodeTypes.TEXT,
    codeContent: ['Two lines', 'of text'],
  },
};

export default data;
