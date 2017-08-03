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
const lanternStationManager = require('./lanternStations');

/**
 * Get lantern round
 * @param {string} params.token jwt
 * @param {Function} params.callback Callback
 */
function getLanternRound({ token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetLanternRound.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbLanternHack.getLanternRound({
        callback: ({ error: roundError, data }) => {
          if (roundError) {
            callback({ error: roundError });

            return;
          }

          callback({ data });
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
function startLanternRound({ io, endTime, token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.StartLanternRound.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      lanternStationManager.resetStations({ callback: () => {} });

      dbLanternHack.startLanternRound({
        endTime,
        callback: ({ error: startLanternError, data: startLanternData }) => {
          if (startLanternError) {
            callback({ error: startLanternError });

            return;
          }

          io.emit('lanternRound', { data: { round: startLanternData } });

          callback({ data: startLanternData });
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
function endLanternRound({ startTime, io, token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.EndLanternRound.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbLanternHack.endLanternRound({
        startTime,
        callback: ({ error: roundError, data }) => {
          if (roundError) {
            callback({ error: roundError });

            return;
          }

          io.emit('lanternRound', { data: { round: data } });

          callback({ data });
        },
      });
    },
  });
}

/**
 * Update lantern round times
 * @param {Object} params.io socket io
 * @param {string} params.token jwt
 * @param {Function} params.callback Callback
 */
function updateLanternRound({ io, token, startTime, endTime, isActive, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.StartLanternRound.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbLanternHack.updateLanternRound({
        startTime,
        endTime,
        isActive,
        callback: ({ error: roundError, data }) => {
          if (roundError) {
            callback({ error: roundError });

            return;
          }

          io.emit('lanternRound', { data: { round: data } });

          callback({ data });
        },
      });
    },
  });
}

exports.startLanternRound = startLanternRound;
exports.endLanternRound = endLanternRound;
exports.getLanternRound = getLanternRound;
exports.updateLanternRound = updateLanternRound;
