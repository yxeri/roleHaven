'use strict';

const dbConnector = require('../../databaseConnector');
const manager = require('../../manager');
const dbDefaults = require('../../config/dbPopDefaults');
const logger = require('../../logger');

function handle(socket) {
  socket.on('entities', function() {
    dbConnector.getAllEntities(function(err, entities) {
      if (err || entities === null) {
        logger.sendErrorMsg(logger.ErrorCodes.general, 'Could not retrieve entities');
      } else {
        const entityArray = ['Available entities:'];

        for (let i = 0; i < entities.length; i++) {
          const keyAmount = entities[i].keys.length;

          entityArray.push(
            entities[i].entityName +
            ' [' + keyAmount +
            ' unlocked]'
          );
        }

        socket.emit('message', { text : entityArray });
      }
    });
  });

  socket.on('verifyKey', function(sentKey) {
    const keyLower = sentKey.toLowerCase();

    dbConnector.getEncryptionKey(keyLower, function(err, key) {
      if (err || key === null) {
        logger.sendErrorMsg(logger.ErrorCodes.general, 'Failed to get key. Aborting');
        socket.emit('commandFail');
      } else {
        const data = {};

        data.keyData = key;
        socket.emit('commandSuccess', data);
      }
    });
  });

  socket.on('unlockEntity', function(data) {
    data.entityName = data.entityName.toLowerCase();
    data.keyData.key = data.keyData.key.toLowerCase();

    dbConnector.unlockEntity(data.keyData.key, data.entityName, data.userName,
      function(err, entity) {
        if (err || entity === null) {
          logger.sendErrorMsg(logger.ErrorCodes.general, 'Failed to unlock entity. Aborting');
          socket.emit('commandFail');
        } else {
          const message = {
            text : [
              'Entity event',
              'User ' + data.userName + ' has used a key on entity ' +
              data.entityName,
              'Organica Re-Education Squads have been deployed'
            ], morse : { local : true }
          };

          socket.emit('commandSuccess', entity);
          socket.broadcast.emit('importantMsg', message);
          socket.emit('importantMsg', message);
        }
      });
  });

  socket.on('addKeys', function(keys) {
    manager.userAllowedCommand(socket.id, dbDefaults.commands.addencryptionkeys.commandName, function(allowed) {
      if (allowed) {
        for (let i = 0; i < keys.length; i++) {
          keys[i].key = keys[i].key.toLowerCase();
        }

        dbConnector.addEncryptionKeys(keys, function(err) {
          if (err) {
            logger.sendErrorMsg(logger.ErrorCodes.general, 'Failed to upload keys to the database');
          } else {
            socket.emit('message', {
              text : ['Key has been uploaded to the database']
            });
          }
        });
      }
    });
  });

  socket.on('addEntities', function(entities) {
    manager.userAllowedCommand(socket.id, dbDefaults.commands.addentities.commandName, function(allowed) {
      if (allowed) {
        for (let i = 0; i < entities.length; i++) {
          entities[i].entityName = entities[i].entityName.toLowerCase();
        }

        dbConnector.addEntities(entities, function(err) {
          if (err) {
            logger.sendErrorMsg(logger.ErrorCodes.general, 'Failed to upload entities to the database');
          } else {
            socket.emit('message', {
              text : ['Entity has been uploaded to the database']
            });
          }
        });
      }
    });
  });
}

exports.handle = handle;