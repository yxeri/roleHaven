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
const dbConfig = require('../../config/defaults/config').databasePopulation;
const objectValidator = require('../../utils/objectValidator');
const mapCreator = require('../../utils/mapCreator');
const errorCreator = require('../../objects/error/errorCreator');
const appConfig = require('../../config/defaults/config').app;

/**
 * @param {Object} socket - Socket.IO socket
 */
function handle(socket) {
  socket.on('updatePosition', ({ position, token }, callback = () => {}) => {
    if (!objectValidator.isValidData({ position }, { position: { coordinates: { longitude: true, latitude: true }, positionName: true, markerType: true } })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ position: { coordinates: { longitude, latitude }, positionName, markerType } }' }) });

      return;
    }

    manager.userIsAllowed({
      token,
      commandName: dbConfig.commands.createPosition.commandName,
      callback: ({ error, allowedUser }) => {
        if (error) {
          callback({ error });

          return;
        }

        if (position.markerType === 'ping' && position.description.length > 0) {
          position.description = [position.description[0].slice(0, 20)];
        }

        position.owner = allowedUser.userName;
        position.team = allowedUser.team;
        position.lastUpdated = new Date();

        dbPosition.updatePosition({
          position,
          callback: (err, createdPosition) => {
            if (err) {
              callback({ error: new errorCreator.Database({}) });

              return;
            }

            if (createdPosition.team && !createdPosition.isPublic) {
              socket.broadcast.to(`${createdPosition}${appConfig.teamAppend}`).emit('mapPositions', {
                positions: [position],
                currentTime: new Date(),
              });
            } else {
              socket.broadcast.emit('mapPositions', {
                positions: [position],
                currentTime: new Date(),
              });
            }

            callback({ data: { position: createdPosition } });
          },
        });
      },
    });
  });

  socket.on('updateUserPosition', ({ position, token }, callback = () => {}) => {
    if (!objectValidator.isValidData({ position }, { position: { coordinates: { latitude: true, longitude: true, accuracy: true } } })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ position: { coordinates: { latitude, longitude, accuracy } } }' }) });

      return;
    }

    manager.userIsAllowed({
      token,
      commandName: dbConfig.commands.updateUserPosition.commandName,
      callback: ({ error, allowedUser }) => {
        if (error) {
          callback({ error });

          return;
        }

        position.positionName = allowedUser.userName;
        position.markerType = 'user';
        position.owner = allowedUser.userName;
        position.team = allowedUser.team;
        position.lastUpdated = new Date();

        dbUser.updateUserIsTracked(allowedUser.userName, true, () => {});
        dbPosition.updatePosition({
          position,
          callback: (err, createdPosition) => {
            if (err) {
              callback({ error: new errorCreator.Database({}) });

              return;
            }

            dbUser.getAllUsers(allowedUser, (usersErr, allUsers) => {
              if (usersErr) {
                callback({ error: new errorCreator.Database({}) });
              }

              allUsers.forEach((socketUser) => {
                socket.broadcast.to(socketUser.userName + appConfig.whisperAppend).emit('mapPositions', {
                  positions: [createdPosition],
                  currentTime: (new Date()),
                });
              });
            });
          },
        });
      },
    });
  });

  socket.on('getMapPositions', ({ types, token }, callback = () => {}) => {
    if (!objectValidator.isValidData({ types }, { types: true })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ types }' }) });

      return;
    }

    manager.userIsAllowed({
      token,
      commandName: dbConfig.commands.getPositions.commandName,
      callback: ({ error, allowedUser }) => {
        if (error) {
          callback({ error: new errorCreator.Database({}) });

          return;
        }

        /**
         * Get and send positions
         * @param {string} type Position type
         * @param {Object[]} positions All positions
         */
        function getPositions(type, positions) {
          switch (type) {
            case 'google': {
              mapCreator.getGooglePositions((err, googlePositions) => {
                if (err) {
                  callback({ error: new errorCreator.Database({}) });

                  return;
                }

                getPositions(types.shift(), positions.concat(googlePositions));
              });

              break;
            }
            case 'custom': {
              manager.userIsAllowed({
                token,
                commandName: dbConfig.commands.getCustomPositions.commandName,
                callback: ({ error: allowedErr }) => {
                  if (allowedErr) {
                    getPositions(types.shift(), positions.concat([]));

                    return;
                  }

                  dbPosition.getCustomPositions(allowedUser.userName, (err, customPositions = []) => {
                    if (err) {
                      callback({ error: new errorCreator.Database({}) });

                      return;
                    }

                    getPositions(types.shift(), positions.concat(customPositions));
                  });
                },
              });

              break;
            }
            case 'signalBlock': {
              dbPosition.getSignalBlockPositions((err, signalBlockPositions = []) => {
                if (err) {
                  callback({ error: new errorCreator.Database({}) });

                  return;
                }

                getPositions(types.shift(), positions.concat(signalBlockPositions));
              });

              break;
            }
            case 'user': {
              manager.userIsAllowed({
                token,
                commandName: dbConfig.commands.getUserPositions.commandName,
                callback: ({ error: allowedErr }) => {
                  if (allowedErr) {
                    getPositions(types.shift(), positions.concat([]));

                    return;
                  }

                  dbUser.getAllUserPositions(allowedUser, (err, userPositions = []) => {
                    if (err) {
                      callback({ error: new errorCreator.Database({}) });

                      return;
                    }

                    getPositions(types.shift(), positions.concat(userPositions));
                  });
                },
              });

              break;
            }
            case 'ping': {
              dbPosition.getPings(allowedUser, (err, pings = []) => {
                if (err) {
                  callback({ error: new errorCreator.Database({}) });

                  return;
                }

                getPositions(types.shift(), positions.concat(pings));
              });

              break;
            }
            default: {
              callback({
                data: {
                  positions,
                  team: allowedUser.team,
                  currentTime: (new Date()),
                },
              });

              break;
            }
          }
        }

        getPositions(types.shift(), []);
      },
    });
  });
}

exports.handle = handle;
