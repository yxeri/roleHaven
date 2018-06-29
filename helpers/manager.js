/*
 Copyright 2018 Aleksandar Jankovic

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
 * @param {Object} params - Parameters.
 * @param {Object} params.object - Object to strip.
 * @return {Object} Stripped object.
 */
function stripObject({ object }) {
  const modifiedObject = object;

  modifiedObject.ownerId = modifiedObject.ownerAliasId || modifiedObject.ownerId;
  modifiedObject.lastUpdated = modifiedObject.customLastUpdated || modifiedObject.lastUpdated;
  modifiedObject.timeCreated = modifiedObject.customTimeCreated || modifiedObject.timeCreated;
  modifiedObject.teamAdminIds = undefined;
  modifiedObject.userAdminIds = undefined;
  modifiedObject.userIds = undefined;
  modifiedObject.teamIds = undefined;
  modifiedObject.bannedIds = undefined;
  modifiedObject.customTimeCreated = undefined;
  modifiedObject.customLastUpdated = undefined;
  modifiedObject.hasFullAccess = false;

  return modifiedObject;
}

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
          } else if (!hasAccess) {
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
        const { paramName, paramValue } = param;

        dbCallParams[paramName] = paramValue;
      });

      dbCallFunc(dbCallParams);
    },
  });
}

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
          const allObjects = objects.map((object) => {
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
              } else if (aName > bName) {
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

function updateObject({
  objectId,
  token,
  object,
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

              io.emit(emitType, dataToSend);

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
}) {
  authenticator.isUserAllowed({
    token,
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

              io.emit(emitTypeGenerator ? emitTypeGenerator(foundObject) : emitType, dataToSend);

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
 * objectId,
 token,
 object,
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
 toStrip = [],
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

              io.emit(emitType, dataToSend);

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
