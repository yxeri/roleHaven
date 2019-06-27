/*
 Copyright 2018 Carmilla Mina Jankovic

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

const authenticator = require('./authenticator');
const errorCreator = require('../error/errorCreator');
const { dbConfig } = require('../config/defaults/config');

/**
 * Removes variables with admin info.
 * @param {Object} params Parameters.
 * @param {Object} params.object Object to strip.
 * @return {Object} Stripped object.
 */
function stripObject({ object }) {
  const modifiedObject = object;

  modifiedObject.ownerId = modifiedObject.ownerAliasId || modifiedObject.ownerId;
  modifiedObject.lastUpdated = modifiedObject.customLastUpdated || modifiedObject.lastUpdated;
  modifiedObject.timeCreated = modifiedObject.customTimeCreated || modifiedObject.timeCreated;
  modifiedObject.teamAdminIds = [];
  modifiedObject.userAdminIds = [];
  modifiedObject.userIds = [];
  modifiedObject.teamIds = [];
  modifiedObject.bannedIds = [];
  modifiedObject.customTimeCreated = undefined;
  modifiedObject.customLastUpdated = undefined;
  modifiedObject.hasFullAccess = false;

  return modifiedObject;
}

/**
 * Get an object.
 * @param {Object} params Parameters.
 * @param {string} params.token Jwt.
 * @param {string} params.commandName Name of the command that will be authenticated against when retrieving the object.
 * @param {Function} params.dbCallFunc Database call that will be used to get the object.
 * @param {Function} params.callback Callback.
 * @param {string} [params.objectType] Type of the object that will be retrieved.
 * @param {Object} [params.internalCallUser] Authentication will be bypassed with the set user.
 * @param {boolean} [params.needsAccess] User has to have access to the object to retrieve it.
 * @param {string[]} [params.searchParams] Parameters that will be matched against when retrieving the object.
 */
function getObjectById({
  token,
  objectId,
  objectType,
  objectIdType,
  callback,
  dbCallFunc,
  commandName,
  needsAccess,
  internalCallUser,
  searchParams = [],
}) {
  authenticator.isUserAllowed({
    token,
    internalCallUser,
    commandName,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user: authUser } = data;

      const dbCallParams = {
        callback: ({ error: getError, data: getData }) => {
          if (getError) {
            callback({ error: getError });

            return;
          }

          const foundObject = getData[objectType];

          const {
            canSee,
            hasAccess,
          } = authenticator.hasAccessTo({
            objectToAccess: foundObject,
            toAuth: authUser,
          });

          if (!canSee || (needsAccess && !hasAccess)) {
            callback({ error: new errorCreator.NotAllowed({ name: `${commandName}. User: ${authUser.objectId}. Access: ${objectType} ${objectId}` }) });

            return;
          }

          if (!hasAccess) {
            const dataToReturn = { data: {} };
            dataToReturn.data[objectType] = stripObject({ object: foundObject });

            callback(dataToReturn);

            return;
          }

          const dataToReturn = {
            data: {
              authUser,
              hasAccess,
            },
          };
          dataToReturn.data[objectType] = foundObject;

          callback(dataToReturn);
        },
      };
      dbCallParams[objectIdType] = objectId;

      searchParams.forEach((param) => {
        if (param.paramValue) {
          const { paramName, paramValue } = param;

          dbCallParams[paramName] = paramValue;
        }
      });

      dbCallFunc(dbCallParams);
    },
  });
}

/**
 * Get objects.
 * @param {Object} params Parameters.
 * @param {string} params.token Jwt.
 * @param {string} params.commandName Name of the command that will be authenticated against when updating the object.
 * @param {Function} params.dbCallFunc Database call that will be used to update the object.
 * @param {Function} params.callback Callback.
 * @param {string} [params.objectsType] Type of objects that will be retrieved.
 * @param {Object} [params.internalCallUser] Authentication will be bypassed with the set user.
 * @param {boolean} [params.shouldSort] Should the retrieved objects be sorted?
 * @param {string[]} [params.getParams] Variables that be matched against when retrieving the objects.
 * @param {string} [params.sortName] Variable name that will be used to sort objects with.
 * @param {string} [params.fallbackSortName] Variable name that will be used if sortName isn't matched.
 * @param {boolean} [params.ignoreAuth] Returns all objects and does not check if the user has access to them.
 */
function getObjects({
  token,
  objectsType,
  callback,
  dbCallFunc,
  commandName,
  internalCallUser,
  shouldSort,
  sortName,
  fallbackSortName,
  ignoreAuth = false,
  getParams = [],
}) {
  authenticator.isUserAllowed({
    token,
    internalCallUser,
    commandName,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user: authUser } = data;

      const dbCallParams = {
        user: authUser,
        callback: ({ error: getError, data: getData }) => {
          if (getError) {
            callback({ error: getError });

            return;
          }

          const objects = getData[objectsType];
          const allObjects = objects.filter((object) => {
            if (ignoreAuth) {
              return true;
            }

            const { canSee } = authenticator.hasAccessTo({
              toAuth: authUser,
              objectToAccess: object,
            });

            return canSee;
          }).map((object) => {
            if (ignoreAuth) {
              return object;
            }

            const { hasFullAccess } = authenticator.hasAccessTo({
              toAuth: authUser,
              objectToAccess: object,
            });

            if (!hasFullAccess) {
              return stripObject({ object });
            }

            return object;
          });

          const dataToReturn = {
            data: { authUser },
          };

          if (shouldSort) {
            dataToReturn.data[objectsType] = allObjects.sort((a, b) => {
              const aName = a[sortName] || a[fallbackSortName];
              const bName = b[sortName] || b[fallbackSortName];

              if (aName < bName) {
                return -1;
              }

              if (aName > bName) {
                return 1;
              }

              return 0;
            });
          } else {
            dataToReturn.data[objectsType] = allObjects;
          }

          callback(dataToReturn);
        },
      };

      getParams.forEach((param) => {
        dbCallParams[param] = param;
      });

      dbCallFunc(dbCallParams);
    },
  });
}

/**
 * Update an object.
 * @param {Object} params Parameters.
 * @param {string} params.objectId Id of the object to update.
 * @param {string} params.token Jwt.
 * @param {string} params.commandName Name of the command that will be authenticated against when updating the object.
 * @param {Function} params.dbCallFunc Database call that will be used to update the object.
 * @param {string} params.emitType Socket.io emit type on successful update.
 * @param {Object} params.io Socket.io
 * @param {string} params.objectIdType Name of the object Id.
 * @param {Function} params.getDbCallFunc Database call that will be used to get the object and check if the user has access to it.
 * @param {string} params.getCommandName Name of the command that will be authenticated against when retrieving the object.
 * @param {Function} params.callback Callback
 * @param {string} [params.objectType] Type of object to update
 * @param {Object} [params.internalCallUser] Authentication will be bypassed with the set user.
 * @param {Object} [params.options] Database call options.
 * @param {string[]} [params.toStrip] Variables that should be removed when emitting the updated object.
 */
function updateObject({
  objectId,
  token,
  object,
  commandName,
  objectType,
  dbCallFunc,
  emitType,
  io,
  socket,
  objectIdType,
  getDbCallFunc,
  getCommandName,
  callback,
  internalCallUser,
  options,
  limitAccessLevel = false,
  toStrip = [],
}) {
  authenticator.isUserAllowed({
    token,
    commandName,
    internalCallUser,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user: authUser } = data;

      getObjectById({
        token,
        objectId,
        objectType,
        objectIdType,
        dbCallFunc: getDbCallFunc,
        commandName: getCommandName,
        internalCallUser: authUser,
        callback: ({ error: getError, data: getData }) => {
          if (getError) {
            callback({ error: getError });

            return;
          }

          const foundObject = getData[objectType];
          const {
            hasFullAccess,
          } = authenticator.hasAccessTo({
            objectToAccess: foundObject,
            toAuth: authUser,
          });

          if (!hasFullAccess) {
            callback({ error: new errorCreator.NotAllowed({ name: `${commandName}. User: ${authUser.objectId}. Access: ${objectType} ${objectId}` }) });

            return;
          }

          const dbCallParams = {
            options,
            callback: ({ error: updateError, data: updated }) => {
              if (updateError) {
                callback({ error: updateError });

                return;
              }

              const updatedObject = updated[objectType];
              const dataToSend = {
                data: {
                  changeType: dbConfig.ChangeTypes.UPDATE,
                },
              };
              dataToSend.data[objectType] = stripObject({ object: Object.assign({}, updatedObject) });

              toStrip.forEach((stripVar) => {
                dataToSend.data[objectType][stripVar] = undefined;
              });

              const creatorDataToSend = {
                data: {
                  changeType: dbConfig.ChangeTypes.UPDATE,
                },
              };
              creatorDataToSend.data[objectType] = updatedObject;

              if (socket) {
                if (limitAccessLevel) {
                  socket.broadcast.to(dbConfig.apiCommands.CreateTriggerEvent.accessLevel.toString()).emit(emitType, dataToSend);
                } else {
                  socket.broadcast.emit(emitType, dataToSend);
                }
              } else if (limitAccessLevel) {
                io.to(dbConfig.apiCommands.CreateTriggerEvent.accessLevel.toString()).emit(emitType, dataToSend);
              } else {
                io.emit(emitType, dataToSend);
              }

              callback(creatorDataToSend);
            },
          };
          dbCallParams[objectIdType] = objectId;
          dbCallParams[objectType] = object;

          dbCallFunc(dbCallParams);
        },
      });
    },
  });
}

/**
 * Remove an object.
 * @param {Object} params Parameters.
 * @param {string} params.objectId Id of the object to remove.
 * @param {string} params.token Jwt.
 * @param {string} params.commandName Name of the command that will be authenticated against when deleting the object.
 * @param {Function} params.dbCallFunc Database call that will be used to remove the object.
 * @param {string} params.emitType Socket.io emit type on successful deletion.
 * @param {Object} params.io Socket.io
 * @param {string} params.objectIdType Name of the object Id.
 * @param {Function} params.getDbCallFunc Database call that will be used to get the object and check if the user has access to it.
 * @param {string} params.getCommandName Name of the command that will be authenticated against when retrieving the object.
 * @param {Function} params.callback Callback
 * @param {string} [params.objectType] Type of object or remove.
 * @param {Function} [params.emitTypeGenerator] Function to use to create the correct emit type for socket.io. It will be used instead of variable emitType, if set.
 */
function removeObject({
  objectId,
  token,
  commandName,
  objectType,
  dbCallFunc,
  emitType,
  io,
  objectIdType,
  getDbCallFunc,
  getCommandName,
  emitTypeGenerator,
  callback,
  socket,
  internalCallUser,
}) {
  authenticator.isUserAllowed({
    token,
    internalCallUser,
    commandName,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user: authUser } = data;

      getObjectById({
        token,
        objectId,
        objectType,
        objectIdType,
        dbCallFunc: getDbCallFunc,
        commandName: getCommandName,
        internalCallUser: authUser,
        callback: ({ error: getError, data: getData }) => {
          if (getError) {
            callback({ error: getError });

            return;
          }

          const foundObject = getData[objectType];
          const {
            hasFullAccess,
          } = authenticator.hasAccessTo({
            objectToAccess: foundObject,
            toAuth: authUser,
          });

          if (!hasFullAccess) {
            callback({ error: new errorCreator.NotAllowed({ name: `${commandName}. User: ${authUser.objectId}. Access: ${objectType} ${objectId}` }) });

            return;
          }

          const dbCallParams = {
            callback: ({ error: removeError }) => {
              if (removeError) {
                callback({ error: removeError });

                return;
              }

              const dataToSend = {
                data: {
                  changeType: dbConfig.ChangeTypes.REMOVE,
                },
              };
              dataToSend.data[objectType] = { objectId };

              if (socket) {
                socket.broadcast.emit(emitTypeGenerator
                  ? emitTypeGenerator(foundObject)
                  : emitType, dataToSend);
              } else {
                io.emit(emitTypeGenerator
                  ? emitTypeGenerator(foundObject)
                  : emitType, dataToSend);
              }

              callback(dataToSend);
            },
          };
          dbCallParams[objectIdType] = objectId;

          dbCallFunc(dbCallParams);
        },
      });
    },
  });
}

/**
 * Update permission on an object.
 * @param {Object} params Parameters.
 * @param {string} params.objectId Id of the object to update.
 * @param {string} params.token Jwt.
 * @param {string} params.commandName Name of the command that will be authenticated against when updating the object.
 * @param {Function} params.dbCallFunc Database call that will be used to update the object.
 * @param {string} params.emitType Socket.io emit type on successful update.
 * @param {Object} params.io Socket.io
 * @param {string} params.objectIdType Name of the object Id.
 * @param {Function} params.getDbCallFunc Database call that will be used to get the object and check if the user has access to it.
 * @param {string} params.getCommandName Name of the command that will be authenticated against when retrieving the object.
 * @param {Function} params.callback Callback
 * @param {string} [params.objectType] Type of object to update
 * @param {Object} [params.internalCallUser] Authentication will be bypassed with the set user.
 * @param {Object} [params.options] Database call options.
 * @param {string[]} [params.toStrip] Variables that should be removed when emitting the updated object.
 * @param {boolean} [params.shouldRemove] Should the user and team Id's access be removed? Default is false.
 * @param {string[]} [params.userIds] Ids of the users that will be given/lose permissions to access the object.
 * @param {string[]} [params.teamIds] Ids of the teams that will be given/lose permissions to access the object.
 * @param {string[]} [params.userAdminIds] Ids of the users that will be given/lose permissions admin access on the object.
 * @param {string[]} [params.teamAdminIds] Ids of the teams that will be given/lose permissions admin access on the object.
 * @param {string[]} [params.bannedIds] Ids of the users that will be banned/unbanned from the object.
 */
function updateAccess({
  objectId,
  token,
  teamAdminIds,
  userAdminIds,
  userIds,
  teamIds,
  bannedIds,
  shouldRemove,
  commandName,
  objectType,
  dbCallFunc,
  emitType,
  io,
  objectIdType,
  getDbCallFunc,
  getCommandName,
  callback,
  internalCallUser,
  options,
  socket,
  toStrip = [],
}) {
  authenticator.isUserAllowed({
    token,
    commandName,
    internalCallUser,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user: authUser } = data;

      getObjectById({
        token,
        objectId,
        objectType,
        objectIdType,
        dbCallFunc: getDbCallFunc,
        commandName: getCommandName,
        internalCallUser: authUser,
        callback: ({ error: getError, data: getData }) => {
          if (getError) {
            callback({ error: getError });

            return;
          }

          const foundObject = getData[objectType];
          const {
            hasFullAccess,
          } = authenticator.hasAccessTo({
            objectToAccess: foundObject,
            toAuth: authUser,
          });

          if (!hasFullAccess) {
            callback({ error: new errorCreator.NotAllowed({ name: `${commandName}. User: ${authUser.objectId}. Access: ${objectType} ${objectId}` }) });

            return;
          }

          const dbCallParams = {
            options,
            teamAdminIds,
            userAdminIds,
            userIds,
            teamIds,
            bannedIds,
            shouldRemove,
            callback: ({ error: updateError }) => {
              if (updateError) {
                callback({ error: updateError });

                return;
              }

              const dataToSend = {
                data: {
                  changeType: dbConfig.ChangeTypes.UPDATE,
                },
              };
              dataToSend.data[objectType] = stripObject({ object: Object.assign({}, foundObject) });

              toStrip.forEach((stripVar) => {
                dataToSend.data[objectType][stripVar] = undefined;
              });

              const creatorDataToSend = {
                data: {
                  changeType: dbConfig.ChangeTypes.UPDATE,
                },
              };
              creatorDataToSend.data[objectType] = foundObject;

              if (socket) {
                socket.broadcast.emit(emitType, dataToSend);
              } else {
                io.emit(emitType, dataToSend);
              }

              callback(creatorDataToSend);
            },
          };
          dbCallParams[objectIdType] = objectId;

          dbCallFunc(dbCallParams);
        },
      });
    },
  });
}

exports.stripObject = stripObject;
exports.removeObject = removeObject;
exports.getObjectById = getObjectById;
exports.updateObject = updateObject;
exports.getObjects = getObjects;
exports.updateAccess = updateAccess;
