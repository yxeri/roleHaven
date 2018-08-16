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
    teamName: tools.createRandString({ length: appConfig.teamNameMaxLength }),
    shortName: tools.createRandString({ length: appConfig.shortTeamMaxLength }),
  },
  second: {
    teamName: tools.createRandString({ length: appConfig.teamNameMaxLength }),
    shortName: tools.createRandString({ length: appConfig.shortTeamMaxLength }),
  },
  missing: {
    teamName: tools.createRandString({ length: appConfig.teamNameMaxLength }),
    shortName: tools.createRandString({ length: appConfig.shortTeamMaxLength }),
  },
};

data.update = {
  toUpdate: {
    teamName: tools.createRandString({ length: appConfig.teamNameMaxLength }),
    shortName: tools.createRandString({ length: appConfig.shortTeamMaxLength }),
  },
  updateWith: {
    teamName: tools.createRandString({ length: appConfig.teamNameMaxLength }),
    shortName: tools.createRandString({ length: appConfig.shortTeamMaxLength }),
  },
};

data.remove = {
  toRemove: {
    teamName: tools.createRandString({ length: appConfig.teamNameMaxLength }),
    shortName: tools.createRandString({ length: appConfig.shortTeamMaxLength }),
  },
  secondToRemove: {
    teamName: tools.createRandString({ length: appConfig.teamNameMaxLength }),
    shortName: tools.createRandString({ length: appConfig.shortTeamMaxLength }),
  },
};

module.exports = data;
