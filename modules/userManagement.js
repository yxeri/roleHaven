var manager = require('../manager');

function handle(socket) {
    socket.on('register', function(sentUser) {
        if (sentUser) {
            var userObj = {
                userName: sentUser.userName,
                socketId: socket.id,
                password: sentUser.password
            };

            manager.addUser(userObj, function (err, user) {
                if (err) {
                    socket.emit('message', {text: ['Failed to register user']});
                } else if (user !== null) {
                    socket.emit('login', user.userName);
                    socket.emit('message', {text: [user.userName + ' has been registered!']});
                } else {
                    socket.emit('message', {text: [sentUser.userName + ' already exists']});
                }
            });
        }
    });

    socket.on('updateId', function(sentObject) {
        manager.updateUserSocketId(sentObject.userName, socket.id, function(err, user) {
            if(err || user === null) {
                console.log('Failed to update Id', err);
                socket.emit('disconnectUser');
            } else {
                for(var i = 0; i < user.rooms.length; i++) {
                    var room = user.rooms[i];

                    socket.join(room);
                }

                socket.emit('reconnectSuccess', sentObject.firstConnection);

                if(sentObject.firstConnection) {
                    manager.getUserHistory(user.rooms, function(err, history) {
                        if(err || history === null) {
                            socket.emit('message', { text : ['Unable to retrieve missed chat history'] });
                        } else {
                            var missedMessages = [];

                            for(var i = 0; i < history.length; i++) {
                                var currentHistory = history[i];
                                var messages = currentHistory.messages;

                                // Does the history document actually contain any messages?
                                if(messages.length > 0) {
                                    for (var j = (messages.length - 1); j !== 0; j--) {
                                        var message = messages[j];

                                        if (message !== undefined) {
                                            // Pushes only the messages that the user hasn't already seen
                                            if (user.lastOnline <= message.time) {
                                                message.roomName = currentHistory.roomName;
                                                // We want the messages to be printed out instantly on the client
                                                message.speed = 0;
                                                missedMessages.push(message);
                                            }
                                        }
                                    }
                                }
                            }

                            if(missedMessages.length > 0) {
                                // Above loop pushes in everything in the reverse order. Let's fix that
                                missedMessages.reverse();
                                missedMessages.sort(function (a, b) {
                                    if(a.time < b.time) {
                                        return - 1;
                                    } else if(a.time > b.time) {
                                        return 1;
                                    }

                                    return 0;
                                });

                                socket.emit('multiMsg', missedMessages);
                            }
                        }
                    });
                }
            }
        });
    });

    socket.on('updateLocation', function(position) {
        manager.getUserById(socket.id, function(err, user) {
            if(err || user === null) {
                // socket.emit('message', { text : ['Failed to update location'] });
            } else {
                manager.updateUserLocation(user.userName, position, function(err) {
                    if(err) {
                        // socket.emit('message', { text : ['Failed to update location'] });
                    }
                });
            }
        });
    });

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