'use strict';

const express = require('express');
const router = express.Router();
const chat = require('../modules/chat');
const userManagement = require('../modules/userManagement');
const manager = require('../manager');
const commandManagement = require('../modules/commandManagement');
const config = require('../config/config');
const http = require('http');
//Blodsband specific
const blodsband = require('../modules/blodsband');

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
                manager.updateUserSocketId(
                  user.userName, ' ', function(err, user) {
                  if (err || user === null) {
                    console.log('Failed to reset socket id', err);
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
  });

  return router;
}

module.exports = handle;