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
 * Add custom id to the object
 * @param {Object} team - Team object
 * @return {Object} - Team object with id
 */
function addCustomId(team) {
  const updatedTeam = team;
  updatedTeam.teamId = team.objectId;

  return updatedTeam;
}

/**
 * Update team
 * @private
 * @param {Object} params - Parameters
 * @param {Object} params.teamId - ID of the team
 * @param {Function} params.callback Callback
 */
function updateObject({ teamId, update, callback }) {
  dbConnector.updateObject({
    update,
    query: { _id: teamId },
    object: Team,
    errorNameContent: 'updateTeam',
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ data: { team: addCustomId(data.object) } });
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

      callback({ data: { team: addCustomId(data.object) } });
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

          callback({ data: { team: addCustomId(data.savedObject) } });
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
  teamId,
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
      teamId,
      callback: (updateData) => {
        if (updateData.error) {
          callback({ error: updateData.error });

          return;
        }

        callback({ data: { team: addCustomId(updateData.data.team) } });
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
 * @param {string} params.teamId - ID of the team
 * @param {string[]} [params.userIds] - ID of the users
 * @param {string[]} [params.teamIds] - ID of the teams
 * @param {string[]} [params.bannedIds] - Blocked ids
 * @param {boolean} [params.isAdmin] - Should the users be added to admins?
 * @param {Function} params.callback - Callback
 */
function addAccess({
  teamId,
  userIds,
  teamIds,
  bannedIds,
  isAdmin,
  callback,
}) {
  dbConnector.addObjectAccess({
    userIds,
    teamIds,
    bannedIds,
    isAdmin,
    objectId: teamId,
    object: Team,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ team: addCustomId(data.object) });
    },
  });
}

/**
 * Remove access to team
 * @param {Object} params - Parameters
 * @param {string} params.teamId - ID of the team
 * @param {string[]} params.teamIds - ID of the teams
 * @param {string[]} [params.userIds] - ID of the user
 * @param {string[]} [params.bannedIds] - Blocked ids
 * @param {boolean} [params.isAdmin] - Should the teams and/or users be removed from admins?
 * @param {Function} params.callback - Callback
 */
function removeAccess({
  teamId,
  userIds,
  teamIds,
  bannedIds,
  isAdmin,
  callback,
}) {
  dbConnector.removeObjectAccess({
    userIds,
    teamIds,
    bannedIds,
    isAdmin,
    objectId: teamId,
    object: Team,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ team: addCustomId(data.object) });
    },
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
 * @param {string} params.teamId - ID of the team
 * @param {Function} params.callback - Callback
 */
function getTeamById({ teamId, callback }) {
  getTeam({
    callback,
    query: { _id: teamId },
  });
}

/**
 * Remove team
 * @param {Object} params - Parameters
 * @param {string} params.teamId - ID of the team to remove
 * @param {Function} params.callback Callback
 */
function removeTeam({ teamId, callback }) {
  dbConnector.removeObject({
    callback,
    query: { _id: teamId },
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
