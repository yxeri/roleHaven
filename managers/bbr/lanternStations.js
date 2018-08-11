/*
 Copyright 2018 Carmilla Mina Jankovic
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

const authenticator = require('../../helpers/authenticator');
const dbLanternHack = require('../../db/connectors/bbr/lanternHack');
const {
  dbConfig,
  appConfig,
} = require('../../config/defaults/config');

/**
 * Get lantern stations.
 * @param {Object} params Parameters.
 * @param {string} params.token jwt.
 * @param {Function} params.callback Callback.
 */
function getLanternStations({ token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetLanternStations.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbLanternHack.getAllStations({
        callback: ({ error: stationError, data: stationData }) => {
          if (stationError) {
            callback({ error: stationError });

            return;
          }

          const { stations } = stationData;
          const activeStations = [];
          const inactiveStations = stations.filter((station) => {
            if (station.isActive) {
              activeStations.push(station);

              return false;
            }

            return true;
          });

          callback({
            data: {
              activeStations,
              inactiveStations,
            },
          });
        },
      });
    },
  });
}

/**
 * Get lantern station.
 * @param {Object} params Parameters.
 * @param {number} params.stationId Id of the station to retrieve.
 * @param {string} params.token jwt.
 * @param {Function} params.callback Callback.
 */
function getLanternStation({
  stationId,
  token,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetLanternStations.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbLanternHack.getStation({
        stationId,
        callback: ({ error: stationError, data: stationData }) => {
          if (stationError) {
            callback({ error: stationError });

            return;
          }

          callback({ data: stationData });
        },
      });
    },
  });
}

/**
 * Create lantern station.
 * @param {Object} params Parameters.
 * @param {Object} params.io Socket io.
 * @param {Object} params.station Station to create.
 * @param {string} params.token jwt.
 * @param {Function} params.callback Callback.
 */
function createLanternStation({
  io,
  station,
  token,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.CreateLanternStation.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      const newStation = station;
      newStation.calibrationReward = typeof newStation.calibrationReward === 'number' &&
      newStation.calibrationReward >= appConfig.calibrationRewardMinimum &&
      newStation.calibrationReward <= appConfig.calibrationRewardMax ?
        newStation.calibrationReward :
        undefined;

      dbLanternHack.createStation({
        station,
        callback: ({ error: stationError, data: stationData }) => {
          if (stationError) {
            callback({ error: stationError });

            return;
          }

          io.emit('lanternStation', {
            data: {
              station: stationData.station,
              changeType: dbConfig.ChangeTypes.CREATE,
            },
          });

          callback({ data: stationData });
        },
      });
    },
  });
}

/**
 * Update lantern stations.
 * @param {Object} params Parameters.
 * @param {number} params.stationId Id of the station to update.
 * @param {Object} params.io Socket io.
 * @param {Object} params.station Parameters to change in station.
 * @param {string} params.token jwt.
 * @param {Function} params.callback Callback.
 */
function updateLanternStation({
  io,
  station,
  stationId,
  token,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.UpdateLanternStation.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      const {
        isUnderAttack,
        isActive,
        stationName,
        owner,
        calibrationReward,
        resetOwner,
      } = station;

      dbLanternHack.updateLanternStation({
        resetOwner,
        isUnderAttack,
        stationId,
        isActive,
        stationName,
        owner,
        calibrationReward: typeof calibrationReward === 'number' &&
          calibrationReward >= appConfig.calibrationRewardMinimum &&
          calibrationReward <= appConfig.calibrationRewardMax ?
          calibrationReward :
          undefined,
        callback: ({ error: updateError, data: updateData }) => {
          if (updateError) {
            callback({ error: updateError });

            return;
          }

          io.emit('lanternStation', {
            data: {
              station: updateData.station,
              changeType: dbConfig.ChangeTypes.UPDATE,
            },
          });

          callback({ data: updateData });
        },
      });
    },
  });
}

/**
 * Reset station to default value.
 * @param {Object} params Parameters.
 * @param {Function} params.callback Callback.
 */
function resetStations({ callback }) {
  dbLanternHack.resetLanternStations({
    callback,
    signalValue: appConfig.signalDefaultValue,
  });
}

/**
 * Delete lantern station.
 * @param {Object} params Parameters.
 * @param {string} params.token jwt.
 * @param {number} params.stationId Id of the station to delete.
 * @param {Function} params.callback Callback.
 */
function deleteLanternStation({
  token,
  stationId,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.DeleteLanternStation.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbLanternHack.deleteStation({
        stationId,
        callback,
      });
    },
  });
}

exports.getLanternStations = getLanternStations;
exports.createLanternStation = createLanternStation;
exports.updateLanternStation = updateLanternStation;
exports.getLanternStation = getLanternStation;
exports.resetStations = resetStations;
exports.deleteLanternStation = deleteLanternStation;
