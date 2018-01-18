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

const authenticator = require('../helpers/authenticator');
const dbGameCode = require('../db/connectors/gameCode');
const errorCreator = require('../objects/error/errorCreator');
const dbConfig = require('../config/defaults/config').databasePopulation;
const appConfig = require('../config/defaults/config').app;
const transactionManager = require('../managers/transactions');
const aliasManager = require('./aliases');
const textTools = require('../utils/textTools');
const docFileManager = require('./docFiles');

/**
 * Get game code by code and check if the user has access to it.
 * @param {Object} params - Parameters.
 * @param {Object} params.user - User retrieving the alias.
 * @param {string} params.gameCodeId - Id of the game code to retrieve.
 * @param {Function} params.callback - Callback.
 * @param {string} [params.errorContentText] - Text to be printed on error.
 * @param {boolean} [params.shouldBeAdmin] - Does the user have to be an admin?
 */
function getAccessibleGameCode({
  user,
  gameCodeId,
  callback,
  shouldBeAdmin,
  full,
  errorContentText = `gameCode ${gameCodeId}`,
}) {
  dbGameCode.getGameCodeById({
    gameCodeId,
    full: true,
    callback: (gameCodeData) => {
      if (gameCodeData.error) {
        callback({ error: gameCodeData.error });

        return;
      } else if (!authenticator.hasAccessTo({
        shouldBeAdmin,
        toAuth: user,
        objectToAccess: gameCodeData.data.gameCode,
      })) {
        callback({ error: new errorCreator.NotAllowed({ name: errorContentText }) });

        return;
      }

      const foundGameCode = gameCodeData.data.gameCode;
      const filteredGameCode = {
        objectId: foundGameCode.objectId,
        code: foundGameCode.code,
        codeContent: foundGameCode.codeContent,
        codeType: foundGameCode.codeType,
        lastUpdated: foundGameCode.lastUpdated,
        used: foundGameCode.used,
        ownerId: foundGameCode.ownerId,
        ownerAliasId: foundGameCode.ownerAliasId,
      };

      callback({ data: { gameCode: full ? foundGameCode : filteredGameCode } });
    },
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
  userId,
  gameCode,
  callback,
  io,
}) {
  const dataToSend = {
    data: {
      ownerId: gameCode.ownerAliasId || gameCode.ownerId,
      codeType: gameCode.codeType,
      content: {},
    },
  };

  switch (gameCode.codeType) {
    case dbConfig.GameCodeTypes.TRANSACTION: {
      // TODO Fix after transaction manager
      transactionManager.createTransaction({
        io,
        ownerId: gameCode.ownerId,
        transaction: {
          toWalletId: userId,
          fromWalletId: gameCode.ownerAliasId || gameCode.ownerId,
          amount: appConfig.gameCodeAmount,
        },
        emitToSender: true,
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
        code: gameCode.codeContent[0],
        callback: ({ error, data }) => {
          if (error) {
            callback({ error });

            return;
          }

          dataToSend.data.docFile = data.docFile;

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
      callback({ error: new errorCreator.InvalidData({ name: `codeType ${gameCode.codeType}` }) });

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

      const createCallback = (gameCodeToSave) => {
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

            callback(dataToSend);
          },
        });
      };

      const { user } = data;
      const gameCodeToSave = gameCode;
      gameCodeToSave.ownerId = user.objectId;
      gameCodeToSave.code = (gameCodeToSave.code || textTools.generateTextCode()).toLowerCase();

      if (gameCodeToSave.ownerAliasId) {
        aliasManager.getAccessibleAlias({
          user,
          aliasId: gameCodeToSave.ownerAliasId,
          callback: (aliasData) => {
            if (aliasData.error) {
              callback({ error: aliasData.error });

              return;
            }

            createCallback(gameCodeToSave);
          },
        });

        return;
      }

      createCallback(gameCodeToSave);
    },
  });
}

/**
 * Get a game code by Id.
 * @param {Object} params - Parameters.
 * @param {string} params.token - jwt.
 * @param {Function} params.callback - Callback.
 * @param {string} params.gameCodeId - Code of the game code.
 * @param {boolean} [params.full] - Should the complete object be returned?
 */
function getGameCodeById({
  token,
  callback,
  gameCodeId,
  full,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetGameCode.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user } = data;

      getAccessibleGameCode({
        user,
        gameCodeId,
        full,
        callback,
        shouldBeAdmin: full && dbConfig.apiCommands.GetFull.accessLevel > user.accessLevel,
      });
    },
  });
}

/**
 * Get game codes by owner.
 * @param {Object} params - Parameters.
 * @param {string} params.token - jwt.
 * @param {Function} params.callback - Callback.
 */
function getGameCodesByOwner({ token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetGameCode.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user } = data;

      dbGameCode.getGameCodesByOwner({
        ownerId: user.objectId,
        callback: (gameCodeData) => {
          if (gameCodeData.error) {
            callback({ error: gameCodeData.error });

            return;
          }

          callback(gameCodeData);
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
 * @param {Object} [params.socket] - Socket io.
 */
function useGameCode({
  socket,
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

      dbGameCode.getGameCodeById({
        code,
        callback: (gameCodeData) => {
          if (gameCodeData.error) {
            callback({ error: gameCodeData.error });

            return;
          } else if (gameCodeData.data.gameCode.ownerId === data.user.objectId) {
            callback({ error: new errorCreator.NotAllowed({ name: 'useGameCode on yourself' }) });

            return;
          }

          dbGameCode.removeGameCode({
            code,
            callback: (removeData) => {
              if (removeData.error) {
                callback({ error: removeData.error });

                return;
              }

              const usedGameCode = gameCodeData.data.gameCode;

              triggerUnlockedContent({
                token,
                userId: data.user.objectId,
                gameCode: usedGameCode,
                callback: (unlockedData) => {
                  if (unlockedData.error) {
                    callback({ error: unlockedData.error });

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
                      callback: (createData) => {
                        if (createData.error) {
                          callback({ error: createData.error });

                          return;
                        }

                        dataToOwner.data.newGameCode = createData.data.gameCode;

                        if (socket) {
                          socket.to(usedGameCode.ownerId).emit(dbConfig.EmitTypes.GAMECODE, dataToOwner);
                        } else {
                          io.to(usedGameCode.ownerId).emit(dbConfig.EmitTypes.GAMECODE, dataToOwner);
                        }
                      },
                    });
                  } else if (socket) {
                    socket.to(usedGameCode.ownerId).emit(dbConfig.EmitTypes.GAMECODE, dataToOwner);
                  } else {
                    io.to(usedGameCode.ownerId).emit(dbConfig.EmitTypes.GAMECODE, dataToOwner);
                  }

                  callback(unlockedData.data);
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
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.RemoveGameCode.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user } = data;

      getAccessibleGameCode({
        gameCodeId,
        user,
        shouldBeAdmin: true,
        callback: (gameCodeData) => {
          if (gameCodeData.error) {
            callback({ error: gameCodeData.error });

            return;
          }

          dbGameCode.removeGameCode({
            gameCodeId,
            callback: ({ error: removeError }) => {
              if (removeError) {
                callback({ error: removeError });

                return;
              }

              const dataToSend = {
                data: {
                  gameCode: { objectId: gameCodeId },
                  changeType: dbConfig.ChangeTypes.REMOVE,
                },
              };

              callback(dataToSend);
            },
          });
        },
      });
    },
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
  callback,
  gameCodeId,
  gameCode,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.UpdateGameCode.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user } = data;

      getAccessibleGameCode({
        gameCodeId,
        user,
        shouldBeAdmin: true,
        callback: ({ error: gameCodeError }) => {
          if (gameCodeError) {
            callback({ error: gameCodeError });

            return;
          }

          dbGameCode.updateGameCode({
            gameCodeId,
            gameCode,
            callback: ({ error: updateError, data: updateData }) => {
              if (updateError) {
                callback({ error: updateError });

                return;
              }

              const updatedGameCode = updateData.gameCode;

              const dataToSend = {
                data: {
                  gameCode: updatedGameCode,
                  changeType: dbConfig.ChangeTypes.UPDATE,
                },
              };

              callback(dataToSend);
            },
          });
        },
      });
    },
  });
}

exports.createGameCode = createGameCode;
exports.useGameCode = useGameCode;
exports.removeGameCode = removeGameCode;
exports.getGameCodesByOwner = getGameCodesByOwner;
exports.getProfileGameCode = getProfileGameCode;
exports.updateGameCode = updateGameCode;
exports.getGameCodeById = getGameCodeById;
