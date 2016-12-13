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

/**
 * @param {Object} socket - Socket.IO socket
 */
function handle(socket) {
  socket.on('updateLocation', (params, callback = () => {}) => {
    if (!objectValidator.isValidData(params, { position: true })) {
      callback({ error: {} });

      return;
    }

    manager.userAllowedCommand(socket.id, databasePopulation.commands.map.commandName, (allowErr, allowed, user) => {
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

      dbLocation.updatePosition({
        positionName: user.userName,
        position: params.position,
        type: 'user',
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

          dbLocation.getPosition(user.userName, (err, position) => {
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
                  console.log('position updated');
                  socket.broadcast.to(socketUser.socketId).emit('mapPositions', {
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

  socket.on('getMapPositions', (params, callback = () => {}) => {
    if (!objectValidator.isValidData(params, { types: true })) {
      callback({ error: {} });

      return;
    }

    manager.userAllowedCommand(socket.id, databasePopulation.commands.map.commandName, (allowErr, allowed, user) => {
      if (allowErr || !allowed) {
        callback({ error: {} });

        return;
      }

      const types = params.types;
      const message = {};

      /**
       * Get and send positions
       * @private
       * @param {string} type - Position type
       * @param {Object[]} positions - All positions
       */
      function getPositions(type, positions) {
        switch (type) {
          case 'static': {
            dbLocation.getAllStaticPositions((err, staticPositions) => {
              if (err) {
                callback({ error: {} });

                return;
              }

              getPositions(types.shift(), positions.concat(staticPositions));
            });

            break;
          }
          case 'users': {
            if (user.isTracked) {
              dbUser.getAllUserPositions(user, (err, userPositions) => {
                if (err) {
                  callback({ error: {} });

                  return;
                }

                getPositions(types.shift(), positions.concat(userPositions));
              });
            } else {
              message.text = [
                'DETECTED: TRACKING DISABLED',
                'UNABLE TO RETRIEVE USER LOCATIONS',
                'DISABLING TRACKING IS A MAJOR OFFENSE',
                'REPORT IN FOR IMMEDIATE RE-EDUCATION SESSION',
              ];

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

            console.log('payload', payload);

            callback(payload);

            break;
          }
        }
      }

      getPositions(types.shift(), []);
    });
  });

  socket.on('getGooglePositions', (params, callback = () => {}) => {
    manager.userAllowedCommand(socket.id, databasePopulation.commands.map.commandName, (allowErr, allowed) => {
      if (allowErr || !allowed) {
        callback({ error: {} });

        return;
      }

      mapCreator.getGooglePositions((err, googlePositions) => {
        if (err || googlePositions === null) {
          logger.sendErrorMsg({
            code: logger.ErrorCodes.general,
            text: ['Failed to get world positions'],
            err,
          });

          callback({ error: {} });

          return;
        }

        callback({ data: { positions: googlePositions } });
      });
    });
  });
}

exports.handle = handle;
