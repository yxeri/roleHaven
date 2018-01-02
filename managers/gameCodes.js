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
 * @param {string} params.code - Code of the game code to retrieve.
 * @param {Function} params.callback - Callback.
 * @param {string} [params.errorContentText] - Text to be printed on error.
 * @param {boolean} [params.shouldBeAdmin] - Does the user have to be an admin?
 */
function getAccessibleGameCode({
  user,
  code,
  callback,
  shouldBeAdmin,
  errorContentText = `gameCode ${code}`,
}) {
  dbGameCode.getGameCodeByCode({
    code,
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

      callback(gameCodeData);
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
  userId,
  gameCode,
  token,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    matchToId: userId,
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

            callback(gameCodeData);
          },
        });
      };

      const { user } = data;
      const gameCodeToSave = gameCode;
      gameCodeToSave.ownerId = user.userId;
      gameCodeToSave.code = gameCodeToSave.code || textTools.generateTextCode();

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
 * Get game codes by owner.
 * @param {Object} params - Parameters.
 * @param {string} params.token - jwt.
 * @param {string} [params.userId] - ID of the user to auth and retrieve codes with.
 * @param {Function} params.callback - Callback.
 */
function getGameCodesByOwner({ token, userId, callback }) {
  authenticator.isUserAllowed({
    token,
    matchToId: userId,
    commandName: dbConfig.apiCommands.GetGameCode.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbGameCode.getGameCodesByOwner({
        ownerId: data.user.userId,
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

      dbGameCode.getGameCodeByCode({
        code,
        callback: (gameCodeData) => {
          if (gameCodeData.error) {
            callback({ error: gameCodeData.error });

            return;
          } else if (gameCodeData.data.gameCode.ownerId === data.user.userId) {
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
                userId: data.user.userId,
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
                        code: textTools.generateTextCode(),
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
 * @param {string} params.code - Code of the game code.
 * @param {Object} params.token - jwt.
 * @param {Function} params.callback - Callback.
 */
function removeGameCode({
  code,
  token,
  callback,
  userId,
}) {
  authenticator.isUserAllowed({
    token,
    matchToId: userId,
    commandName: dbConfig.apiCommands.RemoveGameCode.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user } = data;

      getAccessibleGameCode({
        code,
        user,
        callback: (gameCodeData) => {
          if (gameCodeData.error) {
            callback({ error: gameCodeData.error });

            return;
          }

          dbGameCode.removeGameCode({
            code,
            callback,
          });
        },
      });
    },
  });
}

/**
 * Get user's profile code.
 * @param {Object} params - Parameters.
 * @param {string} params.userId - Id of the user retrieving the code.
 * @param {string} params.ownerId - Id of the owner of the code.
 * @param {Function} params.callback - Callback.
 * @param {string} params.token - jwt.
 */
function getProfileGameCode({
  userId,
  ownerId,
  callback,
  token,
}) {
  authenticator.isUserAllowed({
    token,
    matchToId: userId,
    commandName: dbConfig.apiCommands.GetGameCode.commandName,
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
 * @param {string} params.code - Code of the game code.
 * @param {Object} params.gameCode - Game code parameters to update.
 * @param {string} [params.userId] - Id of the user updating the game code.
 */
function updateGameCode({
  token,
  callback,
  code,
  userId,
  gameCode,
}) {
  authenticator.isUserAllowed({
    token,
    matchToId: userId,
    commandName: dbConfig.apiCommands.UpdateGameCode.commandName,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user } = data;

      getAccessibleGameCode({
        code,
        user,
        callback: ({ error: gameCodeError }) => {
          if (gameCodeError) {
            callback({ error: gameCodeError });

            return;
          }
          dbGameCode.updateGameCode({
            code,
            gameCode,
            callback,
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
