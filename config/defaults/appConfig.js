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

const path = require('path');
const textTools = require('../../utils/textTools');
const { version } = require('../../package');

let clientConfig = {};
let config = {};

try {
  clientConfig = require('../../../private/config/config'); // eslint-disable-line
} catch (err) {
  console.log('Did not find client config. Using defaults.');
}

try {
  config = Object.assign({}, require('../appConfig')); // eslint-disable-line
} catch (err) {
  console.log('Did not find modified appConfig. Using defaults.');
}

const forceFullscreenEnv = textTools.convertToBoolean(process.env.FORCEFULLSCREEN);
const gpsTrackingEnv = textTools.convertToBoolean(process.env.GPSTRACKING);
const teamVerifyEnv = textTools.convertToBoolean(process.env.TEAMVERIFY);
const disallowRegisterEnv = textTools.convertToBoolean(process.env.DISALLOWUSERREGISTER);
const verboseErrorEnv = textTools.convertToBoolean(process.env.VERBOSEERROR);
const allowMessageImageEnv = textTools.convertToBoolean(process.env.ALLOWMESSAGEIMAGE);
const bypassExternalConnectionEnv = textTools.convertToBoolean(process.env.BYPASSEXTERNALCONNECTIONS);
const userVerifyEnv = textTools.convertToBoolean(process.env.USERVERIFY);
const showDevInfoEnv = textTools.convertToBoolean(process.env.SHOWDEVINFO);
const disablePositionImportEnv = textTools.convertToBoolean(process.env.DISABLEPOSITIONIMPORT);

/**
 * **********
 * * System *
 * **********
 */

/**
 * Host address
 * @type {string}
 */
config.host = process.env.VIRTUAL_HOST || '127.0.0.1';

/**
 * Base directory for public files.
 * @type {string}
 */
config.publicBase = path.normalize(`${__dirname}/../../../../public`);

/**
 * Base directory for private files.
 * @type {string}
 */
config.privateBase = path.normalize(`${__dirname}/../../../../private`);

/**
 * Default index name that will be served to public view.
 * @type {string}
 */
config.indexName = process.env.INDEXNAME || config.indexName || 'default';

/**
 * Default main Javascript file that will be served to public view.
 * @type {string}
 */
config.mainJsName = process.env.MAINJSNAME || config.mainJsName || 'default';

/**
 * Default main Javascript file that will be served to public view.
 * @type {string}
 */
config.mainCssName = process.env.MAINCSSNAME || config.mainCssName || 'default';

/**
 * Admin interface index name that will be served to public view.
 * @type {string}
 */
config.adminIndexName = process.env.ADMININDEXNAME || config.adminIndexName || 'admin';

/**
 * Admin interface Javascript file that will be served to public view.
 * @type {string}
 */
config.adminJsName = process.env.ADMINJSNAME || config.adminJsName || 'admin';

/**
 * Admin interface Javascript file that will be served to public view.
 * @type {string}
 */
config.adminCssName = process.env.ADMINCSSNAME || config.adminCssName || 'admin';

// TODO Routes should be empty by defaults. Move all routes to app-specific instances
/**
 * Array of route paths.
 * Should contain objects of site and file paths.
 * sitePath : REQUESTPATH.
 * filePath : ROUTEFILE.
 *
 * Example:
 * {
 *   sitePath : '*',
 *   filePath : './routes/index.js'
 * }
 * @type {{sitePath:string, filePath:string}[]}
 */
config.routes = config.ignoreDefaultRoutes
  ? config.routes || []
  : [{ sitePath: '/', filePath: '/routes/index.js' }].concat([
    { sitePath: '/api/authenticate', filePath: '/routes/rest/authenticate.js' },
    { sitePath: '/api/gameCodes', filePath: '/routes/rest/gameCodes.js' },
    { sitePath: '/api/rooms', filePath: '/routes/rest/rooms.js' },
    { sitePath: '/api/positions', filePath: '/routes/rest/positions.js' },
    { sitePath: '/api/docFiles', filePath: '/routes/rest/docFiles.js' },
    { sitePath: '/api/users', filePath: '/routes/rest/users.js' },
    { sitePath: '/api/aliases', filePath: '/routes/rest/aliases.js' },
    { sitePath: '/api/wallets', filePath: '/routes/rest/wallets' },
    { sitePath: '/api/teams', filePath: '/routes/rest/teams' },
    { sitePath: '/api/devices', filePath: '/routes/rest/devices' },
    { sitePath: '/api/simpleMsgs', filePath: '/routes/rest/simpleMsgs' },
    { sitePath: '/api/forums', filePath: '/routes/rest/forums' },
    { sitePath: '/api/forumThreads', filePath: '/routes/rest/forumThreads' },
    { sitePath: '/api/forumPosts', filePath: '/routes/rest/forumPosts' },
    { sitePath: '/api/messages', filePath: '/routes/rest/messages' },
    { sitePath: '/api/transactions', filePath: '/routes/rest/transactions' },
  ]).concat(config.routes || []).concat([{ sitePath: '*', filePath: '/routes/error.js' }]).map((route) => {
    return {
      sitePath: route.sitePath,
      filePath: `${__dirname}/../..${route.filePath}`,
    };
  });

/* eslint-disable */

config.handlers = config.ignoreDefaultHandlers
  ? config.handlers || []
  : [
  '/routes/socketHandlers/aliases',
  '/routes/socketHandlers/authenticate',
  '/routes/socketHandlers/devices',
  '/routes/socketHandlers/docFiles',
  '/routes/socketHandlers/forumPost',
  '/routes/socketHandlers/forums',
  '/routes/socketHandlers/forumThreads',
  '/routes/socketHandlers/gameCodes',
  '/routes/socketHandlers/messages',
  '/routes/socketHandlers/positions',
  '/routes/socketHandlers/rooms',
  '/routes/socketHandlers/simpleMsgs',
  '/routes/socketHandlers/teams',
  '/routes/socketHandlers/transactions',
  '/routes/socketHandlers/users',
  '/routes/socketHandlers/wallets',
].concat(config.handlers || []).map(path => `${__dirname}/../..${path}`);

/* eslint-enable */

/**
 * Path to directory with views.
 * Will be appended to the base directories.
 * @type {string}
 */
config.viewsPath = 'views';

/**
 * Path to directory with stylesheets.
 * Will be appended to the base directories.
 * @type {string}
 */
config.stylesPath = 'styles';

/**
 * Path to directory with scripts. Will be minified.
 * Will be appended to the base directories.
 * @type {string}
 */
config.scriptsPath = 'scripts';

/**
 * Path to directory with scripts that should not be minified.
 * Will be appended to the base directories.
 * @type {string}
 */
config.requiredPath = 'required';

config.jsVersion = clientConfig && clientConfig.version
  ? `${version}-${clientConfig.version}`
  : version;

/**
 * Path to favicon.
 * Will be appended to the base directories.
 * @type {string}
 */
config.faviconPath = 'images/favicon.ico';

/**
 * Allowed server modes.
 * @type {{string}}
 */
config.Modes = {
  TEST: 'test',
  PROD: 'prod',
  DEV: 'dev',
};
/**
 * Server mode.
 * @type {string}
 */
config.mode = process.env.MODE || config.mode || config.Modes.DEV;

/**
 * Database host name.
 * @type {string}
 */
config.dbHost = process.env.DBHOST || config.dbHost || '127.0.0.1';

/**
 * Database port.
 * @type {number}
 */
config.dbPort = process.env.DBPORT || config.dbPort || 27017;

/**
 * Database database name.
 * @type {string}
 */
config.dbName = `${config.mode}-${process.env.DBNAME || config.dbName || 'roleHaven'}`;

/**
 * Node server port number.
 * @type {number}
 */
config.port = process.env.PORT || config.port || 8888;

/**
 * Retrieve socket.io from local server or cdn.
 * Note! Android 2.2 fails when using cdn.
 * @type {string}
 */
config.socketPath = (process.env.SOCKETPATH === 'cdn' || config.socketPath === 'cdn')
  ? 'https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.0.1/socket.io.slim.js'
  : (process.env.SOCKETPATH || config.socketPath || '/scripts/socket.io.js');

config.country = process.env.COUNTRY || config.country || 'Sweden';

/**
 * Secret key used with JSON Web Token.
 */
config.jsonKey = process.env.JSONKEY || (config.mode === config.Modes.TEST
  ? 'TESTKEY'
  : undefined);

/**
 * Should errors be printed to log?
 * @type {boolean}
 */
config.verboseError = typeof verboseErrorEnv !== 'undefined'
  ? verboseErrorEnv
  : config.verboseError || false;

/**
 * Should external calls to other systems be disabled?
 * @type {boolean}
 */
config.bypassExternalConnections = typeof bypassExternalConnectionEnv !== 'undefined'
  ? bypassExternalConnectionEnv
  : config.bypassExternalConnections || true;

/**
 * User-friendly name for the event using the system
 * @type {string}
 */
config.eventName = process.env.EVENTNAME || config.eventName || 'roleHaven larp';

/**
 * *******************
 * * Client settings *
 * *******************
 */

/**
 * Default language for clients connecting.
 * Default language is English.
 * Don't set this var if you want English to be the default language.
 * Valid options: se.
 * @type {string}
 */
config.defaultLanguage = process.env.DEFAULTLANGUAGE || config.defaultLanguage || 'en';

/**
 * Name of the system. Human-readable name that will be sent to clients, such as in the subject field of mail or page title.
 * @type {string}
 */
config.title = process.env.TITLE || config.title || 'roleHaven';

/**
 * Should developer items (off-game) be shown on the client?
 * @type {boolean}
 */
config.showDevInfo = typeof showDevInfoEnv !== 'undefined'
  ? showDevInfoEnv
  : config.showDevInfo || false;

/**
 * Should the frontend force full screen on click?
 * @type {boolean}
 */
config.forceFullscreen = typeof forceFullscreenEnv !== 'undefined'
  ? forceFullscreenEnv
  : config.forceFullscreen || true;

/**
 * The number of years that will be subtracted/added to the current year.
 * It will only affect the visible date. The original date is stored on created objects.
 * @type {number}
 */
config.yearModification = process.env.YEARMODIFICATION || config.yearModification || 0;

/**
 * The number of days that will be subtraced/added to the current day
 * It will only affect the visible date. The original date is stored on created objects.
 * @type {number}
 */
config.dayModification = process.env.DAYMODIFICATION || config.dayModification || 0;

/**
 * Message that will be sent to clients.
 * @type {string}
 */
config.welcomeMessage = process.env.WELCOMEMESSAGE || config.welcomeMessage;

/**
 * Center latitude coordinate for game area.
 * @type {number}
 */
config.centerLat = textTools.convertToFloat(process.env.CENTERLAT || config.centerLat || 59.7526684);

/**
 * Center longitude coordinate for the game area.
 * @type {number}
 */
config.centerLong = textTools.convertToFloat(process.env.CENTERLONG || config.centerLong || 15.1941731);

/**
 * Upper left corner latitude for the game area.
 * @type {number}
 */
config.cornerOneLat = textTools.convertToFloat(process.env.CORNERONELAT || config.cornerOneLat || 59.7580656);

/**
 * Upper left corner longitude for the game area.
 * @type {number}
 */
config.cornerOneLong = textTools.convertToFloat(process.env.CORNERONELONG || config.cornerOneLong || 15.1851052);

/**
 * Bottom right corner latitude for the game area.
 * @type {number}
 */
config.cornerTwoLat = textTools.convertToFloat(process.env.CORNERTWOLAT || config.cornerTwoLat || 59.7467013);

/**
 * Bottom right corner longitude for the game area.
 * @type {number}
 */
config.cornerTwoLong = textTools.convertToFloat(process.env.CORNERTWOLONG || config.cornerTwoLong || 15.2048731);

/**
 * Default map zoom level
 * @type {number}
 */
config.defaultZoomLevel = textTools.convertToInt(process.env.DEFAULTZOOMLEVEL || config.defaultZoomLevel || 15);

/**
 * Minimum map zoom level
 * @type {number}
 */
config.minZoomLevel = textTools.convertToInt(process.env.MINZOOMLEVEL || config.minZoomLevel || 3);

/**
 * Maximum map zoom level
 * @type {number}
 */
config.maxZoomLevel = textTools.convertToInt(process.env.MAXZOOMLEVEL || config.maxZoomLevel || 19);

/**
 * ********
 * * Maps *
 * ********
 */

/**
 * Google Maps API key.
 * @type {string}
 */
config.gMapsKey = process.env.GMAPSKEY || config.gMapsKey;

/**
 * URL to Google Maps layer that will be imported
 * @type {string}
 */
config.mapLayersPath = process.env.MAPLAYERSPATH || config.mapLayersPath;

/**
 * Interval for collection of Google Maps positions.
 */
config.mapPositionsInterval = process.env.MAPPOSITIONSINTERVAL || config.mapPositionsInterval || 3600000;

/**
 * Should the frontend ask for user tracking?
 * @type {boolean}
 */
config.gpsTracking = typeof gpsTrackingEnv !== 'undefined'
  ? gpsTrackingEnv
  : config.gpsTracking || true;

config.disablePositionImport = typeof disablePositionImportEnv !== 'undefined'
  ? disablePositionImportEnv
  : config.disablePositionImport || true;

/**
 * *************
 * * Game code *
 * *************
 */

/**
 * Amount of credits transferred when a game code is used
 * @type {number}
 */
config.gameCodeAmount = process.env.GAMECODEAMOUNT || config.gameCodeAmount || 2;

/**
 * Max length for game codes
 * @type {number}
 */
config.gameCodeLength = process.env.GAMECODELENGTH || config.gameCodeLength || 8;

/**
 * ***********
 * * Message *
 * ***********
 */

/**
 * Max amount of messages that will be retrieved
 * @type {number}
 */
config.maxHistoryAmount = process.env.MAXHISTORYAMOUNT || config.maxHistoryAmount || 60;

/**
 * Should messagesbe allowed to have an attached image?
 * @type {boolean}
 */
config.allowMessageImage = typeof allowMessageImageEnv !== 'undefined'
  ? allowMessageImageEnv
  : config.allowMessageImage || false;

/**
 * Maximum amount of characters in a message
 * @type {number}
 */
config.messageMaxLength = process.env.MESSAGEMAXLENGTH || config.messageMaxLength || 2500;

/**
 * Maximum amount of characters in a broadcast
 * @type {number}
 */
config.broadcastMaxLength = process.env.BROADCASTMAXLENGTH || config.broadcastMaxLength || 600;

/**
 * ********
 * * User *
 * ********
 */

/**
 * Does the user have to be verified before being used?
 * @type {boolean}
 */
config.userVerify = typeof userVerifyEnv !== 'undefined'
  ? userVerifyEnv
  : config.userVerify || true;

/**
 * Minimum amount of characters in a user name
 * @type {number}
 */
config.usernameMinLength = process.env.USERNAMEMINLENGTH || config.usernameMinLength || 2;

/**
 * Maximum amount of characters in a user name
 * @type {number}
 */
config.usernameMaxLength = process.env.USERNAMEMAXLENGTH || config.usernameMaxLength || 10;

/**
 * Maximum amount warnings before a user account is banned
 * @type {number}
 */
config.maxUserWarnings = process.env.MAXUSERWARNINGS || config.maxUserWarnings || 2;

/**
 * Minimum amount of characters in a password
 * @type {number}
 */
config.passwordMinLength = process.env.PASSWORDMINLENGTH || config.passwordMinLength || 4;

/**
 * Maximum amount of characters in a password
 * @type {number}
 */
config.passwordMaxLength = process.env.PASSWORDMAXLENGTH || config.passwordMaxLength || 40;

/**
 * Should users be able to register? Does not block register through rest api.
 * @type {boolean}
 */
config.disallowUserRegister = typeof disallowRegisterEnv !== 'undefined'
  ? disallowRegisterEnv
  : config.disallowUserRegister || false;

/**
 * Minimum amount of characters in a user's full name.
 * @type {number}
 */
config.fullNameMinLength = process.env.FULLNAMEMINLENGTH || config.fullNameMinLength || 3;

/**
 * Maximum amount of characters in a user's full name.
 * @type {number}
 */
config.fullNameMaxLength = process.env.FULLNAMEMAXLENGTH || config.fullNameMaxLength || 40;

/**
 * ********
 * * Team *
 * ********
 */

/**
 * Does the team have to be verified before being used?
 * @type {boolean}
 */
config.teamVerify = typeof teamVerifyEnv !== 'undefined'
  ? teamVerifyEnv
  : config.teamVerify || false;

/**
 * Maximum amount of characters in a team name
 * @type {number}
 */
config.teamNameMaxLength = process.env.TEAMNAMEMAXLENGTH || config.teamNameMaxLength || 10;

/**
 * Maximum amount of characters in a team acronym
 * @type {number}
 */
config.shortTeamMaxLength = process.env.SHORTEAMMAXLENGTH || config.shortTeamMaxLength || 5;

/**
 * Max amount of teams that a user can be part of.
 * @type {number}
 */
config.maxUserTeam = process.env.MAXUSERTEAM || config.maxUserTeam || 1;

/**
 * ************
 * * Doc File *
 * ************
 */

/**
 * Minimum amount of characters in a document
 * @type {number}
 */
config.docFileMinLength = process.env.DOCFILEMINLENGTH || config.docFileMinLength || 3;

/**
 * Maximum amount of characters in a document
 * @type {number}
 */
config.docFileMaxLength = process.env.DOCFILEMAXLENGTH || config.docFileMaxLength || 3500;

/**
 * Maximum amount of characters in a document title
 * @type {number}
 */
config.docFileTitleMaxLength = process.env.DOCFILETITLEMAXLENGTH || config.docFileTitleMaxLength || 40;

/**
 * Minimum amount of characters in a document title
 * @type {number}
 */
config.docFileTitleMinLength = process.env.DOCFILETITLEMINLENGTH || config.docFileTitleMinLength || 3;

/**
 * Maximum amount of alphanumeric in a document id
 * @type {number}
 */
config.docFileCodeMaxLength = process.env.DOCFILECODEMAXLENGTH || config.docFileCodeMaxLength || 10;

/**
 * Minimum amount of alphanumeric in a document id
 * @type {number}
 */
config.docFileCodeMinLength = process.env.DOCFILECODEMINLENGTH || config.docFileCodeMinLength || 3;

/**
 * ********
 * * Room *
 * ********
 */

/**
 * Maximum amount of characters in a room name
 * @type {number}
 */
config.roomNameMaxLength = process.env.ROOMNAMEMAXLENGTH || config.roomNameMaxLength || 20;

/**
 * Maximum amount of characters in a room name
 * @type {number}
 */
config.roomNameMinLength = process.env.ROOMNAMEMINLENGTH || config.roomNameMinLength || 3;

/**
 * **********
 * * Device *
 * **********
 */

/**
 * Maximum amount of alphanumeric in a device id
 * @type {number}
 */
config.deviceIdLength = process.env.DEVICEIDLENGTH || config.deviceIdLength || 16;

/**
 * Maximum amount of characters in a device alias
 * @type {number}
 */
config.deviceAliasMaxLength = process.env.DEVICEALIASMAXLENGTH || config.deviceAliasMaxLength || 20;

/**
 * **********
 * * Wallet *
 * **********
 */

/**
 * Default amount that is added when a wallet is created.
 * @type {number}
 */
config.defaultWalletAmount = process.env.DEFAULTWALLETAMOUNT || config.defaultWalletAmount || 10;

/**
 * ************
 * * Position *
 * ************
 */

/**
 * Maximum amount of characters in a position title
 * @type {number}
 */
config.positionNameMaxLength = process.env.POSITIONNAMEMAXLENGTH || config.positionNameMaxLength || 30;

/**
 * Minimum position accuracy. Positions with worse accuracy will not be stored nor sent to clients
 * @type {number}
 */
config.minimumPositionAccuracy = process.env.MINIMUMPOSITIONACCURACY || config.minimumPositionAccuracy || 50;

/**
 * Maximum amount of time before a position is no longer valid. Used on clients.
 * @type {number}
 */
config.maxPositionAge = process.env.MAXPOSITIONAGE || config.maxPositionAge || 10;

/**
 * Access level that will be set on positions that are imported from external source (Google)
 * @type {number}
 */
config.importedPositionMinAccessLevel = process.env.IMPORTEDPOSITIONMINACCESSLEVEL || config.importedPositionMinAccessLevel || 2;

/**
 * Maximum amount of old coordinates stored in a position.
 * @type {number}
 */
config.maxPositionHistory = process.env.MAXPOSITIONHISTORY || config.maxPositionHistory || 5;

/**
 * *********
 * * Forum *
 * *********
 */

/**
 * Maximum amount of characters in a forum title
 * @type {number}
 */
config.forumTitleMaxLength = process.env.FORUMTITLEMAXLENGTH || config.forumTitleMaxLength || 50;

/**
 * Maximum amount of characters in a forum post
 * @type {number}
 */
config.forumPostMaxLength = process.env.FORUMPOSTMAXLENGTH || config.forumPostMaxLength || 2500;

/**
 * ***********
 * * Spotify *
 * ***********
 */

config.spotifyClientId = process.env.SPOTIFYCLIENTID;

config.spotifySecret = process.env.SPOTIFYSECRET;

config.spotifyRedirectUri = process.env.SPOTIFYREDIRECTURI;

module.exports = config;
