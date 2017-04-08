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
const dbPosition = require('../../db/connectors/position');
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
  socket.on('updatePosition', ({ position }, callback = () => {}) => {
    if (!objectValidator.isValidData({ position }, { position: { coordinates: { longitude: true, latitude: true }, positionName: true } })) {
      callback({ error: {} });

      return;
    }

    manager.userIsAllowed(socket.id, databasePopulation.commands.createPosition.commandName, (allowErr, allowed, user) => {
      if (allowErr || !allowed) {
        callback({ error: {} });

        return;
      }

      position.markerType = 'custom';
      position.owner = user.userName;
      position.team = user.team;

      dbPosition.updatePosition({
        position,
        callback: (err, createdPosition) => {
          if (err) {
            callback({ error: {} });

            return;
          }

          callback({ data: { position: createdPosition } });
        },
      });
    });
  });

  socket.on('updateUserPosition', ({ position }, callback = () => {}) => {
    if (!objectValidator.isValidData({ position }, { position: { coordinates: true } })) {
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


      // TODO This needs to be updated
      dbPosition.updatePosition({
        positionName: user.userName,
        markerType: 'user',
        owner: user.userName,
        team: user.team,
        coordinates: position.coordinates,
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

          dbPosition.getPosition(user.userName, (err, newPosition) => {
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
                  socket.broadcast.to(socketUser.socketId).emit('mapPositions', {
                    positions: [newPosition],
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
       * @param {Object[]} positions - All positions
       */
      function getPositions(type, positions) {
        switch (type) {
          case 'google': {
            mapCreator.getGooglePositions((err, googlePositions) => {
              if (err || googlePositions === null) {
                callback({ error: new errorCreator.External({ source: 'Google Maps' }) });

                return;
              }

              getPositions(types.shift(), positions.concat(googlePositions));
            });

            break;
          }
          case 'custom': {
            dbPosition.getCustomPositions(user.userName, (err, customPositions) => {
              if (err) {
                callback({ error: new errorCreator.Database() });

                return;
              }

              getPositions(types.shift(), positions.concat(customPositions));
            });

            break;
          }
          case 'user': {
            if (true || user.isTracked) {
              dbUser.getAllUserPositions(user, (err, userPositions) => {
                if (err) {
                  callback({ error: new errorCreator.Database() });

                  return;
                }

                console.log('pos', userPositions);

                getPositions(types.shift(), positions.concat(userPositions));
              });
            } else {
              getPositions(types.shift(), positions);
            }

            break;
          }
          default: {
            const payload = {
              data: {
                positions,
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

      getPositions(types.shift(), []);
    });
  });
}

exports.handle = handle;
