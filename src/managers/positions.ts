'use strict';

import { appConfig, dbConfig } from '../config/defaults/config';

import authenticator from '../helpers/authenticator';
import errorCreator from '../error/errorCreator';
import dbPosition from '../db/connectors/position';
import mapCreator from '../utils/mapCreator';
import managerHelper from '../helpers/manager';

/**
 * Get position.
 * @param {Object} params Parameter.
 * @param {string} params.token jwt.
 * @param {Function} params.callback Callback.
 * @param {string} [params.positionId] Id of the position.
 * @param {Object} [params.internalCallUser] User to use on authentication. It will bypass token authentication.
 */
function getPositionById({
  token,
  positionId,
  callback,
  needsAccess,
  internalCallUser,
}) {
  managerHelper.getObjectById({
    token,
    internalCallUser,
    callback,
    needsAccess,
    objectId: positionId,
    objectType: 'position',
    objectIdType: 'positionId',
    dbCallFunc: getPositionById,
    commandName: dbConfig.apiCommands.GetPositions.name,
  });
}

// TODO Should update if the position already exist
/**
 * Retrieve and store positions from a Google Maps collaborative map.
 * @param {Object} params Parameters.
 * @param {Function} params.callback Callback.
 */
function getAndStoreGooglePositions({
  io,
  callback = () => {
  },
}) {
  if (!appConfig.mapLayersPath) {
    callback({ error: new errorCreator.InvalidData({ expected: 'Map layer is not set' }) });

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
          const sendCallback = ({
            error,
            iteration,
          }) => {
            if (error) {
              callback({ error });

              return;
            }

            const dataToReturn = {
              data: {
                positions: createdPositions,
                changeType: dbConfig.ChangeTypes.CREATE,
              },
            };

            if (iteration === positionAmount) {
              io.emit(dbConfig.EmitTypes.POSITIONS, dataToReturn);

              callback(dataToReturn);
            }
          };
          let iteration = 1;

          positions.forEach((position) => {
            createPosition({
              position,
              callback: ({
                error,
                data,
              }) => {
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
 * Update position.
 * @param {Object} params Parameters.
 * @param {string} params.positionId Id of the position to update.
 * @param {Object} params.position User position to update or create.
 * @param {string} params.token jwt.
 * @param {Object} params.io Socket io.
 * @param {Function} params.callback Callback.
 * @param {Object} [params.options] Update options.
 */
function updatePosition({
  positionId,
  position,
  token,
  io,
  callback,
  options,
  socket,
  internalCallUser,
}) {
  managerHelper.updateObject({
    callback,
    options,
    token,
    io,
    socket,
    internalCallUser,
    objectId: positionId,
    object: position,
    commandName: dbConfig.apiCommands.UpdatePosition.name,
    objectType: 'position',
    dbCallFunc: updatePosition,
    emitType: dbConfig.EmitTypes.POSITION,
    objectIdType: 'positionId',
    getDbCallFunc: getPositionById,
    getCommandName: dbConfig.apiCommands.GetPositions.name,
  });
}

/**
 * Create a position.
 * @param {Object} params Parameters.
 * @param {Object} params.position Position to create.
 * @param {string} params.token jwt.
 * @param {Object} params.io Socket.io.
 * @param {Function} params.callback Callback.
 */
function createPosition({
  position,
  token,
  io,
  internalCallUser,
  callback,
  socket,
  isUserPosition = false,
}) {
  authenticator.isUserAllowed({
    token,
    internalCallUser,
    commandName: dbConfig.apiCommands.CreatePosition.name,
    callback: ({
      error,
      data,
    }) => {
      if (error) {
        callback({ error });

        return;
      }

      if (!isUserPosition && (!position.coordinates || !position.coordinates.latitude || !position.coordinates.longitude)) {
        callback({ error: new errorCreator.InvalidData({ expected: 'latitude && longitude && accuracy' }) });

        return;
      }

      if ((position.positionName && (position.positionName.length > appConfig.positionNameMaxLength || position.positionName.length <= 0))
        || (position.description && position.description.join('').length > appConfig.docFileMaxLength)) {
        callback({ error: new errorCreator.InvalidCharacters({ expected: `text length: ${appConfig.docFileMaxLength}, title length: ${appConfig.positionNameMaxLength}` }) });

        return;
      }

      if (!isUserPosition && position.coordinates.accuracy && position.coordinates.accuracy > appConfig.minimumPositionAccuracy) {
        callback({ error: new errorCreator.InvalidData({ expected: `accuracy less than ${appConfig.minimumPositionAccuracy}` }) });

        return;
      }

      const { user: authUser } = data;
      const newPosition = position;
      newPosition.ownerId = authUser.objectId;

      if (newPosition.coordinates) {
        newPosition.coordinates.accuracy = newPosition.coordinates.accuracy || appConfig.minimumPositionAccuracy;
      }

      if (position.positionStructure && position.positionStructure === dbConfig.PositionStructures.CIRCLE && !position.radius) {
        newPosition.radius = appConfig.defaultPositionRadius;
      }

      if (newPosition.ownerAliasId && !authUser.aliases.includes(newPosition.ownerAliasId)) {
        callback({ error: new errorCreator.NotAllowed({ name: `create position with alias ${newPosition.ownerAliasId}` }) });

        return;
      }

      createPosition({
        suppressExistsError: isUserPosition,
        options: {
          setId: isUserPosition,
        },
        position: newPosition,
        callback: ({
          error: updateError,
          data: positionData,
        }) => {
          if (updateError) {
            callback({ error: updateError });

            return;
          }

          const { position: updatedPosition } = positionData;
          const dataToReturn = {
            data: {
              position: updatedPosition,
              changeType: dbConfig.ChangeTypes.CREATE,
            },
          };
          const dataToSend = {
            data: {
              position: managerHelper.stripObject({ object: { ...updatedPosition } }),
              changeType: dbConfig.ChangeTypes.CREATE,
            },
          };

          if (socket && !isUserPosition) {
            socket.broadcast.emit(dbConfig.EmitTypes.POSITION, dataToSend);
          } else {
            io.emit(dbConfig.EmitTypes.POSITION, dataToSend);
          }

          callback(dataToReturn);
        },
      });
    },
  });
}

/**
 * Get positions.
 * @param {Object} params Parameters.
 * @param {string} params.token jwt.
 * @param {Function} params.callback Callback.
 */
function getPositionsByUser({
  token,
  callback,
}) {
  managerHelper.getObjects({
    callback,
    token,
    shouldSort: true,
    sortName: 'positionName',
    commandName: dbConfig.apiCommands.GetPositions.name,
    objectsType: 'positions',
    dbCallFunc: getPositionsByUser,
  });
}

/**
 * Remove position.
 * @param {Object} params Parameters.
 * @param {string} params.positionId ID of the position to remove.
 * @param {string} params.token jwt.
 * @param {Function} params.callback Callback
 * @param {Object} params.io Socket io.
 */
function removePosition({
  positionId,
  token,
  callback,
  io,
  socket,
  internalCallUser,
}) {
  managerHelper.removeObject({
    callback,
    token,
    io,
    socket,
    internalCallUser,
    getDbCallFunc: getPositionById,
    getCommandName: dbConfig.apiCommands.GetPositions.name,
    objectId: positionId,
    commandName: dbConfig.apiCommands.RemovePosition.name,
    objectType: 'position',
    dbCallFunc: removePosition,
    emitType: dbConfig.EmitTypes.POSITION,
    objectIdType: 'positionId',
  });
}

export { updatePosition };
export { getPositionsByUser };
export { createPosition };
export { removePosition };
export { getPositionById };
export { getAndStoreGooglePositions };
