const dbUser = require('../db/connectors/user');
const jwt = require('jsonwebtoken');
const errorCreator = require('../error/errorCreator');
const { appConfig, dbConfig } = require('../config/defaults/config');

/**
 * Create json web token. The user can be found by either the username or userId.
 * @param {Object} params - Parameters.
 * @param {string} params.password - Password of user to auth.
 * @param {Function} params.callback - Callback.
 * @param {string} [params.userId] - Id of user to auth.
 * @param {string} [params.username] - Name of user to auth.
 */
function createToken({
  username,
  userId,
  password,
  callback,
}) {
  if (!appConfig.jsonKey) {
    callback({ error: new errorCreator.Internal({ name: 'json key not set' }) });

    return;
  }

  dbUser.authUser({
    userId,
    username,
    password,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (data.user.isBanned) {
        callback({ error: new errorCreator.Banned({ name: `user ${data.user.username}` }) });

        return;
      } else if (!data.user.isVerified) {
        callback({ error: new errorCreator.NotAllowed({ name: `user ${data.user.username} not verified` }) });

        return;
      }

      const { user } = data;

      const jwtUser = { userId: user.objectId };

      jwt.sign({ data: jwtUser }, appConfig.jsonKey, (err, token) => {
        if (err) {
          callback({ error: new errorCreator.Internal({ name: 'jwt', errorObject: err }) });

          return;
        }

        callback({ data: { token, user } });
      });
    },
  });
}

/**
 * Checks if the user is allowed to use the command.
 * @param {Object} params - Parameters.
 * @param {string} params.token - Json web token.
 * @param {string} params.commandName - Name of the command.
 * @param {Object} [params.internalCallUser] - User set in an internal system call.
 * @param {Function} params.callback - callback.
 */
function isUserAllowed({
  commandName,
  token,
  internalCallUser,
  callback,
}) {
  const commandUsed = dbConfig.apiCommands[commandName];
  const anonUser = dbConfig.anonymousUser;

  if (internalCallUser) {
    callback({ data: { user: internalCallUser } });

    return;
  }

  if (!commandUsed) {
    callback({ error: new errorCreator.DoesNotExist({ name: commandName }) });

    return;
  } else if (!token) {
    if (commandUsed.accessLevel > anonUser.accessLevel) {
      callback({ error: new errorCreator.NotAllowed({ name: commandName, verbose: false }) });

      return;
    }

    callback({ data: { user: anonUser } });

    return;
  }

  jwt.verify(token, appConfig.jsonKey, (err, decoded) => {
    if (err || !decoded) {
      callback({ error: new errorCreator.NotAllowed({ name: commandName }) });

      return;
    }

    const { userId } = decoded.data;

    dbUser.getUserById({
      userId,
      callback: ({ error, data }) => {
        if (error) {
          callback({ error });

          return;
        }

        const { user } = data;
        const { accessLevel } = commandUsed;

        if (accessLevel > user.accessLevel) {
          callback({ error: new errorCreator.NotAllowed({ name: commandName }) });

          return;
        }

        callback({ data: { user } });
      },
    });
  });
}

/**
 * Does the user have equal or higher access level to the set visibility/access level in the object that will be created?
 * @param {Object} params - Parameters.
 * @param {Object} params.objectToCreate - Object that is going to be created.
 * @param {Object} params.toAuth - User trying to create an object.
 * @return {boolean} - Does the user have a high enough access level?
 */
function isAllowedAccessLevel({ objectToCreate, toAuth }) {
  return (!objectToCreate.accessLevel || toAuth.accessLevel >= objectToCreate.accessLevel) || (!objectToCreate.visibility || toAuth.accessLevel >= objectToCreate.visibility);
}

/**
 * Checks if user has access, is admin or can see the object.
 * @param {Object} params - Parameter.
 * @param {Object} params.objectToAccess - Object to access.
 * @param {Object} params.toAuth - Object to auth.
 * @returns {boolean} - Does the user have access to the object?
 */
function hasAccessTo({
  objectToAccess,
  toAuth,
}) {
  const {
    teamIds = [],
    userIds = [],
    userAdminIds = [],
    teamAdminIds = [],
    ownerId,
    isPublic,
    visibility,
  } = objectToAccess;
  const {
    hasFullAccess,
    accessLevel,
    teamIds: authTeamIds = [],
    objectId: authUserId = [],
    aliases = [],
  } = toAuth;
  const userHasAccess = userIds.concat([ownerId]).includes(authUserId);
  const teamHasAccess = teamIds.find(teamId => authTeamIds.includes(teamId));
  const aliasHasAccess = aliases.find(aliasId => userIds.includes(aliasId));
  const userHasAdminAccess = userAdminIds.includes(authUserId);
  const aliasHasAdminAccess = aliases.find(aliasId => userAdminIds.includes(aliasId));
  const teamHasAdminAccess = teamAdminIds.find(adminId => authTeamIds.includes(adminId));
  const isAdmin = ownerId === authUserId || hasFullAccess || accessLevel >= dbConfig.AccessLevels.ADMIN;

  return {
    canSee: isAdmin || isPublic || accessLevel >= visibility,
    hasAccess: isAdmin || userHasAccess || teamHasAccess || aliasHasAccess,
    hasFullAccess: isAdmin || userHasAdminAccess || teamHasAdminAccess || aliasHasAdminAccess,
  };
}

exports.isUserAllowed = isUserAllowed;
exports.createToken = createToken;
exports.hasAccessTo = hasAccessTo;
exports.isAllowedAccessLevel = isAllowedAccessLevel;
