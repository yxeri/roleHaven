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

config.apiCommands = {};
config.apiCommands = {
  /**
   * Alias
   */
  CreateAlias: {
    name: 'CreateAlias',
    accessLevel: config.AccessLevels.MODERATOR,
  },
  /**
   * Position
   */
  CreatePosition: {
    name: 'CreatePosition',
    accessLevel: config.AccessLevels.MODERATOR,
  },
  /**
   * Others
   */
  IncludeOff: config.apiCommands.IncludeOff || {
    name: 'IncludeOff',
    accessLevel: config.AccessLevels.MODERATOR,
  },
};

module.exports = config;
