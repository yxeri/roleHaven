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

const mongoose = require('mongoose');
const errorCreator = require('../../objects/error/errorCreator');
const dbConnector = require('../databaseConnector');
const appConfig = require('../../config/defaults/config').app;

const lanternStationSchema = new mongoose.Schema(dbConnector.createSchema({
  stationId: { type: Number, unique: true },
  stationName: String,
  signalValue: { type: Number, default: 0 },
  isActive: { type: Boolean, default: false },
  isUnderAttack: { type: Boolean, default: false },
  calibrationReward: { type: Number, default: appConfig.calibrationRewardAmount },
}), { collection: 'lanternStations' });

const LanternStation = mongoose.model('LanternStation', lanternStationSchema);

/**
 * Add custom id to the object
 * @param {Object} station - Lantern station object
 * @return {Object} - Lantern station object with id
 */
function addCustomId(station) {
  const updatedStation = station;
  updatedStation.stationId = station.objectId;

  return updatedStation;
}

/**
 * Update station
 * @private
 * @param {Object} params - Parameters
 * @param {string} params.stationId - ID of the station to update
 * @param {Object} params.update - Update
 * @param {Function} params.callback Callback
 */
function updateObject({ stationId, update, callback }) {
  dbConnector.updateObject({
    update,
    query: { stationId },
    object: LanternStation,
    errorNameContent: `update station ${stationId}`,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ data: { station: addCustomId(data.object) } });
    },
  });
}

/**
 * Get stations
 * @private
 * @param {Object} params - Parameters
 * @param {Object} params.query - Query to get stations
 * @param {Function} params.callback - Callback
 */
function getStations({ query, callback }) {
  dbConnector.getObjects({
    query,
    object: LanternStation,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({
        data: {
          stations: data.objects.map(station => addCustomId(station)),
        },
      });
    },
  });
}

/**
 * Get station
 * @private
 * @param {Object} params - Parameters
 * @param {string} params.query - Query to get station
 * @param {Function} params.callback - Callback
 */
function getStation({ query, callback }) {
  dbConnector.getObject({
    query,
    object: LanternStation,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!data.object) {
        callback({ error: new errorCreator.DoesNotExist({ name: `lanternStation ${query.toString()}` }) });

        return;
      }

      callback({ data: { station: addCustomId(data.object) } });
    },
  });
}

/**
 * Does the lantern station exist?
 * @param {Object} params - Parameters
 * @param {string} params.stationId - ID of the station
 * @param {Function} params.callback - Callback
 */
function doesStationExist({ stationId, callback }) {
  dbConnector.doesObjectExist({
    callback,
    query: { stationId },
    object: LanternStation,
  });
}

/**
 * Update signal value on station
 * @param {Object} params - Parameters
 * @param {number} params.stationId - Station ID
 * @param {number} params.signalValue - New signal value
 * @param {Function} params.callback - Callback
 */
function updateSignalValue({ stationId, signalValue, callback }) {
  updateObject({
    stationId,
    callback,
    update: { $set: { signalValue } },
  });
}

/**
 * Get all stations. Sorted on station ID
 * @param {Object} params - Parameters
 * @param {Function} params.callback - Callback
 */
function getAllStations({ callback }) {
  getStations({
    callback,
  });
}

/**
 * Create and save station
 * @param {Object} params - Parameters
 * @param {Object} params.station - New station
 * @param {Function} params.callback - Callback
 */
function createStation({ station, callback }) {
  doesStationExist({
    stationId: station.stationId,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error: new errorCreator.Database({ errorObject: error, name: 'createStation' }) });

        return;
      } else if (data.exists) {
        callback({ error: new errorCreator.AlreadyExists({ name: `Station ${station.stationId}` }) });

        return;
      }

      dbConnector.saveObject({
        object: new LanternStation(station),
        objectType: 'Station',
        callback: (saveData) => {
          if (saveData.error) {
            callback({ error: saveData.error });

            return;
          }

          callback({ data: { station: addCustomId(saveData.data.savedObject) } });
        },
      });
    },
  });
}

/**
 * Set all lantern station to value
 * @param {Object} params - Parameters
 * @param {number} params.signalValue - New value
 * @param {Function} params.callback - Callback
 */
function resetStations({ signalValue, callback }) {
  const query = {};
  const update = { $set: { signalValue } };
  const options = { multi: true };
  const updateCallback = (error, stations = []) => {
    if (error) {
      callback({ error });

      return;
    }

    callback({
      data: {
        stations: stations.map(station => addCustomId(station)),
      },
    });
  };

  LanternStation.update(query, update, options).lean().exec(updateCallback);
}

/**
 * Update lantern station
 * @param {Object} params - Parameters
 * @param {Object} params.station - Lantern station
 * @param {number} params.station.stationId - ID of station
 * @param {boolean} [params.station.isActive] - Is the station active?
 * @param {string} [params.station.stationName] - Name of the station
 * @param {number} [params.station.resetOwner] - Remove owner and set isUnderAttack to false
 * @param {number} [params.station.owner] - Team id of the owner
 * @param {Object} [params.isUnderAttack] - Is the station under attack?
 * @param {number} [params.calibrationReward] - Amount of digital currency that will be sent to user when they complete mission with this stations ID
 * @param {Function} params.callback - Callback
 */
function updateStation({
  resetOwner,
  stationId,
  isActive,
  stationName,
  owner,
  isUnderAttack,
  calibrationReward,
  callback,
}) {
  const query = { stationId };
  const update = {};
  const options = { new: true };
  const set = {};
  const unset = {};

  if (typeof isActive === 'boolean') { set.isActive = isActive; }
  if (stationName) { set.stationName = stationName; }
  if (calibrationReward) { set.calibrationReward = calibrationReward; }

  if (resetOwner || (owner && owner === -1)) {
    unset.owner = '';
    set.isUnderAttack = false;
  } else if (owner) {
    set.owner = owner;
    set.isUnderAttack = false;
  } else if (isUnderAttack) {
    set.isUnderAttack = isUnderAttack;
  }

  if (Object.keys(set).length > 0) { update.$set = set; }
  if (Object.keys(unset).length > 0) { update.$unset = unset; }

  LanternStation.findOneAndUpdate(query, update, options).lean().exec((err, station) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'updateLanternStation' }) });

      return;
    } else if (!station) {
      callback({ error: new errorCreator.DoesNotExist({ name: `${stationId} station` }) });

      return;
    }

    callback({ data: { station: addCustomId(station) } });
  });
}

/**
 * Get active stations
 * @param {Object} params - Parameters
 * @param {Function} params.callback - Callback
 */
function getActiveStations({ callback }) {
  const query = { isActive: true };
  const sort = { stationId: 1 };
  const filter = { _id: 0 };
  const updateCallback = (err, stations = []) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err }) });

      return;
    }

    callback({
      data: {
        stations: stations.map(station => addCustomId(station)),
      },
    });
  };

  LanternStation.find(query, filter).sort(sort).lean().exec(updateCallback);
}

/**
 * Delete station
 * @param {Object} params - Parameters
 * @param {number} params.stationId - ID of station to delete
 * @param {Function} params.callback - Callback
 */
function deleteStation({ stationId, callback }) {
  const query = { stationId };

  LanternStation.remove(query).lean().exec((error) => {
    if (error) {
      callback({ error });

      return;
    }

    callback({ data: { success: true } });
  });
}

exports.updateSignalValue = updateSignalValue;
exports.getStation = getStation;
exports.getAllStations = getAllStations;
exports.createStation = createStation;
exports.updateLanternStation = updateStation;
exports.getActiveStations = getActiveStations;
exports.resetStations = resetStations;
exports.deleteStation = deleteStation;

