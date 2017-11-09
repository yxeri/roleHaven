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
const appConfig = require('../../config/defaults/config').app;
const dbLanternRound = require('./lanternRound');
const dbLanternStation = require('./lanternStation');
const dbLanternTeam = require('./lanternTeam');

// Access levels: Lowest / Lower / Middle / Higher / Highest / God
// 1 / 3 / 5 / 7 / 9 / 11

const lanternHackSchema = new mongoose.Schema(dbConnector.createSchema({
  ownerId: { type: String, unique: true },
  triesLeft: { type: Number, default: appConfig.hackingTriesAmount },
  stationId: Number,
  gameUsers: [dbConnector.createSchema({
    userId: String,
    password: String,
    isCorrect: { type: Boolean, default: false },
    passwordType: String,
    passwordHint: {
      index: Number,
      character: String,
    },
  })],
}), { collection: 'lanternHacks' });

const LanternHack = mongoose.model('LanternHack', lanternHackSchema);

/**
 * Update lantern hack fields
 * @private
 * @param {Object} params - Parameters
 * @param {string} params.objectId - ID of the lantern hack to update
 * @param {Object} params.update - Update
 * @param {Function} params.callback - Callback
 */
function updateObject({ objectId, update, callback }) {
  dbConnector.updateObject({
    update,
    query: { _id: objectId },
    object: LanternHack,
    errorNameContent: 'updateLanternHackFields',
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ lanternHack: data.object });
    },
  });
}

/**
 * Get lantern hack
 * @private
 * @param {Object} params - Parameters
 * @param {string} params.query - Query to get alias
 * @param {Function} params.callback - Callback
 */
function getLanternHack({ query, callback }) {
  dbConnector.getObject({
    query,
    object: LanternHack,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!data.object) {
        callback({ error: new errorCreator.DoesNotExist({ name: `lanternHack ${query.toString()}` }) });

        return;
      }

      callback({ lanternHack: data.object });
    },
  });
}

/**
 * Create a lantern hack
 * @param {Object} params - Parameters
 * @param {Object} params.lanternHack - Lantern hack to create
 * @param {Function} params.callback - Callback
 */
function createLanternHack({ lanternHack, callback }) {
  getLanternHack({
    query: { ownerId: lanternHack },
    callback: (hackData) => {
      if (hackData.error) {
        callback({ error: hackData.error });

        return;
      } else if (hackData.data.lanternHack) {
        callback({ error: new errorCreator.AlreadyExists({ name: `lanternHack for owner ${lanternHack.ownerId}` }) });

        return;
      }

      dbConnector.saveObject({
        object: new LanternHack(lanternHack),
        objectType: 'lanternHack',
        callback: (saveData) => {
          if (saveData.error) {
            callback({ error: saveData.error });

            return;
          }

          callback({ data: { lanternHack: saveData.data.savedObject } });
        },
      });
    },
  });
}

/**
 * Update lantern hack
 * @param {Object} params - Parameters
 * @param {Object} params.lanternHack - Parameters to update
 * @param {string} params.objectId - ID of the lantern hack
 * @param {Function} params.callback - Callback
 */
function updateLanternHack({ objectId, lanternHack, callback }) {
  const { triesLeft, stationId } = lanternHack;
  const update = {};

  if (triesLeft) { update.triesLeft = triesLeft; }
  if (stationId) { update.stationId = stationId; }

  updateObject({
    objectId,
    update,
    callback,
  });
}

/**
 * Remove lantern hack
 * @param {Object} params - Parameters
 * @param {string} params.objectId - ID of the hack
 * @param {Function} params.callback - Callback
 */
function removeLanternHack({ objectId, callback }) {
  dbConnector.removeObject({
    callback,
    query: { _id: objectId },
    object: LanternHack,
  });
}

/**
 * Lower amount of hack tries by 1
 * @param {Object} params - Parameters
 * @param {string} params.objectId - ID of the hack
 * @param {Function} params.callback - Callback
 */
function lowerHackTries({ objectId, callback }) {
  updateLanternHack({
    objectId,
    callback,
    update: { $inc: { triesLeft: -1 } },
  });
}

/**
 * Get lantern hack
 * @param {Object} params - Parameters
 * @param {string} params.ownerId - ID of the user
 * @param {Function} params.callback - Callback
 */
function getLanternHackByOwner({ ownerId, callback }) {
  getLanternHack({
    callback,
    query: { ownerId },
  });
}

/**
 * Get lantern stations, round and teams
 * @param {Object} params - Parameters
 * @param {Function} params.callback - Callback
 */
function getLanternStats({ callback }) {
  dbLanternRound.getLanternRound({
    callback: (roundData) => {
      if (roundData.error) {
        callback({ error: roundData.error });

        return;
      }

      dbLanternTeam.getAllTeams({
        callback: (teamData) => {
          if (teamData.error) {
            callback({ error: teamData.error });

            return;
          }

          dbLanternStation.getAllStations({
            callback: (stationsData) => {
              if (stationsData.error) {
                callback({ error: stationsData.error });

                return;
              }

              callback({
                data: {
                  lanternStats: {
                    round: roundData.data.round,
                    teams: teamData.data.team,
                    stations: stationsData.data.stations,
                  },
                },
              });
            },
          });
        },
      });
    },
  });
}

exports.createLanternHack = createLanternHack;
exports.updateLanternHack = updateLanternHack;
exports.lowerHackTries = lowerHackTries;
exports.removeLanternHack = removeLanternHack;
exports.getLanternStats = getLanternStats;
exports.getLanternHackByOwner = getLanternHackByOwner;
