const dbUser = require('../db/connectors/user');
const jwt = require('jsonwebtoken');
const appConfig = require('../config/defaults/config').app;
const errorCreator = require('../objects/error/errorCreator');
const dbConfig = require('../config/defaults/config').databasePopulation;

/**
 * Create json web token
 * @param {Object} params - Parameters
 * @param {string} params.userId - ID of user to auth
 * @param {string} params.password - Password of user to auth
 * @param {Function} params.callback Callback
 */
function createToken({ userId, password, callback }) {
  if (!appConfig.jsonKey) {
    callback({ error: new errorCreator.Internal({ name: 'json key not set' }) });

    return;
  }

  dbUser.authUser({
    userId,
    password,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user } = data;

      const jwtUser = {
        userId: user.userId,
      };

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
 * Checks if the user is allowed to use the command
 * @param {Object} params - Parameters
 * @param {string} params.token - Json web token
 * @param {string} params.commandName - Name of the command
 * @param {string} [params.matchToId] - Checks if sent user ID is the same as authenticated. Used for current user get, as they need less permission than get from other users
 * @param {Function} params.callback - callback
 */
function isUserAllowed({ commandName, token, matchToId, callback }) {
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

    const jwtData = decoded.data;

    dbUser.getUserById({
      userId: matchToId || jwtData.userId,
      callback: ({ error, data }) => {
        if (error) {
          callback({ error });

          return;
        }

        const user = data.user;
        const commandAccessLevel = jwtData.userId === user.userId ? commandUsed.selfAccessLevel : commandUsed.accessLevel;

        if (commandAccessLevel > user.accessLevel) {
          callback({ error: new errorCreator.NotAllowed({ name: commandName }) });

          return;
        }

        callback({ data: { user } });
      },
    });
  });
}

/**
 * Checks if user has access, is admin or can see the object
 * @param {Object} params - Parameter
 * @param {Object} params.objectToAccess - Object to access
 * @param {string[]} params.objectToAccess.teamIds - Teams with access to the object
 * @param {string[]} params.objectToAccess.userIds - Users with access to the object
 * @param {string} params.objectToAccess.ownerId - Owner of the object
 * @param {Object} params.toAuth - Object to auth
 * @param {string[]} params.toAuth.teamIds - Teams to auth
 * @param {string} params.toAuth.userId - User to auth
 * @param {boolean} [params.shouldBeAdmin] - Should it check if the user or team are admins?
 * @returns {boolean} - Does the user have access to the object?
 */
function hasAccessTo({ objectToAccess, toAuth, shouldBeAdmin = false }) {
  const {
    teamIds,
    userIds,
    ownerId,
    adminIds,
  } = objectToAccess;
  const {
    teamIds: authTeamIds,
    userId: authUserId,
  } = toAuth;

  if (shouldBeAdmin) {
    const admins = adminIds.concat([ownerId]);

    return (admins.includes(authUserId) || admins.find(adminId => authTeamIds.includes(adminId)));
  }

  const userHasAccess = userIds && userIds.concat([ownerId]).includes(authUserId);
  const teamHasAccess = teamIds && teamIds.find(teamId => authTeamIds.includes(teamId));

  return userHasAccess || teamHasAccess;
}

exports.isUserAllowed = isUserAllowed;
exports.createToken = createToken;
exports.hasAccessTo = hasAccessTo;
