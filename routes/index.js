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

        socket.on('disconnect', function() {
            socket.broadcast.emit('message', 'User ' + socket.id.substr(0, 6) + ' has disconnected');
        });
    });

    return router;
}

module.exports = handle;