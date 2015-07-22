'use strict';

const manager = require('../manager');

function handle(socket) {
  socket.on('entities', function() {
    manager.getAllEntities(function(err, entities) {
      if (err || entities === null) {
        socket.emit('message', {
          text : ['Could not retrieve entities']
        });
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

    manager.getEncryptionKey(keyLower, function(err, key) {
      if (err || key === null) {
        socket.emit(
          'message',
          { text : ['Failed to get key. Aborting'] }
        );
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

    manager.unlockEntity(data.keyData.key, data.entityName, data.userName,
      function(err, entity) {
        if (err || entity === null) {
          socket.emit('message',
            { text : ['Failed unlock entity. Aborting'] }
          );
          console.log('failed to unlock entity', err);
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
}

exports.handle = handle;