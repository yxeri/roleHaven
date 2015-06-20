'use strict';

const manager = require('../manager');

function isTextAllowed(text) {
    return /^[a-zA-Z0-9]+$/g.test(text)
}

function handle(socket, io) {
    socket.on('register', function(sentUser) {
        if(sentUser && isTextAllowed(sentUser.userName)) {
            const userObj = {
                userName : sentUser.userName,
                socketId : '',
                password : sentUser.password
            };

            manager.addUser(userObj, function(err, user) {
                if(err) {
                    socket.emit('message', { text : ['Failed to register user'] });
                } else if(user !== null) {
                    const message = {};
                    const newRoom = {};

                    message.text = ['User ' + user.userName + ' needs to be verified'];
                    message.time = new Date();
                    message.roomName = 'hqroom';

                    newRoom.roomName = user.userName;
                    newRoom.visibility = 12;
                    newRoom.accessLevel = 12;

                    socket.broadcast.to('hqroom').emit('message', message);
                    socket.emit('message', { text : [
                        user.userName + ' has been registered!',
                        'You need to be verified by another user before you can log in'
                    ] });

                    manager.createRoom(newRoom, function(err, room) {
                        if(err || room === null) {
                            console.log('Failed to create room for user ' + user.userName);
                        } else {
                            manager.addRoomToUser(user.userName, room.roomName, function(err) {
                                if(err) {
                                    console.log('Failed to add user ' + user.userName + ' to its room');
                                } else {
                                    socket.join(room.roomName);
                                }
                            });
                        }
                    });
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
                socket.emit('disconnectUser');
            } else {
                const data = {};

                data.firstConnection = sentObject.firstConnection;
                data.user = user;

                for(let i = 0; i < user.rooms.length; i++) {
                    const room = user.rooms[i];

                    socket.join(room);
                }

                socket.emit('reconnectSuccess', data);

                if(sentObject.firstConnection) {
                    manager.getUserHistory(user.rooms, function(err, history) {
                        if(err || history === null) {
                            socket.emit('message', { text : ['Unable to retrieve missed chat history'] });
                        } else {
                            const missedMessages = [];

                            for(let i = 0; i < history.length; i++) {
                                const currentHistory = history[i];
                                const messages = currentHistory.messages;

                                // Does the history document actually contain any messages?
                                if(messages.length > 0) {
                                    for(let j = (messages.length - 1); j !== 0; j--) {
                                        const message = messages[j];

                                        if(message !== undefined) {
                                            // Pushes only the messages that the user hasn't already seen
                                            if(user.lastOnline <= message.time) {
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
                                missedMessages.sort(function(a, b) {
                                    if(a.time < b.time) {
                                        return -1;
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
                    if(user.verified && !user.banned) {
                        const userSocketId = user.socketId;
                        const allSockets = Object.keys(io.sockets.connected);
                        let userIsOnline = false;

                        for(let i = 0; i < allSockets.length; i++) {
                            if(userSocketId === allSockets[i]) {
                                userIsOnline = true;

                                break;
                            }
                        }

                        if(!userIsOnline) {
                            const authUser = user;

                            manager.updateUserSocketId(sentUser.userName, socket.id, function(err, user) {
                                if(err || user === null) {
                                    socket.emit('message', { text : ['Failed to login'] });
                                } else {
                                    socket.emit('login', authUser);
                                }
                            });
                        } else {
                            manager.getUserById(socket.id, function(err, user) {
                                if(err || user == null) {
                                    socket.emit('message', { text : ['Failed to login'] });
                                } else {
                                    socket.to(userSocketId).emit('message', {
                                        text : [
                                            '-------------------',
                                            'Intrusion attempt detected by user ' + user.userName,
                                            'User tried to log in to your account',
                                            'Coordinates: ' + (user.position ? (user.position.longitude + ', ' + user.position.latitude) : 'Unable to locate user'),
                                            '-------------------',
                                        ]
                                    });
                                    socket.emit('message', {
                                        text : [
                                            'User is already logged in and has been notified about your intrusion attempt',
                                            'Your user name and coordinates have been sent to the user'
                                        ]
                                    });
                                }
                            });
                        }
                    } else {
                        if(!user.verified) {
                            socket.emit('message', { text : ['The user has not yet been verified. Failed to login'] });
                        } else {
                            socket.emit('message', { text : ['The user has been banned. Failed to login'] });
                        }
                    }
                }
            });
        } else {
            socket.emit('message', { text : ['User name and password needed to login. Failed to login'] });
        }
    });

    socket.on('changePassword', function(data) {
        if(data.oldPassword && data.newPassword && data.userName) {
            manager.authUser(data.userName, data.oldPassword, function(err, user) {
                if(err || user === null) {
                    socket.emit('message', { text : ['Failed to update password'] });
                } else {
                    manager.updateUserPassword(user.userName, data.newPassword, function(err, user) {
                        if(err || user === null) {
                            socket.emit('message', { text : ['Failed to update password'] });
                        } else {
                            socket.emit('message', { text : ['Password has been successfully changed!'] });
                        }
                    });
                }
            });
        }
    });

    socket.on('logout', function(sentUserName) {
        if(sentUserName) {
            manager.updateUserSocketId(sentUserName, ' ', function(err, user) {
                if(err || user === null) {
                    console.log('Failed to reset socket id', err);
                }

                socket.emit('message', { text : ['You have been logged out'] });
            });
        }
    });

    socket.on('verifyUser', function(sentUserName) {
       if(sentUserName !== undefined) {
            manager.verifyUser(sentUserName, function(err, user) {
                if(err || user === null) {
                    socket.emit('message', { text : ['Failed to verify user'] });
                } else {
                    socket.emit('message', { text : ['User ' + user.userName + ' has been verified']})
                }
            });
       }
    });

    socket.on('verifyAllUsers', function() {
        manager.verifyAllUsers(function(err, user) {
            if(err || user === null) {
                socket.emit('message', { text : ['Failed to verify all users'] });
            } else {
                socket.emit('message', { text : ['Users have been verified']})
            }
        });
    });

    socket.on('unverifiedUsers', function() {
        manager.getUnverifiedUsers(function(err, users) {
            if(err || users === null) {
                socket.emit('message', { text : ['Failed to get unverified users'] });
            } else{
                let usersString = '';

                for(let i = 0; i < users.length; i++) {
                    usersString += users[i].userName;

                    if(i !== users.length - 1) {
                        usersString += ' | ';
                    }
                }

                socket.emit('message', { text : [usersString] });
            }
        });
    });

    socket.on('ban', function(sentUserName) {
        manager.banUser(sentUserName, function(err, user) {
           if(err || user === null) {
               socket.emit('message', { text : ['Failed to ban user'] });
           } else {
               const bannedSocketId = user.socketId;

               socket.emit('message', { text : ['User' + sentUserName + ' has been banned'] });

               manager.updateUserSocketId(sentUserName, '', function(err, user) {
                   if(err || user === null) {
                       socket.emit('message', { text : ['Failed to disconnect user ' + sentUserName] });
                   } else {
                       socket.to(bannedSocketId).emit('ban');
                       socket.emit('message', { text : ['User ' + sentUserName + ' has been disconnected'] });
                   }
               });
           }
        });
    });

    socket.on('unban', function(sentUserName) {
        manager.unbanUser(sentUserName, function(err, user) {
            if(err || user === null) {
                socket.emit('message', { text : ['Failed to unban user'] });
            } else {
                socket.emit('message', { text : ['Ban on user ' + sentUserName + ' has been removed'] });
            }
        });
    });

    socket.on('bannedUsers', function() {
        manager.getBannedUsers(function(err, users) {
            if(err || users === null) {
                socket.emit('message', { text : ['Failed to get all banned users'] });
            } else {
                let usersString = '';

                for(let i = 0; i < users.length; i++) {
                    usersString += users[i].userName;

                    if(i !== users.length - 1) {
                        usersString += ' | ';
                    }
                }

                socket.emit('message', { text : [usersString] });
            }
        });
    });
}

exports.handle = handle;