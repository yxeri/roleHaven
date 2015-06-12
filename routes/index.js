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
        userManagement.handle(socket);
        chat.handle(socket);
        blodsband.handle(socket);

        socket.on('importantMsg', function(msg) {
            socket.broadcast.emit('importantMsg', msg);
        });

        socket.on('disconnect', function() {
            manager.getUserById(socket.id, function(err, user) {
               if(err || user === null) {
                   console.log('User has disconnected. Couldn\'t retrieve user name');
               } else {
                   manager.setUserLastOnline(user.userName, new Date(), function(err, user) {
                       if(err || user === null) {
                            console.log('Failed to set last online');
                       }
                   });

                   console.log(socket.id, user.userName, 'has disconnected');
               }
            });
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
                                            msg += '\tLast seen: ' + new Date(currentUser.position.timestamp);
                                            msg += '\tCoordinates: ' + currentUser.position.latitude + ', ' + currentUser.position.longitude;
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
                                    'Last seen: ' + new Date(user.position.timestamp),
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

        socket.on('time', function() {
            socket.emit('time', new Date());
        })
    });

    return router;
}

module.exports = handle;