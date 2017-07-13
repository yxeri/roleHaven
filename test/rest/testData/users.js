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
const dbConfig = require('../../../config/defaults/config').databasePopulation;
const tools = require('../helper/tools');

const data = {};

data.fakeMail = 'fakemail@thethirdgift.com';
data.validMail = '4526b00f@opayq.com';

data.newUserToCreate = {
  userName: tools.createRandString({ length: appConfig.userNameMaxLength }),
  password: tools.createRandString({ length: appConfig.passwordMaxLength }),
  registerDevice: tools.createRandString({ length: appConfig.deviceIdLength }),
  mail: `${tools.createRandString({ length: 10 })}@${tools.createRandString({ length: 10 })}.com`,
  verified: true,
};
data.newAdminUserToCreate = {
  userName: tools.createRandString({ length: appConfig.userNameMaxLength }),
  password: tools.createRandString({ length: appConfig.passwordMaxLength }),
  registerDevice: tools.createRandString({ length: appConfig.deviceIdLength }),
  mail: `${tools.createRandString({ length: 10 })}@${tools.createRandString({ length: 10 })}.com`,
  accessLevel: dbConfig.AccessLevels.ADMIN,
  visibility: dbConfig.AccessLevels.PRO,
  verified: true,
};

data.newUserToCreateWithValidMail = {
  userName: tools.createRandString({ length: appConfig.userNameMaxLength }),
  password: tools.createRandString({ length: appConfig.passwordMaxLength }),
  registerDevice: tools.createRandString({ length: appConfig.deviceIdLength }),
  mail: data.validMail,
};

module.exports = data;
