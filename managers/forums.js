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

const dbForum = require('../db/connectors/forum');
const dbConfig = require('../config/defaults/config').databasePopulation;
const errorCreator = require('../error/errorCreator');
const authenticator = require('../helpers/authenticator');
const aliasManager = require('./aliases');

/**
 * Get a forum by Id and check if the user has access to it.
 * @param {Object} params - Parameters.
 * @param {Object} params.user - User retrieving the forum.
 * @param {string} params.forumId - Id of the forum to retrieve.
 * @param {Function} params.callback - Callback.
 * @param {string} [params.errorContentText] - Text to be printed on error.
 * @param {boolean} [params.shouldBeAdmin] - Does the user have to be an admin?
 */
function getAccessibleForum({
  user,
  forumId,
  callback,
  shouldBeAdmin,
  full,
  errorContentText = `forumId ${forumId}`,
}) {
  dbForum.getForumById({
    forumId,
    callback: (forumData) => {
      if (forumData.error) {
        callback({ error: forumData.error });

        return;
      } else if (!authenticator.hasAccessTo({
        shouldBeAdmin,
        toAuth: user,
        objectToAccess: forumData.data.forum,
      })) {
        callback({ error: new errorCreator.NotAllowed({ name: errorContentText }) });

        return;
      }

      const foundForum = forumData.data.forum;
      const filteredForum = {
        objectId: foundForum.objectId,
        forumId: foundForum.forumId,
        text: foundForum.text,
        title: foundForum.title,
        threadIds: foundForum.threadIds,
        lastUpdated: foundForum.lastUpdated,
        timeCreated: foundForum.timeCreated,
        customLastUpdated: foundForum.customLastUpdated,
        customTimeCreated: foundForum.customTimeCreated,
        ownerId: foundForum.ownerId,
        ownerAliasId: foundForum.ownerAliasId,
      };

      callback({
        data: {
          forum: full ? foundForum : filteredForum,
        },
      });
    },
  });
}

/**
 * Create a new forum.
 * @param {Object} params - Parameters.
 * @param {Object} params.forum - Forum to create.
 * @param {Object} params.callback - Callback.
 * @param {Object} params.token - jwt.
 * @param {Object} params.io - Socket.io. Will be used if socket is not set.
 * @param {Object} [params.socket] - Socket.io.
 */
function createForum({
  forum,
  callback,
  token,
  io,
  socket,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.CreateForum.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user } = data;

      const forumToCreate = forum;
      forumToCreate.ownerId = user.objectId;

      const saveCallback = () => {
        dbForum.createForum({
          forum: forumToCreate,
          callback: (forumData) => {
            if (forumData.error) {
              callback({ error: forumData.error });

              return;
            }

            const createdForum = forumData.data.forum;
            const dataToSend = {
              data: {
                forum: createdForum,
                changeType: dbConfig.ChangeTypes.CREATE,
              },
            };

            if (socket) {
              socket.broadcast.emit(dbConfig.EmitTypes.FORUM, dataToSend);
            } else {
              io.emit(dbConfig.EmitTypes.FORUM, dataToSend);
            }

            callback(dataToSend);
          },
        });
      };

      if (forumToCreate.ownerAliasId) {
        aliasManager.getAccessibleAlias({
          user,
          aliasId: forumToCreate.ownerAliasId,
          callback: (aliasData) => {
            if (aliasData.error) {
              callback({ error: aliasData.error });

              return;
            }

            saveCallback();
          },
        });

        return;
      }

      saveCallback();
    },
  });
}

/**
 * Get all forums.
 * @param {Object} params - Parameters.
 * @param {Function} params.callback - Callback.
 * @param {string} params.token - jwt.
 */
function getAllForums({ callback, token }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetFull.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbForum.getAllForums({ callback });
    },
  });
}

/**
 * Update forum.
 * @param {Object} params - Parameters.
 * @param {Object} params.forum - Forum.
 * @parm {Object} params.options - Options.
 * @param {Function} params.callback - Callback.
 * @param {Object} params.io - Socket io. Will be used if socket is not set.
 * @param {Object} [params.socket] - Socket.io.
 */
function updateForum({
  token,
  forum,
  forumId,
  options,
  callback,
  socket,
  io,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.UpdateForumThread.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      getAccessibleForum({
        forumId,
        shouldBeAdmin: true,
        user: data.user,
        errorContentText: `update forumId ${forumId}`,
        callback: (deviceData) => {
          if (deviceData.error) {
            callback({ error: deviceData.error });

            return;
          }

          dbForum.updateForum({
            options,
            forum,
            forumId,
            callback: (updateData) => {
              if (updateData.error) {
                callback({ error: updateData.error });

                return;
              }

              const dataToSend = {
                data: {
                  forum: updateData.data.forum,
                  changeType: dbConfig.ChangeTypes.UPDATE,
                },
              };

              if (socket) {
                socket.broadcast.emit(dbConfig.EmitTypes.FORUM, dataToSend);
              } else {
                io.emit(dbConfig.EmitTypes.FORUM, dataToSend);
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
 * Remove forum.
 * @param {Object} params - Parameters.
 * @param {string} params.token - jwt.
 * @param {string} params.forumId - Id of the forum.
 * @param {Object} params.io - Socket io. Will be used if socket is not set.
 * @param {Function} params.callback - Callback.
 * @param {Object} [params.socket] - Socket.io.
 */
function removeForum({
  token,
  forumId,
  callback,
  socket,
  io,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.RemoveForum.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user } = data;

      getAccessibleForum({
        forumId,
        user,
        shouldBeAdmin: true,
        errorContentText: `remove forumId ${forumId}`,
        callback: (forumData) => {
          if (forumData.error) {
            callback({ error: forumData.error });

            return;
          }

          dbForum.removeForum({
            forumId,
            fullRemoval: true,
            callback: (removeData) => {
              if (removeData.error) {
                callback({ error: removeData.error });

                return;
              }

              const dataToSend = {
                data: {
                  forum: { objectId: forumId },
                  changeType: dbConfig.ChangeTypes.REMOVE,
                },
              };

              if (socket) {
                socket.broadcast.emit(dbConfig.EmitTypes.FORUM, dataToSend);
              } else {
                io.emit(dbConfig.EmitTypes.FORUM, dataToSend);
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
 * Get forum by Id.
 * @param {Object} params - Parameters.
 * @param {string} params.token - jwt.
 * @param {Function} params.callback - Callback.
 * @param {string} [params.forumId] - Id of forum to retrieve.
 */
function getForumById({
  forumId,
  token,
  callback,
  full,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetForum.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user } = data;

      getAccessibleForum({
        callback,
        forumId,
        user,
        full,
        shouldBeAdmin: full && dbConfig.apiCommands.GetFull.accessLevel > user.accessLevel,
      });
    },
  });
}

/**
 * Update last updated on the forum.
 * @param {Object} params - Params.
 * @param {string} params.forumId - Id of the forum.
 * @param {Function} params.callback - Callback.
 */
function updateForumTime({ forumId, callback }) {
  dbForum.updateForum({
    forumId,
    callback,
    forum: {},
  });
}

/**
 * Get forums by user.
 * @param {Object} params - Parameters.
 * @param {string} params.token - jwt.
 * @param {Function} params.callback - Callback
 */
function getForumsByUser({
  full,
  token,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: full ? dbConfig.apiCommands.GetFull.name : dbConfig.apiCommands.GetForum.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user } = data;

      dbForum.getForumsByUser({
        user,
        full,
        callback,
      });
    },
  });
}

exports.createForum = createForum;
exports.removeForum = removeForum;
exports.updateForum = updateForum;
exports.getAllForums = getAllForums;
exports.getForumById = getForumById;
exports.getAccessibleForum = getAccessibleForum;
exports.updateForumTime = updateForumTime;
exports.getForumsByUser = getForumsByUser;
