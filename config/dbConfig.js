const config = {};

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
    accessLevel: config.AccessLevels.MODERATOR,
  },
  GetCalibrationMission: {
    name: 'GetCalibrationMission',
    accessLevel: config.AccessLevels.MODERATOR,
  },
  /**
   * Lantern
   */
  HackLantern: {
    name: 'HackLantern',
    accessLevel: config.AccessLevels.MODERATOR,
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
    accessLevel: config.AccessLevels.MODERATOR,
  },
  GetLanternStations: {
    name: 'GetLanternStations',
    accessLevel: config.AccessLevels.MODERATOR,
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
    accessLevel: config.AccessLevels.MODERATOR,
  },
};

module.exports = config;