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

const lanternTeamSchema = new mongoose.Schema(dbConnector.createSchema({
  teamId: { type: Number, unique: true },
  teamName: { type: String, unique: true },
  shortName: { type: String, unique: true },
  points: { type: Number, default: 0 },
  isActive: { type: Boolean, default: false },
}));

const LanternTeam = mongoose.model('LanternTeam', lanternTeamSchema);

/**
 * Add custom id to the object
 * @param {Object} team - Lantern team object
 * @return {Object} - Lantern team object with id
 */
function addCustomId(team) {
  const updatedTeam = team;
  updatedTeam.teamid = team.objectId;

  return updatedTeam;
}

/**
 * Update lantern team fields
 * @private
 * @param {Object} params - Parameters
 * @param {string} params.teamId - ID of the team to update
 * @param {Object} params.update - Update
 * @param {Function} params.callback Callback
 */
function updateObject({ teamId, update, callback }) {
  dbConnector.updateObject({
    update,
    query: { teamId },
    object: LanternTeam,
    errorNameContent: 'update team',
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
 * Get lantern teams
 * @private
 * @param {Object} params - Parameters
 * @param {Object} [params.query] - Query to get teams
 * @param {Function} params.callback - Callback
 */
function getTeams({ query, callback }) {
  dbConnector.getObjects({
    query,
    object: LanternTeam,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({
        data: {
          teams: data.objects.map(team => addCustomId(team)),
        },
      });
    },
  });
}

/**
 * Get team
 * @private
 * @param {Object} params - Parameters
 * @param {string} params.query - Query to get team
 * @param {Function} params.callback - Callback
 */
function getTeam({ query, callback }) {
  dbConnector.getObject({
    query,
    object: LanternTeam,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!data.object) {
        callback({ error: new errorCreator.DoesNotExist({ name: `lanternTeam ${query.toString()}` }) });

        return;
      }

      callback({ data: { team: addCustomId(data.object) } });
    },
  });
}

/**
 * Does a team exist with the teamId/teamName/shortName?
 * @private
 * @param {Object} params - Parameters
 * @param {string} params.teamName - Team name
 * @param {string} params.shortName - Short team name
 * @param {Function} params.callback - Callback
 */
function doesTeamExist({ teamName, shortName, callback }) {
  const query = {
    $or: [
      { teamName },
      { shortName },
    ],
  };

  dbConnector.doesObjectExist({
    query,
    callback,
    object: LanternTeam,
  });
}

/**
 * Create lantern team
 * @param {Object} params - Parameters
 * @param {Object} params.team - New lantern team
 * @param {Function} params.callback - Callback
 */
function createTeam({ team, callback }) {
  doesTeamExist({
    teamName: team.teamName,
    shortName: team.shortName,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error: new errorCreator.Database({ errorObject: error, name: 'createLanternTeam' }) });

        return;
      } else if (data.exists) {
        callback({ error: new errorCreator.AlreadyExists({ name: `Lantern team ${team.teamName} ${team.shortName}` }) });

        return;
      }

      dbConnector.saveObject({
        object: new LanternTeam(team),
        objectType: 'LanternTeam',
        callback: (saveData) => {
          if (saveData.error) {
            callback({ error: saveData.error });

            return;
          }

          callback({ data: { team: addCustomId(saveData.data.savedObject) } });
        },
      });
    },
  });
}

/**
 * Update lantern team
 * @param {Object} params - Parameters
 * @param {number} [params.teamId] - Id of team to get
 * @param {boolean} [params.isActive] - Is the team active?
 * @param {number} [params.points] - Teams total points
 * @param {boolean} [params.resetPoints] - Resets points on team to 0
 * @param {string} [params.teamName] - Team name
 * @param {string} [params.shortName] - Short team name
 * @param {Function} params.callback - Callback
 */
function updateTeam({
  teamId,
  teamName,
  shortName,
  isActive,
  points,
  resetPoints,
  callback,
}) {
  const update = {};

  if (typeof isActive === 'boolean') { update.isActive = isActive; }
  if (teamName) { update.teamName = teamName; }
  if (shortName) { update.shortName = shortName; }

  if (typeof resetPoints === 'boolean' && resetPoints) {
    update.points = 0;
  } else if (typeof points === 'number') {
    update.points = points;
  }

  updateObject({
    teamId,
    update,
    callback,
  });
}

/**
 * Get all lantern teams
 * @param {Object} params - Parameters
 * @param {Function} params.callback - Callback
 */
function getAllTeams({ callback }) {
  getTeams({ callback });
}

/**
 * Delete team
 * @param {Object} params - Parameters
 * @param {number} params.teamId - ID of team to delete
 * @param {Function} params.callback - Callback
 */
function deleteTeam({ teamId, callback }) {
  dbConnector.removeObject({
    callback,
    object: LanternTeam,
    query: { teamId },
  });
}

exports.updateTeam = updateTeam;
exports.createTeam = createTeam;
exports.getAllTeams = getAllTeams;
exports.deleteTeam = deleteTeam;

