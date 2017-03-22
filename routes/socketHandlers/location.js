/*
 Copyright 2015 Aleksandar Jankovic

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

'use strict';

const dbUser = require('../../db/connectors/user');
const dbLocation = require('../../db/connectors/location');
const manager = require('../../socketHelpers/manager');
const databasePopulation = require('../../config/defaults/config').databasePopulation;
const logger = require('../../utils/logger');
const objectValidator = require('../../utils/objectValidator');
const mapCreator = require('../../utils/mapCreator');
const errorCreator = require('../../objects/error/errorCreator');

/**
 * @param {Object} socket - Socket.IO socket
 */
function handle(socket) {
  socket.on('updateLocation', ({ location }, callback = () => {}) => {
    if (!objectValidator.isValidData({ location }, { location: { coordinates: { longitude: true, latitude: true }, title: true } })) {
      callback({ error: {} });

      return;
    }

    manager.userIsAllowed(socket.id, databasePopulation.commands.createLocation.commandName, (allowErr, allowed, user) => {
      if (allowErr || !allowed) {
        callback({ error: {} });

        return;
      }

      location.markerType = 'custom';
      location.owner = user.userName;
      location.team = user.team;

      dbLocation.updateLocation({
        location,
        callback: (err, createdLocation) => {
          if (err) {
            callback({ error: {} });

            return;
          }

          callback({ data: { location: createdLocation } });
        },
      });
    });
  });

  socket.on('updateUserLocation', (params, callback = () => {}) => {
    if (!objectValidator.isValidData(params, { position: true })) {
      callback({ error: {} });

      return;
    }

    manager.userIsAllowed(socket.id, databasePopulation.commands.map.commandName, (allowErr, allowed, user) => {
      if (allowErr || !allowed) {
        callback({ error: {} });

        return;
      }

      dbUser.updateUserIsTracked(user.userName, true, (trackingErr) => {
        if (trackingErr) {
          logger.sendErrorMsg({
            code: logger.ErrorCodes.db,
            text: ['Failed to update user isTracking'],
            err: trackingErr,
          });

          callback({ error: {} });
        }
      });

      dbLocation.updateLocation({
        positionName: user.userName,
        position: params.position,
        type: 'user',
        owner: user.userName,
        group: user.team,
        callback: (userErr) => {
          if (userErr) {
            logger.sendErrorMsg({
              code: logger.ErrorCodes.db,
              text: ['Failed to update position'],
              err: userErr,
            });

            callback({ error: {} });

            return;
          }

          dbLocation.getLocation(user.userName, (err, position) => {
            if (err) {
              logger.sendErrorMsg({
                code: logger.ErrorCodes.db,
                text: ['Failed to broadcast new user position'],
                err: userErr,
              });

              callback({ error: {} });

              return;
            }

            dbUser.getAllUsers(user, (allErr, users) => {
              if (allErr) {
                logger.sendErrorMsg({
                  code: logger.ErrorCodes.db,
                  text: ['Failed to get all users to broadcast new user position to'],
                  err: userErr,
                });

                callback({ error: {} });

                return;
              }

              for (const socketUser of users) {
                if (socketUser.socketId && socket.id !== socketUser.socketId && socketUser.isTracked) {
                  socket.broadcast.to(socketUser.socketId).emit('mapLocations', {
                    positions: [position],
                    currentTime: (new Date()),
                  });
                }
              }
            });
          });
        },
      });
    });
  });

  socket.on('getMapPositions', ({ types }, callback = () => {}) => {
    if (!objectValidator.isValidData({ types }, { types: true })) {
      callback({ error: {} });

      return;
    }

    manager.userIsAllowed(socket.id, databasePopulation.commands.map.commandName, (allowErr, allowed, user) => {
      if (allowErr || !allowed) {
        callback({ error: {} });

        return;
      }

      const message = {};

      /**
       * Get and send positions
       * @private
       * @param {string} type - Position type
       * @param {Object[]} locations - All positions
       */
      function getLocations(type, locations) {
        switch (type) {
          case 'google': {
            mapCreator.getGoogleLocations((err, googleLocations) => {
              if (err || googleLocations === null) {
                callback({ error: new errorCreator.External({ source: 'Google Maps' }) });

                return;
              }

              getLocations(types.shift(), locations.concat(googleLocations));
            });

            break;
          }
          case 'custom': {
            dbLocation.getCustomLocations(user.userName, (err, customLocations) => {
              if (err) {
                callback({ error: new errorCreator.Database() });

                return;
              }

              getLocations(types.shift(), locations.concat(customLocations));
            });

            break;
          }
          case 'users': {
            if (user.isTracked) {
              dbUser.getAllUserLocations(user, (err, userLocations) => {
                if (err) {
                  callback({ error: new errorCreator.Database() });

                  return;
                }

                getLocations(types.shift(), locations.concat(userLocations));
              });
            } else {
              getLocations(types.shift(), locations);
            }

            break;
          }
          default: {
            const payload = {
              data: {
                locations,
                team: user.team,
                currentTime: (new Date()),
              },
            };

            if (message.text) {
              payload.message = message;
            }

            callback(payload);

            break;
          }
        }
      }

      getLocations(types.shift(), []);
    });
  });
}

exports.handle = handle;
