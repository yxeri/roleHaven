/*
 Copyright 2015 Aleksandar Jankovic

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

const dbCommand = require('../../db/connectors/command');
const manager = require('../../socketHelpers/manager');
const databasePopulation = require('../../config/defaults/config').databasePopulation;
const logger = require('../../utils/logger');
const objectValidator = require('../../utils/objectValidator');

/**
 * @param {Object} socket - Socket.IO socket
 */
function handle(socket) {
  /**
   * Gets all commands available to the user
   * Emits updateCommands
   */
  socket.on('getCommands', (params, callback = () => {}) => {
    dbCommand.getAllCommands((err, commands) => {
      if (err || commands === null || commands.length === 0) {
        callback({
          error: {
            text: [
              'Failure to retrieve commands',
              'Please try rebooting with the command "reboot"',
            ],
            text_se: [
              'Lyckades inte hämta kommandon',
              'Försök att starta om med kommandot "reboot"',
            ],
          },
        });

        return;
      }

      callback({ data: { commands } });
    });
  });

  /**
   * Updates a command's field in the database and emits the change to all sockets
   * Emits updateCommands
   */
  socket.on('updateCommand', (params, callback = () => {}) => {
    if (!objectValidator.isValidData(params, { command: { commandName: true }, field: true, value: true })) {
      callback({ error: {} });

      return;
    }

    manager.userAllowedCommand(socket.id, databasePopulation.commands.updatecommand.commandName, (allowErr, allowed) => {
      if (allowErr || !allowed) {
        callback({ error: {} });

        return;
      }

      const commandName = params.command.commandName;
      const field = params.field;
      const value = params.value;
      const updateCommandCallback = (err, command) => {
        if (err || command === null) {
          callback({
            error: {
              code: logger.ErrorCodes.db,
              text: ['Failed to update command'],
              text_se: ['Misslyckades med att uppdatera kommandot'],
            },
          });

          return;
        }

        callback({
          data: { commands: [command] },
          message: {
            text: ['Command has been updated'],
            text_se: ['Kommandot har uppdaterats'],
          },
        });
        socket.broadcast.emit('updateCommands', { commands: [command] });
      };
      switch (field) {
        case 'visibility':
          dbCommand.updateCommandVisibility(commandName, value, updateCommandCallback);

          break;
        case 'accesslevel':
          dbCommand.updateCommandAccessLevel(commandName, value, updateCommandCallback);

          break;
        default:
          logger.sendSocketErrorMsg({
            socket,
            code: logger.ErrorCodes.notFound,
            text: [`Invalid field. Command doesn't have ${field}`],
            text_se: [`Ej giltigt fält. Kommandon har inte fältet ${field}`],
          });

          break;
      }
    });
  });
}

exports.handle = handle;
