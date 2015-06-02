var manager = require('../manager');

function handle(socket) {
    socket.on('chatMsg', function(msg) {
        socket.broadcast.to(msg.room).emit('chatMsg', msg);
    });

    socket.on('broadcastMsg', function(msg) {
        socket.broadcast.emit('chatMsg', msg);
    });

    socket.on('createRoom', function(room) {
        if(manager.getRoom(room.roomName) === undefined) {
            room.visibility = room.visibility ? room.visibility : 1;
            room.accessLevel = room.accessLevel ? room.accessLevel : 1;

            manager.addRoom(room);
        } else {
            socket.emit('message', { text : [room.roomName + ' already exists.'] });
        }
    });

    socket.on('follow', function(room) {
        var selectedRoom = manager.getRoom(room.roomName);
        var currentUser = manager.getUserById(socket.id);

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
                if(manager.getUserById(socket.id) !== null) {
                    socket.broadcast.to(room.roomName).emit('chatMsg', {
                        text : manager.getUserById(socket.id).userName + ' is following ' + room.roomName,
                        room : room.roomName
                    });
                }

                socket.join(room.roomName);
                socket.emit('follow', room);
            }
        } else {
            socket.emit('message', { text : [room.roomName + ' doesn\'t exist'] });
        }
    });

    socket.on('unfollow', function(room) {
        if(socket.rooms.indexOf(room.roomName) > -1) {
            socket.broadcast.to(room.roomName).emit('chatMsg', {
                text : manager.getUserById(socket.id).userName + ' left ' + room.roomName,
                room : room.roomName
            });
            socket.leave(room.roomName);
            socket.emit('unfollow', room);
        } else {
            socket.emit('message', { text : ['You are not following ' + room.roomName] });
        }
    });

    // Shows all available rooms
    socket.on('listRooms', function() {
        var userObj = manager.getUserById(socket.id);

        if(userObj) {
            var rooms = manager.getAllRoomNames(userObj);

            if(rooms.length > 0) {
                var roomsString = rooms.sort().join('\t');

                socket.emit('message', { text : [roomsString] });
            } else {
                socket.emit('message', { text : ['There are no rooms available on your access level [' + userObj.accessLevel + ']'] });
            }
        }
    });

    socket.on('listUsers', function() {
        var userObj = manager.getUserById(socket.id);

        if(userObj) {
            var users = manager.getAllUserNames(userObj);

            if(users.length > 0) {
                var usersString = users.sort().join('\t');

                socket.emit('message', { text : [usersString] });
            } else {

            }
        }
    });

    socket.on('myRooms', function() {
        var roomsString = socket.rooms.slice(1).sort().join('\t');

        socket.emit('message', { text : [roomsString] });
    });
}

exports.handle = handle;