import { DbConfig } from '@/config/defaults/dbConfig.js';

const config: DbConfig = {} as DbConfig;

/**
 * Access levels are used as permissions for users.
 * A user that has an level equal to or greater than the required access level will be able to use the function.
 */
config.AccessLevels = {
  ANONYMOUS: 0,
  STANDARD: 1,
  PRIVILEGED: 2,
  MODERATOR: 3,
  ADMIN: 4,
  SUPERUSER: 5,
  GOD: 6,
};

config.customUserFields = [];

config.apiCommands = {};
config.apiCommands = {
  /**
   * Calibration mission
   */
  CancelCalibrationMission: {
    name: 'CancelCalibrationMission',
    accessLevel: config.AccessLevels.MODERATOR,
  },
  CompleteCalibrationMission: {
    name: 'CompleteCalibrationMission',
    accessLevel: config.AccessLevels.MODERATOR,
  },
  GetCalibrationMissions: {
    name: 'GetCalibrationMissions',
    accessLevel: config.AccessLevels.STANDARD,
  },
  GetCalibrationMission: {
    name: 'GetCalibrationMission',
    accessLevel: config.AccessLevels.STANDARD,
  },
  /**
   * Lantern
   */
  HackLantern: {
    name: 'HackLantern',
    accessLevel: config.AccessLevels.STANDARD,
  },
  /**
   * Lantern round
   */
  CreateLanternStation: {
    name: 'CreateLanternStation',
    accessLevel: config.AccessLevels.MODERATOR,
  },
  DeleteLanternStation: {
    name: 'DeleteLanternStation',
    accessLevel: config.AccessLevels.MODERATOR,
  },
  UpdateLanternStation: {
    name: 'UpdateLanternStation',
    accessLevel: config.AccessLevels.MODERATOR,
  },
  StartLanternRound: {
    name: 'StartLanternRound',
    accessLevel: config.AccessLevels.MODERATOR,
  },
  GetLanternRound: {
    name: 'GetLanternRound',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },
  GetLanternStations: {
    name: 'GetLanternStations',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },
  /**
   * Lantern team
   */
  CreateLanternTeam: {
    name: 'DeleteLanternTeam',
    accessLevel: config.AccessLevels.MODERATOR,
  },
  DeleteLanternTeam: {
    name: 'DeleteLanternTeam',
    accessLevel: config.AccessLevels.MODERATOR,
  },
  GetLanternTeam: {
    name: 'GetLanternTeam',
    accessLevel: config.AccessLevels.ANONYMOUS,
  },
  /**
   * Position
   */
  CreatePosition: {
    name: 'CreatePosition',
    accessLevel: Number(process.env.CREATEPOSITION || config.AccessLevels.PRIVILEGED),
  },
  /**
   * Alias
   */
  CreateAlias: {
    name: 'CreateAlias',
    accessLevel: Number(process.env.CREATEALIASLEVEL || config.AccessLevels.STANDARD),
  },
  /**
   * Others
   */
  IncludeOff: config.apiCommands.IncludeOff || {
    name: 'IncludeOff',
    accessLevel: config.AccessLevels.MODERATOR,
  },
};

export default config;