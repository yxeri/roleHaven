const dbUser = require('../db/connectors/user');
const jwt = require('jsonwebtoken');
const appConfig = require('../config/defaults/config').app;
const errorCreator = require('../objects/error/errorCreator');
const dbConfig = require('../config/defaults/config').databasePopulation;

/**
 * Create json web token. The user can be found by either the username or userId.
 * @param {Object} params - Parameters.
 * @param {string} params.password - Password of user to auth.
 * @param {Function} params.callback - Callback.
 * @param {string} [params.userId] - Id of user to auth.
 * @param {string} params.username] - Name of user to auth.
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
      }

      const { user } = data;

      const jwtUser = { userId: user.objectId };

      jwt.sign({ data: jwtUser }, appConfig.jsonKey, (err, token) => {
        if (err) {
          callback({ error: new errorCreator.Internal({ name: 'jwt', errorObject: err }) });

          return;
        }

        callback({ data: { token } });
      });
    },
  });
}

/**
 * Checks if the user is allowed to use the command.
 * @param {Object} params - Parameters.
 * @param {string} params.token - Json web token.
 * @param {string} params.commandName - Name of the command.
 * @param {Function} params.callback - callback.
 */
function isUserAllowed({
  commandName,
  token,
  callback,
}) {
  const commandUsed = dbConfig.apiCommands[commandName];
  const anonUser = dbConfig.anonymousUser;

  if (!commandUsed) {
    callback({ error: new errorCreator.DoesNotExist({ name: commandName }) });

    return;
  }

  if (!token) {
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
      full: true,
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
 * Checks if user has access, is admin or can see the object
 * @param {Object} params - Parameter
 * @param {Object} params.objectToAccess - Object to access
 * @param {Object} params.toAuth - Object to auth
 * @param {boolean} [params.shouldBeAdmin] - Should it check if the user or team are admins?
 * @returns {boolean} - Does the user have access to the object?
 */
function hasAccessTo({
  objectToAccess,
  toAuth,
  shouldBeAdmin = false,
}) {
  const {
    teamIds,
    userIds,
    userAdminIds,
    teamAdminIds,
    ownerId,
    isPublic,
  } = objectToAccess;
  const {
    hasFullAccess,
    accessLevel,
    teamIds: authTeamIds,
    objectId: authUserId,
  } = toAuth;
  if (hasFullAccess || accessLevel >= dbConfig.AccessLevels.ADMIN) {
    return true;
  } else if (shouldBeAdmin) {
    return (ownerId === authUserId || (userAdminIds.includes(authUserId)) || (teamAdminIds.find(adminId => authTeamIds.includes(adminId))));
  }

  const userHasAccess = userIds.concat([ownerId]).includes(authUserId);
  const teamHasAccess = teamIds.find(teamId => authTeamIds.includes(teamId));

  return isPublic || userHasAccess || teamHasAccess;
}

exports.isUserAllowed = isUserAllowed;
exports.createToken = createToken;
exports.hasAccessTo = hasAccessTo;
exports.isAllowedAccessLevel = isAllowedAccessLevel;
