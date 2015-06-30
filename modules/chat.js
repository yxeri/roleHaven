'use strict';

const manager = require('../manager');

const messageSort = function(a, b) {
    if(a.time < b.time) {
        return -1;
    } else if(a.time > b.time) {
        return 1;
    }

    return 0;
};

function isTextAllowed(text) {
    return /^[a-zA-Z0-9]+$/g.test(text);
}

function handle(socket) {
    socket.on('chatMsg', function(data) {
        const newData = data;
        let roomName = newData.message.whisper ?
                       newData.roomName + '-whisper' : newData.roomName;

        newData.message.time = new Date();

        manager.addMsgToHistory(roomName, newData.message,
                                function(err, history) {
            if(err || history === null) {
                console.log('Failed to add message to history', err);
            } else {
                const newMessage = newData.message;

                newMessage.roomName = newData.roomName;

                socket.broadcast.to(roomName).emit('chatMsg', newMessage);

                if(!data.skipSelfMsg) {
                    socket.emit('message', newMessage);
                }

                // Save the sent message in the sender's room history too,
                // if it is a whisper
                if(newData.message.whisper) {
                    const whisperRoom = newData.message.user + '-whisper';
                    manager.addMsgToHistory(whisperRoom,
                                            newData.message,
                                            function(err, history) {
                        if(err || history === null) {
                            console.log(
                                'Failed to save whisper in senders history',
                                err
                            );
                        }
                    });
                }
            }
        });
    });

    socket.on('broadcastMsg', function(data) {
        const newData = data;

        newData.message.time = new Date();

        manager.addMsgToHistory('broadcast', newData.message,
                                function(err, history) {
            if(err || history === null) {
                console.log('Failed to add message to history', err);
            } else {
                const newMessage = newData.message;

                newMessage.roomName = newData.roomName;

                socket.broadcast.emit('broadcastMsg', newMessage);
                socket.emit('message', newMessage);
            }
        });
    });

    socket.on('createRoom', function(sentRoom) {
        sentRoom.roomName = sentRoom.roomName.toLowerCase();

        if(sentRoom && sentRoom.owner && isTextAllowed(sentRoom.roomName)) {
            manager.getUserById(socket.id, function(err, user) {
                if(err || user === null) {
                    socket.emit('message',
                        { text : ['Failed to create the room'] }
                    );
                } else {
                    manager.createRoom(sentRoom, user, function(err, room) {
                        if(err) {
                            socket.emit('message',
                                { text : ['Failed to create the room'] }
                            );
                        } else if(room !== null) {
                            socket.emit('message',
                                { text : ['Room successfully created'] }
                            );
                        } else {
                            socket.emit('message', {
                                    text : [
                                        sentRoom.roomName + ' either ' +
                                        'already exists ' +
                                        'or you\'ve already created a room',
                                        'You can only be the owner of one room'
                                    ]
                                }
                            );
                        }
                    });
                }
            });
        } else {
            socket.emit('message', { text : ['Failed to create the room'] });
        }
    });

    socket.on('follow', function(data) {
        data.roomName = data.roomName.toLowerCase();

        if(data.password === undefined) {
            data.password = '';
        }

        manager.getUserById(socket.id, function(err, user) {
            if(err || user === null) {
                socket.emit('message',
                    { text : ['Failed to follow ' + data.roomName] });
            } else {
                manager.authUserToRoom(user, data.roomName, data.password,
                                       function(err, room) {
                    if(err || room === null) {
                        socket.emit('message', {
                            text : [
                                'You are not authorized to join ' +
                                data.roomName
                            ]
                        });
                    } else {
                        const roomName = room.roomName;

                        manager.addRoomToUser(user.userName, roomName,
                                              function(err) {
                            if(err) {
                                socket.emit('message', {
                                    text : [
                                        'Failed to follow ' +
                                        data.roomName
                                    ]
                                });
                            } else {
                                if(data.entered) {
                                    room.entered = true;
                                }

                                if(socket.rooms.indexOf(roomName) < 0) {
                                    socket.broadcast.to(roomName).emit(
                                        'chatMsg', {
                                        text : [
                                            user.userName + ' is following ' +
                                            roomName
                                        ],
                                        room : roomName
                                    });
                                }

                                socket.join(roomName);
                                socket.emit('follow', room);
                            }
                        });
                    }
                });
            }
        });
    });

    socket.on('switchRoom', function(room) {
        room.roomName = room.roomName.toLowerCase();

        manager.getUserById(socket.id, function(err, user) {
            if(err || user === null) {
                socket.emit('message', {
                    text : ['Failed to switch to room ' + room.roomName]
                });
            } else {
                if(socket.rooms.indexOf(room.roomName) > 0) {
                    socket.emit('follow', room);
                } else {
                    socket.emit('message', {
                        text : ['You are not following room ' + room.roomName]
                    });
                }
            }
        });
    });

    socket.on('unfollow', function(room) {
        const roomName = room.roomName.toLowerCase();

        if(socket.rooms.indexOf(roomName) > -1) {
            manager.getUserById(socket.id, function(err, user) {
                if(err || user === null) {
                    socket.emit('message',
                        { text : ['Failed to unfollow room'] });
                } else {
                    const userName = user.userName;

                    // User should not be able to unfollow its own room
                    // That room is for private messaging between users
                    if(roomName !== userName) {
                        manager.removeRoomFromUser(userName, roomName,
                                                   function(err, user) {
                            if(err || user === null) {
                                socket.emit('message', {
                                    text : ['Failed to unfollow room']
                                });
                            } else {
                                socket.broadcast.to(roomName).emit('chatMsg', {
                                    text : [userName + ' left ' + roomName],
                                    room : roomName
                                });
                                socket.leave(roomName);
                                socket.emit('unfollow', room);
                            }
                        });
                    }
                }
            });
        } else {
            socket.emit('message',
                { text : ['You are not following ' + roomName] });
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
                            let roomsString = '';

                            for(let i = 0; i < rooms.length; i++) {
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
                        console.log('Failed to get all users', userErr);
                    } else {
                        if(users.length > 0) {
                            let usersString = '';

                            for(let i = 0; i < users.length; i++) {
                                const currentUser = users[i];

                                if(currentUser.verified &&
                                   !currentUser.banned) {
                                    usersString += currentUser.userName + '\t';
                                }
                            }

                            socket.emit('message', { text : [usersString] });
                        }
                    }
                });
            }
        });
    });

    socket.on('myRooms', function() {
        // The first room is auto-created by socket.io (has name of socket.id)
        // The second room is used for whispering between user
        // (has same name as user). They should not be visible to the user
        const roomsString = socket.rooms.slice(2).sort().join('\t');

        socket.emit('message', {
            text : [
                'You are following rooms:',
                roomsString
            ]
        });

        manager.getUserById(socket.id, function(err, user) {
            if(err || user === null) {
                console.log('Failed to get user for owned rooms', err);
            } else {
                manager.getOwnedRooms(user, function(err, rooms) {
                    if(err || rooms === null) {
                        console.log('Failed to get owned rooms', err);
                    } else {
                        let ownedRoomsString = '';

                        for(let i = 0; i < rooms.length; i++) {
                            ownedRoomsString += rooms[i].roomName + '\t';
                        }

                        if(ownedRoomsString.length > 0) {
                            socket.emit('message', {
                                text : [
                                    'You are owner of the rooms:',
                                    ownedRoomsString
                                ]
                            });
                        }
                    }
                });
            }
        });
    });

    socket.on('history', function(lines) {
        manager.getUserById(socket.id, function(err, user) {
            if(err || user === null) {
                console.log('Failed to get history. Couldn\'t get user', err);
            } else {
                manager.getUserHistory(socket.rooms, function(err, history) {
                    if(err || history === null) {
                        console.log('Failed to get history', err);
                    } else {
                        const historyMessages = [];
                        const maxLines = lines === null || isNaN(lines) ?
                                         60 : lines;

                        for(let i = 0; i < history.length; i++) {
                            const currentHistory = history[i];

                            if(currentHistory.messages.length > 0) {
                                const messages =
                                    currentHistory.messages.slice(-maxLines);
                                const messageLength = messages.length - 1;

                                for(let j = messageLength; j !== 0; j--) {
                                    const message = messages[j];

                                    message.roomName = currentHistory.roomName;
                                    historyMessages.push(message);
                                }
                            }
                        }

                        // Above loop pushes in everything in the reverse order.
                        historyMessages.reverse();
                        historyMessages.sort(messageSort);

                        socket.emit('multiMsg', historyMessages);
                    }
                });
            }
        });
    });

    socket.on('morse', function(data) {
        data.roomName.toLowerCase();

        socket.broadcast.to(data.roomName).emit('morse', data.morseCode);
        socket.emit('morse', data.morseCode);
    });

    socket.on('roomHackable', function(roomName) {
        const roomNameLower = roomName.toLowerCase();

        manager.getRoom(roomNameLower, function(err, room) {
            if(err || room === null) {
                socket.emit('message', {
                   text : [
                       'The room is not hackable or doesn\'t exist'
                   ]
                });
                socket.emit('commandFail');
            } else {
                socket.emit('commandSuccess');
            }
        });
    });

    socket.on('hackRoom', function(data) {
        const roomName = data.roomName.toLowerCase();
        const userName = data.userName.toLowerCase();

        manager.addRoomToUser(userName, roomName, function(err) {
            if(err) {
                socket.emit('message', {
                    text : ['Failed to follow the room']
                });
            } else {
                const room = { roomName : roomName };

                socket.join(roomName);
                socket.emit('follow', room);
            }
        });
    });

    socket.on('removeRoom', function(roomName) {
        const roomNameLower = roomName.toLowerCase();

        manager.getUserById(socket.id, function(err, user) {
            if(err || user == null) {
                socket.emit('message', {
                    text : ['Failed to remove the room']
                });
            } else {
                manager.removeRoom(roomNameLower, user, function(err, room) {
                    if(err || room == null) {
                        socket.emit('message', {
                            text : ['Failed to remove the room']
                        });
                    } else {
                        socket.emit('message', {
                            text : ['Removed the room']
                        });
                    }
                });
            }
        });
    });

    socket.on('importantMsg', function(message) {
        //add to history important
        socket.broadcast.emit('importantMsg', message);
        socket.emit('importantMsg', message);
    });
}

exports.handle = handle;