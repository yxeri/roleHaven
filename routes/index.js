'use strict';

const express = require('express');
const router = express.Router();
const chat = require('../modules/chat');
const userManagement = require('../modules/userManagement');
const manager = require('../manager');
const commandManagement = require('../modules/commandManagement');
//Blodsband specific
const blodsband = require('../modules/blodsband');

function handle(io) {
  router.get('/', function(req, res) {
    res.render('index', { title : 'Organica Oracle v3.2' });
  });

  io.on('connection', function(socket) {
    userManagement.handle(socket, io);
    chat.handle(socket, io);
    commandManagement.handle(socket, io)
    blodsband.handle(socket, io);

    socket.on('importantMsg', function(msg) {
      socket.broadcast.emit('importantMsg', msg);
    });

    socket.on('disconnect', function() {
      manager.getUserById(socket.id, function(err, user) {
        if (err || user === null) {
          console.log(
            'User has disconnected. Couldn\'t retrieve user name'
          );
        } else {
          manager.setUserLastOnline(user.userName, new Date(),
            function(err, user) {
              if (err || user === null) {
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
        if (err || user === null) {
          socket.emit('message', {
            text : ['Failed to get user location']
          });
        } else {
          // Return all user locations
          if (sentUserName === '*') {
            manager.getAllUserLocations(user, function(err, users) {
              if (err || users === null) {
                socket.emit('message', {
                  text : ['Failed to get user location']
                });
              } else {
                const locationData = {};

                for (let i = 0; i < users.length; i++) {
                  const currentUser = users[i];
                  const position = currentUser.position;
                  const userName = currentUser.userName;
                  const locObj = {};

                  if (users[i].position !== undefined) {
                    const coords = {};
                    const locTime =
                      new Date(position.timestamp);

                    coords.latitude = position.latitude;
                    coords.longitude = position.longitude;
                    coords.heading = position.heading;
                    locObj.coords = coords;

                    locObj.locTime = locTime;
                    locObj.accuracy = position.accuracy;

                    locationData[userName] = locObj;
                  }
                }

                socket.emit('locationMsg', locationData);
              }
            });
          } else {
            manager.getUserLocation(user, sentUserName,
              function(err, user) {
                if (err || user === null) {
                  socket.emit('message', {
                    text : ['Failed to get user location']
                  });
                } else if (user.position !== undefined) {
                  const userName = user.userName;
                  const position = user.position;
                  const locTime = new Date(position.timestamp);
                  const locationData = {};
                  const locObj = {};
                  const coords = {};

                  coords.latitude = position.latitude;
                  coords.longitude = position.longitude;
                  coords.heading = position.heading;
                  locObj.coords = coords;

                  locObj.locTime = locTime;
                  locObj.accuracy = position.accuracy;

                  locationData[userName] = locObj;

                  socket.emit('locationMsg', locationData);
                } else {
                  socket.emit('message', {
                    text : ['Unable to locate ' + sentUserName]
                  });
                }
              });
          }
        }
      });
    });

    socket.on('time', function() {
      socket.emit('time', new Date());
    });
  });

  return router;
}

module.exports = handle;