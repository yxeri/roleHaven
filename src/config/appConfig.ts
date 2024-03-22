import { AppConfig } from '@/config/defaults/appConfig.js';
import { Socket } from 'socket.io';

const config: AppConfig = {} as AppConfig;

config.routes = [
  {
    sitePath: '/api/calibrationMissions',
    filePath: '/routes/rest/bbr/calibrationMissions.js'
  },
  {
    sitePath: '/api/lanternStations',
    filePath: '/routes/rest/bbr/lanternStations.js'
  },
  {
    sitePath: '/api/lanternRounds',
    filePath: '/routes/rest/bbr/lanternRounds.js'
  },
  {
    sitePath: '/api/lanternTeams',
    filePath: '/routes/rest/bbr/lanternTeams.js'
  },
  {
    sitePath: '/api/gameItems',
    filePath: '/routes/rest/bbr/gameItems.js'
  },
];

config.handlers = [
  '/routes/socketHandlers/bbr/calibrationMissions',
  '/routes/socketHandlers/bbr/lanternHacking',
];

config.hackingApiHost = process.env.HACKINGAPIHOST || '34.245.62.115';

config.calibrationRewardAmount = Number(process.env.CALIBRATIONREWARDAMOUNT || config.calibrationRewardAmount || 5);

config.calibrationRewardMinimum = Number(process.env.CALIBRATIONREWARDMINIMUM || config.calibrationRewardMinimum || 0);

config.calibrationRewardMax = Number(process.env.CALIBRATIONREWARDMAX || config.calibrationRewardMax || 20);

/**
 * Amount of time between calibration missions can be generated in minutes
 */
config.calibrationTimeout = Number(process.env.CALIBRATIONTIMEOUT || config.calibrationTimeout || 20);

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
config.hackingTriesAmount = Number(process.env.HACKINGTRIESAMOUNT || config.hackingTriesAmount || 3);

/**
 * Amount of milliseconds between each increment/decrement of signal value (BBR game feature)
 * @type {number}
 */
config.signalResetTimeout = Number(process.env.SIGNALRESETINTERVAL || config.signalResetTimeout || 0);

config.signalDefaultValue = Number(process.env.SIGNALDEFAULTVALUE || config.signalDefaultValue || 100);

config.signalThreshold = Number(process.env.SIGNALTRESHHOLD || config.signalThreshold || 50);

config.signalChangePercentage = Number(process.env.SIGNALCHANGEPERCENTAGE || config.signalChangePercentage || 0.2);

config.signalMaxChange = Number(process.env.SIGNALMAXCHANGE || config.signalMaxChange || 10);

config.startupFuncs = [
  async ({ io }: { io: Socket }) => {
    await import('@/managers/bbr/lanternHacking.js')
      .then((lanternHacking) => lanternHacking.startResetInterval({ io }));
  },
];

export default config;
