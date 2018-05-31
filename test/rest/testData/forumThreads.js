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
    text: [
      tools.createRandString({ length: appConfig.messageMaxLength / 2 }),
      tools.createRandString({ length: appConfig.messageMaxLength / 2 }),
    ],
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

module.exports = data;
