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

const dbConfig = require('../../../config/defaults/config').databasePopulation;

const data = {};

/**
 * Users
 */
data.adminUser = {
  userName: 'testadmin',
  password: 'testadmin',
  registerDevice: 'test',
  mail: '4039b151@opayq.com',
  accessLevel: dbConfig.accessLevels.god,
  verified: true,
};
data.normalUser = {
  userName: 'testnormal',
  password: 'testnormal',
  registerDevice: 'test',
  mail: '54d7458b@opayq.com',
  verified: true,
};
data.newUser = {
  userName: 'testnew',
  password: 'testnew',
  registerDevice: 'test',
  mail: '4526b00f@opayq.com',
  verified: true,
};
data.unverifiedUser = {
  userName: 'testunverified',
  password: 'testunverified',
  registerDevice: 'test',
  mail: '4420ef2e@opayq.com',
  verified: false,
};
data.bannedUser = {
  userName: 'testbanned',
  password: 'testbanned',
  registerDevice: 'test',
  mail: 'ad48b733@opayq.com',
  verified: true,
  banned: true,
};

/**
 * Rooms
 */
data.newRoom = {
  roomName: 'testnew',
};
data.passwordRoom = {
  roomName: 'testpassword',
  password: 'testpassword',
};
data.invisibleRoom = {
  roomName: 'testinvisible',
  visibility: dbConfig.accessLevels.god,
};
data.accessRoom = {
  roomName: 'testaccess',
  accessLevel: 13,
};

data.incorrectJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWV9.TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ';

data.fakeMail = 'fakemail@thethirdgift.com';

module.exports = data;

