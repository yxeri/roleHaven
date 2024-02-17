const authenticator = require('../helpers/authenticator');
const teamManager = require('./teams');
const dbMission = require('../db/connectors/mission');
const { dbConfig } = require('../config/defaults/config');

export function createMission({
  internalCallUser,
  token,
}) {
  authenticator.isUserAllowed({
    internalCallUser,
    token,
    commandName: dbConfig.apiCommands.CreateMission,
    callback: () => {

    },
  });
}

export function completeMission({
  socket,
  io,
}) {
  teamManager.updateTeam({
    teamId,
    team,
    callback: () => {

    },
  });
}

/**
 * 1. Input ID
 * 2. Create mission
 * 3. Complete mission
 * 4. Confirmation and update total score.
 */
