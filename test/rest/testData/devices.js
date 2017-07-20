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

// deviceId: { type: String, unique: true },
// socketId: String,
//   deviceAlias: { type: String, unique: true },
// lastUser: String,
//   lastAlive: Date,

data.deviceWithoutUser = {
  deviceId: tools.createRandString({ length: appConfig.deviceIdLength }),
};
data.deviceWithNewAlias = {
  deviceAlias: tools.createRandString({ length: appConfig.deviceAliasMaxLength }),
};
data.deviceWithUser = {
  deviceId: tools.createRandString({ length: appConfig.deviceIdLength }),
};
data.adminUserToChangeDeviceAliasWith = {
  userName: tools.createRandString({ length: appConfig.userNameMaxLength }),
  password: tools.createRandString({ length: appConfig.passwordMaxLength }),
  registerDevice: tools.createRandString({ length: appConfig.deviceIdLength }),
  mail: `${tools.createRandString({ length: 10 })}@${tools.createRandString({ length: 10 })}.com`,
  accessLevel: dbConfig.AccessLevels.ADMIN,
  visibility: dbConfig.AccessLevels.PRO,
  verified: true,
};
data.basicUserToUpdateDeviceWith = {
  userName: tools.createRandString({ length: appConfig.userNameMaxLength }),
  password: tools.createRandString({ length: appConfig.passwordMaxLength }),
  registerDevice: tools.createRandString({ length: appConfig.deviceIdLength }),
  mail: `${tools.createRandString({ length: 10 })}@${tools.createRandString({ length: 10 })}.com`,
  verified: true,
  accessLevel: dbConfig.AccessLevels.BASIC,
};

module.exports = data;
