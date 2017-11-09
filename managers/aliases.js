/*
 Copyright 2017 Aleksandar Jankovic

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

const dbAlias = require('../db/connectors/alias');
const appConfig = require('../config/defaults/config').app;
const dbConfig = require('../config/defaults/config').databasePopulation;
const errorCreator = require('../objects/error/errorCreator');
const textTools = require('../utils/textTools');
const authenticator = require('../helpers/authenticator');
const dbRoom = require('../db/connectors/room');

/**
 * @typedef Alias
 * @property aliasName - Name of the alias
 * @property {string} ownerId - ID of the owner
 * @property {string} ownerAliasId - Alias ID of the owner. Will be shown instead of ownerId, if set
 * @property {Date} timeCreated - Date of when the alias was created
 * @property {Date} lastUpdated - Date of when the alias was last updated
 * @property {string[]} userIds - Users with access to the alias
 * @property {string[]} teamids - Teams with access to the alias
 * @property {string[]} adminIds - Admins with access to the alias. They can update the alias.
 * @property {boolean} isPublic - Should the alias be visible to all users?
 */

/**
 * Does user have access to aliases?
 * @private
 * @param {Object} params - Parameter
 * @param {Object} params.user - User to auth
 * @param {Object} params.alias - Alias to check against
 * @param {boolean} [params.shouldBeAdmin] - Does the user have to be an admin?
 * @param {Function} params.callback - Callback
 */
function hasAccessToAlias({
  user,
  alias,
  shouldBeAdmin,
  callback,
}) {
  authenticator.hasAccessTo({
    shouldBeAdmin,
    objectToAccess: alias,
    toAuth: { userId: user.userId, teamIds: user.partOfTeams },
    callback: (accessData) => {
      if (accessData.error) {
        callback({ error: accessData.error });

        return;
      }

      callback({ data: { alias } });
    },
  });
}

/**
 * Create and add alias to user
 * @param {Object} params - Parameter
 * @param {Object} params.alias - Alias to add
 * @param {Object} [params.socket] - Socket io
 * @param {Object} [params.io] - Socket io. Will be used if socket is not set
 * @param {string} [params.userId] - ID of the user creating alias
 * @param {Object} [params.options] - Options
 * @param {Function} params.callback - Callback
 */
function createAlias({
  token,
  socket,
  io,
  alias,
  options,
  callback,
  userId,
}) {
  authenticator.isUserAllowed({
    token,
    matchToId: userId,
    commandName: dbConfig.apiCommands.CreateAlias.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (alias.aliasName.length > appConfig.usernameMaxLength) {
        callback({ error: new errorCreator.InvalidCharacters({ name: `Username length: ${appConfig.usernameMaxLength}` }) });

        return;
      } else if (!textTools.isAlphaNumeric(alias.aliasName)) {
        callback({ error: new errorCreator.InvalidCharacters({ name: 'alias name', expected: 'a-z 0-9' }) });

        return;
      }

      const authUser = data.user;

      const aliasToSave = alias;
      aliasToSave.ownerId = authUser.userId;

      dbAlias.createAlias({
        options,
        user: authUser,
        alias: aliasToSave,
        callback: ({ error: aliasError, data: aliasData }) => {
          if (aliasError) {
            callback({ error: aliasError });

            return;
          }

          const createdAlias = aliasData.alias;

          dbRoom.createRoom({
            room: {
              ownerId: authUser.userId,
              roomName: createdAlias.aliasId,
              accessLevel: dbConfig.AccessLevels.SUPERUSER,
              visibility: dbConfig.AccessLevels.SUPERUSER,
              isWhisper: true,
              lockedName: true,
            },
            callback: ({ error: roomError, data: roomData }) => {
              if (roomError) {
                callback({ error: roomError });

                return;
              }

              const userSocket = io.sockets.sockets[authUser.socketId];
              const dataToSend = {
                user: {
                  userId: createdAlias.aliasId,
                  username: createdAlias.aliasName,
                },
              };

              if (userSocket) { userSocket.join(roomData.roomId); }

              if (socket) {
                socket.join(roomData.roomId);
                socket.broadcast.emit('user', {
                  data: dataToSend,
                });
              } else {
                io.emit('user', {
                  data: dataToSend,
                });
              }

              callback({ data: { alias: createdAlias } });
            },
          });
        },
      });
    },
  });
}

/**
 * Get alias by its name
 * @param {Object} params - Parameter
 * @param {string} params.token - jwt
 * @param {string} params.aliasName - Name of the alias
 * @param {Function} params.callback - Callback
 * @param {string} [params.userId] - ID of the user that is retrieving the alias
 */
function getAliasByName({ token, aliasName, callback, userId }) {
  authenticator.isUserAllowed({
    token,
    matchToId: userId,
    commandName: dbConfig.apiCommands.GetAliases.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbAlias.getAliasByName({
        aliasName,
        callback: (aliasData) => {
          if (aliasData.error) {
            callback({ error: aliasData.error });

            return;
          }

          hasAccessToAlias({
            callback,
            user: data.user,
            alias: aliasData.data.alias,
          });
        },
      });
    },
  });
}

/**
 * Get alias
 * @param {Object} params - Parameter
 * @param {string} params.token - jwt
 * @param {string} params.aliasId - ID of the alias
 * @param {Function} params.callback - Callback
 * @param {Object} params.userId - ID of the user to retrieve alias with
 */
function getAlias({ token, aliasId, callback, userId }) {
  authenticator.isUserAllowed({
    token,
    matchToId: userId,
    commandName: dbConfig.apiCommands.GetAliases.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbAlias.getAliasById({
        aliasId,
        callback: (aliasData) => {
          if (aliasData.error) {
            callback({ error: aliasData.error });

            return;
          }

          hasAccessToAlias({
            callback,
            user: data.user,
            alias: aliasData.data.alias,
          });
        },
      });
    },
  });
}

/**
 * Get aliases from user
 * @param {Object} params - Parameter
 * @param {Object} params.userId - ID of the user to retrieve aliases for
 * @param {Object} params.token - jwt
 * @param {Function} params.callback - Callback
 */
function getAliases({ token, callback, userId }) {
  authenticator.isUserAllowed({
    token,
    matchToId: userId,
    commandName: dbConfig.apiCommands.GetAliases.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbAlias.getAliasesByUser({
        user: data.user,
        callback: (aliasData) => {
          if (aliasData.error) {
            callback({ error: aliasData.error });

            return;
          }

          hasAccessToAlias({
            callback,
            user: data.user,
            alias: aliasData.data.alias,
          });
        },
      });
    },
  });
}

exports.getAliasByName = getAliasByName;
exports.getAlias = getAlias;
exports.createAlias = createAlias;
exports.getAliases = getAliases;
