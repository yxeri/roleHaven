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
const dbUser = require('./user');
const dbRoom = require('./room');
const appConfig = require('../../config/defaults/config').app;

const teamSchema = new mongoose.Schema({
  teamName: { type: String, unique: true },
  shortName: { type: String, unique: true },
  owner: String,
  admins: { type: [String], default: [] },
  verified: { type: Boolean, default: false },
  isProtected: { type: Boolean, default: false },
}, { collection: 'teams' });

const Team = mongoose.model('Team', teamSchema);

/**
 * Create and save team
 * @param {Object} params.team New team
 * @param {Function} params.callback Callback
 */
function createTeam({ team, callback }) {
  const newTeam = new Team(team);
  const query = {
    $or: [
      { teamName: team.teamName },
      { shortName: team.shortName },
    ],
  };

  Team.findOne(query).lean().exec((err, foundTeam) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'createTeam' }) });

      return;
    } else if (foundTeam) {
      callback({ error: new errorCreator.AlreadyExists({ name: `team ${team.teamName}` }) });

      return;
    }

    dbConnector.saveObject({
      object: newTeam,
      objectType: 'team',
      callback: ({ error, data }) => {
        if (error) {
          callback({ error });

          return;
        }

        callback({ data: { team: data.savedObject } });
      },
    });
  });
}

/**
 * Get team
 * @param {string} params.teamName Name of team to retrieve
 * @param {Function} params.callback Callback
 */
function getTeam({ teamName, callback }) {
  const query = { teamName };
  const filter = { _id: 0 };

  Team.findOne(query, filter).lean().exec((err, team) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'getTeam' }) });

      return;
    } else if (!team) {
      callback({ error: new errorCreator.DoesNotExist({ name: `team ${teamName}` }) });

      return;
    }

    callback({ data: { team } });
  });
}

/**
 * Get teams
 * @param {Object} params.user User retrieving the teams
 * @param {Function} params.callback Callback
 */
function getTeams({ user, callback }) {
  const query = {
    $or: [
      { owner: user.userName },
      { isProtected: false },
    ],
    verified: true,
  };
  const filter = { teamName: 1, shortName: 1 };

  Team.find(query, filter).lean().exec((err, teams = []) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'getTeams' }) });

      return;
    }

    callback({ data: { teams } });
  });
}

/**
 * Verify team
 * @param {string} params.teamName Name of the team that will be verified
 * @param {Function} params.callback Callback
 */
function verifyTeam({ teamName, callback }) {
  const query = { teamName };
  dbConnector.verifyObject({ query, object: Team, callback });
}

/**
 * Verify all teams
 * @param {Function} params.callback Callback
 */
function verifyAllTeams({ callback }) {
  const query = { verified: false };

  dbConnector.verifyAllObjects({ query, object: Team, callback });
}

/**
 * Get all unverified teams
 * @param {Function} params.callback Callback
 */
function getUnverifiedTeams({ callback }) {
  const query = { verified: false };
  const filter = { _id: 0 };
  const sort = { teamName: 1 };

  Team.find(query, filter).sort(sort).lean().exec((err, teams = []) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'getUnverifiedTeams' }) });

      return;
    }

    callback({ data: { teams } });
  });
}

/**
 * Get team by owner
 * @param {string} params.owner User name of the team owner
 * @param {Function} params.callback Callback
 */
function getTeamByOwner({ owner, callback }) {
  const query = { owner };
  const filter = { _id: 0 };

  Team.findOne(query, filter).lean().exec((err, team) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'getTeamByOwner' }) });

      return;
    } else if (!team) {
      callback({ error: new errorCreator.DoesNotExist({ name: `team owner ${owner}` }) });

      return;
    }

    callback({ data: { team } });
  });
}

/**
 * Get team by owner
 * @param {string} params.owner User name of the team owner
 * @param {Function} params.callback Callback
 */
function doesTeamExist({ owner, teamName, shortName, callback }) {
  const query = {
    $or: [
      { owner },
      { teamName },
      { shortName },
    ],
  };
  const filter = { _id: 0 };

  Team.findOne(query, filter).lean().exec((err, team) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'doesTeamExist' }) });

      return;
    }

    if (!team) {
      callback({ data: { exists: false } });
    } else {
      callback({ data: { exists: true } });
    }
  });
}

/**
 * Remove team
 * @param {string} params.teamName Name of the team to remove
 * @param {Object} params.user User trying to remove the team
 * @param {Function} params.callback Callback
 */
function removeTeam({ teamName, callback }) {
  const query = { teamName };

  Team.findOneAndRemove(query).lean().exec((err) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'removeTeam' }) });

      return;
    }

    dbUser.removeAllUserTeam({
      teamName,
      callback: ({ error }) => {
        if (error) {
          callback({ error });

          return;
        }

        dbRoom.removeRoom({
          roomName: teamName + appConfig.teamAppend,
          callback: (teamErr) => {
            if (teamErr) {
              callback({ error: teamErr });

              return;
            }

            callback({ data: { success: true } });
          },
        });
      },
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
exports.getTeams = getTeams;
exports.doesTeamExist = doesTeamExist;
