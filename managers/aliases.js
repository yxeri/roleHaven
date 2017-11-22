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
 * Get alias by ID and check if the user has access to it.
 * @param {Object} params - Parameters.
 * @param {Object} params.user - User retrieving the alias.
 * @param {string} params.aliasId - ID of the alias to retrieve.
 * @param {Function} params.callback - Callback.
 * @param {string} [params.errorContentText] - Text to be printed on error.
 * @param {boolean} [params.shouldBeAdmin] - Does the user have to be an admin?
 */
function getAccessibleAlias({
  user,
  aliasId,
  callback,
  shouldBeAdmin,
  errorContentText = `aliasId ${aliasId}`,
}) {
  dbAlias.getAliasById({
    aliasId,
    callback: (aliasData) => {
      if (aliasData.error) {
        callback({ error: aliasData.error });

        return;
      } else if (!authenticator.hasAccessTo({
        toAuth: user,
        shouldBeAdmin,
        objectToAccess: aliasData.data.alias,
      })) {
        callback({ error: new errorCreator.NotAllowed({ name: errorContentText }) });

        return;
      }

      callback(aliasData);
    },
  });
}

/**
 * Create and add alias to user.
 * @param {Object} params - Parameter.
 * @param {Object} params.alias - Alias to add.
 * @param {Object} [params.socket] - Socket io.
 * @param {Object} [params.io] - Socket io. Will be used if socket is not set.
 * @param {Function} params.callback - Callback.
 */
function createAlias({
  token,
  socket,
  io,
  alias,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.CreateAlias.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (alias.aliasName.length > appConfig.usernameMaxLength) {
        callback({ error: new errorCreator.InvalidCharacters({ name: `Username length: ${appConfig.usernameMaxLength}` }) });

        return;
      } else if (!textTools.hasAllowedText(alias.aliasName)) {
        callback({ error: new errorCreator.InvalidCharacters({ name: 'alias name', expected: 'a-z 0-9' }) });

        return;
      }

      const authUser = data.user;

      const aliasToSave = alias;
      aliasToSave.ownerId = authUser.userId;

      dbAlias.createAlias({
        alias: aliasToSave,
        callback: ({ error: aliasError, data: aliasData }) => {
          if (aliasError) {
            callback({ error: aliasError });

            return;
          }

          const createdAlias = aliasData.alias;

          dbRoom.createRoom({
            options: { shouldSetIdToName: true },
            room: {
              ownerId: authUser.userId,
              roomName: createdAlias.aliasId,
              accessLevel: dbConfig.AccessLevels.SUPERUSER,
              visibility: dbConfig.AccessLevels.SUPERUSER,
              isWhisper: true,
              nameIsLocked: true,
            },
            callback: ({ error: roomError, data: roomData }) => {
              if (roomError) {
                callback({ error: roomError });

                return;
              }

              const newRoom = roomData.data.room;
              const dataToSend = {
                data: {
                  user: {
                    userId: createdAlias.aliasId,
                    username: createdAlias.aliasName,
                  },
                  changeType: dbConfig.ChangeTypes.CREATE,
                },
              };

              if (socket) {
                socket.broadcast.emit(dbConfig.EmitTypes.USER, dataToSend);
              } else {
                io.to(newRoom.roomId).emit(dbConfig.EmitTypes.FOLLOW, { data: { room: newRoom } });
                io.emit(dbConfig.EmitTypes.USER, dataToSend);
              }

              callback({ data: { room: newRoom, alias: createdAlias } });
            },
          });
        },
      });
    },
  });
}

/**
 * Get alias by its name.
 * @param {Object} params - Parameter.
 * @param {string} params.token - jwt.
 * @param {string} params.aliasName - Name of the alias.
 * @param {Function} params.callback - Callback.
 * @param {string} [params.userId] - ID of the user that is retrieving the alias.
 */
function getAliasByName({
  token,
  aliasName,
  callback,
  userId,
}) {
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
          } else if (!authenticator.hasAccessTo({
            toAuth: data.user,
            objectToAccess: aliasData.data.alias,
          })) {
            callback({ error: new errorCreator.NotAllowed({ name: `get alias by name ${aliasName}` }) });

            return;
          }

          callback(aliasData);
        },
      });
    },
  });
}

/**
 * Get alias.
 * @param {Object} params - Parameter.
 * @param {string} params.token - jwt.
 * @param {string} params.aliasId - ID of the alias.
 * @param {Function} params.callback - Callback.
 * @param {Object} params.userId - ID of the user to retrieve alias with.
 */
function getAlias({
  token,
  aliasId,
  callback,
  userId,
}) {
  authenticator.isUserAllowed({
    token,
    matchToId: userId,
    commandName: dbConfig.apiCommands.GetAliases.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      getAccessibleAlias({
        aliasId,
        callback,
        errorContentText: `get alias by id ${aliasId}`,
        user: data.user,
      });
    },
  });
}

/**
 * Get aliases by user.
 * @param {Object} params - Parameter.
 * @param {Object} params.userId - ID of the user to retrieve aliases for.
 * @param {Object} params.token - jwt.
 * @param {Function} params.callback - Callback.
 */
function getAliasesByUser({ token, callback, userId }) {
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
        callback,
        userId: data.user.userId,
      });
    },
  });
}

/**
 * Remove alias.
 * @param {Object} params - Parameter.
 * @param {Object} params.userId - ID of the user to retrieve aliases for.
 * @param {Object} params.token - jwt.
 * @param {Function} params.callback - Callback.
 * @param {Object} params.io - Socket io. Will be used if socket is not set.
 * @param {Object} [params.socket] - Socket io.
 */
function removeAlias({
  token,
  callback,
  userId,
  aliasId,
  socket,
  io,
}) {
  authenticator.isUserAllowed({
    token,
    matchToId: userId,
    commandName: dbConfig.apiCommands.RemoveAlias,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      getAccessibleAlias({
        aliasId,
        shouldBeAdmin: true,
        user: data.user,
        errorContentText: `remove alias by id ${aliasId}`,
        callback: (aliasData) => {
          if (aliasData.error) {
            callback({ error: aliasData.error });
          }

          dbAlias.removeAlias({
            aliasId,
            fullRemoval: true,
            callback: (removeData) => {
              if (removeData) {
                callback({ error: removeData.error });

                return;
              }

              dbRoom.removeRoom({
                roomId: aliasId,
                callback: (removeRoomData) => {
                  if (removeRoomData.error) {
                    callback({ error: removeRoomData.error });

                    return;
                  }

                  const removedAliasId = aliasData.data.alias.aliasId;

                  const dataToSend = {
                    data: {
                      user: { userId: removedAliasId },
                      room: { roomId: removedAliasId },
                      changeType: dbConfig.ChangeTypes.REMOVE,
                    },
                  };

                  if (socket) {
                    socket.broadcast.emit(dbConfig.EmitTypes.USER, dataToSend);
                  } else {
                    io.emit(dbConfig.EmitTypes.USER, dataToSend);
                  }

                  callback(dataToSend);
                },
              });
            },
          });
        },
      });
    },
  });
}

/**
 * Update alias.
 * @param {Object} params - Parameter.
 * @param {Object} params.userId - ID of the user to retrieve aliases for.
 * @param {Object} params.token - jwt.
 * @param {Function} params.callback - Callback.
 * @param {Object} params.aliasId - ID of the alias to update.
 * @param {Object} params.alias - Alias parameters to update.
 * @param {Object} params.io - Socket io. Will be used if socket is not set.
 * @param {Object} [params.options] - Alias update options.
 * @param {Object} [params.socket] - Socket io.
 */
function updateAlias({
  token,
  callback,
  alias,
  options,
  aliasId,
  userId,
  socket,
  io,
}) {
  authenticator.isUserAllowed({
    token,
    matchToId: userId,
    commandName: dbConfig.apiCommands.UpdateAlias,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const authUser = data.user;

      getAccessibleAlias({
        aliasId,
        shouldBeAdmin: true,
        user: authUser,
        errorContentText: `update alias id ${aliasId}`,
        callback: (aliasData) => {
          if (aliasData.error) {
            callback({ error: aliasData.error });

            return;
          }

          dbAlias.updateAlias({
            alias,
            options,
            aliasId,
            callback: (updateData) => {
              if (updateData.error) {
                callback({ error: updateData.error });

                return;
              }

              const updatedAlias = updateData.data.alias;
              const aliasDataToSend = {
                data: {
                  alias: updatedAlias,
                  changeType: dbConfig.ChangeTypes.UPDATE,
                },
              };

              if ((alias.aliasName && alias.aliasName !== updatedAlias.aliasName) || (typeof alias.isPublic === 'boolean' && alias.isPublic)) {
                const dataToSend = {
                  data: {
                    user: {
                      userId: updatedAlias.aliasId,
                      username: updatedAlias.aliasName,
                    },
                    changeType: dbConfig.ChangeTypes.UPDATE,
                  },
                };

                if (socket) {
                  socket.broadcast.emit(dbConfig.EmitTypes.USER, dataToSend);
                } else {
                  io.emit(dbConfig.EmitTypes.USER, dataToSend);
                }
              }

              if (socket) {
                socket.broadcast.to(updatedAlias.aliasId).emit(dbConfig.EmitTypes.ALIAS, aliasDataToSend);
              } else {
                io.to(updatedAlias.aliasId).emit(dbConfig.EmitTypes.ALIAS, aliasDataToSend);
              }

              callback(updateData);
            },
          });
        },
      });
    },
  });
}

/**
 * Add access to the alias for users or teams.
 * @param {Object} params - Parameters.
 * @param {string} params.aliasId - ID of the alias.
 * @param {string[]} [params.userIds] - ID of the users.
 * @param {string[]} [params.teamIds] - ID of the teams.
 * @param {string[]} [params.bannedIds] - ID of the blocked Ids to add.
 * @param {string[]} [params.teamAdminIds] - ID of the team admins to add.
 * @param {string[]} [params.userAdminIds] - ID of the user admins to add.
 * @param {Function} params.callback - Callback.
 */
function addAccess({
  token,
  aliasId,
  userId,
  teamAdminIds,
  userAdminIds,
  userIds,
  teamIds,
  bannedIds,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    matchToId: userId,
    commandName: dbConfig.apiCommands.UpdateAlias,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const authUser = data.user;

      getAccessibleAlias({
        aliasId,
        shouldBeAdmin: true,
        user: authUser,
        errorContentText: `add access alias id ${aliasId}`,
        callback: (aliasData) => {
          if (aliasData.error) {
            callback({ error: aliasData.error });

            return;
          }

          dbAlias.addAccess({
            userIds,
            teamIds,
            bannedIds,
            teamAdminIds,
            userAdminIds,
            aliasId,
            callback,
          });
        },
      });
    },
  });
}

/**
 * Remove access to the alias for user or team.
 * @param {Object} params - Parameters.
 * @param {string} params.aliasId - ID of the alias.
 * @param {string[]} [params.userIds] - ID of the users to remove.
 * @param {string[]} [params.teamIds] - ID of the teams to remove.
 * @param {string[]} [params.bannedIds] - Blocked IDs to remove.
 * @param {string[]} [params.teamAdminIds] - ID of the team admins to remove.
 * @param {string[]} [params.userAdminIds] - ID of the user admins to remove.
 * @param {Function} params.callback - Callback.
 */
function removeAccess({
  token,
  aliasId,
  userId,
  teamAdminIds,
  userAdminIds,
  userIds,
  teamIds,
  bannedIds,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    matchToId: userId,
    commandName: dbConfig.apiCommands.UpdateAlias,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const authUser = data.user;

      getAccessibleAlias({
        aliasId,
        shouldBeAdmin: true,
        user: authUser,
        errorContentText: `add access alias id ${aliasId}`,
        callback: (aliasData) => {
          if (aliasData.error) {
            callback({ error: aliasData.error });

            return;
          }

          dbAlias.removeAccess({
            userIds,
            teamIds,
            teamAdminIds,
            userAdminIds,
            bannedIds,
            callback,
            aliasId,
          });
        },
      });
    },
  });
}

exports.createAlias = createAlias;
exports.updateAlias = updateAlias;
exports.removeAlias = removeAlias;
exports.addAccess = addAccess;
exports.removeAccess = removeAccess;
exports.getAliasByName = getAliasByName;
exports.getAlias = getAlias;
exports.getAliases = getAliasesByUser;
exports.getAccessibleAlias = getAccessibleAlias;
