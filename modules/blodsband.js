var manager = require('../manager');

function handle(socket) {
	socket.on('entities', function() {
		manager.getAllEntities(function(err, entities) {
			if(err || entities === null) {
				socket.emit('message', { text : ['Could not retrieve entities'] })
			} else {
				var entitiesString = '';

				for(var i = 0; i < entities.length; i++) {
					var keyAmount = entities[i].keys.length;

					entitiesString += entities[i].entityName + ' [' + keyAmount + ' unlocked]' + '\t';
				}

				socket.emit('message', { text : [entitiesString] });
			}
		});
	});
}

exports.handle = handle;