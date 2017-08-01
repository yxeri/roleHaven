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

const dbConfig = require('../config/defaults/config').databasePopulation;
const authenticator = require('../helpers/authenticator');
const dbLanternHack = require('../db/connectors/lanternhack');

/**
 * Get lantern teams
 * @param {string} params.token jwt
 * @param {Function} params.callback Callback
 */
function getLanternTeams({ token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetLanternTeam.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbLanternHack.getTeams({
        callback: ({ error: teamError, data: teamData }) => {
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
 * Create lantern team
 * @param {Object} params.io socket io
 * @param {Object} params.team Team to create
 * @param {string} params.token jwt
 * @param {Function} params.callback Callback
 */
function createLanternTeam({ io, team, token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.CreateLanternTeam.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbLanternHack.createLanternTeam({
        team,
        callback: ({ error: teamError, data: teamData }) => {
          if (teamError) {
            callback({ error: teamError });

            return;
          }

          io.emit('lanternTeams', { data: { teams: [teamData.team] } });
          callback({ data: teamData });
        },
      });
    },
  });
}

/**
 * Update lantern team
 * @param {Object} params.io Socket io
 * @param {Object} params.team Parameters to update in teawm
 * @param {string} params.teamName Full or short name of team to update
 * @param {string} params.token jwt
 * @param {Function} params.callback Callback
 */
function updateLanternTeam({ io, team, teamName, token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.UpdateLanternStation.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbLanternHack.updateLanternTeam({
        teamName,
        isActive: team.isActive,
        points: team.points,
        resetPoints: team.resetPoints,
        callback: ({ error: teamError, data: teamData }) => {
          if (teamError) {
            callback({ error: teamError });

            return;
          }

          io.emit('lanternTeams', { data: { teams: [teamData.team] } });
          callback({ data: teamData });
        },
      });
    },
  });
}

exports.getLanternTeams = getLanternTeams;
exports.createLanternTeam = createLanternTeam;
exports.updateLanternTeam = updateLanternTeam;
