const manager = require('../manager');

function handle(socket) {
    socket.on('entities', function() {
        manager.getAllEntities(function(err, entities) {
            if(err || entities === null) {
                socket.emit('message', { text : ['Could not retrieve entities'] })
            } else {
                const entityArray = ['Available entities:'];

                for(let i = 0; i < entities.length; i++) {
                    const keyAmount = entities[i].keys.length;

                    entityArray.push(entities[i].entityName + ' [' + keyAmount + ' unlocked]');
                }

                socket.emit('message', { text : entityArray });
            }
        });
    });

    socket.on('verifyKey', function(sentKey) {
        manager.getEncryptionKey(sentKey, function(err, key) {
            if(err) {
                socket.emit('message', { text : ['Failed to get key. Aborting'] });
                socket.emit('commandFail');
            } else {
                const data = {};

                data['keyData'] = key;
                socket.emit('commandSuccess', data);
            }
        });
    });

    socket.on('unlockEntity', function(data) {
        manager.unlockEntity(data.keyData.key, data.entityName, data.userName, function(err, entity) {
            if(err) {
                socket.emit('message', { text : ['Failed unlock entity. Aborting'] });
                socket.emit('commandFail');
            } else {
                const warningMessage = { text : ['Warning!'], morse : true };
                const message = { text : [
                    'User ' + data.userName + ' has used a key on entity ' + data.entityName,
                    'Organica Re-Education Squads have been deployed'
                ] };

                socket.emit('commandSuccess', entity);
                socket.broadcast.emit('importantMsg', warningMessage);
                socket.emit('importantMsg', warningMessage);
                socket.broadcast.emit('importantMsg', message);
                socket.emit('importantMsg', message);
            }
        });
    });
}

exports.handle = handle;