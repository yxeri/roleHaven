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
const { appConfig, dbConfig } = require('../config/defaults/config');
const errorCreator = require('../error/errorCreator');
const textTools = require('../utils/textTools');
const authenticator = require('../helpers/authenticator');
const dbRoom = require('../db/connectors/room');
const socketUtils = require('../utils/socketIo');
const dbWallet = require('../db/connectors/wallet');

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
  full,
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
        shouldBeAdmin,
        toAuth: user,
        objectToAccess: aliasData.data.alias,
      })) {
        callback({ error: new errorCreator.NotAllowed({ name: errorContentText }) });

        return;
      }

      const foundAlias = aliasData.data.alias;
      const filteredAlias = {
        objectId: foundAlias.objectId,
        aliasName: foundAlias.aliasName,
        lastUpdated: foundAlias.lastUpdated,
      };

      callback({
        data: {
          alias: full ? foundAlias : filteredAlias,
        },
      });
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

      const { user } = data;

      const aliasToSave = alias;
      aliasToSave.ownerId = user.objectId;

      dbAlias.createAlias({
        alias: aliasToSave,
        callback: ({ error: aliasError, data: aliasData }) => {
          if (aliasError) {
            callback({ error: aliasError });

            return;
          }

          const createdAlias = aliasData.alias;

          dbRoom.createRoom({
            options: { setId: true },
            room: {
              ownerId: user.objectId,
              roomName: createdAlias.objectId,
              roomId: createdAlias.objectId,
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

              const wallet = {
                walletId: createdAlias.objectId,
                ownerId: user.objectId,
                ownerAliasId: createdAlias.objectId,
                amount: appConfig.defaultWalletAmount,
              };
              const walletOptions = { setId: true };

              dbWallet.createWallet({
                wallet,
                options: walletOptions,
                callback: ({ error: walletError, data: walletData }) => {
                  if (walletError) {
                    callback({ error: walletError });

                    return;
                  }

                  const newWallet = walletData.wallet;
                  const newRoom = roomData.room;
                  const dataToSend = {
                    data: {
                      user: {
                        userId: createdAlias.objectId,
                        username: createdAlias.aliasName,
                      },
                      changeType: dbConfig.ChangeTypes.CREATE,
                    },
                  };
                  const creatorDataToSend = {
                    data: {
                      wallet: newWallet,
                      room: newRoom,
                      alias: createdAlias,
                      changeType: dbConfig.ChangeTypes.CREATE,
                    },
                  };

                  if (socket) {
                    socket.broadcast.emit(dbConfig.EmitTypes.USER, dataToSend);
                  } else {
                    const userSocket = socketUtils.getUserSocket({ io, socketId: user.socketId });

                    if (userSocket) { userSocket.join(newRoom.objectId); }

                    io.to(user.objectId).emit(dbConfig.EmitTypes.ALIAS, creatorDataToSend);
                    io.emit(dbConfig.EmitTypes.USER, dataToSend);
                  }

                  callback(creatorDataToSend);
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
 * Get alias by its name.
 * @param {Object} params - Parameter.
 * @param {string} params.token - jwt.
 * @param {string} params.aliasName - Name of the alias.
 * @param {Function} params.callback - Callback.
 */
function getAliasByName({
  token,
  aliasName,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
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
 * Get alias by Id.
 * @param {Object} params - Parameter.
 * @param {string} params.token - jwt.
 * @param {string} params.aliasId - Id of the alias.
 * @param {Function} params.callback - Callback.
 */
function getAliasById({
  token,
  aliasId,
  callback,
  full,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetAliases.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user } = data;

      getAccessibleAlias({
        aliasId,
        callback,
        user,
        full,
        shouldBeAdmin: full && dbConfig.apiCommands.GetFull.accessLevel > user.accessLevel,
        errorContentText: `get alias by id ${aliasId}`,
      });
    },
  });
}

/**
 * Get aliases that the user has access to.
 * @param {Object} params - Parameter.
 * @param {Object} params.token - jwt.
 * @param {Function} params.callback - Callback.
 */
function getAliasesByUser({
  token,
  full,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: full ? dbConfig.apiCommands.GetFull.name : dbConfig.apiCommands.GetAliases.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user } = data;

      dbAlias.getAliasesByUser({
        callback,
        full,
        user,
      });
    },
  });
}

/**
 * Remove alias.
 * @param {Object} params - Parameter.
 * @param {Object} params.token - jwt.
 * @param {Function} params.callback - Callback.
 * @param {Object} params.io - Socket io. Will be used if socket is not set.
 * @param {Object} [params.socket] - Socket io.
 */
function removeAlias({
  token,
  callback,
  aliasId,
  socket,
  io,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.RemoveAlias.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user } = data;

      getAccessibleAlias({
        aliasId,
        user,
        shouldBeAdmin: true,
        errorContentText: `remove alias by id ${aliasId}`,
        callback: (aliasData) => {
          if (aliasData.error) {
            callback({ error: aliasData.error });

            return;
          }

          dbAlias.removeAlias({
            aliasId,
            fullRemoval: true,
            callback: (removeData) => {
              if (removeData.error) {
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

                  const removedAlias = aliasData.data.alias;
                  const removedAliasId = removedAlias.objectId;

                  const dataToSend = {
                    data: {
                      user: { objectId: removedAliasId },
                      changeType: dbConfig.ChangeTypes.REMOVE,
                    },
                  };
                  const creatorDataToSend = {
                    data: {
                      alias: removedAlias,
                      changeType: dbConfig.ChangeTypes.REMOVE,
                    },
                  };

                  socketUtils.getSocketsByRoom({ io, roomId: removedAliasId }).forEach(roomSocket => roomSocket.leave(removedAliasId));

                  if (socket) {
                    socket.to(removedAliasId).broadcast.emit(dbConfig.EmitTypes.ALIAS, creatorDataToSend);
                    socket.broadcast.emit(dbConfig.EmitTypes.USER, dataToSend);
                  } else {
                    io.to(removedAliasId).emit(dbConfig.EmitTypes.ALIAS, creatorDataToSend);
                    io.emit(dbConfig.EmitTypes.USER, dataToSend);
                  }

                  callback(creatorDataToSend);
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
 * @param {Object} params.token - jwt.
 * @param {Function} params.callback - Callback.
 * @param {Object} params.aliasId - Id of the alias to update.
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
  socket,
  io,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.UpdateAlias.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user } = data;

      getAccessibleAlias({
        aliasId,
        user,
        shouldBeAdmin: true,
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
              const dataToSend = {
                data: {
                  user: {
                    userId: updatedAlias.objectId,
                    username: updatedAlias.aliasName,
                  },
                  changeType: dbConfig.ChangeTypes.UPDATE,
                },
              };

              if (socket) {
                socket.broadcast.emit(dbConfig.EmitTypes.USER, dataToSend);
                socket.broadcast.to(updatedAlias.objectId).emit(dbConfig.EmitTypes.ALIAS, aliasDataToSend);
              } else {
                io.emit(dbConfig.EmitTypes.USER, dataToSend);
                io.to(updatedAlias.objectId).emit(dbConfig.EmitTypes.ALIAS, aliasDataToSend);
              }

              callback(aliasDataToSend);
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
 * @param {string} params.aliasId - Id of the alias.
 * @param {string[]} [params.userIds] - Id of the users.
 * @param {string[]} [params.teamIds] - Id of the teams.
 * @param {string[]} [params.bannedIds] - Id of the blocked Ids to add.
 * @param {string[]} [params.teamAdminIds] - Id of the teams to give admin access to. They will also be added to teamIds.
 * @param {string[]} [params.userAdminIds] - Id of the users to give admin access to. They will also be added to userIds.
 * @param {Function} params.callback - Callback.
 */
function addAccess({
  token,
  aliasId,
  teamAdminIds,
  userAdminIds,
  userIds,
  teamIds,
  bannedIds,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.UpdateAlias.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user } = data;

      getAccessibleAlias({
        aliasId,
        user,
        shouldBeAdmin: true,
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
 * @param {string[]} [params.teamAdminIds] - Id of the teams to remove admin access from. They will not be removed from teamIds.
 * @param {string[]} [params.userAdminIds] - Id of the users to remove admin access from. They will not be removed from userIds.
 * @param {Function} params.callback - Callback.
 */
function removeAccess({
  token,
  aliasId,
  teamAdminIds,
  userAdminIds,
  userIds,
  teamIds,
  bannedIds,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.UpdateAlias.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user } = data;

      getAccessibleAlias({
        aliasId,
        user,
        shouldBeAdmin: true,
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
exports.getAliasById = getAliasById;
exports.getAliasesByUser = getAliasesByUser;
exports.getAccessibleAlias = getAccessibleAlias;
