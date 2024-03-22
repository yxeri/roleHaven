'use strict';

const {
  appConfig,
  dbConfig,
} = require('../../../config/defaults/config');
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

export default data;
