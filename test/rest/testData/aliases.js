/*
 Copyright 2017 Carmilla Mina Jankovic

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
    aliasName: tools.createRandString({ length: appConfig.usernameMaxLength }),
  },
  second: {
    aliasName: tools.createRandString({ length: appConfig.usernameMaxLength }),
  },
  missing: {
    aliasName: tools.createRandString({ length: appConfig.usernameMaxLength }),
  },
};

data.update = {
  toUpdate: {
    aliasName: tools.createRandString({ length: appConfig.usernameMaxLength }),
  },
  updateWith: {
    aliasName: tools.createRandString({ length: appConfig.usernameMaxLength }),
  },
};

data.remove = {
  toRemove: {
    aliasName: tools.createRandString({ length: appConfig.usernameMaxLength }),
  },
  secondToRemove: {
    aliasName: tools.createRandString({ length: appConfig.usernameMaxLength }),
  },
};

module.exports = data;
