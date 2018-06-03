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
    deviceName: tools.createRandString({ length: appConfig.deviceAliasMaxLength }),
  },
  second: {
    deviceName: tools.createRandString({ length: appConfig.deviceAliasMaxLength }),
  },
  missing: {
    deviceName: tools.createRandString({ length: appConfig.deviceAliasMaxLength }),
  },
};

data.update = {
  toUpdate: {
    deviceName: tools.createRandString({ length: appConfig.deviceAliasMaxLength }),
  },
  updateWith: {
    deviceName: tools.createRandString({ length: appConfig.deviceAliasMaxLength }),
  },
};

data.remove = {
  toRemove: {
    deviceName: tools.createRandString({ length: appConfig.deviceAliasMaxLength }),
  },
  secondToRemove: {
    deviceName: tools.createRandString({ length: appConfig.deviceAliasMaxLength }),
  },
};

module.exports = data;
