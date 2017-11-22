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
import { auth } from "../../../Library/Preferences/WebStorm2017.2/javascript/extLibs/http_github.com_DefinitelyTyped_DefinitelyTyped_raw_master_types_redis_index";

const dbConfig = require('../config/defaults/config').databasePopulation;
const authenticator = require('../helpers/authenticator');
const errorCreator = require('../objects/error/errorCreator');
const appConfig = require('../config/defaults/config').app;
const dbPosition = require('../db/connectors/position');
const aliasManager = require('./aliases');

/**
 * Get position by ID and check if the user has access to it.
 * @param {Object} params - Parameters.
 * @param {Object} params.user - User retrieving the position.
 * @param {string} params.positionId - ID of the alias to retrieve.
 * @param {Function} params.callback - Callback.
 * @param {string} [params.errorContentText] - Text to be printed on error.
 * @param {boolean} [params.shouldBeAdmin] - Does the user have to be an admin?
 */
function getAccessiblePosition({
  user,
  positionId,
  callback,
  shouldBeAdmin,
  errorContentText = `positionId ${positionId}`,
}) {
  dbPosition.getPositionById({
    positionId,
    callback: (positionData) => {
      if (positionData.error) {
        callback({ error: positionData.error });

        return;
      } else if (!authenticator.hasAccessTo({
        shouldBeAdmin,
        toAuth: user,
        objectToAccess: positionData.data.position,
      })) {
        callback({ error: new errorCreator.NotAllowed({ name: errorContentText }) });

        return;
      }

      callback(positionData);
    },
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
    commandName: dbConfig.apiCommands.GetAll.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbPosition.getPositionsByType({
        positionType: dbConfig.PositionTypes.USER,
        callback: (positionsData) => {
          if (positionsData.error) {
            callback({ error: positionsData.error });

            return;
          }

          callback(positionsData);
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
 * Update user position. Will create a new one if it doesn't exist.
 * @param {Object} params - Parameters.
 * @param {string} params.positionId - ID of the position to update.
 * @param {Object} params.position - User position to update or create.
 * @param {string} params.token - jwt.
 * @param {Object} params.io - Socket io. Will be used if socket is not set.
 * @param {Function} params.callback - Callback.
 * @param {Object} [params.options] - Update options.
 * @param {Object} [params.socket] - Socket io.
 */
function updatePosition({
  positionId,
  position,
  token,
  socket,
  io,
  callback,
  options,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.UpdatePosition.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const authUser = data.user;

      getAccessiblePosition({
        positionId,
        user: authUser,
        shouldBeAdmin: true,
        callback: ({ error: trackError }) => {
          if (trackError) {
            callback({ error: trackError });

            return;
          }

          dbPosition.updatePosition({
            position,
            options,
            callback: ({ error: updateError, data: positionData }) => {
              if (updateError) {
                callback({ error: updateError });

                return;
              }

              const dataToSend = {
                data: {
                  position: positionData.position,
                  changeType: dbConfig.ChangeTypes.UPDATE,
                  currentTime: (new Date()),
                },
              };

              if (socket) {
                socket.broadcast.emit(dbConfig.EmitTypes.POSITION, dataToSend);
              } else {
                io.emit(dbConfig.EmitTypes.POSITION, dataToSend);
              }

              callback(dataToSend);
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
function createPosition({
  userId,
  position,
  token,
  socket,
  io,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    matchToId: userId,
    commandName: dbConfig.apiCommands.CreatePosition.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if ((position.positionName && position.positionName.length > appConfig.positionNameMaxLength) || (position.description && position.description.join('').length > appConfig.docFileMaxLength)) {
        callback({ error: new errorCreator.InvalidCharacters({ expected: `text length: ${appConfig.docFileMaxLength}, title length: ${appConfig.positionNameMaxLength}` }) });

        return;
      } else if (position.coordinates.accuracy > appConfig.minimumPositionAccuracy) {
        callback({ error: new errorCreator.InvalidData({ name: 'accuracy' }) });

        return;
      }

      const authUser = data.user;
      const newPosition = position;
      newPosition.ownerId = authUser.userId;

      if (!newPosition.coordinates) {
        newPosition.coordinates = {
          latitude: 0,
          longitude: 0,
          speed: 0,
          heading: 0,
        };
      }

      newPosition.coordinates.accuracy = newPosition.coordinates.accuracy || appConfig.minimumPositionAccuracy;

      const savePosition = () => {
        dbPosition.createPosition({
          position: newPosition,
          callback: ({ error: updateError, data: positionData }) => {
            if (updateError) {
              callback({ error: updateError });

              return;
            }

            const updatedPosition = positionData.position;
            const dataToReturn = {
              data: {
                position: updatedPosition,
                currentTime: new Date(),
                changeType: dbConfig.ChangeTypes.CREATE,
              },
            };
            const dataToSend = {
              data: {
                position: updatedPosition,
                currentTime: new Date(),
                changeType: dbConfig.ChangeTypes.CREATE,
              },
            };
            const { ownerAliasId } = updatedPosition;

            if (ownerAliasId) {
              dataToSend.data.position.ownerId = ownerAliasId;
              dataToSend.data.position.ownerAliasId = undefined;
            }

            if (socket) {
              socket.broadcast.emit('position', dataToSend);
            } else {
              io.emit('position', dataToSend);
            }

            callback(dataToReturn);
          },
        });
      };

      if (newPosition.ownerAliasId) {
        aliasManager.getAccessibleAlias({
          user: authUser,
          aliasId: newPosition.ownerAliasId,
          callback: ({ error: aliasError }) => {
            if (aliasError) {
              callback({ error: aliasError });

              return;
            }

            savePosition();
          },
        });

        return;
      }

      savePosition();
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
    commandName: dbConfig.apiCommands.GetAll.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbPosition.getAllPositions({ callback });
    },
  });
}

/**
 * Remove position.
 * @param {Object} params - Parameters.
 * @param {string} params.docFileId - ID of the file to remove.
 * @param {string} params.token - jwt.
 * @param {string} params.userId - ID of the user removing the file
 * @param {Function} params.callback - Callback
 * @param {Object} params.io - Socket io. Will be used if socket is not set.
 * @param {Object} [params.socket] - Socket io.
 */
function removeDocFile({
  docFileId,
  token,
  userId,
  callback,
  socket,
  io,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.RemoveDocFile.commandName,
    matchToId: userId,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      getAccessibleDocFile({
        docFileId,
        user: data.user,
        callback: (aliasData) => {
          if (aliasData.error) {
            callback({ error: aliasData.error });

            return;
          }
          dbDocFile.removeDocFile({
            docFileId,
            callback: (removeData) => {
              if (removeData.remove) {
                callback({ error: removeData.error });

                return;
              }

              const dataToSend = {
                data: {
                  docFile: { docFileId },
                  changeType: dbConfig.ChangeTypes.REMOVE,
                },
              };

              if (socket) {
                socket.broadcast.emit(dbConfig.EmitTypes.DOCFILE, dataToSend);
              } else {
                io.emit(dbConfig.EmitTypes.DOCFILE, dataToSend);
              }

              callback(dataToSend);
            },
          });
        },
      });
    },
  });
}

exports.getAccessiblePosition = getAccessiblePosition;
exports.getAllUserPositions = getAllUserPositions;
exports.getUserPosition = getUserPosition;
exports.updatePosition = updatePosition;
exports.getAllPositions = getAllPositions;
exports.createPosition = createPosition;
