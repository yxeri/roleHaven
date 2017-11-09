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
const dbConnector = require('../databaseConnector');
const errorCreator = require('../../objects/error/errorCreator');

const lanternRoundSchema = new mongoose.Schema(dbConnector.createSchema({
  isActive: { type: Boolean, default: false },
  startTime: Date,
  endTime: Date,
}), { collection: 'lanternRounds' });

const LanternRound = mongoose.model('LanternRound', lanternRoundSchema);

/**
 * Update round fields
 * @private
 * @param {Object} params - Parameters
 * @param {Object} params.update - Update
 * @param {Function} params.callback Callback
 */
function updateObject({ update, callback }) {
  dbConnector.updateObject({
    update,
    query: {},
    object: LanternRound,
    errorNameContent: 'updateRoundFields',
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ round: data.object });
    },
  });
}

/**
 * Get round
 * @private
 * @param {Object} params - Parameters
 * @param {Function} params.callback - Callback
 */
function getRound({ callback }) {
  dbConnector.getObject({
    query: {},
    object: LanternRound,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!data.object) {
        callback({ error: new errorCreator.DoesNotExist({ name: 'lanternRound' }) });

        return;
      }

      callback({ round: data.object });
    },
  });
}

/**
 * Change times for round
 * @param {Object} params - Parameters
 * @param {Date} params.startTime - Start time
 * @param {Date} params.endTime - End time
 * @param {Function} params.callback - Callback
 */
function updateLanternRound({
  startTime,
  endTime,
  isActive,
  callback,
}) {
  const update = { $set: {} };

  if (startTime) { update.$set.startTime = startTime; }
  if (endTime) { update.$set.endTime = endTime; }
  if (typeof isActive !== 'undefined') { update.$set.isActive = isActive; }

  updateObject({
    update,
    callback,
  });
}

/**
 * Start lantern round
 * @param {Object} params - Parameters
 * @param {Function} params.callback - Callback
 */
function startLanternRound({ endTime, callback }) {
  const update = { $set: { isActive: true } };

  if (endTime) { update.$set.endTime = endTime; }

  updateObject({
    update,
    callback,
  });
}

/**
 * End lantern round
 * @param {Object} params - Parameters
 * @param {Date} params.startTime - Start time of next round
 * @param {Function} params.callback - Callback
 */
function endLanternRound({ startTime, callback }) {
  const update = { $set: { isActive: false } };

  if (startTime) { update.$set.startTime = startTime; }

  updateObject({
    update,
    callback,
  });
}

/**
 * Get lantern round
 * @param {Object} params - Parameters
 * @param {Function} params.callback - Callback
 */
function getLanternRound({ callback }) {
  getRound({ callback });
}

/**
 * Create first round
 * @param {Function} callback - Callback
 */
function createFirstRound(callback) {
  getRound({
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!data) {
        dbConnector.saveObject({
          object: new LanternRound({}),
          objectType: 'lanternRound',
          callback: (roundData) => {
            if (roundData.error) {
              callback({ error: roundData.error });

              return;
            }

            callback({ round: roundData.data.savedObject });
          },
        });

        return;
      }

      callback({ data: { exists: true } });
    },
  });
}

createFirstRound(({ error, data }) => {
  if (error) {
    console.log('Failed to create first round');

    return;
  }

  console.log('Created ', data);
});

exports.getLanternRound = getLanternRound;
exports.startLanternRound = startLanternRound;
exports.endLanternRound = endLanternRound;
exports.updateLanternRound = updateLanternRound;
exports.createFirstRound = createFirstRound;

