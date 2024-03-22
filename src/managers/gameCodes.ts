'use strict';

import authenticator from '../helpers/authenticator';
import errorCreator from '../error/errorCreator';
import { appConfig, dbConfig } from '../config/defaults/config';

import transactionManager from './transactions';
import textTools from '../utils/textTools';
import docFileManager from './docFiles';
import managerHelper from '../helpers/manager';

/**
 * Get a game code by Id.
 * @param {Object} params Parameters.
 * @param {string} params.token jwt.
 * @param {Function} params.callback Callback.
 * @param {string} params.gameCodeId Code of the game code.
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
    dbCallFunc: getGameCodeById,
    commandName: dbConfig.apiCommands.GetGameCode.name,
  });
}

/**
 * Send data to client based on code type.
 * @param {Object} params Parameters.
 * @param {Object} params.gameCode Game code that has been used.
 * @param {string} params.token jwt.
 * @param {Function} params.callback Callback.
 * @param {Object} params.io Socket.io.
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
      callback: ({
        error,
        data,
      }) => {
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
      callback: ({
        error,
        data,
      }) => {
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
 * @param {Object} params Parameters.
 * @param {string} params.gameCode Game code to save.
 * @param {string} params.token jwt.
 * @param {Function} params.callback Callback.
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
    callback: ({
      error,
      data,
    }) => {
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

      createGameCode({
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

          io.to(authUser.objectId)
            .emit(dbConfig.EmitTypes.GAMECODE, dataToSend);

          callback(dataToSend);
        },
      });
    },
  });
}

/**
 * Use game code.
 * @param {Object} params Parameters.
 * @param {Object} params.io Socket io. Will be used if socket is not set.
 * @param {string} params.code Code for a game code.
 * @param {string} params.token jwt.
 * @param {Function} params.callback Callback.
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
    callback: ({
      error,
      data,
    }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user: authUser } = data;

      getGameCodeById({
        code,
        callback: ({
          error: getError,
          data: getData,
        }) => {
          if (getError) {
            callback({ error: getError });

            return;
          }

          if (getData.gameCode.ownerId === authUser.objectId) {
            callback({ error: new errorCreator.NotAllowed({ name: 'useGameCode on yourself' }) });

            return;
          }

          removeGameCode({
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
                callback: ({
                  error: unlockError,
                  data: unlockData,
                }) => {
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
                    createGameCode({
                      gameCode: {
                        ownerId: usedGameCode.ownerId,
                        ownerAliasId: usedGameCode.ownerAliasId,
                        codeType: usedGameCode.codeType,
                        codeContent: usedGameCode.codeContent,
                        isRenewable: true,
                      },
                      callback: ({
                        error: createError,
                        data: createData,
                      }) => {
                        if (createError) {
                          callback({ error: createError });

                          return;
                        }

                        dataToOwner.data.newGameCode = createData.gameCode;

                        io.to(usedGameCode.ownerId)
                          .emit(dbConfig.EmitTypes.GAMECODE, dataToOwner);
                      },
                    });

                    callback({ data: unlockData });

                    return;
                  }

                  io.to(usedGameCode.ownerId)
                    .emit(dbConfig.EmitTypes.GAMECODE, dataToOwner);

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
 * @param {Object} params Parameters.
 * @param {string} params.gameCodeId Id of the game code.
 * @param {Object} params.token jwt.
 * @param {Function} params.callback Callback.
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
    getDbCallFunc: getGameCodeById,
    getCommandName: dbConfig.apiCommands.GetGameCode.name,
    objectId: gameCodeId,
    commandName: dbConfig.apiCommands.RemoveGameCode.name,
    objectType: 'gameCode',
    dbCallFunc: removeGameCode,
    emitType: dbConfig.EmitTypes.GAMECODE,
    objectIdType: 'gameCodeId',
  });
}

/**
 * Get user's profile code.
 * @param {Object} params Parameters.
 * @param {string} params.ownerId Id of the owner of the code.
 * @param {Function} params.callback Callback.
 * @param {string} params.token jwt.
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

      getProfileGameCode({
        ownerId,
        callback,
      });
    },
  });
}

/**
 * Update a game code.
 * @param {Object} params Parameters.
 * @param {string} params.token jwt.
 * @param {Function} params.callback Callback.
 * @param {string} params.gameCodeId Id of the game code.
 * @param {Object} params.gameCode Game code parameters to update.
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
    dbCallFunc: updateGameCode,
    emitType: dbConfig.EmitTypes.GAMECODE,
    objectIdType: 'gameCodeId',
    getDbCallFunc: getGameCodeById,
    getCommandName: dbConfig.apiCommands.GetGameCode.name,
  });
}

/**
 * Get game codes.
 * @param {Object} params Parameters.
 * @param {string} params.token jwt.
 * @param {Function} params.callback Callback.
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
    dbCallFunc: getGameCodesByUser,
  });
}

export { createGameCode };
export { useGameCode };
export { removeGameCode };
export { getProfileGameCode };
export { updateGameCode };
export { getGameCodeById };
export { getGameCodesByUser };
