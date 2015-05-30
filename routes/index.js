var express = require('express');
var router = express.Router();

// Access levels: Lowest / Lower / Middle / Higher / Highest / God
// 1 / 3 / 5 / 7 / 9 / 11

var users = {
    god : {
        userName : 'god',
        socketId : 0,
        accessLevel : 11,
        password: '0000'
    }
};
var rooms = {
    public : {
        roomName : 'public',
        accessLevel : 1,
        visibility : 1,
        commands : { msg : { accessLevel : 11 } },
        isDefault : true
    },
    arrhome : {
        roomName : 'arrhome',
        accessLevel : 11,
        visibility : 11
    }
};

function handle(io) {
    router.get('/', function(req, res) {
        res.render('index', { title: 'Organica Oracle v3.2' });
    });

// WORK IN PROGRESS. Room and user objects instead of strings

    io.on('connection', function(socket) {
        socket.on('register', function(user) {
            if(user && users[user.userName] === undefined) {
                var userObj = {
                    userName : user.userName, 
                    socketId : socket.id,
                    accessLevel : 1,
                    password : user.password ? user.password : '0000'
                }

                users[user.userName] = userObj;

                socket.emit('register', user.userName);
                socket.emit('message', { msg : user.userName + ' has been registered!' });
            // This might not be needed
            } else if(user === null) {
                console.log('Error. User was empty during register');
            } else {
                socket.emit('message', { msg : user.userName + ' already exists. Failed to register' });
            }
        });

        socket.on('updateUser', function(userName) {
            if(users[userName]) {
                users[userName].socketId = socket.id;
            }
        });

        socket.on('chatMsg', function(msg) {
            socket.broadcast.to(msg.room).emit('chatMsg', msg);
        });

        socket.on('broadcastMsg', function(msg) {
            socket.broadcast.emit('chatMsg', msg);
        });

        socket.on('importantMsg', function(msg) {
            socket.broadcast.emit('importantMsg', msg);
        });

        socket.on('createRoom', function(room) {
            if(rooms[room.roomName] === undefined) {
                if(room.accessLevel === undefined) { room.accessLevel = 1 }
                if(room.visibility === undefined) { room.visibility = 1 }

                rooms[room.roomName] = room;
            } else {
                socket.emit('message', { msg : room.roomName + ' already exists.' });
            }
        });

        socket.on('follow', function(room) {
            var selectedRoom = rooms[room.roomName];
            var currentUser = getUser(socket.id);

            // User won't have a user name when it connects for the first time
            if(selectedRoom) {
                // User is already in the room
                if(socket.rooms.indexOf(room.roomName) > -1) {
                    socket.emit('follow', room);
                } else if(selectedRoom.isDefault) {
                    socket.join(room.roomName);
                    socket.emit('follow', room);
                // Check that the user is allowed to join the room
                } else if(currentUser.accessLevel >= selectedRoom.accessLevel && 
                    (selectedRoom.password === undefined || room.password === selectedRoom.password)) {
                    if(getUser(socket.id) !== null) {
                        socket.broadcast.to(room.roomName).emit('chatMsg', {
                            msg : getUser(socket.id).userName + ' is following ' + room.roomName,
                            room : room.roomName
                        });
                    }

                    socket.join(room.roomName);
                    socket.emit('follow', room);
                }
            } else {
                socket.emit('message', { msg : room.roomName + ' doesn\'t exist' });
            }
        });

        socket.on('unfollow', function(room) {
            if(socket.rooms.indexOf(room.roomName) > -1) {
                socket.broadcast.to(room.roomName).emit('chatMsg', {
                    msg : getUser(socket.id).userName + ' left ' + room.roomName,
                    room : room.roomName
                });
                socket.leave(room.roomName);
                socket.emit('unfollow', room);
            } else {
                socket.emit('message', { msg : 'You are not following ' + room.roomName });
            }
        });

        // Shows all available rooms
        socket.on('listRooms', function() {
            var filteredRooms = [];
            var roomsString;
            var userObj = getUser(socket.id);

            if(userObj) {
                for(var room in rooms) {
                    if(userObj.accessLevel >= rooms[room].visibility) {
                        filteredRooms.push(room);
                    }
                }

                if(filteredRooms.length > 0) {
                    roomsString = filteredRooms.sort().join('\t');

                    socket.emit('message', { msg : roomsString });
                } else {
                    socket.emit('message', { msg : 'There are no rooms available on your access level [' + userObj.accessLevel + ']' });
                }
            }
        });

        socket.on('disconnect', function() {
            if(getUser(socket.id) !== null) {
                socket.broadcast.emit('chatMsg', { msg : getUser(socket.id).userName + ' has disconnected' });
            }
        });

        socket.on('listUsers', function() {
            var usersString = Object.keys(users).sort().join('\t');
            socket.emit('message', { msg : usersString });
        });

        socket.on('myRooms', function() {
            var roomsString = socket.rooms.slice(1).sort().join('\t');

            socket.emit('message', { msg : roomsString });
        });
    });

    return router;
}

function getUser(socketId) {
    for(var user in users) {
        if(socketId === users[user].socketId) {
            return users[user]; 
        }
    }

    return null;
}

module.exports = handle;