/*
 Copyright 2017 Carmilla Mina Jankovic

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
const errorCreator = require('../../error/errorCreator');
const dbConnector = require('../databaseConnector');

const teamSchema = new mongoose.Schema(dbConnector.createSchema({
  teamName: { type: String, unique: true },
  shortName: { type: String, unique: true },
  teamNameLowerCase: { type: String, unique: true },
  shortNameLowerCase: { type: String, unique: true },
  isVerified: { type: Boolean, default: false },
  isProtected: { type: Boolean, default: false },
  members: { type: [String], default: [] },
  picture: dbConnector.pictureSchema,
  locationName: String,
}), { collection: 'teams' });

const Team = mongoose.model('Team', teamSchema);

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
      }

      if (!data.object) {
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
function doesTeamExist({
  teamName,
  shortName,
  callback,
}) {
  if (!teamName && !shortName) {
    callback({ data: { exists: false } });

    return;
  }

  const query = {};

  if (teamName && shortName) {
    query.$or = [
      { shortNameLowerCase: shortName.toLowerCase() },
      { teamNameLowerCase: teamName.toLowerCase() },
    ];
  } else if (teamName) {
    query.teamNameLowerCase = teamName.toLowerCase();
  } else {
    query.shortNameLowerCase = shortName.toLowerCase();
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
      }

      if (nameData.data.exists) {
        callback({ error: new errorCreator.AlreadyExists({ name: `team ${team.teamName} ${team.shortName}` }) });

        return;
      }

      const teamToSave = team;
      teamToSave.teamNameLowerCase = teamToSave.teamName.toLowerCase();
      teamToSave.shortNameLowerCase = teamToSave.shortName.toLowerCase();

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
  const update = {};
  const set = {};
  const unset = {};

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
    unset.ownerAliasId = '';
  } else if (ownerAliasId) {
    set.ownerAliasId = ownerAliasId;
  }

  if (typeof isVerified === 'boolean') { set.isVerified = isVerified; }
  if (typeof isProtected === 'boolean') { set.isProtected = isProtected; }
  if (teamName) {
    set.teamName = teamName;
    set.teamNameLowerCase = teamName.toLowerCase();
  }
  if (shortName) {
    set.shortName = shortName;
    set.shortNameLowerCase = shortName.toLowerCase();
  }

  if (Object.keys(set).length > 0) { update.$set = set; }
  if (Object.keys(unset).length > 0) { update.$unset = unset; }

  if (teamName || shortName) {
    doesTeamExist({
      shortName,
      teamName,
      callback: ({ error, data }) => {
        if (error) {
          callback({ error });

          return;
        }

        if (data.exists) {
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
 * Update access to the team.
 * @param {Object} params - Parameters.
 * @param {Function} params.callback - Callback.
 * @param {boolean} [params.shouldRemove] - Should access be removed?
 * @param {string[]} [params.userIds] - Id of the users to update.
 * @param {string[]} [params.teamIds] - Id of the teams to update.
 * @param {string[]} [params.bannedIds] - Id of the blocked Ids to update.
 * @param {string[]} [params.teamAdminIds] - Id of the teams to update admin access for.
 * @param {string[]} [params.userAdminIds] - Id of the users to update admin access for.
 */
function updateAccess(params) {
  const accessParams = params;
  const { callback } = params;
  accessParams.objectId = params.teamId;
  accessParams.object = Team;
  accessParams.callback = ({ error, data }) => {
    if (error) {
      callback({ error });

      return;
    }

    callback({ data: { team: data.object } });
  };

  if (params.shouldRemove) {
    dbConnector.removeObjectAccess(params);
  } else {
    dbConnector.addObjectAccess(params);
  }
}

/**
 * Get teams that the user has access to.
 * @param {Object} params - Parameters.
 * @param {string} params.user - User retrieving the teams.
 * @param {Function} params.callback - Callback.
 * @param {boolean} [params.includeInactive] - Should unverified teams be returned?
 */
function getTeamsByUser({
  user,
  callback,
  includeInactive,
}) {
  const query = dbConnector.createUserQuery({ user });

  if (!includeInactive) { query.isVerified = true; }

  getTeams({
    query,
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

/**
 * Add a new member to the team.
 * @param {Object} params - Parameters.
 * @param {string[]} params.memberIds - Ids of the users.
 * @param {string} params.teamId - Id of the team.
 * @param {Function} params.callback - Callback.
 */
function addTeamMembers({ memberIds, teamId, callback }) {
  updateObject({
    callback,
    teamId,
    update: { $addToSet: { members: { $each: memberIds } } },
  });
}

/**
 * Remove a member from the team.
 * @param {Object} params - Parameters.
 * @param {string[]} params.memberIds - Ids of the users.
 * @param {string} params.teamId - Id of the team.
 * @param {Function} params.callback - Callback.
 */
function removeTeamMembers({ memberIds, teamId, callback }) {
  updateObject({
    callback,
    teamId,
    update: { $pull: { members: { $each: memberIds } } },
  });
}

exports.createTeam = createTeam;
exports.getTeamsByUser = getTeamsByUser;
exports.updateTeam = updateTeam;
exports.updateAccess = updateAccess;
exports.getTeamById = getTeamById;
exports.verifyTeam = verifyTeam;
exports.addTeamMembers = addTeamMembers;
exports.removeTeamMembers = removeTeamMembers;
