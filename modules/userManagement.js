var manager = require('../manager');

function handle(socket) {
    socket.on('register', function(sentUser) {
        if(sentUser) {
            var userObj = {
                userName : sentUser.userName, 
                socketId : socket.id,
                password : sentUser.password
            }

            manager.addUser(userObj, function(err, user) {
                if(err) {
                    socket.emit('message', { text : ['Failed to register user'] });
                } else {
                    socket.emit('login', user.userName);
                    socket.emit('message', { text : [user.userName + ' has been registered!'] });
                }
            });
        }
    });

    socket.on('updateId', function(sentObject) {
        console.log('updateId', socket.id, sentObject.userName);

        manager.updateUserSocketId(sentObject.userName, socket.id, function(err, user) {
            if(err || user === null) {
                console.log('Failed to update Id', err);
            } else if(!sentObject.firstConnection) {
                socket.emit('connectProc');
                socket.emit('importantMsg', { text : ['Re-established connection'] });
            }
        });
    });

    // Joins all rooms connected to the user to its current socket ID
    socket.on('fetchRooms', function() {
        manager.getUserById(socket.id, function(err, user) {
            if(err || user === null) {
                console.log('Failed to get user by id', err);
            } else {
                for(var i = 0; i < user.rooms.length; i++) {
                    var room = user.rooms[i];

                    socket.join(room);
                }
            }
        });
    });

    socket.on('login', function(sentUser) {
        if(sentUser.userName && sentUser.password) {
            manager.authUser(sentUser.userName, sentUser.password, function(err, user) {
                if(err || user === null) {
                    socket.emit('message', { text : ['Failed to login'] });
                } else {
                   socket.emit('login', user.userName); 
                }
            });
        } else {
            socket.emit('message', { text : ['User name and password needed to login. Failed to login'] });
        }
    });
}

exports.handle = handle;