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

const appConfig = require('../../../config/defaults/config').app;
const tools = require('../helper/tools');

const data = {};

data.create = {
  first: {
    roomName: tools.createRandString({ length: appConfig.roomNameMaxLength }),
  },
  second: {
    roomName: tools.createRandString({ length: appConfig.roomNameMaxLength }),
  },
  missing: {
    roomName: tools.createRandString({ length: appConfig.roomNameMaxLength }),
  },
};

data.update = {
  toUpdate: {
    roomName: tools.createRandString({ length: appConfig.roomNameMaxLength }),
  },
  updateWith: {
    roomName: tools.createRandString({ length: appConfig.roomNameMaxLength }),
  },
};

data.remove = {
  toRemove: {
    roomName: tools.createRandString({ length: appConfig.roomNameMaxLength }),
  },
  secondToRemove: {
    roomName: tools.createRandString({ length: appConfig.roomNameMaxLength }),
  },
};

module.exports = data;
