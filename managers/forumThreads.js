/*
 Copyright 2017 Carmilla Mina Jankovic

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

const dbThread = require('../db/connectors/forumThread');
const { dbConfig } = require('../config/defaults/config');
const errorCreator = require('../error/errorCreator');
const authenticator = require('../helpers/authenticator');
const forumManager = require('./forums');
const managerHelper = require('../helpers/manager');

/**
 * Get forum thread by Id.
 * @param {Object} params - Parameters.
 * @param {string} [params.threadId] - Id of forum thread to retrieve.
 * @param {string} params.token - jwt.
 * @param {Function} params.callback - Callback.
 */
function getThreadById({
  threadId,
  token,
  internalCallUser,
  needsAccess,
  callback,
}) {
  managerHelper.getObjectById({
    token,
    internalCallUser,
    callback,
    needsAccess,
    objectId: threadId,
    objectType: 'thread',
    objectIdType: 'threadId',
    dbCallFunc: dbThread.getThreadById,
    commandName: dbConfig.apiCommands.GetForumThread.name,
  });
}

/**
 * Create new forum thread
 * @param {Object} params - Parameters
 * @param {Object} params.thread - Forum thread to create
 * @param {Function} params.callback - Callback
 * @param {string} params.token - jwt
 * @param {Object} params.io - Socket.io.
 */
function createThread({
  thread,
  callback,
  token,
  io,
  socket,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.CreateForumThread.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user: authUser } = data;

      forumManager.getForumById({
        internalCallUser: authUser,
        forumId: thread.forumId,
        needsAccess: true,
        callback: ({ error: forumError }) => {
          if (forumError) {
            callback({ error: forumError });

            return;
          }

          const threadToCreate = thread;
          threadToCreate.ownerId = authUser.objectId;

          if (threadToCreate.ownerAliasId && !authUser.aliases.includes(threadToCreate.ownerAliasId)) {
            callback({ error: new errorCreator.NotAllowed({ name: `create thread with alias ${threadToCreate.ownerAliasId}` }) });

            return;
          }

          dbThread.createThread({
            thread: threadToCreate,
            callback: ({ error: createError, data: createData }) => {
              if (createError) {
                callback({ error: createError });

                return;
              }

              const { thread: createdThread } = createData;

              /**
               * Update will set last updated to the current time.
               */
              forumManager.updateForumTime({
                forumId: thread.forumId,
                callback: ({ error: updateError }) => {
                  if (updateError) {
                    callback({ error: updateError });

                    return;
                  }

                  const dataToSend = {
                    data: {
                      thread: managerHelper.stripObject({ object: Object.assign({}, createdThread) }),
                      changeType: dbConfig.ChangeTypes.CREATE,
                    },
                  };

                  if (socket) {
                    socket.broadcast.emit(dbConfig.EmitTypes.FORUMTHREAD, dataToSend);
                  } else {
                    io.emit(dbConfig.EmitTypes.FORUMTHREAD, dataToSend);
                    io.to(thread.ownerAliasId || authUser.objectId).emit(dbConfig.EmitTypes.FORUMTHREAD, {
                      data: {
                        thread: createdThread,
                        changeType: dbConfig.ChangeTypes.UPDATE,
                      },
                    });
                  }

                  callback({
                    data: {
                      thread: createdThread,
                      changeType: dbConfig.ChangeTypes.CREATE,
                    },
                  });
                },
              });
            },
          });
        },
      });
    },
  });
}

/**
 * Get threads by forum.
 * @param {Object} params - Parameters.
 * @param {string[]} params.forumId - Id of the forum.
 * @param {Function} params.callback - Callback.
 * @param {string} params.token - jwt.
 */
function getForumThreadsByForum({
  forumId,
  callback,
  internalCallUser,
  token,
}) {
  managerHelper.getObjects({
    callback,
    token,
    internalCallUser,
    getParams: [forumId],
    shouldSort: true,
    sortName: 'customLastUpdated',
    fallbackSortName: 'lastUpdated',
    commandName: dbConfig.apiCommands.GetForumThread.name,
    objectsType: 'threads',
    dbCallFunc: dbThread.getThreadsByForum,
  });
}

/**
 * Get threads from the forums that the user has access to.
 * @param {Object} params - Parameters.
 * @param {string} params.token - jwt.
 * @param {Function} params.callback - Callback.
 */
function getThreadsByUser({
  token,
  callback,
}) {
  managerHelper.getObjects({
    callback,
    token,
    shouldSort: true,
    sortName: 'customLastUpdated',
    fallbackSortName: 'lastUpdated',
    commandName: dbConfig.apiCommands.GetForumThread.name,
    objectsType: 'threads',
    dbCallFunc: dbThread.getThreadsByUser,
  });
}

/**
 * Update thread.
 * @param {Object} params - Parameters.
 * @param {Object} params.thread - Forum thread.
 * @param {string} params.threadId - Id of the thread to update.
 * @param {Object} params.options - Options.
 * @param {Function} params.callback - Callback.
 * @param {Object} params.io - Socket.io.
 */
function updateThread({
  token,
  thread,
  threadId,
  options,
  callback,
  io,
  socket,
}) {
  managerHelper.updateObject({
    callback,
    options,
    token,
    io,
    socket,
    objectId: threadId,
    object: thread,
    commandName: dbConfig.apiCommands.UpdateForumThread.name,
    objectType: 'thread',
    dbCallFunc: dbThread.updateThread,
    emitType: dbConfig.EmitTypes.FORUMTHREAD,
    objectIdType: 'threadId',
    getDbCallFunc: dbThread.getThreadById,
    getCommandName: dbConfig.apiCommands.GetForumThread.name,
  });
}

/**
 * Remove thread.
 * @param {Object} params - Parameters.
 * @param {string} params.token - jwt.
 * @param {string} params.threadId - ID of the forum thread.
 * @param {Object} params.io - Socket io.
 * @param {Function} params.callback - Callback.
 */
function removeThread({
  token,
  threadId,
  callback,
  io,
  socket,
}) {
  managerHelper.removeObject({
    callback,
    token,
    io,
    socket,
    getDbCallFunc: dbThread.getThreadById,
    getCommandName: dbConfig.apiCommands.GetForumThread.name,
    objectId: threadId,
    commandName: dbConfig.apiCommands.RemoveForumThread.name,
    objectType: 'thread',
    dbCallFunc: dbThread.removeThread,
    emitType: dbConfig.EmitTypes.FORUMTHREAD,
    objectIdType: 'threadId',
  });
}

/**
 * Get all forums.
 * @param {Object} params - Parameters.
 * @param {Function} params.callback - Callback.
 * @param {string} params.token - jwt.
 */
function getAllThreads({ callback, token }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetFull.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbThread.getAllThreads({ callback });
    },
  });
}

/**
 * Update last updated date on thread and its parent forum, if forum Id is set.
 * @param {Object} params - Parameters.
 * @param {string} params.threadId - Id of the thread.
 * @param {Function} params.callback - Callback.
 * @param {string} [params.forumId] - Id of the forum.
 */
function updateThreadTime({
  threadId,
  forumId,
  callback,
}) {
  dbThread.updateThread({
    threadId,
    thread: {},
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      if (forumId) {
        forumManager.updateForumTime({
          forumId,
          callback,
        });
      }
    },
  });
}

/**
 * Update access to the forum thread for users or teams.
 * @param {Object} params - Parameters.
 * @param {string} params.threadId - Id of the forum thread.
 * @param {Function} params.callback - Callback.
 * @param {boolean} [params.shouldRemove] - Should access be removed from the users or teams?
 * @param {string[]} [params.userIds] - Id of the users.
 * @param {string[]} [params.teamIds] - Id of the teams.
 * @param {string[]} [params.bannedIds] - Id of the blocked Ids to add.
 * @param {string[]} [params.teamAdminIds] - Id of the teams to change admin access for.
 * @param {string[]} [params.userAdminIds] - Id of the users to change admin access for.
 */
function updateAccess({
  token,
  threadId,
  teamAdminIds,
  userAdminIds,
  userIds,
  teamIds,
  bannedIds,
  shouldRemove,
  internalCallUser,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    internalCallUser,
    commandName: dbConfig.apiCommands.UpdateForumThread.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user: authUser } = data;

      getThreadById({
        threadId,
        internalCallUser: authUser,
        callback: ({ error: threadError, data: threadData }) => {
          if (threadError) {
            callback({ error: threadError });

            return;
          }

          const { thread } = threadData;

          const {
            hasFullAccess,
          } = authenticator.hasAccessTo({
            objectToAccess: thread,
            toAuth: authUser,
          });

          if (!hasFullAccess) {
            callback({ error: new errorCreator.NotAllowed({ name: `${dbConfig.apiCommands.UpdateForumThread.name}. User: ${authUser.objectId}. Access: forum thread ${threadId}` }) });

            return;
          }

          dbThread.updateAccess({
            shouldRemove,
            userIds,
            teamIds,
            bannedIds,
            teamAdminIds,
            userAdminIds,
            threadId,
            callback,
          });
        },
      });
    },
  });
}

exports.createThread = createThread;
exports.updateThread = updateThread;
exports.removeThread = removeThread;
exports.getForumThreadsByForum = getForumThreadsByForum;
exports.getAllThreads = getAllThreads;
exports.getThreadById = getThreadById;
exports.getThreadsByUser = getThreadsByUser;
exports.updateThreadTime = updateThreadTime;
exports.updateAccess = updateAccess;
