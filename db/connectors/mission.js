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
const databaseConnector = require('../databaseConnector');
const ObjectId = require('mongodb').ObjectID;
const errorCreator = require('../../objects/error/errorCreator');

const missionSchema = new mongoose.Schema({
  timeCreated: Date,
  completed: { type: Boolean, default: false },
  reward: String,
  rewardType: String,
  title: String,
  description: String,
  requirement: String,
  creator: String,
  agent: String,
  applicationRequired: { type: Boolean, default: false },
  missionType: String,
  visibility: Number,
  accessLevel: Number,
}, { collection: 'missions' });

const Mission = mongoose.model('Mission', missionSchema);

/**
 * Update value in mission document
 * @param {string} params.missionId Id of the mission to update
 * @param {Object} params.update Update instructions
 * @param {Function} params.callback Callback
 */
function updateMissionValue({ missionId, update, callback }) {
  const query = { _id: missionId };
  const options = { new: true };

  Mission.findOneAndUpdate(query, update, options).lean().exec((err, mission) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'updateMissionValue' }) });
    }

    callback({ data: { mission } });
  });
}

/**
 * Create a new mission
 * @param {Object} params.mission New mission
 * @param {Function} params.callback Callback
 */
function createMission({ mission, callback }) {
  const newMission = new Mission(mission);

  databaseConnector.saveObject({
    callback,
    object: newMission,
    objectType: 'mission',
  });
}

/**
 * Set mission to completed or not completed
 * @param {String} params.missionId ID for mission to update
 * @param {boolean} params.isCompleted Is the mission completed?
 * @param {Function} params.callback Callback
 */
function updateMissionCompleted({ missionId, isCompleted, callback }) {
  const update = { $set: { completed: isCompleted } };

  updateMissionValue({
    callback,
    update,
    missionId: new ObjectId(missionId),
  });
}

/**
 * Update mission reward and reward type
 * @param {String} params.missionId ID for mission to update
 * @param {String} params.reward The reward that the player will receive
 * @param {String} params.rewardType Type of reward
 * @param {Function} params.callback Callback
 */
function updateMissionReward({ missionId, reward, rewardType, callback }) {
  const update = { $set: { reward, rewardType } };

  updateMissionValue({
    update,
    callback,
    missionId: new ObjectId(missionId),
  });
}

/**
 * Update agent assigned to mission
 * @param {String} params.missionId ID for mission to update
 * @param {String} params.agent User name that will be assigned to the mission
 * @param {Function} params.callback Callback
 */
function updateMissionAgent({ missionId, agent, callback }) {
  const update = { $set: { agent } };

  updateMissionValue({
    update,
    callback,
    missionId: new ObjectId(missionId),
  });
}

/**
 * Get all active missions
 * @param {Function} params.callback Callback
 */
function getActiveMissions({ callback }) {
  const query = { completed: false };
  const filter = { _id: 0 };

  Mission.find(query, filter).lean().exec((err, missions) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'getActiveMissions' }) });

      return;
    }

    callback({ data: { missions } });
  });
}

/**
 * Get all missions, both active and inactive
 * @param {Function} params.callback Callback
 */
function getAllMissions({ callback }) {
  const query = {};

  Mission.find(query).lean().exec((err, missions) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'getAllMissions' }) });

      return;
    }

    callback({ data: { missions } });
  });
}

exports.createMission = createMission;
exports.getActiveMissions = getActiveMissions;
exports.getAllMissions = getAllMissions;
exports.updateMissionCompleted = updateMissionCompleted;
exports.updateMissionReward = updateMissionReward;
exports.updateMissionAgent = updateMissionAgent;
