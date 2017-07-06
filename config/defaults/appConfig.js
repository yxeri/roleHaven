/*
 Copyright 2015 Aleksandar Jankovic

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

const path = require('path');
const textTools = require('../../utils/textTools');

let config = {};

try {
  config = require(path.normalize(`${__dirname}/../../../../config/appConfig`)).config; // eslint-disable-line import/no-unresolved, global-require, import/no-dynamic-require
} catch (err) {
  console.log('Did not find modified appConfig. Using defaults');
}

const forceFullscreenEnv = textTools.convertToBoolean(process.env.FORCEFULLSCREEN);
const gpsTrackingEnv = textTools.convertToBoolean(process.env.GPSTRACKING);
const teamVerifyEnv = textTools.convertToBoolean(process.env.TEAMVERIFY);
const disallowRegisterEnv = textTools.convertToBoolean(process.env.DISALLOWUSERREGISTER);

/**
 * Name of the system. Human-readable name that will be sent to clients, such as in the subject field of mail or page title
 */
config.title = process.env.TITLE || config.title || 'roleHaven';

config.host = process.env.VIRTUAL_HOST || 'localhost';

/**
 * Default language for clients connecting.
 * Default language is English.
 * Don't set this var if you want English to be the default language.
 * Valid options: se
 */
config.defaultLanguage = process.env.DEFAULTLANGUAGE || config.defaultLanguage || '';

/*
 * Base directory for public and private files
 */
config.publicBase = path.normalize(`${__dirname}/../../../../public`);
config.privateBase = path.normalize(`${__dirname}/../../../../private`);

/*
 * Sub directories for public and private files
 * Will be appended to the base directories
 */
config.viewsPath = 'views';
config.stylesPath = 'styles';
config.scriptsPath = 'scripts';
config.requiredPath = 'required';
config.faviconPath = 'images/favicon.ico';

/**
 * Server mode. Options:
 * prod, dev, test
 */
config.mode = process.env.MODE || config.mode || 'prod';

// Morgan log level
config.logLevel = process.env.LOGLEVEL || config.logLevel || 'tiny';

// Database host name
config.dbHost = process.env.DBHOST || config.dbHost || 'localhost';

// Database port
config.dbPort = process.env.DBPORT || config.dbPort || 27017;

// Database database name
config.dbName = `${config.mode}-${process.env.DBNAME}` || `${config.mode}-${config.dbName}` || `${config.mode}-roleHaven`;

// Node server port number
config.port = process.env.PORT || config.port || 8888;

/*
 * Retrieve socket.io from local server or cdn
 * Note! Android 2.2 fails when using cdn
 */
config.socketPath = (process.env.SOCKETPATH === 'cdn' || config.socketPath === 'cdn') ?
  'https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.0.1/socket.io.slim.js' : (process.env.SOCKETPATH || config.socketPath || '/scripts/socket.io.js');

// TODO Routes should be empty by defaults. Move all routes to app-specific instances
/**
 * Array of route paths
 * Should contain objects of site and file paths
 * sitePath : REQUESTPATH
 * filePath : ROUTEFILE
 *
 * Example:
 * {
 *   sitePath : '*',
 *   filePath : './routes/index.js'
 * }
 * @type {{sitePath:string, filePath:string}[]}
 */
config.routes = config.routes || [
  { sitePath: '/', filePath: `${__dirname}/../../routes/index.js` },
  { sitePath: '/api/authenticate', filePath: `${__dirname}/../../routes/rest/authenticate.js` },
  { sitePath: '/api/rooms', filePath: `${__dirname}/../../routes/rest/rooms.js` },
  { sitePath: '/api/histories', filePath: `${__dirname}/../../routes/rest/histories.js` },
  { sitePath: '/api/positions', filePath: `${__dirname}/../../routes/rest/positions.js` },
  { sitePath: '/api/docFiles', filePath: `${__dirname}/../../routes/rest/docFiles.js` },
  { sitePath: '/api/messages', filePath: `${__dirname}/../../routes/rest/messages.js` },
  { sitePath: '/api/broadcasts', filePath: `${__dirname}/../../routes/rest/broadcasts.js` },
  { sitePath: '/api/users', filePath: `${__dirname}/../../routes/rest/users.js` },
  { sitePath: '/api/aliases', filePath: `${__dirname}/../../routes/rest/aliases.js` },
  { sitePath: '/api/transactions', filePath: `${__dirname}/../../routes/rest/transactions.js` },
  { sitePath: '/api/calibrationMissions', filePath: `${__dirname}/../../routes/rest/calibrationMissions.js` },
  { sitePath: '/api/lanternRounds', filePath: `${__dirname}/../../routes/rest/lanternRounds.js` },
  { sitePath: '/api/lanternStations', filePath: `${__dirname}/../../routes/rest/lanternStations.js` },
  { sitePath: '*', filePath: `${__dirname}/../../routes/error.js` },
];

config.gMapsKey = process.env.GMAPSKEY || config.gMapsKey;
config.mapLayersPath = process.env.MAPLAYERSPATH || config.mapLayersPath;

config.country = process.env.COUNTRY || config.country || 'Sweden';
config.centerLat = textTools.convertToFloat(process.env.CENTERLAT || config.centerLat || 59.7526684);
config.centerLong = textTools.convertToFloat(process.env.CENTERLONG || config.centerLong || 15.1941731);
config.cornerOneLat = textTools.convertToFloat(process.env.CORNERONELAT || config.cornerOneLat || 59.7580656);
config.cornerOneLong = textTools.convertToFloat(process.env.CORNERONELONG || config.cornerOneLong || 15.1851052);
config.cornerTwoLat = textTools.convertToFloat(process.env.CORNERTWOLAT || config.cornerTwoLat || 59.7467013);
config.cornerTwoLong = textTools.convertToFloat(process.env.CORNERTWOLONG || config.cornerTwoLong || 15.2048731);
config.defaultZoomLevel = textTools.convertToInt(process.env.DEFAULTZOOMLEVEL || config.defaultZoomLevel || 15);

// Amount of messages retrieved with the history command
config.historyLines = process.env.MAXHISTORY || config.historyLines || 80;

/**
 * Max amount of history that will be retrieved
 * @type {number}
 */
config.maxHistoryLines = process.env.MAXHISTORYLINES || config.maxHistoryLines || 200;

// Amount of messages sent at a time to client
config.chunkLength = process.env.MAXCHUNK || config.chunkLength || 10;

// Does the team have to be verified before being created?
config.teamVerify = teamVerifyEnv !== undefined ? teamVerifyEnv : config.teamVerify || false;

/**
 * Should the frontend force full screen on click?
 */
config.forceFullscreen = forceFullscreenEnv !== undefined ? forceFullscreenEnv : config.forceFullscreen || true;

/**
 * Should the frontend ask for user tracking?
 */
config.gpsTracking = gpsTrackingEnv !== undefined ? gpsTrackingEnv : config.gpsTracking || true;

/**
 * Should users be able to register? Does not block register through rest api
 */
config.disallowUserRegister = disallowRegisterEnv !== undefined ? disallowRegisterEnv : config.disallowUserRegister || false;

/**
 * Appended to the user name to create a room which is used to store private
 * messages sent to a user (e.g user1-whisper)
 */
config.whisperAppend = '-whisper';

/**
 * Appended to device ID to create a room which is used to store messages
 * sent to a device (e.g fe3Liw19Xz-device)
 */
config.deviceAppend = '-device';

/**
 * Appended to the team name to create a room which is used to chat
 * within the team (e.g skynet-team)
 */
config.teamAppend = '-team';

config.scheduleAppend = '-schedule';

/**
 * The number of years that will be subtracted/added to the current year
 */
config.yearModification = process.env.YEARMODIFICATION || config.yearModification || 0;

/**
 * Amount of milliseconds between each increment/decrement of signal value (BBR game feature)
 * @type {number}
 */
config.signalResetTimeout = process.env.SIGNALRESETINTERVAL || config.signalResetTimeout || 0;

/**
 * Message that will be sent to client and can be printed
 */
config.welcomeMessage = process.env.WELCOMEMESSAGE || config.welcomeMessage;

/**
 * Secret key used with JSON Web Token
 */
config.jsonKey = process.env.JSONKEY || config.mode === 'test' ? 'TESTKEY' : undefined;

/**
 * Secret key used with BBR events
 */
config.hackingApiKey = process.env.HACKINGAPIKEY;

/**
 * URL to API. Used for BBR events
 */
config.hackingApiHost = process.env.HACKINGAPIHOST;

/**
 * Amount of hacking tries before the hack fails
 */
config.hackingTriesAmount = process.env.HACKINGTRIESAMOUNT || config.hackingTriesAmount || 3;

/**
 * Amount of credits transferred when a game code is used
 */
config.gameCodeAmount = process.env.GAMECODEAMOUNT || config.gameCodeAmount || 5;

/**
 * Amount of credits transferred when a game code is used
 */
config.signalBlockRadius = process.env.SIGNALBLOCKRADIUS || config.signalBlockRadius || 60;

/**
 * Amount of credits transferred when a game code is used
 */
config.signalBlockTime = process.env.SIGNALBLOCKTIME || config.signalBlockTime || 120000;

/**
 * Max user accuracy that will be used to calculate if the user is within affected area
 */
config.signalBlockBufferArea = process.env.SIGNALBLOCKBUFFERAREA || config.signalBlockBufferArea || 40;

/**
 * Maximum amount of characters in a document
 */
config.docFileMaxLength = process.env.DOCFILEMAXLENGTH || config.docFileMaxLength || 6000;

config.docFileTitleMaxLength = process.env.DOCFILETITLEMAXLENGTH || config.docFileTitleMaxLength || 100;

config.docFileIdMaxLength = process.env.DOCFILEIDMAXLENGTH || config.docFileIdMaxLength || 20;

config.userNameMaxLength = process.env.USERNAMEMAXLENGTH || config.userNameMaxLength || 20;

config.teamNameMaxLength = process.env.TEAMNAMEMAXLENGTH || config.teamNameMaxLength || 20;

config.shortTeamMaxLength = process.env.SHORTEAMMAXLENGTH || config.shortTeamMaxLength || 5;

config.passwordMaxLength = process.env.PASSWORDMAXLENGTH || config.passwordMaxLength || 100;

config.deviceIdLength = process.env.DEVICEIDLENGTH || config.deviceIdLength || 16;

config.roomNameMaxLength = process.env.ROOMNAMEMAXLENGTH || config.roomNameMaxLength || 20;

config.maxUserWarnings = process.env.MAXUSERWARNINGS || config.maxUserWarnings || 2;

config.minimumPositionAccuracy = process.env.MINIMUMPOSITIONACCURACY || config.minimumPositionAccuracy || 70;

config.maxPositionAge = process.env.MAXPOSITIONAGE || config.maxPositionAge || 2;

/**
 * Secret key used for Mailgun
 */
config.mailKey = process.env.MAILKEY || config.mode === 'test' ? 'TESTKEY' : undefined;

/**
 * Public key used for Mailgun
 */
config.publicMailKey = process.env.PUBLICMAILKEY || config.mode === 'test' ? 'TESTKEY' : undefined;

if (config.mailKey && config.publicMailKey) {
  /**
   * Mail domain used by Mailgun
   */
  config.mailDomain = process.env.MAILDOMAIN || config.mailDomain || config.mode === 'test' ? 'localhost' : undefined;

  /**
   * Mail sender name. Will append mailDomain to name
   */
  config.mailSender = `${process.env.MAILSENDER || config.mailSender || 'roleHaven'}@${config.mailDomain}`;
}

module.exports = config;
