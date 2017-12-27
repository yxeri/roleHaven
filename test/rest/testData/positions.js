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
const appConfig = require('../../../config/defaults/config').app;
const dbConfig = require('../../../config/defaults/config').databasePopulation;

const data = {};

data.updatePositionData = {
  description: [tools.createRandString({ length: appConfig.docFileMaxLength })],
  title: tools.createRandString({ length: appConfig.docFileTitleMaxLength }),
  positionName: tools.createRandString({ length: 5 }),
  coordinates: {
    longitude: 59,
    latitude: 49,
  },
  markerType: 'custom',
};
data.userPositionToUpdateWith = {
  coordinates: {
    longitude: 10,
    latitude: 10,
  },
};
data.otherUserPositionToUpdateWith = {
  coordinates: {
    longitude: 5,
    latitude: 5,
  },
};
data.userThatDoesNotExist = {
  username: tools.createRandString({ length: appConfig.usernameMaxLength }),
};
data.adminUserToCreateAndGetPositionFrom = {
  username: tools.createRandString({ length: appConfig.usernameMaxLength }),
  password: tools.createRandString({ length: appConfig.passwordMaxLength }),
  registerDevice: tools.createRandString({ length: appConfig.deviceIdLength }),
  mail: `${tools.createRandString({ length: 10 })}@${tools.createRandString({ length: 10 })}.com`,
  accessLevel: dbConfig.AccessLevels.ADMIN,
  visibility: dbConfig.AccessLevels.PRIVILEGED,
  verified: true,
};
data.basicUserToCreateAndGetPositionFrom = {
  username: tools.createRandString({ length: appConfig.usernameMaxLength }),
  password: tools.createRandString({ length: appConfig.passwordMaxLength }),
  registerDevice: tools.createRandString({ length: appConfig.deviceIdLength }),
  mail: `${tools.createRandString({ length: 10 })}@${tools.createRandString({ length: 10 })}.com`,
  verified: true,
  accessLevel: dbConfig.AccessLevels.STANDARD,
};

module.exports = data;
