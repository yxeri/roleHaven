var express = require('express');
var router = express.Router();
var chat = require('../modules/chat');
var userManagement = require('../modules/userManagement');

function handle(io) {
    router.get('/', function(req, res) {
        res.render('index', { title: 'Organica Oracle v3.2' });
    });

    io.on('connection', function(socket) {
        connection(socket);
        userManagement.handle(socket);
        chat.handle(socket);

        socket.on('importantMsg', function(msg) {
            socket.broadcast.emit('importantMsg', msg);
        });

        socket.on('disconnect', function() {
            // if(getUser(socket.id) !== null) {
            //     socket.broadcast.emit('chatMsg', { text : [getUser(socket.id).userName + ' has disconnected'] });
            // }
        });
    });

    return router;
}

function connection(socket) {
}

module.exports = handle;