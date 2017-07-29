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

const dbConfig = require('../config/defaults/config').databasePopulation;
const authenticator = require('../helpers/authenticator');
const dbLanternHack = require('../db/connectors/lanternhack');

/**
 * Get lantern rounds
 * @param {string} params.token jwt
 * @param {Function} params.callback Callback
 */
function getLanternRounds({ token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetLanternRound.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbLanternHack.getLanternRounds({
        callback: ({ error: roundError, data: roundData }) => {
          if (roundError) {
            callback({ error: roundError });

            return;
          }

          const currentTime = new Date();
          const rounds = roundData.rounds.filter(round => currentTime >= new Date(round.endTime));

          callback({ data: { rounds } });
        },
      });
    },
  });
}

/**
 * Get lantern round
 * @param {number} params.roundId Id of the lantern round to get
 * @param {string} params.token jwt
 * @param {Function} params.callback Callback
 */
function getLanternRound({ roundId, token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetLanternRound.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbLanternHack.getLanternRound({
        roundId,
        callback: ({ error: roundError, data: roundData }) => {
          if (roundError) {
            callback({ error: roundError });

            return;
          }

          callback({ data: roundData });
        },
      });
    },
  });
}

/**
 * Get active lantern round
 * @param {string} params.token jwt
 * @param {Function} params.callback Callback
 */
function getActiveLanternRound({ token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: db.apiCommands.GetActiveLanternRound.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbLanternHack.getActiveLanternRound({
        callback: ({ error: roundError, data: roundData }) => {
          if (roundError) {
            callback({ error: roundError });

            return;
          }

          const round = roundData;
          const dataToSend = {
            round,
            noActiveRound: typeof round === 'undefined',
          };

          callback({ data: dataToSend });
        },
      });
    },
  });
}

/**
 * Create lantern round
 * @param {Object} params.round Round to create
 * @param {string} params.token jwt
 * @param {Function} params.callback Callback
 */
function createLanternRound({ round, token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.CreateLanternRound.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbLanternHack.createLanternRound({
        round,
        callback: ({ error: lanternError, data: lanternData }) => {
          if (lanternError) {
            callback({ error: lanternError });

            return;
          }

          callback({ data: lanternData });
        },
      });
    },
  });
}

/**
 * Start lantern round
 * @param {number} params.roundId ID of the round to start
 * @param {string} params.token jwt
 * @param {Function} params.callback Callback
 */
function startLanternRound({ roundId, token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.StartLanternRound.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbLanternHack.getActiveLanternRound({
        callback: ({ error: activeLanternError }) => {
          if (activeLanternError) {
            callback({ error: activeLanternError });

            return;
          }

          dbLanternHack.startLanternRound({
            roundId,
            callback: ({ error: startLanternError, data: startLanternData }) => {
              if (startLanternError) {
                callback({ error: startLanternError });

                return;
              }

              callback({ data: startLanternData });
            },
          });
        },
      });
    },
  });
}

/**
 * End lantern round
 * @param {Object} params.io socket io
 * @param {string} params.token jwt
 * @param {Function} params.callback Callback
 */
function endLanternRound({ io, token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.EndLanternRound.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbLanternHack.endLanternRound({
        callback: ({ error: roundError }) => {
          if (roundError) {
            callback({ error: roundError });

            return;
          }

          // TODO Emit to clients
          io.emit('endLanternRound');

          callback({ data: { success: true } });
        },
      });
    },
  });
}

/**
 * Update lantern round
 * @param {number} params.roundId Id of the round to update
 * @param {Date} params.startTime Start time of the round
 * @param {Date} params.endTime Ending time of the round
 * @param {string} params.token jwt
 * @param {Function} params.callback Callback
 */
function updateLanternRound({ roundId, startTime, endTime, token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.UpdateLanternRound.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbLanternHack.updateLanternRound({
        roundId,
        startTime,
        endTime,
        callback: ({ error: lanternError, data: lanternData }) => {
          if (lanternError) {
            callback({ error: lanternError });

            return;
          }

          // TODO Push to clients, if next round

          callback({ data: lanternData });
        },
      });
    },
  });
}

exports.getLanternRounds = getLanternRounds;
exports.getActiveLanternRound = getActiveLanternRound;
exports.createLanternRound = createLanternRound;
exports.startLanternRound = startLanternRound;
exports.endLanternRound = endLanternRound;
exports.updateLanternRound = updateLanternRound;
exports.getLanternRound = getLanternRound;
