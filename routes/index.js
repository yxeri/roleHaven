var express = require('express');
var router = express.Router();

function handle(io) {
    router.get('/', function(req, res) {
        res.render('index', { title: 'Organica Oracle v3.2' });
    });

    io.on('connection', function(socket) {
        socket.broadcast.emit('message', 'User ' + socket.id.substr(0, 6) + ' has connected');

        socket.on('message', function(msg) {
            if(socket.rooms.length > 1) {
                socket.to(socket.rooms[1]).emit('message', msg);
                console.log("Message to ", socket.rooms[1]);
            } else {
                socket.broadcast.emit('message', msg);
                console.log("Messge to everyone");
            }
            
            console.log(socket.rooms);
        });

        socket.on('broadcastMsg', function(msg) {
            socket.broadcast.emit('message', msg);
        });

        socket.on('joinRoom', function(room) {
            socket.join(room);
            console.log(socket.rooms);
        });

        socket.on('disconnect', function() {
            socket.broadcast.emit('message', 'User ' + socket.id.substr(0, 6) + ' has disconnected');
        });
    });

    return router;
}

module.exports = handle;