var express = require('express');
var router = express.Router();
var chat = require('../modules/chat');
var userManagement = require('../modules/userManagement');
var manager = require('../manager');
//Blodsband specific
var blodsband = require('../modules/blodsband');

function handle(io) {
    router.get('/', function(req, res) {
        res.render('index', { title: 'Organica Oracle v3.2' });
    });

    io.on('connection', function(socket) {
        connection(socket);
        userManagement.handle(socket);
        chat.handle(socket);
        blodsband.handle(socket);

        socket.on('importantMsg', function(msg) {
            socket.broadcast.emit('importantMsg', msg);
        });

        socket.on('ping', function() {
            socket.emit('pong');
        })

        socket.on('disconnect', function() {
        });

        // This should be moved
        socket.on('locate', function(sentUserName) {
            manager.getUserById(socket.id, function(err, user) {
                if(err || user === null) {
                    socket.emit('message', { text : ['Failed to get user location'] });
                } else {
                    // Return all user locations
                    if(sentUserName === '*') {
                        manager.getAllUserLocations(user, function(err, users) {
                            if(err || users === null) {
                                socket.emit('message', { text : ['Failed to get user location'] });
                            } else {
                                var userText = [];

                                for(var i = 0; i < users.length; i++) {
                                        var msg = '';
                                        var currentUser = users[i];

                                        msg += 'User: ' + currentUser.userName;

                                        if(users[i].position) {
                                            msg += '\tLast seen: ' + '[' + currentUser.position.timestamp + ']';
                                            msg += '\tCoordinates: ' + currentUser.position.latitude + ', ' + currentUser.position.longitude;;
                                        } else {
                                            msg += '\tUnable to locate user'
                                        }

                                        userText[i] = msg;
                                }

                                socket.emit('message', { text : userText });
                            }
                        });
                    } else {
                        manager.getUserLocation(user, sentUserName, function(err, user) {
                            if(err || user === null) {
                                socket.emit('message', { text : ['Failed to get user location'] });
                            } else if(user.position) {
                                socket.emit('message', { text : [
                                    'User: ' + user.userName,
                                    'Last seen: ' + '[' + user.position.timestamp + ']',
                                    'Coordinates: ' + user.position.latitude + ', ' + user.position.longitude 
                                ]})
                            } else {
                                socket.emit('message', { text : ['Unable to locate ' + sentUserName] });
                            }
                        });
                    }
                }
            });
        });
    });

    return router;
}

function connection(socket) {
}

module.exports = handle;