/*
 Copyright 2017 Carmilla Mina Jankovic

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
const managerHelper = require('../helpers/manager');

/**
 * Create and add alias to user.
 * @param {Object} params - Parameter.
 * @param {Object} params.alias - Alias to add.
 * @param {Object} [params.io] - Socket io.
 * @param {Function} params.callback - Callback.
 */
function createAlias({
  token,
  io,
  alias,
  socket,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.CreateAlias.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      if (alias.aliasName.length > appConfig.usernameMaxLength || alias.aliasName.length < appConfig.usernameMinLength) {
        callback({ error: new errorCreator.InvalidCharacters({ name: `Alias length: ${appConfig.usernameMinLength}-${appConfig.usernameMaxLength}` }) });

        return;
      }

      if (!textTools.hasAllowedText(alias.aliasName)) {
        callback({ error: new errorCreator.InvalidCharacters({ name: 'Alias', expected: 'a-z 0-9' }) });

        return;
      }

      const { user } = data;

      const aliasToSave = alias;
      aliasToSave.ownerId = user.objectId;
      aliasToSave.aliasName = textTools.trimSpace(aliasToSave.aliasName);
      aliasToSave.aliasNameLowerCase = aliasToSave.aliasName.toLowerCase();
      aliasToSave.isVerified = !appConfig.userVerify;

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
              objectId: createdAlias.objectId,
              ownerId: user.objectId,
              roomName: createdAlias.objectId,
              roomId: createdAlias.objectId,
              accessLevel: dbConfig.AccessLevels.SUPERUSER,
              visibility: dbConfig.AccessLevels.SUPERUSER,
              isUser: true,
              nameIsLocked: true,
            },
            callback: ({ error: roomError, data: roomData }) => {
              if (roomError) {
                callback({ error: roomError });

                return;
              }

              const wallet = {
                objectId: createdAlias.objectId,
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

                  const createdWallet = walletData.wallet;
                  const createdRoom = roomData.room;
                  const dataToSend = {
                    data: {
                      user: managerHelper.stripObject({ object: createdAlias }),
                      changeType: dbConfig.ChangeTypes.CREATE,
                    },
                  };
                  const creatorDataToSend = {
                    data: {
                      isSender: true,
                      wallet: createdWallet,
                      room: createdRoom,
                      alias: createdAlias,
                      changeType: dbConfig.ChangeTypes.CREATE,
                    },
                  };
                  const roomDataToSend = {
                    data: {
                      room: managerHelper.stripObject({ object: createdRoom }),
                      changeType: dbConfig.ChangeTypes.CREATE,
                    },
                  };

                  const walletDataToSend = {
                    data: {
                      wallet: managerHelper.stripObject({ object: createdWallet }),
                      changeType: dbConfig.ChangeTypes.CREATE,
                    },
                  };

                  if (socket) {
                    socket.join(createdAlias.objectId);
                  } else {
                    const userSocket = socketUtils.getUserSocket({ io, socketId: user.socketId });

                    if (userSocket) {
                      userSocket.join(createdAlias.objectId);
                    }

                    io.to(user.objectId).emit(dbConfig.EmitTypes.ALIAS, creatorDataToSend);
                  }

                  io.emit(dbConfig.EmitTypes.USER, dataToSend);
                  io.emit(dbConfig.EmitTypes.ROOM, roomDataToSend);
                  io.emit(dbConfig.EmitTypes.WALLET, walletDataToSend);

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
 * Get alias by Id or name.
 * @param {Object} params - Parameter.
 * @param {string} params.token - jwt.
 * @param {Function} params.callback - Callback.
 * @param {string} [params.aliasId] - Id of the alias.
 * @param {string} [params.aliasName] - Name of the alias.
 * @param {Object} [params.internalCallUser] - User to use on authentication. It will bypass token authentication.
 */
function getAliasById({
  token,
  aliasId,
  aliasName,
  callback,
  internalCallUser,
}) {
  authenticator.isUserAllowed({
    token,
    internalCallUser,
    commandName: dbConfig.apiCommands.GetAliases.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user } = data;

      dbAlias.getAliasById({
        aliasId,
        aliasName,
        callback: ({ error: getAliasError, data: getAliasData }) => {
          if (getAliasError) {
            callback({ error: getAliasError });

            return;
          }

          const { alias } = getAliasData;
          const {
            canSee,
            hasAccess,
          } = authenticator.hasAccessTo({
            objectToAccess: alias,
            toAuth: user,
          });

          if (!canSee) {
            callback({ error: errorCreator.NotAllowed({ name: `alias ${aliasName || aliasId}` }) });

            return;
          }

          if (!hasAccess) {
            callback({ data: { alias: managerHelper.stripObject({ object: alias }) } });

            return;
          }

          callback({ data: { alias } });
        },
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

      const { user: authUser } = data;

      dbAlias.getAliasesByUser({
        user: authUser,
        callback: ({ error: getAliasesError, data: getAliasesData }) => {
          if (getAliasesError) {
            callback({ error: getAliasesError });

            return;
          }

          const { aliases } = getAliasesData;
          const allAliases = aliases.filter((alias) => {
            const { canSee } = authenticator.hasAccessTo({
              toAuth: authUser,
              objectToAccess: alias,
            });

            return canSee;
          }).map((alias) => {
            const { hasFullAccess } = authenticator.hasAccessTo({
              toAuth: authUser,
              objectToAccess: alias,
            });

            if (!hasFullAccess) {
              return managerHelper.stripObject({ object: alias });
            }

            return alias;
          }).sort((a, b) => {
            const aName = a.aliasName;
            const bName = b.aliasName;

            if (aName < bName) {
              return -1;
            }

            if (aName > bName) {
              return 1;
            }

            return 0;
          });

          callback({ data: { aliases: allAliases } });
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
 */
function updateAlias({
  token,
  callback,
  alias,
  options,
  aliasId,
  io,
  socket,
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

      getAliasById({
        aliasId,
        token,
        callback: ({ error: aliasError, data: aliasData }) => {
          if (aliasError) {
            callback({ error: aliasError });

            return;
          }

          const { alias: foundAlias } = aliasData;
          const {
            hasFullAccess,
          } = authenticator.hasAccessTo({
            objectToAccess: foundAlias,
            toAuth: user,
          });

          if (!hasFullAccess) {
            callback({ error: new errorCreator.NotAllowed({ name: `alias ${aliasId}` }) });

            return;
          }

          dbAlias.updateAlias({
            alias,
            options,
            aliasId,
            callback: ({ error: updateAliasError, data: updateAliasData }) => {
              if (updateAliasError) {
                callback({ error: updateAliasError });

                return;
              }

              const { alias: updatedAlias } = updateAliasData;
              const aliasToSend = Object.assign({}, updatedAlias);
              aliasToSend.username = aliasToSend.aliasName;
              aliasToSend.aliasName = undefined;

              const aliasDataToSend = {
                data: {
                  isSender: true,
                  alias: updatedAlias,
                  changeType: dbConfig.ChangeTypes.UPDATE,
                },
              };
              const dataToSend = {
                data: {
                  user: managerHelper.stripObject({ object: aliasToSend }),
                  changeType: dbConfig.ChangeTypes.UPDATE,
                },
              };

              if (socket) {
                socket.broadcast.emit(dbConfig.EmitTypes.USER, dataToSend);
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
 * Update access to the alias for users or teams.
 * @param {Object} params - Parameters.
 * @param {string} params.aliasId - Id of the alias.
 * @param {Function} params.callback - Callback.
 * @param {boolean} [params.shouldRemove] - Should access be removed from the users or teams?
 * @param {string[]} [params.userIds] - Id of the users.
 * @param {string[]} [params.teamIds] - Id of the teams.
 * @param {string[]} [params.bannedIds] - Id of the blocked Ids to add.
 * @param {string[]} [params.teamAdminIds] - Id of the teams to change admin access for.
 * @param {string[]} [params.userAdminIds] - Id of the users to change admin access for.
 */
function updateAccess({
  token,
  aliasId,
  teamAdminIds,
  userAdminIds,
  userIds,
  teamIds,
  bannedIds,
  shouldRemove,
  io,
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

      getAliasById({
        aliasId,
        internalCallUser: user,
        callback: ({ error: aliasError, data: aliasData }) => {
          if (aliasError) {
            callback({ error: aliasError });

            return;
          }

          const { alias } = aliasData;

          const {
            hasFullAccess,
          } = authenticator.hasAccessTo({
            objectToAccess: alias,
            toAuth: user,
          });

          if (!hasFullAccess) {
            callback({ error: new errorCreator.NotAllowed({ name: `alias ${aliasId}` }) });

            return;
          }

          const dbFunc = shouldRemove
            ? dbAlias.removeAccess
            : dbAlias.addAccess;

          dbFunc({
            userIds,
            teamIds,
            bannedIds,
            teamAdminIds,
            userAdminIds,
            aliasId,
            callback: ({ error: accessError, data: accessData }) => {
              if (accessError) {
                callback({ error: accessError });

                return;
              }

              const { alias: updatedAlias } = accessData;

              const creatorDataToSend = {
                data: {
                  docFile: updatedAlias,
                  isSender: true,
                  changeType: dbConfig.ChangeTypes.UPDATE,
                },
              };
              const dataToSend = {
                data: {
                  docFile: managerHelper.stripObject({ object: updatedAlias }),
                  changeType: dbConfig.ChangeTypes.UPDATE,
                },
              };

              io.emit(dbConfig.EmitTypes.USER, dataToSend);
              io.to(updatedAlias.ownerId).emit(dbConfig.EmitTypes.USER, creatorDataToSend);

              callback(creatorDataToSend);
            },
          });
        },
      });
    },
  });
}

/**
 * Get all aliases.
 * @param {Object} params - Parameters.
 * @param {Object} params.token - Jwt.
 * @param {Object} [params.internalCallUser] - Skip authentication and instead use this user.
 * @param {Function} params.callback - Callback.
 */
function getAllAliases({
  token,
  internalCallUser,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    internalCallUser,
    commandName: dbConfig.apiCommands.GetFull.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbAlias.getAllAliases({ callback });
    },
  });
}

exports.createAlias = createAlias;
exports.updateAlias = updateAlias;
exports.getAliasById = getAliasById;
exports.getAliasesByUser = getAliasesByUser;
exports.updateAccess = updateAccess;
exports.getAllAliases = getAllAliases;
