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

const authenticator = require('../helpers/authenticator');
const dbGameCode = require('../db/connectors/gameCode');
const errorCreator = require('../error/errorCreator');
const { appConfig, dbConfig } = require('../config/defaults/config');
const transactionManager = require('../managers/transactions');
const textTools = require('../utils/textTools');
const docFileManager = require('./docFiles');
const managerHelper = require('../helpers/manager');

/**
 * Get a game code by Id.
 * @param {Object} params - Parameters.
 * @param {string} params.token - jwt.
 * @param {Function} params.callback - Callback.
 * @param {string} params.gameCodeId - Code of the game code.
 */
function getGameCodeById({
  token,
  callback,
  gameCodeId,
}) {
  managerHelper.getObjectById({
    token,
    callback,
    objectId: gameCodeId,
    objectType: 'gameCode',
    objectIdType: 'gameCodeId',
    dbCallFunc: dbGameCode.getGameCodeById,
    commandName: dbConfig.apiCommands.GetGameCode.name,
  });
}

/**
 * Send data to client based on code type.
 * @param {Object} params - Parameters.
 * @param {Object} params.gameCode - Game code that has been used.
 * @param {string} params.token - jwt.
 * @param {Function} params.callback - Callback.
 * @param {Object} params.io - Socket.io.
 */
function triggerUnlockedContent({
  token,
  gameCode,
  callback,
  io,
  user,
  socket,
}) {
  const dataToSend = {
    data: {
      gameCode: {
        ownerId: gameCode.ownerAliasId || gameCode.ownerId,
        codeType: gameCode.codeType,
        content: {},
      },
    },
  };

  switch (gameCode.codeType) {
    case dbConfig.GameCodeTypes.TRANSACTION: {
      // TODO Fix after transaction manager
      transactionManager.createTransaction({
        io,
        socket,
        transaction: {
          ownerId: gameCode.ownerId,
          toWalletId: user.objectId,
          fromWalletId: gameCode.ownerAliasId || gameCode.ownerId,
          amount: appConfig.gameCodeAmount,
        },
        callback: ({ error, data }) => {
          if (error) {
            callback({ error });

            return;
          }

          dataToSend.content.transaction = data.transaction;

          callback(dataToSend);
        },
      });

      break;
    }
    case dbConfig.GameCodeTypes.DOCFILE: {
      docFileManager.unlockDocFile({
        token,
        io,
        aliasId: gameCode.ownerAliasId,
        internalCallUser: user,
        code: gameCode.codeContent[0],
        callback: ({ error, data }) => {
          if (error) {
            callback({ error });

            return;
          }

          dataToSend.data.content.docFile = data.docFile;

          callback(dataToSend);
        },
      });

      break;
    }
    case dbConfig.GameCodeTypes.TEXT: {
      dataToSend.data.text = gameCode.codeContent;

      callback(dataToSend);

      break;
    }
    default: {
      callback({ error: new errorCreator.InvalidData({ name: `Unlock game code content. User: ${user.obj}. Game code: ${gameCode.objectId}. CodeType: ${gameCode.codeType}` }) });

      break;
    }
  }
}

/**
 * Create game code.
 * @param {Object} params - Parameters.
 * @param {string} params.gameCode - Game code to save.
 * @param {string} params.token - jwt.
 * @param {Function} params.callback - Callback.
 */
function createGameCode({
  gameCode,
  token,
  io,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.CreateGameCode.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user: authUser } = data;
      const gameCodeToSave = gameCode;
      gameCodeToSave.ownerId = authUser.objectId;
      gameCodeToSave.code = (gameCodeToSave.code || textTools.generateTextCode()).toLowerCase();

      if (gameCodeToSave.ownerAliasId && !authUser.aliases.includes(gameCodeToSave.ownerAliasId)) {
        callback({ error: new errorCreator.NotAllowed({ name: `${dbConfig.apiCommands.CreateGameCode.name}. User: ${authUser.objectId}. Access game code with alais ${gameCodeToSave.ownerAliasId}` }) });

        return;
      }

      dbGameCode.createGameCode({
        gameCode: gameCodeToSave,
        callback: (gameCodeData) => {
          if (gameCodeData.error) {
            callback({ error: gameCodeData.error });

            return;
          }

          const dataToSend = {
            data: {
              gameCode: gameCodeData.data.gameCode,
              changeType: dbConfig.ChangeTypes.CREATE,
            },
          };

          io.to(authUser.objectId).emit(dbConfig.EmitTypes.GAMECODE, dataToSend);

          callback(dataToSend);
        },
      });
    },
  });
}

/**
 * Use game code.
 * @param {Object} params - Parameters.
 * @param {Object} params.io - Socket io. Will be used if socket is not set.
 * @param {string} params.code - Code for a game code.
 * @param {string} params.token - jwt.
 * @param {Function} params.callback - Callback.
 */
function useGameCode({
  io,
  code,
  token,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.UseGameCode.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user: authUser } = data;

      dbGameCode.getGameCodeById({
        code,
        callback: ({ error: getError, data: getData }) => {
          if (getError) {
            callback({ error: getError });

            return;
          } else if (getData.gameCode.ownerId === authUser.objectId) {
            callback({ error: new errorCreator.NotAllowed({ name: 'useGameCode on yourself' }) });

            return;
          }

          dbGameCode.removeGameCode({
            code,
            callback: ({ error: removeError }) => {
              if (removeError) {
                callback({ error: removeError });

                return;
              }

              const { gameCode: usedGameCode } = getData;

              triggerUnlockedContent({
                token,
                user: authUser,
                gameCode: usedGameCode,
                callback: ({ error: unlockError, data: unlockData }) => {
                  if (unlockError) {
                    callback({ error: unlockError });

                    return;
                  }

                  const dataToOwner = {
                    data: {
                      gameCode: usedGameCode,
                      changeType: dbConfig.ChangeTypes.REMOVE,
                    },
                  };

                  if (usedGameCode.isRenewable) {
                    dbGameCode.createGameCode({
                      gameCode: {
                        ownerId: usedGameCode.ownerId,
                        ownerAliasId: usedGameCode.ownerAliasId,
                        codeType: usedGameCode.codeType,
                        codeContent: usedGameCode.codeContent,
                        isRenewable: true,
                      },
                      callback: ({ error: createError, data: createData }) => {
                        if (createError) {
                          callback({ error: createError });

                          return;
                        }

                        dataToOwner.data.newGameCode = createData.gameCode;

                        io.to(usedGameCode.ownerId).emit(dbConfig.EmitTypes.GAMECODE, dataToOwner);
                      },
                    });

                    callback({ data: unlockData });

                    return;
                  }

                  io.to(usedGameCode.ownerId).emit(dbConfig.EmitTypes.GAMECODE, dataToOwner);

                  callback({ data: unlockData });
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
 * Remove game code.
 * @param {Object} params - Parameters.
 * @param {string} params.gameCodeId - Id of the game code.
 * @param {Object} params.token - jwt.
 * @param {Function} params.callback - Callback.
 */
function removeGameCode({
  gameCodeId,
  token,
  io,
  callback,
  socket,
}) {
  managerHelper.removeObject({
    callback,
    token,
    io,
    socket,
    getDbCallFunc: dbGameCode.getGameCodeById,
    getCommandName: dbConfig.apiCommands.GetGameCode.name,
    objectId: gameCodeId,
    commandName: dbConfig.apiCommands.RemoveGameCode.name,
    objectType: 'gameCode',
    dbCallFunc: dbGameCode.removeGameCode,
    emitType: dbConfig.EmitTypes.GAMECODE,
    objectIdType: 'gameCodeId',
  });
}

/**
 * Get user's profile code.
 * @param {Object} params - Parameters.
 * @param {string} params.ownerId - Id of the owner of the code.
 * @param {Function} params.callback - Callback.
 * @param {string} params.token - jwt.
 */
function getProfileGameCode({
  ownerId,
  callback,
  token,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetGameCode.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbGameCode.getProfileGameCode({
        ownerId,
        callback,
      });
    },
  });
}

/**
 * Update a game code.
 * @param {Object} params - Parameters.
 * @param {string} params.token - jwt.
 * @param {Function} params.callback - Callback.
 * @param {string} params.gameCodeId - Id of the game code.
 * @param {Object} params.gameCode - Game code parameters to update.
 */
function updateGameCode({
  token,
  io,
  callback,
  gameCodeId,
  gameCode,
  options,
  socket,
}) {
  managerHelper.updateObject({
    callback,
    options,
    token,
    io,
    socket,
    toStrip: [
      'codeContent',
      'code',
    ],
    objectId: gameCodeId,
    object: gameCode,
    commandName: dbConfig.apiCommands.UpdateGameCode.name,
    objectType: 'gameCode',
    dbCallFunc: dbGameCode.updateGameCode,
    emitType: dbConfig.EmitTypes.GAMECODE,
    objectIdType: 'gameCodeId',
    getDbCallFunc: dbGameCode.getGameCodeById,
    getCommandName: dbConfig.apiCommands.GetGameCode.name,
  });
}

/**
 * Get game codes.
 * @param {Object} params - Parameters.
 * @param {string} params.token - jwt.
 * @param {Function} params.callback - Callback.
 */
function getGameCodesByUser({
  token,
  callback,
}) {
  managerHelper.getObjects({
    callback,
    token,
    shouldSort: true,
    commandName: dbConfig.apiCommands.GetGameCode.name,
    objectsType: 'gameCodes',
    dbCallFunc: dbGameCode.getGameCodesByUser,
  });
}

exports.createGameCode = createGameCode;
exports.useGameCode = useGameCode;
exports.removeGameCode = removeGameCode;
exports.getProfileGameCode = getProfileGameCode;
exports.updateGameCode = updateGameCode;
exports.getGameCodeById = getGameCodeById;
exports.getGameCodesByUser = getGameCodesByUser;
