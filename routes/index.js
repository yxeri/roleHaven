var express = require('express');
var router = express.Router();

function handle(io) {
    router.get('/', function(req, res) {
        res.render('index', { title: 'Organica Oracle v3.2' });
    });

    io.on('connection', function(socket) {
        socket.broadcast.emit('message', 'User ' + socket.id.substr(0, 6) + ' has connected');

        socket.on('message', function(msg) {
            socket.broadcast.emit('message', msg); 
        });

        socket.on('roomMsg', function(msg) {
            socket.to(socket.rooms[1]).emit('roomMsg', msg);
        });

        socket.on('broadcastMsg', function(msg) {
            socket.broadcast.emit('message', msg);
        });

        socket.on('joinRoom', function(room) {
            socket.join(room);
            console.log(socket.rooms);
        });

        socket.on('exitRoom', function() {
            socket.leave(socket.rooms[1]);
            console.log(socket.rooms);
        });

        socket.on('disconnect', function() {
            socket.broadcast.emit('message', 'User ' + socket.id.substr(0, 6) + ' has disconnected');
        });
    });

    return router;
}

module.exports = handle;