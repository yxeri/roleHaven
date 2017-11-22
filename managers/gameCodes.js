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
 * Creates game code
 * @private
 * @returns {string} - Alphanumerical game code
 */
function generateGameCode() {
  return textTools.shuffleArray(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'D', 'E', 'F']).slice(0, 8).join('');
}

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
        toAuth: user,
        shouldBeAdmin,
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
 */
function triggerUnlockedContent({
  token,
  userId,
  gameCode,
  callback,
}) {
  const dataToSend = {
    data: {
      ownerId: gameCode.ownerAliasId || gameCode.ownerId,
      codeType: gameCode.codeType,
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

          dataToSend.data.transaction = data.transaction;

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
 * Create game code
 * @param {Object} params - Parameters
 * @param {string} params.gameCode - Game code to save
 * @param {string} params.token - jwt
 * @param {Function} params.callback - Callback
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

      const authUser = data.user;
      const gameCodeToSave = gameCode;
      gameCodeToSave.ownerId = authUser.userId;
      gameCodeToSave.code = generateGameCode();

      if (gameCodeToSave.ownerAliasId) {
        aliasManager.getAccessibleAlias({
          user: authUser,
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
 * Get game codes by owner
 * @param {Object} params - Parameters
 * @param {string} params.token - jwt
 * @param {string} [params.userId] - ID of the user to auth and retrieve codes with
 * @param {Function} params.callback - Callback
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
 * Use game code
 * @param {Object} params - Parameters
 * @param {Object} params.io - Socket io. Will be used if socket is not set
 * @param {string} params.code - Code for a game code
 * @param {string} params.token - jwt
 * @param {Function} params.callback - Callback
 * @param {Object} [params.socket] - Socket io
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
                        code: generateGameCode(),
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
 * Remove game code
 * @param {Object} params - Parameters
 * @param {string} params.code - Code of the game code
 * @param {Object} params.token - jwt
 * @param {Function} params.callback - Callback
 */
function removeGameCode({ code, token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.RemoveGameCode.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      getAccessibleGameCode({
        code,
        user: data.user,
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

exports.createGameCode = createGameCode;
exports.useGameCode = useGameCode;
exports.removeGameCode = removeGameCode;
exports.getGameCodes = getGameCodesByOwner;
