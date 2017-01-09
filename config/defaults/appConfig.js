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

let config = {};

try {
  config = require(path.normalize(`${__dirname}/../../../../config/appConfig`)).config; // eslint-disable-line import/no-unresolved, global-require, import/no-dynamic-require
} catch (err) {
  console.log('Did not find modified appConfig. Using defaults');
}

// TODO Move all converters to a converter file

/**
 * Converts string to boolean
 * @param {string} envar - Value
 * @returns {boolean} Converted boolean
 */
function convertToBoolean(envar) {
  if (envar === 'true') {
    return true;
  } else if (envar === 'false') {
    return false;
  }

  return undefined;
}

/**
 * Convert string to float
 * @param {string} float - Value to be converted
 * @returns {number|null} Converted number
 */
function convertToFloat(float) {
  const parsedFloat = parseFloat(float);

  return isNaN(parsedFloat) ? 0 : parsedFloat;
}

/**
 * Convert string to int
 * @param {string} int - Value to be converted
 * @returns {number} Converted number
 */
function convertToInt(int) {
  const parsedInt = parseInt(int, 10);

  return isNaN(parsedInt) ? 0 : parsedInt;
}

/*
 * All app specific configuration
 */

const userVerifyEnv = convertToBoolean(process.env.REQUIREVERIFY);
const revealFailedHackEnv = convertToBoolean(process.env.REVEALFAILEDHACK);
const forceFullscreenEnv = convertToBoolean(process.env.FORCEFULLSCREEN);
const gpsTrackingEnv = convertToBoolean(process.env.GPSTRACKING);
const teamVerifyEnv = convertToBoolean(process.env.REQUIRETEAMVERIFY);
const disableCommandsEnv = convertToBoolean(process.env.DISABLECOMMANDS);
const hideRoomNamesEnv = convertToBoolean(process.env.HIDEROOMNAMES);
const hideTimeStampEnv = convertToBoolean(process.env.HIDETIMESTAMP);
const staticInputStartEnv = convertToBoolean(process.env.STATICINPUTSTART);

// Title of the site
config.title = process.env.TITLE || config.title || 'roleHaven';

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

// Morgan log level
config.logLevel = process.env.LOGLEVEL || config.logLevel || 'tiny';

// Database host name
config.dbHost = process.env.DBHOST || config.dbHost || 'localhost';

// Database port
config.dbPort = process.env.DBPORT || config.dbPort || 27017;

// Database database name
config.dbName = process.env.DBNAME || config.dbName || 'roleHaven';

// Node server port number
config.port = process.env.PORT || config.port || 8888;

/*
 * Retrieve socket.io from local server or cdn
 * Note! Android 2.2 fails when using cdn
 */
config.socketPath = (process.env.SOCKETPATH === 'cdn' || config.socketPath === 'cdn') ?
  'https://cdn.socket.io/socket.io-1.4.5.js' : (process.env.SOCKETPATH || config.socketPath || '/scripts/socket.io-1.4.5.js');

/**
 * Server mode. Options:
 * prod, dev
 */
config.mode = process.env.MODE || config.mode || 'prod';

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
  { sitePath: '/api/archives', filePath: `${__dirname}/../../routes/rest/archives.js` },
  { sitePath: '/api/messages', filePath: `${__dirname}/../../routes/rest/messages.js` },
  { sitePath: '/api/users', filePath: `${__dirname}/../../routes/rest/users.js` },
  { sitePath: '*', filePath: `${__dirname}/../../routes/error.js` },
];

//
// Instance specific
//

config.radioChannels = config.radioChannels || {};

config.gMapsKey = process.env.GMAPSKEY || config.gMapsKey;
config.mapLayersPath = process.env.MAPLAYERSPATH || config.mapLayersPath || 'https://www.google.com/maps/d/kml?hl=en_US&app=mp&mid=1j97gNHqYj-6M10RbW9CGAVNxUV4&forcekml=1&cid=mp&cv=jm93Tu_hxIY.en_US.';

config.country = process.env.COUNTRY || config.country || 'Sweden';
config.centerLat = convertToFloat(process.env.CENTERLAT || config.centerLat || 59.3534372);
config.centerLong = convertToFloat(process.env.CENTERLONG || config.centerLong || 18.0044666);
config.cornerOneLat = convertToFloat(process.env.CORNERONELAT || config.cornerOneLat || 67.3926316);
config.cornerOneLong = convertToFloat(process.env.CORNERONELONG || config.cornerOneLong || 24.0936037);
config.cornerTwoLat = convertToFloat(process.env.CORNERTWOLAT || config.cornerTwoLat || 55.699443);
config.cornerTwoLong = convertToFloat(process.env.CORNERTWOLONG || config.cornerTwoLong || 10.3777913);
config.defaultZoomLevel = convertToInt(process.env.DEFAULTZOOMLEVEL || config.defaultZoomLevel || 15, 10);

// Amount of messages retrieved with the history command
config.historyLines = process.env.MAXHISTORY || config.historyLines || 80;

/**
 * Max amount of history that will be retrieved
 * @type {number}
 */
config.maxHistoryLines = process.env.MAXHISTORYLINES || config.maxHistoryLines || 200;

// Amount of messages sent at a time to client
config.chunkLength = process.env.MAXCHUNK || config.chunkLength || 10;

// Does the user have to be verified before being able to login?
config.userVerify = userVerifyEnv !== undefined ? userVerifyEnv : config.userVerify;

if (config.userVerify === undefined) {
  config.userVerify = false;
}

// Does the team have to be verified before being created?
config.teamVerify = teamVerifyEnv !== undefined ? teamVerifyEnv : config.teamVerify;

if (config.teamVerify === undefined) {
  config.teamVerify = false;
}

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

config.modes = config.modes || {
  command: 'cmd',
  chat: 'chat',
};

/**
 * Default mode for command input.
 * Valid options are: cmd chat
 */
config.defaultMode = process.env.DEFAULTMODE || config.defaultMode || config.modes.command;

/**
 * Should the user that initiated a hack and failed it be revealed to other users?
 */
config.revealFailedHack = revealFailedHackEnv !== undefined ? revealFailedHackEnv : config.revealFailedHack;

if (config.revealFailedHack === undefined) {
  config.revealFailedHack = true;
}

/**
 * The number of years that will be subtracted/added to the current year
 */
config.yearModification = config.yearModification || 0;

/**
 * Should the frontend force full screen on click?
 */
config.forceFullscreen = forceFullscreenEnv !== undefined ? forceFullscreenEnv : config.forceFullscreen;

if (config.forceFullscreen === undefined) {
  config.forceFullscreen = true;
}

/**
 * Should the frontend ask for user tracking?
 */
config.gpsTracking = gpsTrackingEnv !== undefined ? gpsTrackingEnv : config.gpsTracking;

if (config.gpsTracking === undefined) {
  config.gpsTracking = true;
}

/**
 * Should the user be able to use commands in the frontend?
 */
config.disableCommands = disableCommandsEnv !== undefined ? disableCommandsEnv : config.disableCommands;

if (config.disableCommands === undefined) {
  config.disableCommands = false;
}

/**
 * Should room names be hidden in print in the frontend?
 */
config.hideRoomNames = hideRoomNamesEnv !== undefined ? hideRoomNamesEnv : config.hideRoomNames;

if (config.hideRoomNames === undefined) {
  config.hideRoomNames = false;
}

/**
 * Should time stamps be hidden in print in the frontend?
 */
config.hideTimeStamp = hideTimeStampEnv !== undefined ? hideTimeStampEnv : config.hideTimeStamp;

if (config.hideTimeStamp === undefined) {
  config.hideTimeStamp = false;
}

/**
 * Amount of weather reports that will be sent to the client
 */
config.maxWeatherReports = process.env.MAXWEATHERREPORTS || config.maxWeatherReports || 8;

/**
 * Should the input start be static? Normal behaviour is to set input star to the room name that the user is in
 */
config.staticInputStart = staticInputStartEnv !== undefined ? staticInputStartEnv : config.staticInputStart;

/**
 * The string that will be shown in the beginning of the command input
 */
config.defaultInputStart = process.env.DEFAULTINPUTSTART || config.defaultInputStart || 'RAZCMD';

/**
 * Amount of milliseconds between each increment/decrement of signal value (BBR game feature)
 * @type {number}
 */
config.signalResetInterval = process.env.SIGNALRESETINTERVAL || config.signalResetInterval || 0;

/**
 * Message that will be sent to client and can be printed
 */
config.welcomeMessage = process.env.WELCOMEMESSAGE || config.welcomeMessage;

/**
 * Secret key used with JSON Web Token
 */
config.jsonKey = process.env.JSONKEY;

module.exports = config;
