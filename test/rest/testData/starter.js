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

const { appConfig, dbConfig } = require('../../../config/defaults/config');
const tools = require('../helper/tools');

const data = {};

data.adminUserOne = {
  username: 'adminOne',
  password: tools.createRandString({ length: appConfig.passwordMaxLength }),
  registerDevice: tools.createRandString({ length: appConfig.deviceIdLength }),
  accessLevel: dbConfig.AccessLevels.ADMIN,
  visibility: dbConfig.AccessLevels.ADMIN,
  isVerified: true,
};

data.adminUserTwo = {
  username: 'adminTwo',
  password: tools.createRandString({ length: appConfig.passwordMaxLength }),
  registerDevice: tools.createRandString({ length: appConfig.deviceIdLength }),
  accessLevel: dbConfig.AccessLevels.ADMIN,
  visibility: dbConfig.AccessLevels.STANDARD,
  isVerified: true,
};

data.basicUserOne = {
  username: 'basicOne',
  password: tools.createRandString({ length: appConfig.passwordMaxLength }),
  registerDevice: tools.createRandString({ length: appConfig.deviceIdLength }),
  isVerified: true,
  accessLevel: dbConfig.AccessLevels.STANDARD,
};

data.basicUserTwo = {
  username: 'basicTwo',
  password: tools.createRandString({ length: appConfig.passwordMaxLength }),
  registerDevice: tools.createRandString({ length: appConfig.deviceIdLength }),
  isVerified: true,
  accessLevel: dbConfig.AccessLevels.STANDARD,
};

data.moderatorUserOne = {
  username: 'moderatorOne',
  password: tools.createRandString({ length: appConfig.passwordMaxLength }),
  registerDevice: tools.createRandString({ length: appConfig.deviceIdLength }),
  isVerified: true,
  accessLevel: dbConfig.AccessLevels.MODERATOR,
};
data.moderatorUserTwo = {
  username: 'moderatorTwo',
  password: tools.createRandString({ length: appConfig.passwordMaxLength }),
  registerDevice: tools.createRandString({ length: appConfig.deviceIdLength }),
  isVerified: true,
  accessLevel: dbConfig.AccessLevels.MODERATOR,
};

data.unverifiedUser = {
  username: 'unverified',
  password: tools.createRandString({ length: appConfig.passwordMaxLength }),
  registerDevice: tools.createRandString({ length: appConfig.deviceIdLength }),
  isVerified: false,
};

data.bannedUser = {
  username: 'banned',
  password: tools.createRandString({ length: appConfig.passwordMaxLength }),
  registerDevice: tools.createRandString({ length: appConfig.deviceIdLength }),
  isVerified: true,
  isBanned: true,
};

data.nonExistingUser = {
  username: 'nonExisting',
  password: tools.createRandString({ length: appConfig.passwordMaxLength }),
  registerDevice: tools.createRandString({ length: appConfig.deviceIdLength }),
  isVerified: true,
  isBanned: true,
};

module.exports = data;
