var manager = require('../manager');

function handle(socket) {
    socket.on('entities', function() {
        manager.getAllEntities(function(err, entities) {
            if(err || entities === null) {
                socket.emit('message', { text : ['Could not retrieve entities'] })
            } else {
                var entityArray = ['Available entities:'];

                for(var i = 0; i < entities.length; i++) {
                    var keyAmount = entities[i].keys.length;

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
                var data = {};

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
                var text = [
                    'Warning! User ' + data.userName + ' has used a key on entity ' + data.entityName,
                    'Organica death squads have been deployed'
                ];

                socket.emit('commandSuccess', entity);
                socket.broadcast.emit('importantMsg', { text : text });
                socket.emit('importantMsg', { text : text });
            }
        });
    });
}

exports.handle = handle;