'use strict';

const express = require('express');
const router = express.Router();
const chat = require('./socketHandlers/chat');
const userManagement = require('./socketHandlers/userManagement');
const manager = require('../manager');
const commandManagement = require('./socketHandlers/commandManagement');
const config = require('../config/config');
const http = require('http');
const dbDefaults = require('../config/dbPopDefaults.js');
//Blodsband specific
const blodsband = require('./socketHandlers/blodsband');

function generateWeatherReport(jsonObj) {
  const weatherRep = {};

  weatherRep.time = new Date(jsonObj.validTime);
  weatherRep.temperature = jsonObj.t;
  weatherRep.visibility = jsonObj.vis;
  weatherRep.windDirection = jsonObj.wd;
  weatherRep.thunder = jsonObj.tstm;
  weatherRep.gust = jsonObj.gust;
  weatherRep.cloud = jsonObj.tcc;
  weatherRep.precipitation = jsonObj.pit;
  weatherRep.precipType = jsonObj.pcat;

  return weatherRep;
}

function handle(io) {
  router.get('/', function(req, res) {
    res.render('index', { title : 'Organica Oracle v3.2' });
  });

  io.on('connection', function(socket) {
    userManagement.handle(socket, io);
    chat.handle(socket, io);
    commandManagement.handle(socket, io);
    blodsband.handle(socket, io);

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
              } else {
                manager.updateUserOnline(
                  user.userName, false, function(err, user) {
                  if (err || user === null) {
                    console.log('Failed to update online', err);
                  }
                });
              }
            });

          console.log(socket.id, user.userName, 'has disconnected');
        }
      });
    });

    //TODO This should be moved
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

    //TODO This should be moved
    socket.on('time', function() {
      socket.emit('time', new Date());
    });

    socket.on('weather', function() {
      const lat = config.gameLocation.lat;
      const lon = config.gameLocation.lon;
      const hoursAllowed = [0, 4, 8, 12, 16, 20];
      let url = '';

      if (config.gameLocation.country.toLowerCase() === 'sweden') {
        url = 'http://opendata-download-metfcst.smhi.se/api/category/pmp1.5g/' +
              'version/1/geopoint/lat/' + lat + '/lon/' + lon + '/data.json';
      }

      http.get(url, function(resp) {
        let body = '';

        resp.on('data', function(chunk) {
          body += chunk;
        });

        resp.on('end', function() {
          const response = JSON.parse(body);
          const times = response.timeseries;
          const now = new Date();
          const report = [];

          for (let i = 0; i < times.length; i++) {
            const weatherRep = generateWeatherReport(times[i]);

            console.log(weatherRep.time.getHours());

            if (weatherRep.time > now && hoursAllowed.indexOf(
                weatherRep.time.getHours()) > -1) {
              report.push(weatherRep);
            } else if (weatherRep.time < now && times[i + 1] &&
                       new Date(times[i + 1].validTime) > now) {
              if (now.getMinutes() > 30) {
                report.push(generateWeatherReport(times[i + 1]));
              } else {
                report.push(weatherRep);
              }
            }
          }

          socket.emit('weather', report);
        });
      }).on('error', function(err) {
        console.log('Failed to get weather status', err);
      });
    });

    //TODO This should be moved
    /**
     * Updates socket ID on the device in the database and joins the socket
     * to the device room
     */
    socket.on('updateDeviceSocketId', function(data) {
      const deviceId = data.deviceId;
      const socketId = data.socketId;
      const user = data.user;

      socket.join(deviceId + dbDefaults.device);

      manager.updateDeviceSocketId(
        deviceId, socketId, user, function(err, device) {
        if(err || device === null) {
          const errMsg = 'Failed to update device';

          console.log(errMsg, err);
        } else {
          socket.emit('message', {
            text : ['Device has been updated']
          });
        }
      });
    });

    //TODO This should be moved
    socket.on('updateDevice', function(data) {
      manager.getUserById(socket.id, function(err, user) {
        if (err || user === null) {
          socket.emit('message', {
            text : ['Failed to update device']
          });
          console.log('Failed to get user to update device', err);
        } else {
          const deviceId = data.deviceId;
          const field = data.field;
          const value = data.value;
          const callback = function(err, device) {
            if(err || device === null) {
              let errMsg = 'Failed to update device';

              if (err.code === 11000) {
                errMsg += '. Alias already exists';
              }

              socket.emit('message', {
                text : [errMsg]
              });
              console.log(errMsg, err);
            } else {
              socket.emit('message', {
                text : ['Device has been updated']
              });
            }
          };

          switch(field) {
            case 'alias':
              if (user.accessLevel >= 11) {
                manager.updateDeviceAlias(deviceId, value, callback);
              } else {
                socket.emit('message', {
                  text : ['You do not have access to this command']
                });
              }

              break;
            default:
              socket.emit('message', {
                text : ['Invalid field. Device doesn\'t have ' + field]
              });

              break;
          }
        }
      });
    });

    socket.on('verifyDevice', function(data) {
      manager.getDevice(data.device, function(err, device) {
        if (err || device === null) {
          socket.emit('message', {
            text : [
              'Device is not in the database'
            ]
          });
          socket.emit('commandFail');
        } else {
          socket.emit('message', {
            text : [
              'Device found in the database'
            ]
          });
          socket.emit('commandSuccess', data);
        }
      });
    });
  });

  return router;
}

module.exports = handle;