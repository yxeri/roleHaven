'use strict';

import { dbConfig } from '../../config/defaults/config';
import dbLanternHack from '../../db/connectors/bbr/lanternHack';
import errorCreator from '../../error/errorCreator';
import authenticator from '../../helpers/authenticator';
import objectValidator from '../../utils/objectValidator';

/**
 * Get lantern teams.
 * @param {Object} params Parameters.
 * @param {string} params.token jwt.
 * @param {Function} params.callback Callback.
 */
function getLanternTeams({
  token,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetLanternTeam.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbLanternHack.getTeams({
        callback: ({
          error: teamError,
          data: teamData,
        }) => {
          if (teamError) {
            callback({ error: teamError });

            return;
          }

          callback({ data: teamData });
        },
      });
    },
  });
}

/**
 * Delete lantern team.
 * @param {Object} params Parameters.
 * @param {string} params.token jwt.
 * @param {number} params.teamId Id of the team to delete.
 * @param {Function} params.callback Callback.
 */
function deleteLanternTeam({
  token,
  teamId,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.DeleteLanternTeam.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbLanternHack.deleteTeam({
        teamId,
        callback,
      });
    },
  });
}

/**
 * Create lantern team.
 * @param {Object} params Parameters.
 * @param {Object} params.io socket io.
 * @param {Object} params.team Team to create.
 * @param {string} params.token jwt.
 * @param {Function} params.callback Callback.
 */
function createLanternTeam({
  io,
  team,
  token,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.CreateLanternTeam.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      if (!objectValidator.isValidData({ team }, {
        team: {
          teamName: true,
          shortName: true,
          teamId: true,
        },
      })) {
        callback({ error: new errorCreator.InvalidData({ expected: '{ team: { teamName, shortName, teamId } }' }) });

        return;
      }

      const newTeam = team;
      newTeam.teamName = newTeam.teamName.toLowerCase();
      newTeam.shortName.toLowerCase();

      createLanternTeam({
        team,
        callback: ({
          error: teamError,
          data: teamData,
        }) => {
          if (teamError) {
            callback({ error: teamError });

            return;
          }

          io.emit('lanternTeam', {
            data: {
              team: teamData.team,
              changeType: dbConfig.ChangeTypes.CREATE,
            },
          });

          callback({ data: teamData });
        },
      });
    },
  });
}

/**
 * Update lantern team.
 * @param {Object} params Parameters.
 * @param {number} params.teamId Id of team to update.
 * @param {Object} params.io Socket io.
 * @param {Object} params.team Parameters to update in team.
 * @param {string} params.token jwt.
 * @param {Function} params.callback Callback.
 */
function updateLanternTeam({
  teamId,
  io,
  team,
  token,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.UpdateLanternStation.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      const {
        teamName,
        shortName,
        points,
        isActive,
        resetPoints,
      } = team;

      updateLanternTeam({
        teamId,
        isActive,
        resetPoints,
        teamName: teamName
          ?
          teamName.toLowerCase()
          :
          undefined,
        shortName: shortName
          ?
          shortName.toLowerCase()
          :
          undefined,
        points: typeof points === 'number' && team.points > -1
          ?
          points
          :
          undefined,
        callback: ({
          error: teamError,
          data: teamData,
        }) => {
          if (teamError) {
            callback({ error: teamError });

            return;
          }

          io.emit('lanternTeam', {
            data: {
              team: teamData.team,
            },
          });

          callback({ data: teamData });
        },
      });
    },
  });
}

export { deleteLanternTeam };
export { getLanternTeams };
export { createLanternTeam };
export { updateLanternTeam };
