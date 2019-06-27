/*
 Copyright 2018 Carmilla Mina Jankovic

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

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const dbUser = require('../db/connectors/user');
const errorCreator = require('../error/errorCreator');
const { appConfig, dbConfig } = require('../config/defaults/config');

/**
 * Create json web token. The user can be found by either the username or userId.
 * @param {Object} params Parameters.
 * @param {string} params.password Password of user to auth.
 * @param {Function} params.callback Callback.
 * @param {string} [params.userId] Id of user to auth.
 * @param {string} [params.username] Name of user to auth.
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

  dbUser.getUserById({
    userId,
    username,
    getPassword: true,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user } = data;

      if (user.isBanned) {
        callback({ error: new errorCreator.Banned({ name: `user ${user.username}` }) });

        return;
      }

      if (!user.isVerified) {
        callback({ error: new errorCreator.NotAllowed({ name: `user ${user.username} not verified` }) });

        return;
      }

      bcrypt.compare(password, user.password, (hashError, result) => {
        if (hashError) {
          callback({ error: new errorCreator.Internal({ errorObject: hashError }) });

          return;
        }

        if (!result) {
          callback({ error: new errorCreator.NotAllowed({ name: `user ${user.username} wrong password` }) });

          return;
        }

        const jwtUser = { userId: user.objectId };
        user.password = true;

        jwt.sign({ data: jwtUser }, appConfig.jsonKey, (err, token) => {
          if (err) {
            callback({ error: new errorCreator.Internal({ name: 'jwt', errorObject: err }) });

            return;
          }

          callback({ data: { token, user } });
        });
      });
    },
  });
}

/**
 * Checks if the user is allowed to use the command.
 * @param {Object} params Parameters.
 * @param {string} params.token Json web token.
 * @param {string} params.commandName Name of the command.
 * @param {Object} [params.internalCallUser] User set in an internal system call.
 * @param {Function} params.callback callback.
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
      callback: ({ error, data }) => {
        if (error) {
          callback({ error });

          return;
        }

        const { user } = data;
        const { accessLevel } = commandUsed;

        if (user.isBanned || !user.isVerified || accessLevel > user.accessLevel) {
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
 * @param {Object} params Parameters.
 * @param {Object} params.objectToCreate Object that is going to be created.
 * @param {Object} params.toAuth User trying to create an object.
 * @return {boolean} Does the user have a high enough access level?
 */
function isAllowedAccessLevel({ objectToCreate, toAuth }) {
  return (!objectToCreate.accessLevel || toAuth.accessLevel >= objectToCreate.accessLevel) || (!objectToCreate.visibility || toAuth.accessLevel >= objectToCreate.visibility);
}

/**
 * Checks if user has access, is admin or can see the object.
 * @param {Object} params Parameter.
 * @param {Object} params.objectToAccess Object to access.
 * @param {Object} params.toAuth Object to auth.
 * @returns {boolean} Does the user have access to the object?
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
    ownerAliasId,
    isPublic,
    visibility,
  } = objectToAccess;
  const {
    hasFullAccess,
    accessLevel,
    objectId: authUserId,
    teamIds: authTeamIds = [],
    aliases = [],
  } = toAuth;

  const foundOwnerAlias = ownerAliasId && aliases.find(aliasId => aliasId === ownerAliasId);

  const userHasAccess = userIds.concat([ownerId]).includes(authUserId);
  const teamHasAccess = teamIds.find(teamId => authTeamIds.includes(teamId));
  const aliasHasAccess = foundOwnerAlias || aliases.find(aliasId => userIds.includes(aliasId));
  const userHasAdminAccess = userAdminIds.includes(authUserId);
  const aliasHasAdminAccess = foundOwnerAlias || aliases.find(aliasId => userAdminIds.includes(aliasId));
  const teamHasAdminAccess = teamAdminIds.find(adminId => authTeamIds.includes(adminId));
  const isAdmin = ownerId === authUserId || hasFullAccess || accessLevel >= dbConfig.AccessLevels.ADMIN;

  return {
    canSee: isAdmin || isPublic || userHasAccess || teamHasAccess || aliasHasAccess || accessLevel >= visibility,
    hasAccess: isAdmin || isPublic || userHasAccess || teamHasAccess || aliasHasAccess,
    hasFullAccess: isAdmin || userHasAdminAccess || teamHasAdminAccess || aliasHasAdminAccess,
  };
}

exports.isUserAllowed = isUserAllowed;
exports.createToken = createToken;
exports.hasAccessTo = hasAccessTo;
exports.isAllowedAccessLevel = isAllowedAccessLevel;
