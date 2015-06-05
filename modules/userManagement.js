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
                } else if(user !== null){
                    socket.emit('login', user.userName);
                    socket.emit('message', { text : [user.userName + ' has been registered!'] });
                } else {
                    socket.emit('message', { text : [sentUser.userName + ' already exists'] });
                }
            });
        }
    });

    socket.on('updateId', function(sentObject) {
        manager.updateUserSocketId(sentObject.userName, socket.id, function(err, user) {
            if(err || user === null) {
                console.log('Failed to update Id', err);
            } else if(!sentObject.firstConnection) {
                socket.emit('updateConnection');
            }
        });
    });

    // Should this be moved?
    // Joins all rooms connected to the user to its current socket ID
    socket.on('fetchRooms', function() {
        manager.getUserById(socket.id, function(err, user) {
            if(err || user === null) {
                socket.emit('message', { text : ['Failed to fetch all your rooms'] });
            } else {
                for(var i = 0; i < user.rooms.length; i++) {
                    var room = user.rooms[i];

                    socket.join(room);
                }
            }
        });
    });

    // This should be moved
    socket.on('locate', function(sentUserName) {
        manager.getUserById(socket.id, function(err, user) {
            if(err || user === null) {
                socket.emit('message', { text : ['Failed to get user location'] });
            } else {
                // Return all user locations
                if(sentUserName === '*') {
                    manager.getAllUserLocations(user, function(err, users) {
                        if(err || users === null) {
                            socket.emit('message', { text : ['Failed to get user location'] });
                        } else {
                            var userText = [];

                            for(var i = 0; i < users.length; i++) {
                                var msg = '';

                                msg += 'User: ' + users[i].userName;
                                msg += '.\tLast seen: ' + '[' + users[i].position.timestamp + ']';
                                msg += '.\tLongitude: ' + users[i].position.longitude;
                                msg += '.\tLatitude: ' + users[i].position.latitude;

                                userText[i] = msg;
                            }

                            socket.emit('message', { text : userText });
                        }
                    });
                } else {
                    manager.getUserLocation(user, sentUserName, function(err, user) {
                        if(err || user === null) {
                            socket.emit('message', { text : ['Failed to get user location'] });
                        } else {
                            socket.emit('message', { text : [
                                'User: ' + user.userName,
                                'Last seen: ' + '[' + user.position.timestamp + ']',
                                'Longitude: ' + user.position.longitude + '. Latitude: ' + user.position.latitude 
                            ]})
                        }
                    });
                }
            }
        });
    });

    socket.on('updateLocation', function(position) {
        manager.getUserById(socket.id, function(err, user) {
            if(err || user === null) {
                socket.emit('message', { text : ['Failed to update location'] });
            } else {
                manager.updateUserLocation(user.userName, position, function(err, user) {
                    if(err) {
                        socket.emit('message', { text : ['Failed to update location'] });
                    }
                });
            }
        });
    })

    // This has to set socket ID on new user
    socket.on('login', function(sentUser) {
        if(sentUser.userName && sentUser.password) {
            manager.authUser(sentUser.userName, sentUser.password, function(err, user) {
                if(err || user === null) {
                    socket.emit('message', { text : ['Failed to login'] });
                } else {
                    var authUser = user;

                    manager.updateUserSocketId(sentUser.userName, socket.id, function(err, user) {
                        if(err || user === null) {
                            socket.emit('message', { text : ['Failed to login'] });
                        } else {
                            socket.emit('login', authUser.userName);
                        }
                    });
                }
            });
        } else {
            socket.emit('message', { text : ['User name and password needed to login. Failed to login'] });
        }
    });
}

exports.handle = handle;