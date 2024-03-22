'use strict';

import { version } from '@/package.json';
import textTools from '@/utils/textTools.js';
import path from 'path';

export type AppConfig = {
  jsonKey: string;
  gMapsKey: string;
  mapLayersPath: string;
  hackingApiKey?: string;
  roomNameMaxLength?: number;
  roomNameMinLength?: number;
  deviceIdLength?: number;
  deviceAliasMaxLength?: number;
  defaultWalletAmount?: number;
  walletMinimumAmount?: number;
  positionNameMaxLength?: number;
  docFileMinLength?: number;
  docFileMaxLength?: number;
  docFileTitleMaxLength?: number;
  docFileTitleMinLength?: number;
  docFileCodeMaxLength?: number;
  docFileCodeMinLength?: number;
  calibrationRewardAmount?: number;
  calibrationRewardMinimum?: number;
  calibrationRewardMax?: number;
  calibrationTimeout?: number;
  forumTitleMaxLength?: number;
  forumPostMaxLength?: number;
  signalMaxChange?: number;
  signalChangePercentage?: number;
  signalThreshold?: number;
  signalDefaultValue?: number;
  signalResetTimeout?: number;
  hackingTriesAmount?: number;
  hackingApiHost?: string;
  maxUserTeam?: number;
  shortTeamMaxLength?: number;
  teamNameMaxLength?: number;
  teamVerify?: boolean;
  userDescriptionMaxLength?: number;
  offNameNameMaxLength?: number;
  offNameMinLength?: number;
  requireOffName?: boolean;
  disallowUserRegister?: boolean;
  passwordMaxLength?: number;
  passwordMinLength?: number;
  maxUserWarnings?: number;
  usernameMaxLength?: number;
  usernameMinLength?: number;
  userVerify?: boolean;
  host?: string;
  publicBase?: string;
  privateBase?: string;
  indexName?: string;
  mainJsName?: string;
  mainCssName?: string;
  adminIndexName?: string;
  adminJsName?: string;
  adminCssName?: string;
  routes?: {
    sitePath: string;
    filePath: string
  }[];
  startupFuncs?: Array<(props: never) => Promise<never | void>>;
  handlers?: string[];
  viewsPath?: string;
  stylesPath?: string;
  scriptsPath?: string;
  requiredPath?: string;
  jsVersion?: string;
  faviconPath?: string;
  Modes: {
    TEST: string;
    PROD: string;
    DEV: string;
  };
  mode?: string;
  dbHost?: string;
  dbPort?: number;
  dbName?: string;
  port?: number;
  socketPath?: string;
  country?: string;
  verboseError?: boolean;
  bypassExternalConnections?: boolean;
  eventName?: string;
  mapPositionsInterval?: number;
  gameCodeAmount?: number;
  gameCodeLength?: number;
  maxHistoryAmount?: number;
  messageMaxLength?: number;
  broadcastMaxLength?: number;
  imageMaxWidth?: number;
  imageMaxHeight?: number;
  imageThumbMaxWidth?: number;
  imageThumbMaxHeight?: number;
  defaultLanguage?: string;
  title?: string;
  showDevInfo?: boolean;
  forceFullscreen?: boolean;
  yearModification?: number;
  dayModification?: number;
  welcomeMessage?: string;
  centerLat?: number;
  centerLong?: number;
  cornerOneLat?: number;
  cornerOneLong?: number;
  cornerTwoLat?: number;
  cornerTwoLong?: number;
  defaultZoomLevel?: number;
  minZoomLevel?: number;
  maxZoomLevel?: number;
  gpsTracking?: boolean;
  disablePositionImport?: boolean;
  ignoreDefaultHandlers?: [{
    sitePath: string;
    filePath: string;
  }];
  ignoreDefaultRoutes?: [{
    sitePath: string;
    filePath: string;
  }];
  version?: string;
  defaultPositionRadius?: number;
  allowedImages?: { CHAT: boolean; PROFILE: boolean; DOCFILE: boolean; };
  maxPositionHistory?: number;
  maxPositionAge?: number;
  minimumPositionAccuracy?: number;
  importedPositionMinAccessLevel?: number;
}

let clientConfig: AppConfig = {} as AppConfig;
let config: AppConfig = {} as AppConfig;

try {
  // @ts-expect-error generated file path
  const config = await import('../../../../private/config/config');
  clientConfig = Object.assign({}, config); // eslint-disable-line
} catch (err) {
  console.log('Did not find client config. Using defaults.');
}

try {
  // @ts-expect-error generated file path
  const appConfig = await import ('../../../../private/config/appConfig');
  config = Object.assign({}, appConfig.default); // eslint-disable-line
} catch (err) {
  console.log('Did not find modified appConfig. Using defaults.');
}

const forceFullscreenEnv = textTools.convertToBoolean(process.env.FORCEFULLSCREEN);
const gpsTrackingEnv = textTools.convertToBoolean(process.env.GPSTRACKING);
const teamVerifyEnv = textTools.convertToBoolean(process.env.TEAMVERIFY);
const disallowRegisterEnv = textTools.convertToBoolean(process.env.DISALLOWUSERREGISTER);
const verboseErrorEnv = textTools.convertToBoolean(process.env.VERBOSEERROR);
const bypassExternalConnectionEnv = textTools.convertToBoolean(process.env.BYPASSEXTERNALCONNECTIONS);
const userVerifyEnv = textTools.convertToBoolean(process.env.USERVERIFY);
const showDevInfoEnv = textTools.convertToBoolean(process.env.SHOWDEVINFO);
const disablePositionImportEnv = textTools.convertToBoolean(process.env.DISABLEPOSITIONIMPORT);
const requireOffNameEnv = textTools.convertToBoolean(process.env.REQUIREOFFNAME);

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
  ?
  config.routes || []
  :
  [{
    sitePath: '/',
    filePath: '/routes/index.js',
  }].concat([
    {
      sitePath: '/api/authenticate',
      filePath: '/routes/rest/authenticate.js',
    },
    {
      sitePath: '/api/gameCodes',
      filePath: '/routes/rest/gameCodes.js',
    },
    {
      sitePath: '/api/rooms',
      filePath: '/routes/rest/rooms.js',
    },
    {
      sitePath: '/api/positions',
      filePath: '/routes/rest/positions.js',
    },
    {
      sitePath: '/api/docFiles',
      filePath: '/routes/rest/docFiles.js',
    },
    {
      sitePath: '/api/users',
      filePath: '/routes/rest/users.js',
    },
    {
      sitePath: '/api/aliases',
      filePath: '/routes/rest/aliases.js',
    },
    {
      sitePath: '/api/wallets',
      filePath: '/routes/rest/wallets',
    },
    {
      sitePath: '/api/teams',
      filePath: '/routes/rest/teams',
    },
    {
      sitePath: '/api/devices',
      filePath: '/routes/rest/devices',
    },
    {
      sitePath: '/api/simpleMsgs',
      filePath: '/routes/rest/simpleMsgs',
    },
    {
      sitePath: '/api/forums',
      filePath: '/routes/rest/forums',
    },
    {
      sitePath: '/api/forumThreads',
      filePath: '/routes/rest/forumThreads',
    },
    {
      sitePath: '/api/forumPosts',
      filePath: '/routes/rest/forumPosts',
    },
    {
      sitePath: '/api/messages',
      filePath: '/routes/rest/messages',
    },
    {
      sitePath: '/api/transactions',
      filePath: '/routes/rest/transactions',
    },
    {
      sitePath: '/api/triggerEvents',
      filePath: '/routes/rest/triggerEvents',
    },
  ])
    .concat(config.routes || [])
    .concat([{
      sitePath: '*',
      filePath: '/routes/error.js',
    }])
    .map((route) => {
      return {
        sitePath: route.sitePath,
        filePath: `${__dirname}/../..${route.filePath}`,
      };
    });

/**
 * Array of functions that will be called on startup.
 * @type {Function[]}
 */
config.startupFuncs = config.startupFuncs || [];

/* eslint-disable */

config.handlers = config.ignoreDefaultHandlers
  ?
  config.handlers || []
  :
  [
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
  ].concat(config.handlers || [])
    .map(path => `${__dirname}/../..${path}`);

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
  ?
  clientConfig.version
  :
  version;

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
config.dbPort = Number(process.env.DBPORT || config.dbPort || 27017);

/**
 * Database database name.
 * @type {string}
 */
config.dbName = `${config.mode}-${process.env.DBNAME || config.dbName || 'roleHaven'}`;

/**
 * Node server port number.
 * @type {number}
 */
config.port = Number(process.env.PORT || config.port || 8888);

/**
 * Retrieve socket.io from local server or cdn.
 * Note! Android 2.2 fails when using cdn.
 * @type {string}
 */
config.socketPath = (process.env.SOCKETPATH === 'cdn' || config.socketPath === 'cdn')
  ?
  'https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.0.1/socket.io.slim.js'
  :
  (process.env.SOCKETPATH || config.socketPath || '/scripts/socket.io.js');

config.country = process.env.COUNTRY || config.country || 'Sweden';

/**
 * Secret key used with JSON Web Token.
 */
config.jsonKey = (process.env.JSONKEY || (config.mode === config.Modes.TEST
  ? 'TESTKEY'
  : undefined) as string);

/**
 * Should errors be printed to log?
 * @type {boolean}
 */
config.verboseError = typeof verboseErrorEnv !== 'undefined'
  ?
  verboseErrorEnv
  :
  config.verboseError || false;

/**
 * Should external calls to other systems be disabled?
 * @type {boolean}
 */
config.bypassExternalConnections = typeof bypassExternalConnectionEnv !== 'undefined'
  ?
  bypassExternalConnectionEnv
  :
  config.bypassExternalConnections || true;

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
  ?
  showDevInfoEnv
  :
  config.showDevInfo || false;

/**
 * Should the frontend force full screen on click?
 * @type {boolean}
 */
config.forceFullscreen = typeof forceFullscreenEnv !== 'undefined'
  ?
  forceFullscreenEnv
  :
  config.forceFullscreen || true;

/**
 * The number of years that will be subtracted/added to the current year.
 * It will only affect the visible date. The original date is stored on created objects.
 * @type {number}
 */
config.yearModification = Number(process.env.YEARMODIFICATION || config.yearModification || 0);

/**
 * The number of days that will be subtraced/added to the current day
 * It will only affect the visible date. The original date is stored on created objects.
 * @type {number}
 */
config.dayModification = Number(process.env.DAYMODIFICATION || config.dayModification || 0);

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
config.mapPositionsInterval = Number(process.env.MAPPOSITIONSINTERVAL || config.mapPositionsInterval || 3600000);

/**
 * Should the frontend ask for user tracking?
 * @type {boolean}
 */
config.gpsTracking = typeof gpsTrackingEnv !== 'undefined'
  ?
  gpsTrackingEnv
  :
  config.gpsTracking || true;

config.disablePositionImport = typeof disablePositionImportEnv !== 'undefined'
  ?
  disablePositionImportEnv
  :
  config.disablePositionImport || true;

/**
 * *************
 * * Game code *
 * *************
 */

/**
 * Amount of credits transferred when a game code is used
 * @type {number}
 */
config.gameCodeAmount = Number(process.env.GAMECODEAMOUNT || config.gameCodeAmount || 2);

/**
 * Max length for game codes
 * @type {number}
 */
config.gameCodeLength = Number(process.env.GAMECODELENGTH || config.gameCodeLength || 8);

/**
 * ***********
 * * Message *
 * ***********
 */

/**
 * Max amount of messages that will be retrieved
 * @type {number}
 */
config.maxHistoryAmount = Number(process.env.MAXHISTORYAMOUNT || config.maxHistoryAmount || 60);

/**
 * Maximum amount of characters in a message
 * @type {number}
 */
config.messageMaxLength = Number(process.env.MESSAGEMAXLENGTH || config.messageMaxLength || 2500);

/**
 * Maximum amount of characters in a broadcast
 * @type {number}
 */
config.broadcastMaxLength = Number(process.env.BROADCASTMAXLENGTH || config.broadcastMaxLength || 600);

/**
 * *********
 * * Image *
 * *********
 */

config.imageMaxWidth = Number(process.env.IMAGEMAXWIDTH || config.imageMaxWidth || 500);
config.imageMaxHeight = Number(process.env.IMAGEMAXHEIGHT || config.imageMaxHeight || 500);
config.imageThumbMaxWidth = Number(process.env.IMAGETHUMBMAXWIDTH || config.imageThumbMaxWidth || 150);
config.imageThumbMaxHeight = Number(process.env.IMAGETHUMBMAXHEIGHT || config.imageThumbMaxHeight || 150);

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
  ?
  userVerifyEnv
  :
  config.userVerify || true;

/**
 * Minimum amount of characters in a user name
 * @type {number}
 */
config.usernameMinLength = Number(process.env.USERNAMEMINLENGTH || config.usernameMinLength || 1);

/**
 * Maximum amount of characters in a user name
 * @type {number}
 */
config.usernameMaxLength = Number(process.env.USERNAMEMAXLENGTH || config.usernameMaxLength || 20);

/**
 * Maximum amount warnings before a user account is banned
 * @type {number}
 */
config.maxUserWarnings = Number(process.env.MAXUSERWARNINGS || config.maxUserWarnings || 2);

/**
 * Minimum amount of characters in a password
 * @type {number}
 */
config.passwordMinLength = Number(process.env.PASSWORDMINLENGTH || config.passwordMinLength || 3);

/**
 * Maximum amount of characters in a password
 * @type {number}
 */
config.passwordMaxLength = Number(process.env.PASSWORDMAXLENGTH || config.passwordMaxLength || 100);

/**
 * Should users be able to register? Does not block register through rest api.
 * @type {boolean}
 */
config.disallowUserRegister = typeof disallowRegisterEnv !== 'undefined'
  ?
  disallowRegisterEnv
  :
  config.disallowUserRegister || false;

config.requireOffName = typeof requireOffNameEnv !== 'undefined'
  ?
  requireOffNameEnv
  :
  config.requireOffName || false;

/**
 * Minimum amount of characters in a user's off-game name.
 * @type {number}
 */
config.offNameMinLength = Number(process.env.OFFNAMEMINLENGTH || config.offNameMinLength || 1);

/**
 * Maximum amount of characters in a user's off-game name.
 * @type {number}
 */
config.offNameNameMaxLength = Number(process.env.OFFNAMEMAXLENGTH || config.offNameNameMaxLength || 40);

/**
 * Maximum amount of characters in a user's description.
 * @type {number}
 */
config.userDescriptionMaxLength = Number(process.env.USERDESCRIPTIONMAXLENGTH || config.userDescriptionMaxLength || 300);

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
  ?
  teamVerifyEnv
  :
  config.teamVerify || false;

/**
 * Maximum amount of characters in a team name
 * @type {number}
 */
config.teamNameMaxLength = Number(process.env.TEAMNAMEMAXLENGTH || config.teamNameMaxLength || 20);

/**
 * Maximum amount of characters in a team acronym
 * @type {number}
 */
config.shortTeamMaxLength = Number(process.env.SHORTEAMMAXLENGTH || config.shortTeamMaxLength || 5);

/**
 * Max amount of teams that a user can be part of.
 * @type {number}
 */
config.maxUserTeam = Number(process.env.MAXUSERTEAM || config.maxUserTeam || 1);

/**
 * ************
 * * Doc File *
 * ************
 */

/**
 * Minimum amount of characters in a document
 * @type {number}
 */
config.docFileMinLength = Number(process.env.DOCFILEMINLENGTH || config.docFileMinLength || 3);

/**
 * Maximum amount of characters in a document
 * @type {number}
 */
config.docFileMaxLength = Number(process.env.DOCFILEMAXLENGTH || config.docFileMaxLength || 3500);

/**
 * Maximum amount of characters in a document title
 * @type {number}
 */
config.docFileTitleMaxLength = Number(process.env.DOCFILETITLEMAXLENGTH || config.docFileTitleMaxLength || 40);

/**
 * Minimum amount of characters in a document title
 * @type {number}
 */
config.docFileTitleMinLength = Number(process.env.DOCFILETITLEMINLENGTH || config.docFileTitleMinLength || 3);

/**
 * Maximum amount of alphanumeric in a document id
 * @type {number}
 */
config.docFileCodeMaxLength = Number(process.env.DOCFILECODEMAXLENGTH || config.docFileCodeMaxLength || 10);

/**
 * Minimum amount of alphanumeric in a document id
 * @type {number}
 */
config.docFileCodeMinLength = Number(process.env.DOCFILECODEMINLENGTH || config.docFileCodeMinLength || 3);

/**
 * ********
 * * Room *
 * ********
 */

/**
 * Maximum amount of characters in a room name
 * @type {number}
 */
config.roomNameMaxLength = Number(process.env.ROOMNAMEMAXLENGTH || config.roomNameMaxLength || 20);

/**
 * Maximum amount of characters in a room name
 * @type {number}
 */
config.roomNameMinLength = Number(process.env.ROOMNAMEMINLENGTH || config.roomNameMinLength || 3);

/**
 * **********
 * * Device *
 * **********
 */

/**
 * Maximum amount of alphanumeric in a device id
 * @type {number}
 */
config.deviceIdLength = Number(process.env.DEVICEIDLENGTH || config.deviceIdLength || 16);

/**
 * Maximum amount of characters in a device alias
 * @type {number}
 */
config.deviceAliasMaxLength = Number(process.env.DEVICEALIASMAXLENGTH || config.deviceAliasMaxLength || 20);

/**
 * **********
 * * Wallet *
 * **********
 */

/**
 * Default amount that is added when a wallet is created.
 * @type {number}
 */
config.defaultWalletAmount = Number(process.env.DEFAULTWALLETAMOUNT || config.defaultWalletAmount || 10);

/**
 * Minimum amount that a wallet can contain.
 * @type {number}
 */
config.walletMinimumAmount = Number(process.env.WALLETMINIMUMAMOUNT || config.walletMinimumAmount || 0);

/**
 * ************
 * * Position *
 * ************
 */

/**
 * Maximum amount of characters in a position title
 * @type {number}
 */
config.positionNameMaxLength = Number(process.env.POSITIONNAMEMAXLENGTH || config.positionNameMaxLength || 30);

/**
 * Minimum position accuracy. Positions with worse accuracy will not be stored nor sent to clients
 * @type {number}
 */
config.minimumPositionAccuracy = Number(process.env.MINIMUMPOSITIONACCURACY || config.minimumPositionAccuracy || 100);

/**
 * Maximum amount of time before a position is no longer valid. Used on clients.
 * @type {number}
 */
config.maxPositionAge = Number(process.env.MAXPOSITIONAGE || config.maxPositionAge || 10);

/**
 * Access level that will be set on positions that are imported from external source (Google)
 * @type {number}
 */
config.importedPositionMinAccessLevel = Number(process.env.IMPORTEDPOSITIONMINACCESSLEVEL || config.importedPositionMinAccessLevel || 2);

/**
 * Maximum amount of old coordinates stored in a position.
 * @type {number}
 */
config.maxPositionHistory = Number(process.env.MAXPOSITIONHISTORY || config.maxPositionHistory || 15);

config.defaultPositionRadius = Number(process.env.DEFAULTPOSITIONRADIUS || config.defaultPositionRadius || 25);

/**
 * *********
 * * Forum *
 * *********
 */

/**
 * Maximum amount of characters in a forum title
 * @type {number}
 */
config.forumTitleMaxLength = Number(process.env.FORUMTITLEMAXLENGTH || config.forumTitleMaxLength || 50);

/**
 * Maximum amount of characters in a forum post
 * @type {number}
 */
config.forumPostMaxLength = Number(process.env.FORUMPOSTMAXLENGTH || config.forumPostMaxLength || 2500);

/**
 * Should images be allowed in the specified content?
 * @type {{PROFILE: boolean, DOCFILE: boolean, CHAT: boolean}}
 */
config.allowedImages = config.allowedImages || {
  CHAT: true,
  PROFILE: true,
  DOCFILE: true,
};

export default config;
