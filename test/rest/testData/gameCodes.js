/*
 Copyright 2017 Aleksandar Jankovic

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

'use strict';

const tools = require('../helper/tools');
const { appConfig, dbConfig } = require('../../../config/defaults/config');

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

module.exports = data;
