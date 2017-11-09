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

const teamSchema = new mongoose.Schema(dbConnector.createSchema({
  teamName: { type: String, unique: true },
  shortName: { type: String, unique: true },
  isVerified: { type: Boolean, default: false },
  isProtected: { type: Boolean, default: false },
}), { collection: 'teams' });

const Team = mongoose.model('Team', teamSchema);

/**
 * Update team
 * @private
 * @param {Object} params - Parameters
 * @param {Object} params.objectId - ID of the team
 * @param {Function} params.callback Callback
 */
function updateObject({ objectId, update, callback }) {
  dbConnector.updateObject({
    update,
    query: { _id: objectId },
    object: Team,
    errorNameContent: 'updateTeam',
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ data: { team: data.object } });
    },
  });
}

/**
 * Get teams
 * @private
 * @param {Object} params - Parameters
 * @param {Object} params.query - Query to get teams
 * @param {Function} params.callback - Callback
 */
function getTeams({ query, callback }) {
  dbConnector.getObjects({
    query,
    object: Team,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ data: { teams: data.objects } });
    },
  });
}

/**
 * Get team
 * @private
 * @param {Object} params - Parameters
 * @param {Object} params.query - Query to get teams
 * @param {Function} params.callback - Callback
 */
function getTeam({ query, callback }) {
  dbConnector.getObject({
    query,
    object: Team,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!data.object) {
        callback({ error: new errorCreator.DoesNotExist({ name: `team ${query.toString()}` }) });

        return;
      }

      callback({ data: { team: data.object } });
    },
  });
}

/**
 * Does team exist?
 * @private
 * @param {Object} params - Parameters
 * @param {string} params.teamName - Name of the team
 * @param {string} params.shortName - Short name of the team
 * @param {Function} params.callback - Callback
 */
function doesTeamExist({ teamName, shortName, callback }) {
  if (!teamName && !shortName) {
    callback({ data: { exists: false } });

    return;
  }

  const query = {};

  if (teamName && shortName) {
    query.$or = [
      { shortName },
      { teamName },
    ];
  } else if (teamName) {
    query.teamName = teamName;
  } else {
    query.shortName = shortName;
  }

  dbConnector.doesObjectExist({
    callback,
    query,
    object: Team,
  });
}

/**
 * Create and save team
 * @param {Object} params - Parameters
 * @param {Object} params.team - New team
 * @param {Function} params.callback - Callback
 */
function createTeam({ team, callback }) {
  doesTeamExist({
    teamName: team.teamName,
    shortName: team.shortName,
    callback: (nameData) => {
      if (nameData.error) {
        callback({ error: nameData.error });

        return;
      } else if (nameData.data.exists) {
        callback({ error: new errorCreator.AlreadyExists({ name: `team ${team.teamName} ${team.shortName}` }) });

        return;
      }

      dbConnector.saveObject({
        object: new Team(team),
        objectType: 'team',
        callback: ({ error, data }) => {
          if (error) {
            callback({ error });

            return;
          }

          callback({ data: { team: data.savedObject } });
        },
      });
    },
  });
}

/**
 * Update team
 * @param {Object} params - Parameters
 * @param {Object} params.team - Fields to update
 * @param {Object} [params.options] - Options
 * @param {Function} params.callback - Callback
 */
function updateTeam({
  objectId,
  team,
  callback,
  options = {},
}) {
  const {
    teamName,
    shortName,
    ownerAliasId,
    isVerified,
    isProtected,
  } = team;
  const { resetOwnerAliasId } = options;
  const update = { $set: {} };

  const updateCallback = () => {
    updateObject({
      update,
      objectId,
      callback: (updateData) => {
        if (updateData.error) {
          callback({ error: updateData.error });

          return;
        }

        callback({ data: { team: updateData.data.team } });
      },
    });
  };

  if (resetOwnerAliasId) {
    update.$unset = { ownerAliasId: '' };
  } else if (ownerAliasId) {
    update.$set.ownerAliasId = ownerAliasId;
  }

  if (typeof isVerified === 'boolean') { update.$set.isVerified = isVerified; }
  if (typeof isProtected === 'boolean') { update.$set.isProtected = isProtected; }

  if (teamName || shortName) {
    if (teamName) { update.$set.teamName = teamName; }
    if (shortName) { update.$set.shortName = shortName; }

    doesTeamExist({
      shortName,
      teamName,
      callback: ({ error, data }) => {
        if (error) {
          callback({ error });

          return;
        } else if (data.exists) {
          callback({ error: new errorCreator.AlreadyExists({ name: `teamName ${teamName} ${shortName}` }) });

          return;
        }

        updateCallback();
      },
    });

    return;
  }

  updateCallback();
}

/**
 * Add users to team
 * @param {Object} params - Parameters
 * @param {string} params.objectId - ID of the team
 * @param {string[]} [params.userIds] - ID of the users
 * @param {string[]} [params.teamIds] - ID of the teams
 * @param {string[]} [params.blockedIds] - Blocked ids
 * @param {boolean} [params.isAdmin] - Should the users be added to admins?
 * @param {Function} params.callback - Callback
 */
function addAccess({
  objectId,
  userIds,
  teamIds,
  blockedIds,
  isAdmin,
  callback,
}) {
  if (!userIds && !teamIds && !blockedIds) {
    callback({ error: new errorCreator.InvalidData({ expected: 'teamIds || userIds || blockedIds' }) });

    return;
  }

  dbConnector.addObjectAccess({
    objectId,
    userIds,
    teamIds,
    blockedIds,
    isAdmin,
    callback,
    object: Team,
  });
}

/**
 * Remove access to team
 * @param {Object} params - Parameters
 * @param {string} params.objectId - ID of the team
 * @param {string[]} params.teamIds - ID of the teams
 * @param {string[]} [params.userIds] - ID of the user
 * @param {string[]} [params.blockedIds] - Blocked ids
 * @param {boolean} [params.isAdmin] - Should the teams and/or users be removed from admins?
 * @param {Function} params.callback - Callback
 */
function removeAccess({
  objectId,
  userIds,
  teamIds,
  blockedIds,
  isAdmin,
  callback,
}) {
  if (!userIds && !teamIds && !blockedIds) {
    callback({ error: new errorCreator.InvalidData({ expected: 'teamIds || userIds || blockedIds' }) });

    return;
  }

  dbConnector.removeObjectAccess({
    objectId,
    userIds,
    teamIds,
    blockedIds,
    callback,
    isAdmin,
    object: Team,
  });
}

/**
 * Get teams by user
 * @param {Object} params - Parameters
 * @param {string} params.userId - ID of the user
 * @param {Function} params.callback - Callback
 */
function getTeamsByUser({ userId, callback }) {
  const query = {
    $or: [
      { ownerId: userId },
      { userIds: { $in: [userId] } },
    ],
  };

  getTeams({
    query,
    callback,
  });
}

/**
 * Get team by ID
 * @param {Object} params - Parameters
 * @param {string} params.objectId - ID of the team
 * @param {Function} params.callback - Callback
 */
function getTeamById({ objectId, callback }) {
  getTeam({
    callback,
    query: { _id: objectId },
  });
}

/**
 * Remove team
 * @param {Object} params - Parameters
 * @param {string} params.objectId - ID of the team to remove
 * @param {Function} params.callback Callback
 */
function removeTeam({ objectId, callback }) {
  dbConnector.removeObject({
    callback,
    query: { _id: objectId },
    object: Team,
  });
}

exports.createTeam = createTeam;
exports.removeTeam = removeTeam;
exports.getTeamsByUser = getTeamsByUser;
exports.updateTeam = updateTeam;
exports.addAccess = addAccess;
exports.removeAccess = removeAccess;
exports.getTeamById = getTeamById;
