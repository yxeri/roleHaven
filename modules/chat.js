var manager = require('../manager');

var messageSort = function(a, b) {
    if(a.time < b.time) {
        return -1;
    } else if(a.time > b.time) {
        return 1;
    }

    return 0;
};

function isTextAllowed(text) {
    return /^[a-zA-Z0-9]+$/g.test(text)
}

function handle(socket) {
    socket.on('chatMsg', function(data) {
        var newData = data;

        newData.message.time = new Date();

        manager.addMsgToHistory(newData.roomName, newData.message, function(err, history) {
            if(err || history === null) {
                console.log('Failed to add message to history', err);
            } else {
                var newMessage = newData.message;

                newMessage.roomName = newData.roomName;

                socket.broadcast.to(newMessage.roomName).emit('chatMsg', newMessage);
                socket.emit('message', newMessage);
            }
        });
    });

    socket.on('broadcastMsg', function(data) {
        var newData = data;

        newData.message.time = new Date();

        manager.addMsgToHistory('broadcast', newData.message, function(err, history) {
            if(err || history === null) {
                console.log('Failed to add message to history', err);
            } else {
                var newMessage = newData.message;

                newMessage.roomName = newData.roomName;

                socket.broadcast.emit('broadcastMsg', newMessage);
                socket.emit('message', newMessage);
            }
        });
    });

    socket.on('createRoom', function(sentRoom) {
        if(sentRoom && isTextAllowed(sentRoom.roomName)) {
            manager.createRoom(sentRoom, function(err, room) {
                if(err) {
                    socket.emit('message', { text : ['Failed to create the room'] });
                } else if(room !== null) {
                    socket.emit('message', { text : ['Room successfully created'] });
                } else {
                    socket.emit('message', { text : [sentRoom.roomName + ' already exists'] });
                }
            });
        }
    });

    socket.on('follow', function(sentRoom) {
        if(sentRoom.password === undefined) {
            sentRoom.password = ''
        }

        manager.getUserById(socket.id, function(err, user) {
            if(err || user === null) {
                socket.emit('message', { text : ['Failed to follow ' + sentRoom.roomName] });
            } else {
                manager.authUserToRoom(user, sentRoom.roomName, sentRoom.password, function(err, room) {
                    if(err || room === null) {
                        socket.emit('message', { text : ['Failed to follow ' + sentRoom.roomName] });
                    } else {
                        manager.addRoomToUser(user.userName, room.roomName, function(err) {
                            if(err) {
                                socket.emit('message', { text : ['Failed to follow ' + sentRoom.roomName] });
                            } else {
                                if(sentRoom.entered) {
                                    room.entered = true
                                }

                                if(socket.rooms.indexOf(room.roomName) < 0) {
                                    socket.broadcast.to(room.roomName).emit('chatMsg', {
                                        text : [user.userName + ' is following ' + room.roomName],
                                        room : room.roomName
                                    });
                                }

                                socket.join(room.roomName);
                                socket.emit('follow', room);
                            }
                        });
                    }
                });
            }
        });
    });

    socket.on('unfollow', function(room) {
        if(socket.rooms.indexOf(room.roomName) > -1) {
            manager.getUserById(socket.id, function(err, user) {
                if(err || user === null) {
                    socket.emit('message', { text : ['Failed to unfollow room'] });
                } else {
                    manager.removeRoomFromUser(user.userName, room.roomName, function(err, user) {
                        if(err || user === null) {
                            socket.emit('message', { text : ['Failed to unfollow room'] });
                        } else {
                            socket.broadcast.to(room.roomName).emit('chatMsg', {
                                text : [user.userName + ' left ' + room.roomName],
                                room : room.roomName
                            });
                            socket.leave(room.roomName);
                            socket.emit('unfollow', room);
                        }
                    });
                }
            });
        } else {
            socket.emit('message', { text : ['You are not following ' + room.roomName] });
        }
    });

    // Shows all available rooms
    socket.on('listRooms', function() {
        manager.getUserById(socket.id, function(err, user) {
            if(err || user === null) {
                console.log('Failed to get user by id', err);
            } else {
                manager.getAllRooms(user, function(roomErr, rooms) {
                    if(roomErr) {
                        console.log('Failed to get all room names', roomErr);
                    } else {
                        if(rooms.length > 0) {
                            var roomsString = '';

                            for(var i = 0; i < rooms.length; i++) {
                                roomsString += rooms[i].roomName + '\t';
                            }

                            socket.emit('message', { text : [roomsString] });
                        }
                    }
                });
            }
        });
    });

    socket.on('listUsers', function() {
        manager.getUserById(socket.id, function(err, user) {
            if(err || user === null) {
                console.log('Failed to get user by id', err);
            } else {
                manager.getAllUsers(user, function(userErr, users) {
                    if(userErr || users === null) {
                        console.log('Failed to get all users', usererr);
                    } else {
                        if(users.length > 0) {
                            var usersString = '';

                            for(var i = 0; i < users.length; i++) {
                                usersString += users[i].userName + '\t';
                            }

                            socket.emit('message', { text : [usersString] });
                        }
                    }
                });
            }
        });
    });

    socket.on('myRooms', function() {
        var roomsString = socket.rooms.slice(1).sort().join('\t');

        socket.emit('message', { text : [roomsString] });
    });

    socket.on('history', function(lines) {
        console.log('history', lines);

        manager.getUserById(socket.id, function(err, user) {
            if(err || user === null) {
                console.log('Failed to get history. Couldn\'t get user', err);
            } else {
                manager.getUserHistory(socket.rooms.slice(1), function(err, history) {
                    if(err || history === null) {
                        console.log('Failed to get history', err);
                    } else {
                        var historyMessages = [];
                        var maxLines = lines === null || isNaN(lines) ? 60 : lines;

                        for(var i = 0; i < history.length; i++) {
                            var currentHistory = history[i];
                            var messages = currentHistory.messages;

                            if(messages.length > 0) {
                                messages = messages.slice(-maxLines);

                                for(var j = (messages.length - 1); j !== 0; j--) {
                                    var message = messages[j];

                                    message.roomName = currentHistory.roomName;
                                    // We want the messages to be printed out instantly on the client
                                    message.speed = 0;
                                    historyMessages.push(message);
                                }
                            }
                        }

                        // Above loop pushes in everything in the reverse order. Let's fix that
                        historyMessages.reverse();
                        historyMessages.sort(messageSort);

                        socket.emit('multiMsg', historyMessages);
                    }
                });
            }
        })
    });

    socket.on('morse', function(data) {
        socket.broadcast.to(data.roomName).emit('morse', data.morseCode);
        socket.emit('morse', data.morseCode);
    });
}

exports.handle = handle;