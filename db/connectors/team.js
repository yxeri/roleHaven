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

const teamSchema = new mongoose.Schema(dbConnector.createSchema({
  teamName: { type: String, unique: true },
  shortName: { type: String, unique: true },
  isVerified: { type: Boolean, default: false },
  isProtected: { type: Boolean, default: false },
  members: { type: [String], default: [] },
}), { collection: 'teams' });

const Team = mongoose.model('Team', teamSchema);

const teamFilter = dbConnector.createFilter({
  teamName: 1,
  shortName: 1,
  members: 1,
});

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

      callback({ data: { team: data.object } });
    },
  });
}

/**
 * Get teams.
 * @private
 * @param {Object} params - Parameters.
 * @param {Object} params.query - Query to get teams.
 * @param {Object} [params.filter] - Filter for the result.
 * @param {Function} params.callback - Callback.
 */
function getTeams({
  query,
  filter,
  callback,
}) {
  dbConnector.getObjects({
    query,
    filter,
    object: Team,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({
        data: {
          teams: data.objects,
        },
      });
    },
  });
}

/**
 * Get a team.
 * @private
 * @param {Object} params - Parameters.
 * @param {Object} params.query - Query to get teams.
 * @param {Function} params.callback - Callback.
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
        callback({ error: new errorCreator.DoesNotExist({ name: `team ${JSON.stringify(query, null, 4)}` }) });

        return;
      }

      callback({ data: { team: data.object } });
    },
  });
}

/**
 * Does the team exist?
 * @private
 * @param {Object} params - Parameters.
 * @param {string} params.teamName - Name of the team.
 * @param {string} params.shortName - Short name of the team.
 * @param {Function} params.callback - Callback.
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
 * @param {string} params.teamId - ID of the team
 * @param {Function} params.callback - Callback
 * @param {string[]} [params.userIds] - ID of the users
 * @param {string[]} [params.teamIds] - ID of the teams
 * @param {string[]} [params.bannedIds] - Blocked ids
 * @param {string[]} [params.teamAdminIds] - Id of the teams to give admin access to. They will also be added to teamIds.
 * @param {string[]} [params.userAdminIds] - Id of the users to give admin access to. They will also be added to userIds.
 */
function addAccess({
  teamId,
  userIds,
  teamIds,
  bannedIds,
  callback,
  teamAdminIds,
  userAdminIds,
}) {
  dbConnector.addObjectAccess({
    userIds,
    teamIds,
    bannedIds,
    teamAdminIds,
    userAdminIds,
    objectId: teamId,
    object: Team,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ team: data.object });
    },
  });
}

/**
 * Remove access to team.
 * @param {Object} params - Parameters.
 * @param {string} params.teamId - ID of the team.
 * @param {Function} params.callback - Callback.
 * @param {string[]} [params.teamIds] - ID of the teams.
 * @param {string[]} [params.userIds] - ID of the user.
 * @param {string[]} [params.bannedIds] - Blocked ids.
 * @param {string[]} [params.teamAdminIds] - Id of the teams to remove admin access from. They will not be removed from teamIds.
 * @param {string[]} [params.userAdminIds] - Id of the users to remove admin access from. They will not be removed from userIds.
 */
function removeAccess({
  teamId,
  userIds,
  teamIds,
  bannedIds,
  teamAdminIds,
  userAdminIds,
  callback,
}) {
  dbConnector.removeObjectAccess({
    userIds,
    teamIds,
    bannedIds,
    teamAdminIds,
    userAdminIds,
    objectId: teamId,
    object: Team,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ team: data.object });
    },
  });
}

/**
 * Get teams that the user has access to.
 * @param {Object} params - Parameters.
 * @param {string} params.user - User retrieving the teams.
 * @param {Function} params.callback - Callback.
 * @param {boolean} [params.full] - Should access data be returned?
 * @param {boolean} [params.includeInactive] - Should unverified teams be returned?
 */
function getTeamsByUser({
  user,
  callback,
  includeInactive,
  full = false,
}) {
  const query = dbConnector.createUserQuery({ user });
  const filter = !full ? teamFilter : {};

  if (!includeInactive) { query.isVerified = true; }

  getTeams({
    query,
    filter,
    callback,
  });
}

/**
 * Get team by Id.
 * @param {Object} params - Parameters.
 * @param {string} params.teamId - Id of the team.
 * @param {Function} params.callback - Callback.
 */
function getTeamById({ teamId, callback }) {
  getTeam({
    callback,
    query: { _id: teamId },
  });
}

/**
 * Remove team.
 * @param {Object} params - Parameters.
 * @param {string} params.teamId - Id of the team to remove.
 * @param {Function} params.callback Callback.
 */
function removeTeam({ teamId, callback }) {
  dbUser.removeTeamFromAll({
    teamId,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbConnector.removeObject({
        callback,
        query: { _id: teamId },
        object: Team,
      });
    },
  });
}

/**
 * Verify the team.
 * @param {Object} params - Parameters.
 * @param {string} params.teamId - Id of the team to verify.
 * @param {Function} params.callback - Callback.
 */
function verifyTeam({ teamId, callback }) {
  updateTeam({
    teamId,
    callback,
    team: { isVerified: true },
  });
}

exports.createTeam = createTeam;
exports.removeTeam = removeTeam;
exports.getTeamsByUser = getTeamsByUser;
exports.updateTeam = updateTeam;
exports.addAccess = addAccess;
exports.removeAccess = removeAccess;
exports.getTeamById = getTeamById;
exports.verifyTeam = verifyTeam;
