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

module.exports = data;
