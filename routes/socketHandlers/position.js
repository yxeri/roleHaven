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
    } else if (position.positionName.length > appConfig.docFileTitleMaxLength || (position.description && position.description.join('').length > appConfig.docFileMaxLength)) {
      callback({ error: new errorCreator.InvalidCharacters({ expected: `text length: ${appConfig.docFileMaxLength}, title length: ${appConfig.docFileTitleMaxLength}` }) });

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
          callback: ({ error: updateError, data }) => {
            if (updateError) {
              callback({ error: updateError });

              return;
            }

            const createdPosition = data.position;

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

  socket.on('updateDevicePosition', ({ position }, callback = () => {}) => {
    if (!objectValidator.isValidData({ position }, { position: { deviceId: true, coordinates: { latitude: true, longitude: true, accuracy: true } } })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ position: { deviceId, coordinates: { latitude, longitude, accuracy } } }' }) });

      return;
    }

    manager.userIsAllowed({
      commandName: dbConfig.commands.updateUserPosition.commandName,
      callback: ({ error }) => {
        if (error) {
          callback({ error });

          return;
        }

        position.positionName = position.deviceId;
        position.markerType = 'device';
        position.owner = position.deviceId;
        position.lastUpdated = new Date();

        dbPosition.updatePosition({
          position,
          callback: ({ error: updateError, data }) => {
            if (updateError) {
              callback({ error: updateError });

              return;
            }

            const callbackBroadcast = () => {
              socket.broadcast.to(dbConfig.rooms.public.roomName).emit('mapPositions', {
                positions: [data.position],
                currentTime: (new Date()),
              });
              callback({ data: { position: data.position } });
            };

            dbPosition.getUserPositionByDeviceId({
              deviceId: position.deviceId,
              callback: (positionData) => {
                if (positionData.error) {
                  if (positionData.error.type === errorCreator.ErrorTypes.DOESNOTEXIST) {
                    callbackBroadcast();

                    return;
                  }

                  callback({ error: positionData.error });

                  return;
                } else if (!positionData.data.position.socketId || positionData.data.position.socketId === '') {
                  callbackBroadcast();

                  return;
                }

                callback({ data: { position: data.data.position } });
              },
            });
          },
        });
      },
    });
  });

  socket.on('updateUserPosition', ({ position, token }, callback = () => {}) => {
    if (!objectValidator.isValidData({ position }, { position: { deviceId: true, coordinates: { latitude: true, longitude: true, accuracy: true } } })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ position: { deviceId, coordinates: { latitude, longitude, accuracy } } }' }) });

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

        dbUser.updateUserIsTracked({
          userName: allowedUser.userName,
          isTracked: true,
          callback: () => {},
        });
        dbPosition.updatePosition({
          position,
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

                  if (allowedUser.accessLevel === 0) { allowedUser.accessLevel += 1; }

                  dbUser.getAllUserPositions({
                    user: allowedUser,
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
