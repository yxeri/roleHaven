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

const dbThread = require('../db/connectors/forumThread');
const dbConfig = require('../config/defaults/config').databasePopulation;
const errorCreator = require('../objects/error/errorCreator');
const authenticator = require('../helpers/authenticator');
const aliasManager = require('./aliases');
const forumManager = require('./forums');

/**
 * Get forum thread by Id and check if the user has access to it.
 * @param {Object} params - Parameters.
 * @param {Object} params.user - User retrieving the forum thread.
 * @param {string} params.threadId - Id of the forum thread to retrieve.
 * @param {Function} params.callback - Callback.
 * @param {string} [params.errorContentText] - Text to be printed on error.
 * @param {boolean} [params.shouldBeAdmin] - Does the user have to be an admin?
 */
function getAccessibleThread({
  user,
  threadId,
  callback,
  shouldBeAdmin,
  full,
  errorContentText = `forumThreadId ${threadId}`,
}) {
  dbThread.getThreadById({
    threadId,
    callback: (forumData) => {
      if (forumData.error) {
        callback({ error: forumData.error });

        return;
      } else if (!authenticator.hasAccessTo({
        shouldBeAdmin,
        toAuth: user,
        objectToAccess: forumData.data.thread,
      })) {
        callback({ error: new errorCreator.NotAllowed({ name: errorContentText }) });

        return;
      }

      const foundThread = forumData.data.thread;
      const filteredThread = {
        title: foundThread.title,
        objectId: foundThread.objectId,
        forumId: foundThread.forumId,
        text: foundThread.text,
        postIds: foundThread.postIds,
        lastUpdated: foundThread.lastUpdated,
        timeCreated: foundThread.timeCreated,
        customLastUpdated: foundThread.customLastUpdated,
        customTimeCreated: foundThread.customTimeCreated,
        ownerId: foundThread.ownerId,
        ownerAliasId: foundThread.ownerAliasId,
      };

      callback({
        data: {
          thread: full ? foundThread : filteredThread,
        },
      });
    },
  });
}

/**
 * Get forum thread by query and check if the user has access to it.
 * @param {Object} params - Parameters.
 * @param {Object} params.user - User retrieving the forum thread.
 * @param {string} params.forumId - ID of the forum to retrieve threads for.
 * @param {Function} params.callback - Callback.
 * @param {boolean} [params.shouldBeAdmin] - Does the user have to be an admin?
 */
function getAccessibleThreads({
  user,
  forumId,
  callback,
  shouldBeAdmin,
  full,
}) {
  dbThread.getThreadsByForum({
    forumId,
    callback: (forumData) => {
      if (forumData.error) {
        callback({ error: forumData.error });

        return;
      }

      const accessibleThreads = forumData.data.threads.filter((thread) => {
        return authenticator.hasAccessTo({
          shouldBeAdmin,
          toAuth: user,
          objectToAccess: thread,
        });
      });
      const filteredThreads = accessibleThreads.map((thread) => {
        return {
          objectId: thread.objectId,
          forumId: thread.forumId,
          text: thread.text,
          postIds: thread.postIds,
          lastUpdated: thread.lastUpdated,
          timeCreated: thread.timeCreated,
          customLastUpdated: thread.customLastUpdated,
          customTimeCreated: thread.customTimeCreated,
          ownerId: thread.ownerId,
          ownerAliasId: thread.ownerAliasId,
        };
      });

      callback({
        data: {
          threads: full ? accessibleThreads : filteredThreads,
        },
      });
    },
  });
}

/**
 * Update last updated on the thread
 * @param {Object} params - Params
 * @param {string} params.threadId - ID of the thread
 * @param {Function} params.callback - Callback
 */
function updateThreadTime({ threadId, callback }) {
  dbThread.updateThread({
    threadId,
    callback,
    thread: {},
  });
}

/**
 * Create new forum thread
 * @param {Object} params - Parameters
 * @param {Object} params.thread - Forum thread to create
 * @param {Function} params.callback - Callback
 * @param {string} params.token - jwt
 * @param {Object} params.io - Socket.io. Will be used if socket is not set
 * @param {Object} [params.socket] - Socket.io
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

      const { user } = data;

      forumManager.getAccessibleForum({
        user,
        forumId: thread.forumId,
        callback: (forumData) => {
          if (forumData.error) {
            callback({ error: forumData.error });

            return;
          }

          const threadToCreate = thread;
          threadToCreate.ownerId = user.objectId;

          const saveCallback = () => {
            dbThread.createThread({
              thread: threadToCreate,
              callback: (threadData) => {
                if (threadData.error) {
                  callback({ error: threadData.error });

                  return;
                }

                forumManager.updateForumTime({
                  forumId: thread.forumId,
                  callback: (timeData) => {
                    if (timeData.error) {
                      callback({ error: timeData.error });

                      return;
                    }

                    const dataToSend = {
                      data: {
                        thread: threadData.data.thread,
                        changeType: dbConfig.ChangeTypes.CREATE,
                      },
                    };

                    if (socket) {
                      socket.broadcast.emit(dbConfig.EmitTypes.FORUMTHREAD, dataToSend);
                    } else {
                      io.emit(dbConfig.EmitTypes.FORUMTHREAD, dataToSend);
                    }

                    callback(dataToSend);
                  },
                });
              },
            });
          };

          if (threadToCreate.ownerAliasId) {
            aliasManager.getAccessibleAlias({
              user,
              aliasId: threadToCreate.ownerAliasId,
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
  token,
  full,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetForumThread.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user } = data;

      forumManager.getAccessibleForum({
        forumId,
        user,
        callback: (forumData) => {
          if (forumData.error) {
            callback({ error: forumData.error });

            return;
          }

          getAccessibleThreads({
            forumId,
            user,
            full,
            shouldBeAdmin: full && dbConfig.apiCommands.GetFull.accessLevel > user.accessLevel,
            callback: (threadsData) => {
              if (threadsData.error) {
                callback({ error: threadsData.error });

                return;
              }

              callback({ data: { threads: threadsData.data.threads } });
            },
          });
        },
      });
    },
  });
}

/**
 * Get threads from the forums that the user has access to.
 * @param {Object} params - Parameters.
 * @param {string} params.token - jwt.
 * @param {Function} params.callback - Callback.
 * @param {boolean} [params.full] - Should the complete objects be returned?
 */
function getThreadsByUser({
  token,
  callback,
  full,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: full ? dbConfig.apiCommands.GetFull.name : dbConfig.apiCommands.GetForumThread.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user } = data;

      dbThread.getThreadsByUser({
        callback,
        full,
        user,
      });
    },
  });
}

/**
 * Update thread.
 * @param {Object} params - Parameters.
 * @param {Object} params.thread - Forum thread.
 * @param {string} params.threadId - Id of the thread to update.
 * @param {Object} params.options - Options.
 * @param {Function} params.callback - Callback.
 * @param {Object} params.io - Socket.io. Will be used if socket is not set.
 * @param {Object} [params.socket] - Socket.io.
 */
function updateThread({
  token,
  thread,
  threadId,
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

      const { user } = data;

      getAccessibleThread({
        threadId,
        user,
        shouldBeAdmin: true,
        errorContentText: `update thread ${threadId}`,
        callback: (deviceData) => {
          if (deviceData.error) {
            callback({ error: deviceData.error });

            return;
          }

          dbThread.updateThread({
            options,
            thread,
            threadId,
            callback: (updateData) => {
              if (updateData.error) {
                callback({ error: updateData.error });

                return;
              }

              const dataToSend = {
                data: {
                  thread: updateData.data.thread,
                  changeType: dbConfig.ChangeTypes.UPDATE,
                },
              };

              if (socket) {
                socket.broadcast.emit(dbConfig.EmitTypes.FORUMTHREAD, dataToSend);
              } else {
                io.emit(dbConfig.EmitTypes.FORUMTHREAD, dataToSend);
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
 * Remove thread.
 * @param {Object} params - Parameters.
 * @param {string} params.token - jwt.
 * @param {string} params.threadId - ID of the forum thread.
 * @param {Object} params.io - Socket io. Will be used if socket is not set.
 * @param {Function} params.callback - Callback.
 * @param {Object} [params.socket] - Socket io.
 */
function removeThread({
  token,
  threadId,
  callback,
  socket,
  io,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.RemoveForumThread.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user } = data;

      getAccessibleThread({
        threadId,
        user,
        shouldBeAdmin: true,
        errorContentText: `remove forum threadId ${threadId}`,
        callback: (forumData) => {
          if (forumData.error) {
            callback({ error: forumData.error });

            return;
          }

          dbThread.removeThread({
            threadId,
            fullRemoval: true,
            callback: (removeData) => {
              if (removeData.error) {
                callback({ error: removeData.error });

                return;
              }

              const dataToSend = {
                data: {
                  thread: { objectId: threadId },
                  changeType: dbConfig.ChangeTypes.REMOVE,
                },
              };

              if (socket) {
                socket.broadcast.emit(dbConfig.EmitTypes.FORUMTHREAD, dataToSend);
              } else {
                io.emit(dbConfig.EmitTypes.FORUMTHREAD, dataToSend);
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
 * Get forum thread by Id.
 * @param {Object} params - Parameters.
 * @param {string} [params.threadId] - Id of forum thread to retrieve.
 * @param {string} params.token - jwt.
 * @param {Function} params.callback - Callback.
 */
function getThreadById({
  threadId,
  token,
  full,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetForumThread.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user } = data;

      getAccessibleThread({
        callback,
        threadId,
        user,
        full,
        shouldBeAdmin: full && dbConfig.apiCommands.GetFull.accessLevel > user.accessLevel,
      });
    },
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

exports.createThread = createThread;
exports.updateThread = updateThread;
exports.removeThread = removeThread;
exports.getForumThreadsByForum = getForumThreadsByForum;
exports.getAllThreads = getAllThreads;
exports.getThreadById = getThreadById;
exports.getAccessibleThreads = getAccessibleThreads;
exports.getAccessibleThread = getAccessibleThread;
exports.updateThreadTime = updateThreadTime;
exports.getThreadsByUser = getThreadsByUser;
