var express = require('express');
var router = express.Router();

function handle(io) {
    router.get('/', function(req, res) {
        res.render('index', { title: 'Organica Oracle v3.2' });
    });

    io.on('connection', function(socket) {
        console.log('a user connected');

        socket.on('chat message', function(msg) {
            socket.broadcast.emit('chat message', msg);
        });

        socket.on('disconnect', function() {
            socket.emit('chat message', 'User disconnected');
        });
    });

    return router;
}

module.exports = handle;