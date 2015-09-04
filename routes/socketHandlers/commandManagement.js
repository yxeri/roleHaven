'use strict';

const dbConnector = require('../../databaseConnector');
const manager = require('../../manager');
const dbDefaults = require('../../config/dbPopDefaults');
const logger = require('../../logger');

function handle(socket) {
  socket.on('getCommands', function() {
    dbConnector.getAllCommands(function(err, commands) {
      if (err || commands === null || commands.length === 0) {
        //TODO Important msg through logger?
        socket.emit('importantMsg', {
          text : [
            'Failure to retrieve commands',
            'Please try rebooting with "-reboot"'
          ]
        });
      } else {
        socket.emit('updateCommands', commands);
      }
    });
  });

  socket.on('updateCommand', function(data) {
    manager.userAllowedCommand(socket.id, dbDefaults.commands.updatecommand.commandName, function(allowed) {
      if (allowed) {
        const cmdName = data.cmdName;
        const field = data.field;
        const value = data.value;
        const callback = function(err, command) {
          if (err || command === null) {
            logger.sendSocketErrorMsg(socket, logger.ErrorCodes.db, 'Failed to update command');
            logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to update command', err);
          } else {
            socket.emit('message', { text : ['Command has been updated'] });
            socket.emit('updateCommands', [command]);
            socket.broadcast.emit('updateCommands', [command]);
          }
        };
        let managerFunc;

        switch(field) {
          case 'visibility':
            managerFunc = dbConnector.updateCommandVisibility(
              cmdName, value, callback);

            break;
          case 'accesslevel':
            managerFunc = dbConnector.updateCommandAccessLevel(
              cmdName, value, callback);

            break;
          default:
            logger.sendSocketErrorMsg(socket, logger.ErrorCodes.notFound, 'Invalid field. Command doesn\'t have ' + field);

            break;
        }
      }
    });
  });
}

exports.handle = handle;