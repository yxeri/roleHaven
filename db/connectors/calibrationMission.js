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

const mongoose = require('mongoose');
const dbConnector = require('../databaseConnector');
const errorCreator = require('../../objects/error/errorCreator');

const calibrationMissionSchema = new mongoose.Schema(dbConnector.createSchema({
  stationId: Number,
  code: Number,
  isCompleted: { type: Boolean, default: false },
  timeCompleted: Date,
}), { collection: 'calibrationMissions' });

const CalibrationMission = mongoose.model('CalibrationMission', calibrationMissionSchema);

/**
 * Update mission
 * @private
 * @param {Object} params - Parameters
 * @param {string} params.objectId - ID of the mission to update
 * @param {Object} params.update - Update
 * @param {Function} params.callback - Callback
 */
function updateObject({ objectId, update, callback }) {
  dbConnector.updateObject({
    update,
    query: { _id: objectId },
    object: CalibrationMission,
    errorNameContent: 'updateCalibrationMission',
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ data: { mission: data.object } });
    },
  });
}

/**
 * Get calibration missions
 * @private
 * @param {Object} params - Parameters
 * @param {Object} params.query - Query to get calibration missions
 * @param {Object} [params.sort] - Sorting instructions
 * @param {Function} params.callback - Callback
 */
function getMissions({ query, sort, callback }) {
  dbConnector.getObjects({
    query,
    sort,
    object: CalibrationMission,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ data: { missions: data.objects } });
    },
  });
}

/**
 * Get calibration mission
 * @private
 * @param {Object} params - Parameters
 * @param {string} params.query - Query to get calibration mission
 * @param {boolean} [params.silentDoesNotExist] - Should the error when an object does not exist be surpressed?
 * @param {Function} params.callback - Callback
 */
function getMission({ query, silentDoesNotExist, callback }) {
  dbConnector.getObject({
    query,
    object: CalibrationMission,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!data.object) {
        if (!silentDoesNotExist) {
          callback({ error: new errorCreator.DoesNotExist({ name: `calibration mission ${query.toString()}` }) });
        } else {
          callback({ data: { exists: false } });
        }

        return;
      }

      callback({ data: { mission: data.object } });
    },
  });
}

/**
 * Get active mission
 * @param {Object} params - Parameters
 * @param {string} params.ownerId - ID of the user who is the owner
 * @param {boolean} [params.silentDoesNotExist] - Should the error be surpressed if the mission does not exist?
 * @param {Function} params.callback - Callback
 */
function getActiveMission({ ownerId, silentDoesNotExist, callback }) {
  getMission({
    callback,
    silentDoesNotExist,
    query: { $and: [{ ownerId }, { isCompleted: false }] },
  });
}

/**
 * Get finished missions
 * @param {Object} params - Parameters
 * @param {string} params.ownerId - ID of the user
 * @param {Function} params.callback - Callback
 */
function getInactiveMissions({ ownerId, callback }) {
  getMissions({
    callback,
    query: { $and: [{ ownerId }, { isCompleted: true }] },
    sort: { timeCompleted: 1 },
  });
}

/**
 * Get all missions
 * @param {Object} params - Parameters
 * @param {boolean} params.includeCompleted - Should completed missions be included?
 * @param {Function} params.callback - Callback
 */
function getAllMissions({ includeCompleted, callback }) {
  const query = {};

  if (!includeCompleted) { query.isCompleted = false; }

  getMissions({
    query,
    callback,
  });
}

/**
 * Removes mission based on owner
 * @param {Object} params - Parameters
 * @param {Object} params.ownerId - ID of the user
 * @param {Function} params.callback Callback
 */
function removeMission({ ownerId, callback }) {
  dbConnector.removeObject({
    callback,
    query: { ownerId, isCompleted: false },
    object: CalibrationMission,
  });
}

/**
 * Create and save mission
 * @param {Object} params - Parameters
 * @param {Object} params.mission - New mission
 * @param {Function} params.callback - Callback
 */
function createMission({ mission, callback }) {
  const newMission = new CalibrationMission(mission);
  const query = { ownerId: mission.ownerId, isCompleted: false };

  getMission({
    query,
    callback: (missionData) => {
      if (missionData.error) {
        callback({ error: new errorCreator.Database({ errorObject: missionData.error, name: 'createMission' }) });

        return;
      } else if (missionData.data.mission) {
        callback({ error: new errorCreator.AlreadyExists({ name: `Calibration mission ${mission.ownerId}` }) });

        return;
      }

      dbConnector.saveObject({
        object: newMission,
        objectType: 'calibrationMission',
        callback: ({ error, data }) => {
          if (error) {
            callback({ error });

            return;
          }

          callback({ data: { mission: data.savedObject } });
        },
      });
    },
  });
}

/**
 * Set mission completed
 * @param {Object} params - Parameters
 * @param {number} params.ownerId - ID of the user
 * @param {Function} params.callback - Callback
 */
function setMissionCompleted({ ownerId, callback }) {
  const query = { ownerId, isCompleted: false };
  const update = { $set: { isCompleted: true, timeCompleted: new Date() } };

  getMission({
    query,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error: new errorCreator.Database({ errorObject: error, name: 'setMissionCompleted' }) });

        return;
      } else if (!data.mission) {
        callback({ error: new errorCreator.DoesNotExist({ name: `Mission ownerId: ${ownerId}` }) });

        return;
      }

      updateObject({
        update,
        callback,
        objectId: data.mission.objectId,
      });
    },
  });
}

exports.getActiveMission = getActiveMission;
exports.createMission = createMission;
exports.setMissionCompleted = setMissionCompleted;
exports.getInactiveMissions = getInactiveMissions;
exports.getAllMissions = getAllMissions;
exports.removeMission = removeMission;
