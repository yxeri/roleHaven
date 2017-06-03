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
const logger = require('../../utils/logger');
const dbConnector = require('../databaseConnector');
const dbUser = require('./user');
const dbRoom = require('./room');
const appConfig = require('../../config/defaults/config').app;

const teamSchema = new mongoose.Schema({
  teamName: { type: String, unique: true },
  shortName: { type: String, unique: true },
  owner: String,
  admins: [{ type: String, unique: true }],
  verified: { type: Boolean, default: false },
}, { collection: 'teams' });

const Team = mongoose.model('Team', teamSchema);

/**
 * Create and save team
 * @param {Object} team - Team
 * @param {Function} callback - Callback
 */
function createTeam(team, callback) {
  const newTeam = new Team(team);
  const query = { teamName: team.teamName };

  Team.findOne(query).lean().exec((err, foundTeam) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to check if team already exists'],
        err,
      });
    } else if (foundTeam === null) {
      dbConnector.saveObject(newTeam, 'team', callback);
    } else {
      callback(err, null);
    }
  });
}

/**
 * Get team
 * @param {string} teamName - Name of team to retrieve
 * @param {Function} callback - Callback
 */
function getTeam(teamName, callback) {
  const query = { teamName };
  const filter = { _id: 0 };

  Team.findOne(query, filter).lean().exec((err, team) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to get team'],
        err,
      });
    }

    callback(err, team);
  });
}

/**
 * Verify team
 * @param {string} teamName - Name of the team that will be verified
 * @param {Function} callback - Callback
 */
function verifyTeam(teamName, callback) {
  const query = { teamName };
  dbConnector.verifyObject(query, Team, 'team', callback);
}

/**
 * Verify all teams
 * @param {Function} callback - Callback
 */
function verifyAllTeams(callback) {
  const query = { verified: false };

  dbConnector.verifyAllObjects(query, Team, 'teams', callback);
}

/**
 * Get all unverified teams
 * @param {Function} callback - Callback
 */
function getUnverifiedTeams(callback) {
  const query = { verified: false };
  const filter = { _id: 0 };
  const sort = { teamName: 1 };

  Team.find(query, filter).sort(sort).lean().exec((err, teams) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to get unverified teams'],
        err,
      });
    }

    callback(err, teams);
  });
}

/**
 * Get team by owner
 * @param {string} owner User name of the team owner
 * @param {Function} callback Callback
 */
function getTeamByOwner(owner, callback) {
  const query = { owner };
  const filter = { _id: 0 };

  Team.findOne(query, filter).lean().exec((err, team) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to get team'],
        err,
      });
    }

    callback(err, team);
  });
}

/**
 * Remove team
 * @param {string} Name of the team to remove
 * @param {Object} user User trying to remove the team
 */
function removeTeam(teamName, user, callback) {
  const query = { teamName };

  Team.findOneAndRemove(query).lean().exec((err) => {
    if (err) {
      callback(err, null);

      return;
    }

    dbUser.removeAllUserTeam(teamName, (userErr) => {
      if (userErr) {
        callback(userErr, null);

        return;
      }
      dbRoom.removeRoom(teamName + appConfig.teamAppend, (teamErr) => {
        if (teamErr) {
          callback(userErr, null);

          return;
        }

        callback(null, { success: true });
      });
    });
  });
}

exports.createTeam = createTeam;
exports.getTeam = getTeam;
exports.verifyTeam = verifyTeam;
exports.verifyAllTeams = verifyAllTeams;
exports.getUnverifiedTeams = getUnverifiedTeams;
exports.getTeamByOwner = getTeamByOwner;
exports.removeTeam = removeTeam;
