var express = require('express');
var router = express.Router();

var users = {};

function handle(io) {
    router.get('/', function(req, res) {
        res.render('index', { title: 'Organica Oracle v3.2' });
    });

    // A user is meant to only join one room outside of the automatically created one and 'public'
    io.on('connection', function(socket) {
        socket.join('public');

        socket.on('register', function(user) {
            var userObj = {
                name : user, 
                socketId : socket.id
            }

            users[user] = userObj.socketId;
        });

        socket.on('chatMsg', function(msg) {
            console.log(msg);
            socket.broadcast.to(msg.room).emit('chatMsg', msg); 
        });

        socket.on('broadcastMsg', function(msg) {
            socket.broadcast.emit('chatMsg', msg);
        });

        socket.on('importantMsg', function(msg) {
            socket.broadcast.emit('importantMsg', msg);
        });

        socket.on('follow', function(room) {
            if(socket.rooms.indexof(room) > -1) {
                socket.broadcast.to(room).emit('chatMsg', {
                    msg : socket.id.substr(0, 6) + ' joined ' + room,
                    room : room
                });
                socket.join(room);
            }

            console.log(socket.rooms);
        });

        socket.on('unfollow', function(room) {
            socket.broadcast.to(room).emit('chatMsg', {
                msg : socket.id.substr(0, 6) + ' left ' + room,
                room : room
            });
            socket.leave(room);
            console.log(socket.rooms);
        });

        socket.on('listRooms', function() {
            var rooms = socket.rooms.slice(1).join('\t');

            socket.emit('message', { msg : rooms });
        });

        socket.on('disconnect', function() {
            socket.broadcast.emit('chatMsg', { msg : socket.id.substr(0, 6) + ' has disconnected' });
        });
    });

    return router;
}

module.exports = handle;