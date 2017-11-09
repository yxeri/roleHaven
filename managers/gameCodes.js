
const authenticator = require('../helpers/authenticator');
const objectValidator = require('../utils/objectValidator');
const dbGameCode = require('../db/connectors/gameCode');
const errorCreator = require('../objects/error/errorCreator');
const dbConfig = require('../config/defaults/config').databasePopulation;
const appConfig = require('../config/defaults/config').app;
const transactionManager = require('../managers/transactions');
const aliasManager = require('./aliases');
const textTools = require('../utils/textTools');

/**
 * Creates game code
 * @private
 * @returns {string} - Alphanumerical game code
 */
function generateGameCode() {
  return textTools.shuffleArray(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'D', 'E', 'F']).slice(0, 8).join('');
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

      const createCallback = ({ gameCodeToSave }) => {
        dbGameCode.createGameCode({
          owner: data.user.username,
          gameCode: gameCodeToSave,
          callback: ({ error: updateError, data: codeData }) => {
            if (updateError) {
              callback({ error: updateError });

              return;
            }

            callback({ data: codeData });
          },
        });
      };

      const authUser = data.user;

      const gameCodeToSave = gameCode;
      gameCodeToSave.ownerId = authUser.userId;
      gameCodeToSave.code = generateGameCode();

      if (gameCodeToSave.ownerAliasId) {
        aliasManager.getAlias({
          token,
          aliasId: gameCodeToSave.ownerAliasId,
          userId: authUser.userId,
          callback: (aliasData) => {
            if (aliasData.error) {
              callback({ error: aliasData.error });

              return;
            }

            createCallback({ gameCodeToSave });
          },
        });
      } else {
        createCallback({ gameCodeToSave });
      }
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

      const authUser = data.user;

      dbGameCode.getGameCodesByOwner({
        ownerId: authUser.userId,
        callback: ({ error: getError, data: gameCodeData }) => {
          if (getError) {
            callback({ error: getError });

            return;
          }

          callback({ data: gameCodeData });
        },
      });
    },
  });
}

/**
 * Use game code
 * @param {Object} params - Parameters
 * @param {Object} [params.socket] - Socket io
 * @param {Object} params.io - Socket io. Will be used if socket is not set
 * @param {string} params.code - Code for a game code
 * @param {string} params.token - jwt
 * @param {Function} params.callback - Callback
 */
function useGameCode({ socket, io, code, token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.UseGameCode.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error: new errorCreator.Database({ errorObject: error, name: 'useGameCode' }) });

        return;
      } else if (!objectValidator.isValidData({ code }, { code: true })) {
        callback({ error: new errorCreator.InvalidData({ expected: '{ code }' }) });

        return;
      }

      dbGameCode.getGameCodeByCode({
        code,
        callback: ({ error: codeError, data: codeData }) => {
          if (codeError) {
            callback({ error: codeError });

            return;
          } else if (codeData.gameCode.ownerId === data.user.userId) {
            callback({ error: new errorCreator.NotAllowed({ name: 'useGameCode on yourself' }) });

            return;
          }

          const gameCode = codeData.gameCode;

          dbGameCode.updateGameCode({
            gameCode: {
              gameCodeId: gameCode.gameCodeId,
              used: true,
            },
            callback: ({ error: removeError, data: updatedData }) => {
              if (removeError) {
                callback({ error: removeError });

                return;
              }

              transactionManager.createTransaction({
                io,
                transaction: {
                  toWalletId: data.user.userId,
                  fromWalletId: gameCode.ownerId,
                  amount: appConfig.gameCodeAmount,
                },
                emitToSender: true,
                ownerId: gameCode.ownerId,
                callback: ({ error: transError }) => {
                  if (transError) {
                    callback({ error: transError });

                    return;
                  }

                  const payload = {
                    usedGameCode: updatedData.gameCode,
                  };

                  callback({
                    data: {
                      ownerId: gameCode.ownerAliasId || gameCode.ownerId,
                      amount: appConfig.gameCodeAmount,
                    },
                  });

                  if (gameCode.isRenewable) {
                    dbGameCode.createGameCode({
                      ownerId: gameCode.ownerId,
                      codeType: gameCode.codeType,
                      isRenewable: true,
                      code: generateGameCode(),
                      callback: ({ error: updateError, data: newCodeData }) => {
                        if (updateError) {
                          callback({ error: updateError });

                          return;
                        }

                        payload.gameCode = newCodeData.gameCode;

                        if (socket) {
                          socket.to(gameCode.ownerId).emit('gameCode', { data: payload });
                        } else {
                          io.to(gameCode.ownerId).emit('gameCode', { data: payload });
                        }
                      },
                    });
                  } else if (socket) {
                    socket.to(gameCode.ownerId).emit('gameCode', { data: payload });
                  } else {
                    io.to(gameCode.ownerId).emit('gameCode', { data: payload });
                  }
                },
              });
            },
          });
        },
      });
    },
  });
}

exports.createGameCode = createGameCode;
exports.getGameCodes = getGameCodesByOwner;
exports.useGameCode = useGameCode;
