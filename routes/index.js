var express = require('express');
var router = express.Router();

var users = {};

function handle(io) {
    router.get('/', function(req, res) {
        res.render('index', { title: 'Organica Oracle v3.2' });
    });

    // A user is meant to only join one room outside of the automatically created one and 'public'
    io.on('connection', function(socket) {
        socket.on('register', function(user) {
            var userObj = {
                name : user, 
                socketId : socket.id
            }

            users[user] = userObj.socketId;
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

        socket.on('follow', function(room) {
            if(socket.rooms.indexOf(room) > -1) {
                socket.broadcast.to(room).emit('chatMsg', {
                    msg : getUser(socket.id) + ' joined ' + room,
                    room : room
                });
                socket.join(room);
            }
        });

        socket.on('unfollow', function(room) {
            socket.broadcast.to(room).emit('chatMsg', {
                msg : getUser(socket.id) + ' left ' + room,
                room : room
            });
            socket.leave(room);
        });

        socket.on('listRooms', function() {
            var rooms = socket.rooms.slice(1).join('\t');

            socket.emit('message', { msg : rooms });
        });

        socket.on('disconnect', function() {
            socket.broadcast.emit('chatMsg', { msg : getUser(socket.id) + ' has disconnected' });
        });

        socket.on('listUsers', function() {
            var usersString = Object.keys(users).sort().join(' - ');
            socket.emit('message', { msg : usersString });
        });
    });

    return router;
}

function getUser(socketId) {
    for(var user in users) {
        if(socketId === users[user]) {
            return user; 
        }
    }

    return null;
}

module.exports = handle;