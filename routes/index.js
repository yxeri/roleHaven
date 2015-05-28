var express = require('express');
var router = express.Router();

function handle(io) {
    router.get('/', function(req, res) {
        res.render('index', { title: 'Organica Oracle v3.2' });
    });

    // A user is meant to only join one room outside of the automatically created one and 'public'
    io.on('connection', function(socket) {
        socket.join('public');

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
            socket.broadcast.to(room).emit('chatMsg', {
                msg : socket.id.substr(0, 6) + ' is now following ' + room,
                room : room
            });
            socket.join(room);
        });

        socket.on('unfollow', function(room) {
            socket.broadcast.to(room).emit('chatMsg', {
                msg : socket.id.substr(0, 6) + ' has stopped following ' + room,
                room : room
            });
            socket.leave(room);
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