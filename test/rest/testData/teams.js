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

const data = {};

data.teamToCreate = {
  teamName: tools.createRandString({ length: appConfig.teamNameMaxLength }),
  shortName: tools.createRandString({ length: appConfig.shortTeamMaxLength }),
};
data.teamToCreateAndInviteTo = {
  teamName: tools.createRandString({ length: appConfig.teamNameMaxLength }),
  shortName: tools.createRandString({ length: appConfig.shortTeamMaxLength }),
};
data.teamDoesNotExist = {
  teamName: tools.createRandString({ length: appConfig.teamNameMaxLength }),
  shortName: tools.createRandString({ length: appConfig.shortTeamMaxLength }),
};
data.teamToTryAndCreateTwice = {
  teamName: tools.createRandString({ length: appConfig.teamNameMaxLength }),
  shortName: tools.createRandString({ length: appConfig.shortTeamMaxLength }),
};
data.teamWithExistingTeamName = {
  teamName: data.teamToTryAndCreateTwice.teamName,
  shortName: tools.createRandString({ length: appConfig.shortTeamMaxLength }),
};
data.teamWithExistingShortName = {
  teamName: tools.createRandString({ length: appConfig.teamNameMaxLength }),
  shortName: data.teamToTryAndCreateTwice.shortName,
};
data.userToCreateTeamWith = {
  userName: tools.createRandString({ length: appConfig.userNameMaxLength }),
  password: tools.createRandString({ length: appConfig.passwordMaxLength }),
  registerDevice: tools.createRandString({ length: appConfig.deviceIdLength }),
  mail: `${tools.createRandString({ length: 10 })}@${tools.createRandString({ length: 10 })}.com`,
  verified: true,
};
data.userToCreateTeamAndSendInvitation = {
  userName: tools.createRandString({ length: appConfig.userNameMaxLength }),
  password: tools.createRandString({ length: appConfig.passwordMaxLength }),
  registerDevice: tools.createRandString({ length: appConfig.deviceIdLength }),
  mail: `${tools.createRandString({ length: 10 })}@${tools.createRandString({ length: 10 })}.com`,
  verified: true,
};
data.userToInvite = {
  userName: tools.createRandString({ length: appConfig.userNameMaxLength }),
  password: tools.createRandString({ length: appConfig.passwordMaxLength }),
  registerDevice: tools.createRandString({ length: appConfig.deviceIdLength }),
  mail: `${tools.createRandString({ length: 10 })}@${tools.createRandString({ length: 10 })}.com`,
  verified: true,
};
data.anotherUserToCreateTeam = {
  userName: tools.createRandString({ length: appConfig.userNameMaxLength }),
  password: tools.createRandString({ length: appConfig.passwordMaxLength }),
  registerDevice: tools.createRandString({ length: appConfig.deviceIdLength }),
  mail: `${tools.createRandString({ length: 10 })}@${tools.createRandString({ length: 10 })}.com`,
  verified: true,
};
data.userTryingToCreateExistingTeam = {
  userName: tools.createRandString({ length: appConfig.userNameMaxLength }),
  password: tools.createRandString({ length: appConfig.passwordMaxLength }),
  registerDevice: tools.createRandString({ length: appConfig.deviceIdLength }),
  mail: `${tools.createRandString({ length: 10 })}@${tools.createRandString({ length: 10 })}.com`,
  verified: true,
};

module.exports = data;
