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
const appConfig = require('../../../config/defaults/config').app;
const tools = require('./tools');

const data = {};

/**
 * Users
 */
data.userAdmin = {
  userName: tools.createRandString({ length: appConfig.userNameMaxLength }),
  password: tools.createRandString({ length: appConfig.passwordMaxLength }),
  registerDevice: tools.createRandString({ length: appConfig.deviceIdLength }),
  mail: '4039b151@opayq.com',
  accessLevel: dbConfig.AccessLevels.GOD,
  visibility: dbConfig.AccessLevels.PRO,
  verified: true,
};
data.userNormal = {
  userName: tools.createRandString({ length: appConfig.userNameMaxLength }),
  password: tools.createRandString({ length: appConfig.passwordMaxLength }),
  registerDevice: tools.createRandString({ length: appConfig.deviceIdLength }),
  mail: '54d7458b@opayq.com',
  verified: true,
  accessLevel: dbConfig.AccessLevels.BASIC,
};
data.userPrivileged = {
  userName: tools.createRandString({ length: appConfig.userNameMaxLength }),
  password: tools.createRandString({ length: appConfig.passwordMaxLength }),
  registerDevice: tools.createRandString({ length: appConfig.deviceIdLength }),
  mail: 'd17dcee5@opayq.com',
  verified: true,
  accessLevel: dbConfig.AccessLevels.PRIVILEGED,
};
data.userNew = {
  userName: tools.createRandString({ length: appConfig.userNameMaxLength }),
  password: tools.createRandString({ length: appConfig.passwordMaxLength }),
  registerDevice: tools.createRandString({ length: appConfig.deviceIdLength }),
  mail: '4526b00f@opayq.com',
  verified: true,
};
data.userUnverified = {
  userName: tools.createRandString({ length: appConfig.userNameMaxLength }),
  password: tools.createRandString({ length: appConfig.passwordMaxLength }),
  registerDevice: tools.createRandString({ length: appConfig.deviceIdLength }),
  mail: '4420ef2e@opayq.com',
  verified: false,
};
data.userBanned = {
  userName: tools.createRandString({ length: appConfig.userNameMaxLength }),
  password: tools.createRandString({ length: appConfig.passwordMaxLength }),
  registerDevice: tools.createRandString({ length: appConfig.deviceIdLength }),
  mail: 'ad48b733@opayq.com',
  verified: true,
  banned: true,
};

/**
 * Rooms
 */
data.roomNew = {
  roomName: tools.createRandString({ length: appConfig.roomNameMaxLength }),
};
data.roomPublic = {
  roomName: tools.createRandString({ length: appConfig.roomNameMaxLength }),
  visibility: dbConfig.AccessLevels.ANONYMOUS,
};
data.roomPassword = {
  roomName: tools.createRandString({ length: appConfig.roomNameMaxLength }),
  password: tools.createRandString({ length: appConfig.passwordMaxLength }),
};
data.roomInvisible = {
  roomName: tools.createRandString({ length: appConfig.roomNameMaxLength }),
  visibility: dbConfig.AccessLevels.GOD,
};
data.roomAccess = {
  roomName: tools.createRandString({ length: appConfig.roomNameMaxLength }),
  accessLevel: dbConfig.AccessLevels.GOD,
};
data.roomFollow = {
  roomName: tools.createRandString({ length: appConfig.roomNameMaxLength }),
};
data.roomNoExist = {
  roomName: tools.createRandString({ length: appConfig.roomNameMaxLength }),
};

/**
 * DocFile
 */
data.docFilePrivate = {
  title: tools.createRandString({ length: appConfig.docFileTitleMaxLength }),
  docFileId: tools.createRandString({ length: appConfig.docFileIdMaxLength }),
  text: [
    tools.createRandString({ length: appConfig.docFileMaxLength / 2 }),
    tools.createRandString({ length: appConfig.docFileMaxLength / 2 }),
  ],
  isPublic: false,
};
data.docFilePrivateChangedId = {
  title: data.docFilePrivate.title,
  docFileId: tools.createRandString({ length: appConfig.docFileIdMaxLength }),
  text: [
    tools.createRandString({ length: appConfig.docFileMaxLength / 2 }),
    tools.createRandString({ length: appConfig.docFileMaxLength / 2 }),
  ],
  isPublic: false,
};
data.docFilePrivateChangedTitle = {
  title: tools.createRandString({ length: appConfig.docFileTitleMaxLength }),
  docFileId: data.docFilePrivate.docFileId,
  text: [
    tools.createRandString({ length: appConfig.docFileMaxLength / 2 }),
    tools.createRandString({ length: appConfig.docFileMaxLength / 2 }),
  ],
  isPublic: false,
};
data.docFilePublic = {
  title: tools.createRandString({ length: appConfig.docFileTitleMaxLength }),
  docFileId: tools.createRandString({ length: appConfig.docFileIdMaxLength }),
  text: [
    tools.createRandString({ length: appConfig.docFileMaxLength / 2 }),
    tools.createRandString({ length: appConfig.docFileMaxLength / 2 }),
  ],
  isPublic: true,
};
data.docFileNewPublic = {
  title: tools.createRandString({ length: appConfig.docFileTitleMaxLength }),
  docFileId: tools.createRandString({ length: appConfig.docFileIdMaxLength }),
  text: [
    tools.createRandString({ length: appConfig.docFileMaxLength / 2 }),
    tools.createRandString({ length: appConfig.docFileMaxLength / 2 }),
  ],
  isPublic: true,
};
data.docFileNewPrivate = {
  title: tools.createRandString({ length: appConfig.docFileTitleMaxLength }),
  docFileId: tools.createRandString({ length: appConfig.docFileIdMaxLength }),
  text: [
    tools.createRandString({ length: appConfig.docFileMaxLength / 2 }),
    tools.createRandString({ length: appConfig.docFileMaxLength / 2 }),
  ],
  isPublic: true,
};

/**
 * Histories
 */
data.roomNewHistory = {
  roomName: tools.createRandString({ length: appConfig.roomNameMaxLength }),
};
data.roomHistoryUnfollowed = {
  roomName: tools.createRandString({ length: appConfig.roomNameMaxLength }),
};

// * @apiParam {string} [data.station.stationName] Location name of the station
// * @apiParam {boolean} [data.station.isActive] Is the station active?
// * @apiParam {boolean} [data.station.owner] Owner name of the station
// * @apiParam {Object} [data.attacker] Attacker object. data.station.owner will be ignored if data.attacker is set
// * @apiParam {string} data.attacker.name Name of the attacker that is trying to take over the station
// * @apiParam {string} data.attacker.time Amount of time till the attack succeeds.

/**
 * Lantern stations
 */
data.lanternStationNew = {
  stationId: 1,
  stationName: 's1',
};
data.lanternStationToModify = {
  stationId: 2,
  stationName: 's2',
};
data.lanternStationToModifyOwner = {
  owner: tools.createRandString({ length: appConfig.teamNameMaxLength }),
};
data.lanternStationToModifyAttacker = {
  attacker: {
    name: tools.createRandString({ length: appConfig.teamNameMaxLength }),
    time: 1,
  },
};
data.lanternStationDoesNotExist = {
  stationId: 3,
};

/**
 * Lantern teams
 */
data.lanternTeamNew = {
  teamName: tools.createRandString({ length: appConfig.teamNameMaxLength }),
  shortName: tools.createRandString({ length: appConfig.shortTeamMaxLength }),
};
data.lanternTeamModify = {
  teamName: tools.createRandString({ length: appConfig.teamNameMaxLength }),
  shortName: tools.createRandString({ length: appConfig.shortTeamMaxLength }),
  points: 22,
  isActive: false,
};
data.lanternTeamModifyPoints = {
  points: 75,
};
data.lanternTeamModifyActive = {
  isActive: true,
};
data.lanternTeamModifyResetPoints = {
  points: 30,
  resetPoints: true,
};
data.lanternTeamDoesNotExist = {
  teamName: 'a',
  shortTeam: 'b',
};

/**
 * Aliases
 */
data.aliasTooLong = {

};

/**
 * Broadcasts
 */
data.broadcast = {
  text: ['Broadcast', 'message'],
};
data.broadcastTooLong = {
  text: [
    tools.createRandString({ length: appConfig.broadcastMaxLength }),
    'word',
  ],
};

// * @apiParam {Boolean} [data.whisper] Is this a whisper (direct message) to another user?
// * @apiParam {Object} data.message Message
// * @apiParam {String} data.message.roomName Name of the room (or user name) to send the message to
// * @apiParam {String} [data.message.userName] Name of the sender. Default is your user name. You can instead set it to one of your user's aliases
// * @apiParam {String[]} data.message.text Content of the message

/**
 * Messages
 */
data.messageRoom = {
  roomName: tools.createRandString({ length: appConfig.roomNameMaxLength }),
};
data.messageNew = {
  roomName: data.messageRoom.roomName,
  text: [
    tools.createRandString({ length: appConfig.messageMaxLength / 2 }),
    tools.createRandString({ length: appConfig.messageMaxLength / 2 }),
  ],
};
data.messageRoomNotExist = {
  roomName: 'rne',
  text: [
    tools.createRandString({ length: appConfig.messageMaxLength / 2 }),
    tools.createRandString({ length: appConfig.messageMaxLength / 2 }),
  ],
};
data.messageTooLong = {
  roomName: data.messageRoom.roomName,
  text: [
    tools.createRandString({ length: appConfig.messageMaxLength / 2 }),
    tools.createRandString({ length: appConfig.messageMaxLength / 2 }),
    'word',
  ],
};

/**
 * Positions
 */
data.positionParameters = {
  coordinates: {
    longitude: 10,
    latitude: 10,
  },
};
data.positionUser = {
  coordinates: {
    longitude: 10.1,
    latitude: 11.1,
  },
};

/**
 * LanternRounds
 */
data.lanternRoundNew = {
  startTime: '2017-10-10T12:42:06.262Z',
  endTime: '2017-10-28T23:42:06.262Z',
  roundId: 1,
};
data.lanternRoundModify = {
  roundId: 2,
  startTime: '2017-10-15T12:42:06.262Z',
  endTime: '2017-10-25T23:42:06.262Z',
};
data.lanternRoundModifyStartTime = {
  startTime: '2017-10-15T12:42:06.262Z',
};

data.lanternRoundModifyEndTime = {
  endTime: '2017-10-15T12:42:06.262Z',
};
data.lanternRoundDoesNotExist = {
  roundId: 3,
  startTime: '2017-10-15T12:42:06.262Z',
  endTime: '2017-10-25T23:42:06.262Z',
};

data.incorrectJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWV9.TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ';

data.fakeMail = 'fakemail@thethirdgift.com';

module.exports = data;

