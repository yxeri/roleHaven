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

data.lanternStationToCreate = {
  stationId: 1,
  stationName: `${tools.createRandString({ length: 5 })}`,
};
data.lanternStationToCreateAndModify = {
  stationId: 2,
  stationName: `${tools.createRandString({ length: 5 })}`,
};
data.lanternStationWithNewOwner = {
  owner: tools.createRandString({ length: appConfig.teamNameMaxLength }),
};
data.lanternStationUnderAttack = {
  isUnderAttack: true,
};
data.lanternStationThatDoesNotExist = {
  stationId: 3,
  stationName: `${tools.createRandString({ length: 5 })}`,
};
data.lanternStationToGet = {
  stationId: 5,
  stationName: `${tools.createRandString({ length: 5 })}`,
  owner: tools.createRandString({ length: appConfig.teamNameMaxLength }),
};

module.exports = data;
