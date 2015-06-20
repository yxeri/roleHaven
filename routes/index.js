'use strict';

const express = require('express');
const router = express.Router();
const chat = require('../modules/chat');
const userManagement = require('../modules/userManagement');
const manager = require('../manager');
//Blodsband specific
const blodsband = require('../modules/blodsband');

function handle(io) {
    router.get('/', function(req, res) {
        res.render('index', { title : 'Organica Oracle v3.2' });
    });

    io.on('connection', function(socket) {
        userManagement.handle(socket, io);
        chat.handle(socket, io);
        blodsband.handle(socket, io);

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
                                const locationData = {};

                                for(let i = 0; i < users.length; i++) {
                                    const currentUser = users[i];
                                    const userName = currentUser.userName;

                                    locationData[userName] = {};

                                    if(users[i].position !== undefined) {
                                        locationData[userName].coords = {};
                                        locationData[userName].lastSeen = new Date(currentUser.position.timestamp);
                                        locationData[userName].coords.latitude = currentUser.position.latitude;
                                        locationData[userName].coords.longitude = currentUser.position.longitude;
                                        locationData[userName].coords.heading = currentUser.position.heading;
                                    }
                                }

                                socket.emit('locationMsg', locationData);
                            }
                        });
                    } else {
                        manager.getUserLocation(user, sentUserName, function(err, user) {
                            if(err || user === null) {
                                socket.emit('message', { text : ['Failed to get user location'] });
                            } else if(user.position !== undefined) {
                                const locationData = {};
                                const userName = user.userName;

                                locationData[userName] = {};
                                locationData[userName].coords = {};

                                locationData[userName].lastSeen = new Date(user.position.timestamp);
                                locationData[userName].coords.latitude = user.position.latitude;
                                locationData[userName].coords.longitude = user.position.longitude;
                                locationData[userName].coords.heading = user.position.heading;

                                socket.emit('locationMsg', locationData);
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