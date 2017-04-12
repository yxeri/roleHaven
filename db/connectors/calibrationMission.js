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
const logger = require('../../utils/logger');
const databaseConnector = require('../databaseConnector');

const calibrationMissionSchema = new mongoose.Schema({
  owner: String,
  stationId: Number,
  code: Number,
  completed: { type: Boolean, default: false },
  timeCompleted: Date,
}, { collection: 'calibrationMissions' });

const CalibrationMission = mongoose.model('CalibrationMission', calibrationMissionSchema);

/**
 * Get active mission
 * @param {string} owner - User name
 * @param {Function} callback - Callback
 */
function getActiveMission(owner, callback) {
  const query = { $and: [{ owner }, { completed: false }] };
  const filter = { _id: 0 };

  CalibrationMission.findOne(query, filter).lean().exec((err, foundMission) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to find mission'],
        err,
      });
    }

    callback(err, foundMission);
  });
}

/**
 * Get finished missions
 * @param {string} owner - User name
 * @param {Function} callback - Callback
 */
function getInactiveMissions(owner, callback) {
  const query = { $and: [{ owner }, { completed: true }] };
  const filter = { _id: 0 };
  const sort = { timeCompleted: 1 };

  CalibrationMission.find(query, filter).sort(sort).lean().exec((err, foundMissions) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to find mission'],
        err,
      });
    }

    callback(err, foundMissions);
  });
}

/**
 * Create and save mission
 * @param {Object} mission - New mission
 * @param {Function} callback - Callback
 */
function createMission(mission, callback) {
  const newUser = new CalibrationMission(mission);

  getActiveMission(mission.owner, (err, foundMission) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to check if mission exists'],
        err,
      });

      callback(err, null);
    } else if (foundMission === null) {
      databaseConnector.saveObject(newUser, 'calibrationMission', callback);
    } else {
      callback(err, null);
    }
  });
}

/**
 * Set mission completed
 * @param {number} code Mission code
 * @param {number} stationId Station ID
 * @param {Function} callback Callback
 */
function setMissionCompleted(code, stationId, callback) {
  const query = { $and: [{ code }, { stationId }, { completed: false }] };
  const update = { $set: { completed: true, timeCompleted: new Date() } };
  const options = { new: true };

  CalibrationMission.findOneAndUpdate(query, update, options).lean().exec((err, foundMission) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to find mission'],
        err,
      });
    }

    callback(err, foundMission);
  });
}

exports.getActiveMission = getActiveMission;
exports.createMission = createMission;
exports.setMissionCompleted = setMissionCompleted;
exports.getInactiveMissions = getInactiveMissions;
