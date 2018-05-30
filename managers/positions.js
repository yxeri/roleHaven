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

const { appConfig, dbConfig } = require('../config/defaults/config');
const authenticator = require('../helpers/authenticator');
const errorCreator = require('../error/errorCreator');
const dbPosition = require('../db/connectors/position');
const aliasManager = require('./aliases');
const mapCreator = require('../utils/mapCreator');

// TODO Should update if the position already exist
/**
 * Retrieve and store positions from a Google Maps collaborative map.
 * @param {Object} params - Parameters.
 * @param {Function} params.callback - Callback.
 */
function getAndStoreGooglePositions({ callback = () => {} }) {
  if (!appConfig.mapLayersPath) {
    callback({ error: new errorCreator.InvalidData({ name: 'Map layer is not set' }) });

    return;
  }

  mapCreator.getGooglePositions({
    callback: (googleData) => {
      if (googleData.error) {
        callback({ error: googleData.error });

        return;
      }

      dbPosition.removePositionsByOrigin({
        origin: dbConfig.PositionOrigins.GOOGLE,
        callback: (removeData) => {
          if (removeData.error) {
            callback({ error: removeData.error });

            return;
          }

          const { positions } = googleData.data;
          const positionAmount = positions.length;
          const createdPositions = [];
          const sendCallback = ({ error, iteration }) => {
            if (error) {
              callback({ error });

              return;
            }

            if (iteration === positionAmount) {
              callback({ data: { positions: createdPositions } });
            }
          };
          let iteration = 1;

          positions.forEach((position) => {
            dbPosition.createPosition({
              position,
              callback: ({ error, data }) => {
                if (error) {
                  callback({ error });

                  return;
                }

                createdPositions.push(data.position);
                sendCallback({
                  error,
                  iteration: iteration += 1,
                });
              },
            });
          });
        },
      });
    },
  });
}

/**
 * Get position by Id and check if the user has access to it.
 * @param {Object} params - Parameters.
 * @param {Object} params.user - User retrieving the position.
 * @param {string} params.positionId - Id of the alias to retrieve.
 * @param {Function} params.callback - Callback.
 * @param {string} [params.errorContentText] - Text to be printed on error.
 * @param {boolean} [params.shouldBeAdmin] - Does the user have to be an admin?
 */
function getAccessiblePosition({
  user,
  positionId,
  callback,
  shouldBeAdmin,
  full,
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

      const foundPosition = positionData.data.position;
      const filteredPosition = {
        objectId: foundPosition.objectId,
        connectedUser: foundPosition.connectedToUser,
        coordinatesHistory: foundPosition.coordinatesHistory,
        positionName: foundPosition.positionName,
        positionType: foundPosition.positionType,
        radius: foundPosition.radius,
        isStationary: foundPosition.isStationary,
        lastUpdated: foundPosition.lastUpdated,
        customLastUpdated: foundPosition.customLastUpdated,
        timeCreated: foundPosition.timeCreated,
        customTimeCreated: foundPosition.customTimeCreated,
      };

      callback({
        data: {
          position: full ? foundPosition : filteredPosition,
        },
      });
    },
  });
}

/**
 * Get position.
 * @param {Object} params - Parameters.
 * @param {string} params.token - jwt.
 * @param {Function} params.callback - Callback.
 * @param {string} params.positionId - Id of the position that will be retrieved.
 */
function getPositionById({
  positionId,
  token,
  callback,
  full,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetPositions.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user } = data;

      getAccessiblePosition({
        user,
        positionId,
        callback,
        full,
        shouldBeAdmin: full && dbConfig.apiCommands.GetFull.accessLevel > user.accessLevel,
      });
    },
  });
}

/**
 * Update the position's coordinates.
 * @param {Object} params - Parameters.
 * @param {Object} params.io - Socket.io.
 * @param {Object} params.callback - Callback.
 * @param {string} params.positionId - Id of the position to update.
 * @param {string} params.token - jwt.
 * @param {Object} params.coordinates - New coordinates.
 */
function updatePositionCoordinates({
  io,
  callback,
  positionId,
  token,
  coordinates,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.UpdatePosition.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user } = data;

      getAccessiblePosition({
        positionId,
        user,
        shouldBeAdmin: true,
        callback: ({ error: positionError }) => {
          if (positionError) {
            callback({ error: positionError });

            return;
          }

          dbPosition.updatePositionCoordinates({
            positionId,
            coordinates,
            callback: (updateData) => {
              if (updateData.error) {
                callback({ error: updateData.error });

                return;
              }

              const dataToSend = {
                data: {
                  position: updateData.data.position,
                },
                changeType: dbConfig.ChangeTypes.UPDATE,
              };

              io.emit(dbConfig.EmitTypes.POSITION, dataToSend);

              callback(dataToSend);
            },
          });
        },
      });
    },
  });
}

/**
 * Update user position. Will create a new one if it doesn't exist.
 * @param {Object} params - Parameters.
 * @param {string} params.positionId - Id of the position to update.
 * @param {Object} params.position - User position to update or create.
 * @param {string} params.token - jwt.
 * @param {Object} params.io - Socket io.
 * @param {Function} params.callback - Callback.
 * @param {Object} [params.options] - Update options.
 */
function updatePosition({
  positionId,
  position,
  token,
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

      const { user } = data;

      getAccessiblePosition({
        positionId,
        user,
        shouldBeAdmin: true,
        callback: ({ error: trackError }) => {
          if (trackError) {
            callback({ error: trackError });

            return;
          }

          dbPosition.updatePosition({
            positionId,
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

              io.emit(dbConfig.EmitTypes.POSITION, dataToSend);

              callback(dataToSend);
            },
          });
        },
      });
    },
  });
}

/**
 * Create a position.
 * @param {Object} params - Parameters.
 * @param {Object} params.position - Position to create.
 * @param {string} params.token - jwt.
 * @param {Object} params.io - Socket.io.
 * @param {Function} params.callback - Callback.
 */
function createPosition({
  position,
  token,
  io,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.CreatePosition.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!position.coordinates || !position.coordinates.latitude || !position.coordinates.longitude) {
        callback({ error: new errorCreator.InvalidData({ name: 'latitude && longitude' }) });

        return;
      } else if ((position.positionName && position.positionName.length > appConfig.positionNameMaxLength) || (position.description && position.description.join('').length > appConfig.docFileMaxLength)) {
        callback({ error: new errorCreator.InvalidCharacters({ expected: `text length: ${appConfig.docFileMaxLength}, title length: ${appConfig.positionNameMaxLength}` }) });

        return;
      } else if (position.coordinates && position.coordinates.accuracy && position.coordinates.accuracy > appConfig.minimumPositionAccuracy) {
        callback({ error: new errorCreator.InvalidData({ name: 'accuracy' }) });

        return;
      }

      const { user } = data;
      const newPosition = position;
      newPosition.ownerId = user.objectId;
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
            const { ownerAliasId } = updatedPosition;
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

            if (ownerAliasId) {
              dataToSend.data.position.ownerId = ownerAliasId;
              dataToSend.data.position.ownerAliasId = undefined;
            }

            io.emit(dbConfig.EmitTypes.POSITION, dataToSend);

            callback(dataToReturn);
          },
        });
      };

      if (newPosition.ownerAliasId) {
        aliasManager.getAccessibleAlias({
          user,
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
 * Get positions.
 * @param {Object} params - Parameters.
 * @param {string} params.token - jwt.
 * @param {Function} params.callback - Callback.
 * @param {string[]} [params.positionTypes] - Types of positions to retrieve.
 */
function getPositions({
  token,
  callback,
  positionTypes,
  full = false,
  lite = true,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: full ? dbConfig.apiCommands.GetFull.name : dbConfig.apiCommands.GetPositions.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user } = data;

      dbPosition.getPositionsByUser({
        user,
        callback,
        full,
        positionTypes,
        lite,
      });
    },
  });
}

/**
 * Remove position.
 * @param {Object} params - Parameters.
 * @param {string} params.positionId - ID of the position to remove.
 * @param {string} params.token - jwt.
 * @param {Function} params.callback - Callback
 * @param {Object} params.io - Socket io.
 */
function removePosition({
  positionId,
  token,
  callback,
  io,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.RemovePosition.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user } = data;

      getAccessiblePosition({
        positionId,
        user,
        shouldBeAdmin: true,
        callback: (aliasData) => {
          if (aliasData.error) {
            callback({ error: aliasData.error });

            return;
          }
          dbPosition.removePosition({
            positionId,
            callback: (removeData) => {
              if (removeData.remove) {
                callback({ error: removeData.error });

                return;
              }

              const dataToSend = {
                data: {
                  position: { objectId: positionId },
                  changeType: dbConfig.ChangeTypes.REMOVE,
                },
              };

              io.emit(dbConfig.EmitTypes.POSITION, dataToSend);

              callback(dataToSend);
            },
          });
        },
      });
    },
  });
}

exports.getAccessiblePosition = getAccessiblePosition;
exports.updatePosition = updatePosition;
exports.getPositions = getPositions;
exports.createPosition = createPosition;
exports.removePosition = removePosition;
exports.getPositionById = getPositionById;
exports.getAndStoreGooglePositions = getAndStoreGooglePositions;
exports.updatePositionCoordinates = updatePositionCoordinates;
