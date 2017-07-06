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
    if (!objectValidator.isValidData({ position }, { position: { coordinates: { longitude: true, latitude: true, accuracy: true }, positionName: true, markerType: true } })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ position: { coordinates: { longitude, latitude }, positionName, markerType } }' }) });

      return;
    } else if (position.positionName.length > appConfig.docFileTitleMaxLength || (position.description && position.description.join('').length > appConfig.docFileMaxLength)) {
      callback({ error: new errorCreator.InvalidCharacters({ expected: `text length: ${appConfig.docFileMaxLength}, title length: ${appConfig.docFileTitleMaxLength}` }) });

      return;
    } else if (position.coordinates.accuracy > appConfig.minimumPositionAccuracy) {
      callback({ error: new errorCreator.Insufficient({ name: 'accuracy' }) });

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

        const newPosition = position;

        if (newPosition.markerType === 'ping' && newPosition.description.length > 0) {
          newPosition.description = [newPosition.description[0].slice(0, 20)];
        }

        newPosition.owner = allowedUser.userName;
        newPosition.team = allowedUser.team;
        newPosition.lastUpdated = new Date();

        dbPosition.updatePosition({
          position: newPosition,
          callback: ({ error: updateError, data }) => {
            if (updateError) {
              callback({ error: updateError });

              return;
            }

            const updatedPosition = data.position;

            if (updatedPosition.team && !updatedPosition.isPublic) {
              socket.broadcast.to(`${updatedPosition}${appConfig.teamAppend}`).emit('mapPositions', {
                positions: [updatedPosition],
                currentTime: new Date(),
              });
            } else {
              socket.broadcast.emit('mapPositions', {
                positions: [updatedPosition],
                currentTime: new Date(),
              });
            }

            callback({ data: { position: updatedPosition } });
          },
        });
      },
    });
  });

  socket.on('updateUserPosition', ({ position, token }, callback = () => {}) => {
    if (!objectValidator.isValidData({ position }, { position: { deviceId: true, coordinates: { latitude: true, longitude: true, accuracy: true } } })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ position: { deviceId, coordinates: { latitude, longitude, accuracy } } }' }) });

      return;
    } else if (position.coordinates.accuracy > appConfig.minimumPositionAccuracy) {
      callback({ error: new errorCreator.Insufficient({ name: 'accuracy' }) });

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

        const newPosition = position;

        newPosition.positionName = allowedUser.userName;
        newPosition.markerType = 'user';
        newPosition.owner = allowedUser.userName;
        newPosition.team = allowedUser.team;
        newPosition.lastUpdated = new Date();

        dbUser.updateUserIsTracked({
          userName: allowedUser.userName,
          isTracked: true,
          callback: () => {},
        });
        dbPosition.updatePosition({
          position: newPosition,
          callback: ({ error: updateError, data }) => {
            if (updateError) {
              callback({ error: updateError });

              return;
            }

            socket.broadcast.to(dbConfig.rooms.public.roomName).emit('mapPositions', {
              positions: [data.position],
              currentTime: (new Date()),
            });
            callback({ data: { position: data.position } });
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
          callback({ error });

          return;
        }

        /**
         * Get and send positions
         * @param {string} params.type Position type
         * @param {Object[]} params.positions All positions
         */
        function getPositions({ type, positions }) {
          switch (type) {
            case 'google': {
              mapCreator.getGooglePositions({
                callback: (googleData) => {
                  if (googleData.error) {
                    callback({ error });

                    return;
                  }

                  getPositions({ type: types.shift(), positions: positions.concat(googleData.data.positions) });
                },
              });

              break;
            }
            case 'custom': {
              manager.userIsAllowed({
                token,
                commandName: dbConfig.commands.getCustomPositions.commandName,
                callback: ({ error: allowedErr }) => {
                  if (allowedErr) {
                    getPositions({ type: types.shift(), positions: positions.concat([]) });

                    return;
                  }

                  dbPosition.getCustomPositions({
                    userName: allowedUser.userName,
                    callback: (customData) => {
                      if (customData.error) {
                        callback({ error: customData.error });

                        return;
                      }

                      getPositions({ type: types.shift(), positions: positions.concat(customData.data.positions) });
                    },
                  });
                },
              });

              break;
            }
            case 'signalBlock': {
              dbPosition.getSignalBlockPositions({
                callback: (blockData) => {
                  if (blockData.error) {
                    callback({ error: blockData.error });

                    return;
                  }

                  getPositions({ type: types.shift(), positions: positions.concat(blockData.data.positions) });
                },
              });

              break;
            }
            case 'user': {
              manager.userIsAllowed({
                token,
                commandName: dbConfig.commands.getUserPositions.commandName,
                callback: ({ error: allowedErr }) => {
                  if (allowedErr) {
                    callback({ error: allowedErr });

                    return;
                  }

                  const user = allowedUser;
                  user.accessLevel = user.accessLevel === 0 ? 1 : 0;

                  dbUser.getAllUserPositions({
                    user,
                    callback: (userData) => {
                      if (userData.error) {
                        callback({ error: userData.error });

                        return;
                      }

                      getPositions({ type: types.shift(), positions: positions.concat(userData.data.positions) });
                    },
                  });
                },
              });

              break;
            }
            case 'ping': {
              dbPosition.getPings({
                user: allowedUser,
                callback: (pingsData) => {
                  if (pingsData.error) {
                    callback({ error: pingsData.error });

                    return;
                  }

                  getPositions({ type: types.shift(), positions: positions.concat(pingsData.data.positions) });
                },
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

        getPositions({ type: types.shift(), positions: [] });
      },
    });
  });
}

exports.handle = handle;
