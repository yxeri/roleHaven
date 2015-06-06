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
				var keyData = key;

				data['keyData'] = keyData;
				socket.emit('commandSuccess', data);
			}
		});
	});

	socket.on('unlockEntity', function(data) {
		manager.unlockEntity(data.keyData.key, data.entityName, function(err, entity) {
			if(err) {
				socket.emit('message', { text : ['Failed unlock entity. Aborting'] })
				socket.emit('commandFail');
			} else {
				socket.emit('commandSuccess', entity);
			}
		});
	});
}

exports.handle = handle;