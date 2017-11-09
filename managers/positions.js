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

const dbConfig = require('../config/defaults/config').databasePopulation;
const authenticator = require('../helpers/authenticator');
const objectValidator = require('../utils/objectValidator');
const errorCreator = require('../objects/error/errorCreator');
const appConfig = require('../config/defaults/config').app;
const dbPosition = require('../db/connectors/position');

/**
 * Does user have access to the position?
 * @private
 * @param {Object} params - Parameter
 * @param {Object} params.user - User to auth
 * @param {Object} params.position - Position to check against
 * @param {boolean} [params.shouldBeAdmin] - Should the user have admin access?
 * @param {Function} params.callback - Callback
 * @returns {boolean} - Does the user have access to the position?
 */
function hasAccessToPosition({ user, position, shouldBeAdmin }) {
  return authenticator.hasAccessTo({
    shouldBeAdmin,
    objectToAccess: position,
    toAuth: { userId: user.userId, teamIds: user.partOfTeams },
  });
}

/**
 * Get position from all users
 * @param {Object} params - Parameters
 * @param {string} params.token - jwt
 * @param {Function} params.callback - Callback
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

      const authUser = data.user;

      dbPosition.getPositionsByType({
        userId: data.user.userId,
        callback: ({ error: positionError, data: positionsData }) => {
          if (positionError) {
            callback({ error: positionError });

            return;
          }

          callback({
            data: {
              positions: positionsData.positions.filter((position) => {
                const hasAccess = hasAccessToPosition({
                  position,
                  user: authUser,
                });

                return hasAccess || authUser.accessLevel >= position.visibility;
              }),
            },
          });
        },
      });
    },
  });
}

/**
 * Get position from user
 * @param {Object} params - Parameters
 * @param {string} params.userId - ID of user to get position from
 * @param {string} params.token - jwt
 * @param {Function} params.callback - Callback
 */
function getUserPosition({ userId, token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetUserPosition.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const userAccessLevel = data.user.accessLevel;

      dbPosition.getUserPosition({
        userId,
        callback: (userData) => {
          if (userData.error) {
            callback({ error: userData.error });

            return;
          } else if (userAccessLevel >= userData.data.position.visibility) {
            callback({ error: new errorCreator.NotAllowed({ name: `position for user ${userId}` }) });

            return;
          }

          callback({ data: { position: userData.data.position } });
        },
      });
    },
  });
}

/**
 * Update user position. Will create a new one if it doesn't exist
 * @param {Object} params - Parameters
 * @param {Object} params.position - User position to update or create
 * @param {string} params.token - jwt
 * @param {Object} params.io - Socket io. Will be used if socket is not set
 * @param {Object} [params.socket] - Socket io
 * @param {Function} params.callback - Callback
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

      newPosition.positionName = user.username;
      newPosition.markerType = 'user';
      newPosition.ownerId = user.userId;
      newPosition.teamId = user.teamId;
      newPosition.aliasId = user.aliasId;
      newPosition.coordinates.accuracy = newPosition.coordinates.accuracy || appConfig.minimumPositionAccuracy / 2;

      hasAccessToPosition({
        user,
        position: newPosition,
        shouldBeAdmin: true,
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
                positions: [positionData.position],
                currentTime: (new Date()),
              };

              if (socket) {
                socket.broadcast.emit('mapPositions', { data: dataToSend });
              } else {
                io.emit('mapPositions', { data: dataToSend });
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
 * Create position
 * @param {Object} params - Parameters
 * @param {Object} params.position - Position to create
 * @param {string} params.token - jwt
 * @param {Object} params.io - Socket io. Will be used if socket is not set
 * @param {Object} [params.socket] - Socket io
 * @param {Function} params.callback - Callback
 */
function createPosition({ userId, position, token, socket, io, callback }) {
  authenticator.isUserAllowed({
    token,
    matchToId: userId,
    commandName: dbConfig.apiCommands.UpdatePosition.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!objectValidator.isValidData({ position }, { position: { coordinates: { longitude: true, latitude: true }, positionName: true, positionType: true } })) {
        callback({ error: new errorCreator.InvalidData({ expected: '{ position: { coordinates: { longitude, latitude }, positionName, positionType } }' }) });

        return;
      } else if (position.positionName && (position.positionName.length > appConfig.docFileTitleMaxLength || (position.description && position.description.join('').length > appConfig.docFileMaxLength))) {
        callback({ error: new errorCreator.InvalidCharacters({ expected: `text length: ${appConfig.docFileMaxLength}, title length: ${appConfig.docFileTitleMaxLength}` }) });

        return;
      } else if (position.coordinates.accuracy > appConfig.minimumPositionAccuracy) {
        callback({ error: new errorCreator.InvalidData({ name: 'accuracy' }) });

        return;
      }

      const user = data.user;
      const newPosition = position;

      newPosition.ownerId = user.userId;
      newPosition.coordinates.accuracy = newPosition.coordinates.accuracy || appConfig.minimumPositionAccuracy;

      dbPosition.createPosition({
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

          if (socket) {
            socket.broadcast.emit('mapPositions', { data: dataToSend });
          } else {
            io.emit('mapPositions', { data: dataToSend });
          }

          callback({ data: dataToSend });
        },
      });
    },
  });
}

/**
 * Update position
 * @param {Object} params - Parameters
 * @param {Object} params.position - Position to update
 * @param {string} params.token - jwt
 * @param {Object} params.io - Socket io. Will be used if socket is not set
 * @param {Object} [params.socket] - Socket io
 * @param {string} params.userId - ID of the user that is creating the position
 * @param {Function} params.callback - Callback
 */
function updatePosition({ userId, position, token, socket, io, callback }) {
  authenticator.isUserAllowed({
    token,
    matchToId: userId,
    commandName: dbConfig.apiCommands.UpdatePosition.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (position.positionName && (position.positionName.length > appConfig.docFileTitleMaxLength || (position.description && position.description.join('').length > appConfig.docFileMaxLength))) {
        callback({ error: new errorCreator.InvalidCharacters({ expected: `text length: ${appConfig.docFileMaxLength}, title length: ${appConfig.docFileTitleMaxLength}` }) });

        return;
      } else if (position.coordinates && position.coordinates.accuracy && position.coordinates.accuracy > appConfig.minimumPositionAccuracy) {
        callback({ error: new errorCreator.InvalidData({ name: 'accuracy' }) });

        return;
      }

      const user = data.user;
      const newPosition = position;

      newPosition.teamId = user.teamId;
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

          if (socket) {
            socket.broadcast.emit('mapPositions', { data: dataToSend });
          } else {
            io.emit('mapPositions', { data: dataToSend });
          }

          callback({ data: dataToSend });
        },
      });
    },
  });
}

/**
 * Get all positions
 * @param {Object} params - Parameters
 * @param {string} params.token - jwt
 * @param {Function} params.callback - Callback
 */
function getAllPositions({ token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetPositions.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const authUser = data.user;

      dbPosition.getAllPositions({
        callback: (positionsData) => {
          if (positionsData.error) {
            callback({ error: positionsData.error });

            return;
          }

          callback({
            data: {
              positions: positionsData.data.positions.filter((position) => {
                const hasAccess = hasAccessToPosition({
                  position,
                  user: authUser,
                });

                return hasAccess || authUser.accessLevel >= position.visibility;
              }),
            },
          });
        },
      });
    },
  });
}

exports.getAllUserPositions = getAllUserPositions;
exports.getUserPosition = getUserPosition;
exports.updateUserPosition = updateUserPosition;
exports.updatePosition = updatePosition;
exports.getAllPositions = getAllPositions;
exports.createPosition = createPosition;
