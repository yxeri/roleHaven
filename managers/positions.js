/*
 Copyright 2017 Aleksandar Jankovic

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

const dbUser = require('../db/connectors/user');
const dbConfig = require('../config/defaults/config').databasePopulation;
const authenticator = require('../helpers/authenticator');
const objectValidator = require('../utils/objectValidator');
const errorCreator = require('../objects/error/errorCreator');
const appConfig = require('../config/defaults/config').app;
const dbPosition = require('../db/connectors/position');
const mapCreator = require('../utils/mapCreator');

/**
 * Get position from all users
 * @param {string} params.token jwt
 * @param {Function} params.callback Callback
 */
function getAllUserPositions({ token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetUserPosition.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbUser.getAllUserPositions({
        user: data.user,
        callback: ({ error: positionError, data: positionData }) => {
          if (positionError) {
            callback({ error: positionError });

            return;
          }

          callback({ data: positionData });
        },
      });
    },
  });
}

/**
 * Get position from user
 * @param {string} params.userName Name of user to get position from
 * @param {string} params.token jwt
 * @param {Function} params.callback Callback
 */
function getUserPosition({ userName, token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetUserPosition.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbUser.getUserPosition({
        userName,
        user: data.user,
        callback: ({ error: positionError, data: positionData }) => {
          if (positionError) {
            callback({ error: positionError });

            return;
          }

          callback({ data: positionData });
        },
      });
    },
  });
}

/**
 * Update user position. Will create a new one if it doesn't exist
 * @param {Object} params.position User position to update or create
 * @param {string} params.token jwt
 * @param {Object} params.io Socket io. Will be used if socket is not set
 * @param {Object} [params.socket] Socket io
 * @param {Function} params.callback Callback
 */
function updateUserPosition({ position, token, socket, io, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.UpdateUserPosition.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!objectValidator.isValidData({ position }, { position: { coordinates: { longitude: true, latitude: true } } })) {
        callback({ error: new errorCreator.InvalidData({ expected: '{ position: { coordinates: { longitude, latitude } } }' }) });

        return;
      } else if (position.coordinates.accuracy && position.coordinates.accuracy > appConfig.minimumPositionAccuracy) {
        callback({ error: new errorCreator.Insufficient({ name: 'accuracy' }) });

        return;
      }

      const user = data.user;
      const newPosition = position;

      newPosition.positionName = user.userName;
      newPosition.markerType = 'user';
      newPosition.owner = user.userName;
      newPosition.team = user.team;
      newPosition.lastUpdated = new Date();
      newPosition.coordinates.accuracy = newPosition.coordinates.accuracy || appConfig.minimumPositionAccuracy / 2;

      dbUser.updateUserIsTracked({
        userName: user.userName,
        isTracked: true,
        callback: ({ error: trackError }) => {
          if (trackError) {
            callback({ error: trackError });

            return;
          }

          dbPosition.updatePosition({
            position: newPosition,
            callback: ({ error: updateError, data: positionData }) => {
              if (updateError) {
                callback({ error: updateError });

                return;
              }

              const dataToSend = {
                positions: [data.position],
                currentTime: (new Date()),
              };

              if (socket) {
                socket.broadcast.to(dbConfig.rooms.public.roomName).emit('mapPositions', dataToSend);
              } else {
                io.to(dbConfig.rooms.public.roomName).emit('mapPositions', dataToSend);
              }

              callback({ data: { position: positionData.position } });
            },
          });
        },
      });
    },
  });
}

/**
 * Update position. Will create a new one if it doesn't exist
 * @param {Object} params.position Position to update or create
 * @param {string} params.token jwt
 * @param {Object} params.io Socket io. Will be used if socket is not set
 * @param {Object} [params.socket] Socket io
 * @param {Function} params.callback Callback
 */
function updatePosition({ position, token, socket, io, callback }) {
  authenticator.isUserAllowed({
    token,
    matchNameTo: position.positionName,
    commandName: dbConfig.apiCommands.UpdateUserPosition.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!objectValidator.isValidData({ position }, { position: { coordinates: { longitude: true, latitude: true }, positionName: true, markerType: true } })) {
        callback({ error: new errorCreator.InvalidData({ expected: '{ position: { coordinates: { longitude, latitude }, positionName, markerType } }' }) });

        return;
      } else if (position.positionName.length > appConfig.docFileTitleMaxLength || (position.description && position.description.join('').length > appConfig.docFileMaxLength)) {
        callback({ error: new errorCreator.InvalidCharacters({ expected: `text length: ${appConfig.docFileMaxLength}, title length: ${appConfig.docFileTitleMaxLength}` }) });

        return;
      } else if (position.coordinates.accuracy > appConfig.minimumPositionAccuracy) {
        callback({ error: new errorCreator.InvalidData({ name: 'accuracy' }) });

        return;
      }

      const user = data.user;
      const newPosition = position;

      if (newPosition.markerType === 'ping' && newPosition.description.length > 0) {
        newPosition.description = [newPosition.description[0].slice(0, 20)];
      }

      newPosition.owner = user.userName;
      newPosition.team = user.team;
      newPosition.lastUpdated = new Date();
      newPosition.coordinates.accuracy = newPosition.coordinates.accuracy || appConfig.minimumPositionAccuracy;

      dbPosition.updatePosition({
        position: newPosition,
        callback: ({ error: updateError, data: positionData }) => {
          if (updateError) {
            callback({ error: updateError });

            return;
          }

          const updatedPosition = positionData.position;
          const dataToSend = {
            positions: [updatedPosition],
            currentTime: new Date(),
          };

          if (updatedPosition.team && !updatedPosition.isPublic) {
            const roomName = `${updatedPosition}${appConfig.teamAppend}`;

            if (socket) {
              socket.broadcast.to(roomName).emit('mapPositions', dataToSend);
            } else {
              io.to(roomName).emit('mapPositions', dataToSend);
            }
          } else if (socket) {
            socket.broadcast.emit('mapPositions', dataToSend);
          } else {
            io.emit('mapPositions', dataToSend);
          }

          callback({ data: { position: updatedPosition } });
        },
      });
    },
  });
}

/**
 * Get positions by types
 * @param {string[]} params.types Position types to get
 * @param {string} param.stoken jwt
 * @param {Function} params.callback Callback
 */
function getPositions({ types, token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetPositions.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!objectValidator.isValidData({ types }, { types: true })) {
        callback({ error: new errorCreator.InvalidData({ expected: '{ types }' }) });

        return;
      }

      const user = data.user;

      /**
       * Get and send positions
       * @param {string} params.type Position type
       * @param {Object[]} params.positions All positions
       */
      function getPositionsOfType({ type, positions }) {
        switch (type) {
          case 'google': {
            mapCreator.getGooglePositions({
              callback: (googleData) => {
                if (googleData.error) {
                  callback({ error });

                  return;
                }

                getPositionsOfType({ type: types.shift(), positions: positions.concat(googleData.data.positions) });
              },
            });

            break;
          }
          case 'custom': {
            dbPosition.getCustomPositions({
              userName: user.userName,
              callback: (customData) => {
                if (customData.error) {
                  callback({ error: customData.error });

                  return;
                }

                getPositionsOfType({ type: types.shift(), positions: positions.concat(customData.data.positions) });
              },
            });

            break;
          }
          case 'user': {
            getAllUserPositions({
              token,
              callback: ({ error: userPositionsError, data: userPositions }) => {
                if (userPositionsError) {
                  callback({ error: userPositionsError });

                  return;
                }

                getPositionsOfType({ type: types.shift(), positions: positions.concat(userPositions.positions) });
              },
            });

            break;
          }
          case 'ping': {
            dbPosition.getPings({
              user,
              callback: (pingsData) => {
                if (pingsData.error) {
                  callback({ error: pingsData.error });

                  return;
                }

                getPositionsOfType({ type: types.shift(), positions: positions.concat(pingsData.data.positions) });
              },
            });

            break;
          }
          default: {
            callback({
              data: {
                positions,
                team: user.team,
                currentTime: (new Date()),
              },
            });

            break;
          }
        }
      }

      getPositionsOfType({ type: types.shift(), positions: [] });
    },
  });
}

/**
 * Get all positions
 * @param {string} param.stoken jwt
 * @param {Function} params.callback Callback
 */
function getAllPositions({ token, callback }) {
  getPositions({
    types: ['google', 'custom', 'user', 'ping'],
    token,
    callback,
  });
}

exports.getAllUserPositions = getAllUserPositions;
exports.getUserPosition = getUserPosition;
exports.updateUserPosition = updateUserPosition;
exports.updatePosition = updatePosition;
exports.getPositions = getPositions;
exports.getAllPositions = getAllPositions;
