'use strict';

import { appConfig, dbConfig } from '../../config/defaults/config';
import dbLanternHack from '../../db/connectors/bbr/lanternHack';
import authenticator from '../../helpers/authenticator';

/**
 * Get lantern stations.
 * @param {Object} params Parameters.
 * @param {string} params.token jwt.
 * @param {Function} params.callback Callback.
 */
function getLanternStations({
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

      dbLanternHack.getAllStations({
        callback: ({
          error: stationError,
          data: stationData,
        }) => {
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
        callback: ({
          error: stationError,
          data: stationData,
        }) => {
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
      newStation.calibrationReward = typeof newStation.calibrationReward === 'number'
      && newStation.calibrationReward >= appConfig.calibrationRewardMinimum
      && newStation.calibrationReward <= appConfig.calibrationRewardMax
        ?
        newStation.calibrationReward
        :
        undefined;

      dbLanternHack.createStation({
        station,
        callback: ({
          error: stationError,
          data: stationData,
        }) => {
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

      updateLanternStation({
        resetOwner,
        isUnderAttack,
        stationId,
        isActive,
        stationName,
        owner,
        calibrationReward: typeof calibrationReward === 'number'
        && calibrationReward >= appConfig.calibrationRewardMinimum
        && calibrationReward <= appConfig.calibrationRewardMax
          ?
          calibrationReward
          :
          undefined,
        callback: ({
          error: updateError,
          data: updateData,
        }) => {
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

export { getLanternStations };
export { createLanternStation };
export { updateLanternStation };
export { getLanternStation };
export { resetStations };
export { deleteLanternStation };
