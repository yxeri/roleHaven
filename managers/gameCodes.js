
const authenticator = require('../helpers/authenticator');
const objectValidator = require('../utils/objectValidator');
const dbGameCode = require('../db/connectors/gameCode');
const errorCreator = require('../objects/error/errorCreator');
const dbConfig = require('../config/defaults/config').databasePopulation;
const appConfig = require('../config/defaults/config').app;
const transactionManager = require('../managers/transactions');

/**
 * Create game code
 * @param {string} [params.owner] User name to create game code for
 * @param {string} params.codeType Code type
 * @param {string} params.token jwt
 * @param {Function} params.callback Callback
 */
function createGameCode({ owner, codeType, token, callback }) {
  authenticator.isUserAllowed({
    token,
    matchNameTo: owner,
    commandName: dbConfig.apiCommands.CreateGameCode.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!objectValidator.isValidData({ codeType }, { codeType: true })) {
        callback({ error: new errorCreator.InvalidData({ expected: `{ codeType: ${dbConfig.GameCodeTypes.toString()} }` }) });

        return;
      } else if (codeType === dbConfig.GameCodeTypes.PROFILE) {
        callback({ error: new errorCreator.InvalidData({ expected: 'codeType !== profile' }) });

        return;
      }

      dbGameCode.updateGameCode({
        codeType,
        owner: data.user.userName,
        renewable: false,
        callback: ({ error: updateError, data: codeData }) => {
          if (updateError) {
            callback({ error: updateError });

            return;
          }

          callback({ data: codeData });
        },
      });
    },
  });
}

/**
 * Get game codes
 * @param {string} params.codeType Code type
 * @param {string} params.token jwt
 * @param {string} [params.userName] Name of the user to retrieve codes for
 * @param {Function} params.callback Callback
 */
function getGameCodes({ token, userName, callback }) {
  authenticator.isUserAllowed({
    token,
    matchNameTo: userName,
    commandName: dbConfig.apiCommands.GetGameCode.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbGameCode.getGameCodesByUserName({
        owner: data.user.userName,
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
 * Get game code by its bode
 * @param {string} params.code Code of the game code
 * @param {string} params.token jwt
 * @param {Function} params.callback Callback
 */
function getGameCodeByCode({ code, token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetGameCode.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!objectValidator.isValidData({ code }, { code: true })) {
        callback({ error: new errorCreator.InvalidData({ expected: '{ code }' }) });

        return;
      }

      dbGameCode.getGameCodeByCode({
        code,
        owner: data.user.userName,
        callback: ({ error: getError, data: codeData }) => {
          if (getError) {
            callback({ error: getError });

            return;
          }

          callback({ data: codeData });
        },
      });
    },
  });
}

/**
 * Get profile game code. Creates if none exists
 * @param {string} [params.owner] Owner of the code
 * @param {string} params.codeType Code type
 * @param {string} params.token jwt
 * @param {Function} params.callback Callback
 */
function getProfileGameCode({ owner, token, callback }) {
  authenticator.isUserAllowed({
    token,
    matchNameTo: owner,
    commandName: dbConfig.apiCommands.GetGameCode.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbGameCode.getProfileGameCode({
        owner: owner || data.user.userName,
        callback: ({ error: getError, data: codeData }) => {
          if (getError) {
            callback({ error: getError });

            return;
          }

          callback({ data: codeData });
        },
      });
    },
  });
}

/**
 * Use game code
 * @param {Object} [params.socket] Socket io
 * @param {Object} params.io Socket io. Will be used if socket is not set
 * @param {string} params.code Code for a game code
 * @param {string} params.token jwt
 * @param {Function} params.callback Callback
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
          } else if (codeData.gameCode.owner === data.user.userName) {
            callback({ error: new errorCreator.NotAllowed({ name: 'useGameCode on yourself' }) });

            return;
          }

          const gameCode = codeData.gameCode;

          dbGameCode.removeGameCode({
            code: gameCode.code,
            callback: ({ error: removeError }) => {
              if (removeError) {
                callback({ error: removeError });

                return;
              }

              const victim = {
                userName: gameCode.owner,
                accessLevel: dbConfig.AccessLevels.ADMIN,
              };

              transactionManager.createTransaction({
                io,
                transaction: {
                  to: data.user.userName,
                  from: gameCode.owner,
                  amount: appConfig.gameCodeAmount,
                },
                emitToSender: true,
                user: victim,
                callback: ({ error: transError }) => {
                  if (transError) {
                    callback({ error: transError });

                    return;
                  }

                  const rewardData = {
                    reward: {
                      amount: appConfig.gameCodeAmount,
                    },
                  };

                  if (!gameCode.renewable) {
                    const usedGameCode = gameCode;
                    usedGameCode.used = true;

                    callback({ data: rewardData });

                    if (socket) {
                      socket.to(gameCode.owner + appConfig.whisperAppend).emit('gameCode', { data: { gameCode: usedGameCode } });
                    } else {
                      io.to(gameCode.owner + appConfig.whisperAppend).emit('gameCode', { data: { gameCode: usedGameCode } });
                    }

                    return;
                  }

                  dbGameCode.updateGameCode({
                    owner: gameCode.owner,
                    codeType: gameCode.codeType,
                    renewable: true,
                    callback: ({ error: updateError, data: newCodeData }) => {
                      if (updateError) {
                        callback({ error: updateError });

                        return;
                      }

                      callback({ data: rewardData });

                      if (socket) {
                        socket.to(gameCode.owner + appConfig.whisperAppend).emit('gameCode', { data: { gameCode: newCodeData.gameCode } });
                      } else {
                        io.to(gameCode.owner + appConfig.whisperAppend).emit('gameCode', { data: { gameCode: newCodeData.gameCode } });
                      }
                    },
                  });
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
exports.getGameCodes = getGameCodes;
exports.getProfileGameCode = getProfileGameCode;
exports.useGameCode = useGameCode;
exports.getGameCodeByCode = getGameCodeByCode;
