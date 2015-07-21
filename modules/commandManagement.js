'use strict';

const manager = require('../manager');
const dbDefaults = require('../config/dbPopDefaults.js');

function handle(socket) {
  socket.on('getCommands', function() {
    manager.getAllCommands(function(err, commands) {
      if (err || commands === null || commands.length === 0) {
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
    manager.getUserById(socket.id, function(err, user) {
      if (err || user === null) {
        socket.emit('message', {
          text : ['Failed to update command']
        });
        console.log('Failed to get user to update command', err);
      } else {
        const cmdName = data.cmdName;
        const field = data.field;
        const value = data.value;
        const callback = function(err, command) {
          if (err || command === null) {
            socket.emit('message', { text : ['Failed to update command'] });
            console.log('Failed to update command', err);
          } else {
            socket.emit('message', { text : ['Command has been updated'] });
            socket.emit('updateCommands', [command]);
            socket.broadcast.emit('updateCommands', [command]);
          }
        };
        let managerFunc;

        switch(field) {
          case 'visibility':
            managerFunc = manager.updateCommandVisibility(
              cmdName, value, callback);

            break;
          case 'accesslevel':
            managerFunc = manager.updateCommandAccessLevel(
              cmdName, value, callback);

            break;
          default:
            socket.emit('message', {
              text : ['Invalid field. Command doesn\'t have ' + field]
            });

            break;
        }
      }
    });
  });
}

exports.handle = handle;