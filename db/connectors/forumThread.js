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

const mongoose = require('mongoose');
const errorCreator = require('../../objects/error/errorCreator');
const dbConnector = require('../databaseConnector');
const dbForum = require('./forum');
const dbForumPost = require('./forumPost');

const forumThreadSchema = new mongoose.Schema(dbConnector.createSchema({
  forumId: String,
  title: String,
  text: { type: [String], default: [] },
  postIds: { type: [String], default: [] },
}), { collection: 'forumThreads' });

const ForumThread = mongoose.model('ForumThread', forumThreadSchema);

/**
 * Get forum threads
 * @private
 * @param {Object} params - Parameters
 * @param {Object} params.query - Query to get doc files
 * @param {Function} params.callback - Callback
 */
function getThreads({ query, callback }) {
  dbConnector.getObjects({
    query,
    object: ForumThread,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ threads: data.objects });
    },
  });
}

/**
 * Get forum thread
 * @private
 * @param {Object} params - Parameters
 * @param {string} params.query - Query to get forum object
 * @param {Function} params.callback - Callback
 */
function getThread({ query, callback }) {
  dbConnector.getObject({
    query,
    object: ForumThread,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!data.object) {
        callback({ error: new errorCreator.DoesNotExist({ name: `forumThread ${query.toString()}` }) });

        return;
      }

      callback({ data: { thread: data.object } });
    },
  });
}

/**
 * Update forum object fields
 * @private
 * @param {Object} params - Parameters
 * @param {string} params.objectId - ID of forum object to update
 * @param {Object} params.update - Update
 * @param {Function} params.callback Callback
 */
function updateObject({
  objectId,
  update,
  callback,
}) {
  dbConnector.updateObject({
    update,
    object: ForumThread,
    query: { _id: objectId },
    errorNameContent: 'updatePost',
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ data: { forumObject: data.object } });
    },
  });
}

/**
 * Create thread.
 * @param {Object} params - Parameters
 * @param {Object} params.thread - Forum thread to save
 * @param {Function} params.callback - Callback
 */
function createThread({ thread, callback }) {
  dbForum.getForumById({
    query: { _id: thread.forumId },
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!data.forum) {
        callback({ error: errorCreator.DoesNotExist({ name: `forum ID ${thread.forumId}` }) });

        return;
      }

      dbConnector.saveObject({
        object: new ForumThread(thread),
        objectType: 'ForumThread',
        callback: (threadData) => {
          if (threadData.error) {
            callback({ error: threadData.error });

            return;
          }

          callback({ data: { thread: threadData.data.savedObject } });
        },
      });
    },
  });
}

/**
 * Get forum thread
 * @param {Object} params - Parameters
 * @param {string} params.objectId - ID of the thread
 * @param {Function} params.callback - Callback
 */
function getThreadById({ objectId, callback }) {
  getThread({
    callback,
    query: { _id: objectId },
  });
}

/**
 * Get threads by forum
 * @param {Object} params - Parameters
 * @param {string} params.forumId - ID of the forum
 * @param {Function} params.callback - Callback
 */
function getThreadsByForum({ forumId, callback }) {
  getThreads({
    callback,
    query: { forumId },
  });
}

/**
 * Get threads by forums
 * @param {Object} params - Parameters
 * @param {string[]} params.forumIds - ID of the forums
 * @param {Function} params.callback - Callback
 */
function getThreadsByForums({ forumIds, callback }) {
  getThreads({
    callback,
    query: { forumId: { $in: forumIds } },
  });
}

/**
 * Update existing forum thread
 * @param {Object} params - Parameters
 * @param {string} params.objectId - ID of the thread
 * @param {Object} params.thread - Thread updates
 * @param {Object} [params.options] - Options
 * @param {Object} params.options.resetOwnerAliasId - Should ownerAliasId be removed?
 * @param {Function} params.callback - Callback
 */
function updateThread({
  objectId,
  thread,
  callback,
  options,
}) {
  const update = { $set: {} };

  if (thread.forumId) { update.$set.forumId = thread.forumId; }
  if (thread.title) { update.$set.title = thread.title; }
  if (thread.text) { update.$set.text = thread.text; }

  if (options.resetOwnerAliasId) {
    update.$unset = { ownerAliasId: '' };
  } else if (thread.ownerAliasId) {
    update.$set.ownerAliasId = thread.ownerAliasId;
  }

  updateObject({
    update,
    objectId,
    callback,
  });
}

/**
 * Remove forum threads.
 * Setting fullRemoval will also remove all connected forum posts.
 * @param {Object} params - Parameters
 * @param {string[]} params.threadIds - IDs of forums threads to remove
 * @param {boolean} [params.fullRemoval] - Should connected forum posts be removed?
 * @param {Function} params.callback - Callback
 */
function removeThreads({ threadIds, fullRemoval, callback }) {
  dbConnector.removeObject({
    object: ForumThread,
    query: { _id: { $in: threadIds } },
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      if (fullRemoval) {
        dbForumPost.removePostsByThreadIds({
          threadIds,
          callback,
        });

        return;
      }

      callback({ data: { success: true } });
    },
  });
}

/**
 * Remove forum threads by forum.
 * Setting fullRemoval will also remove all connected forum posts.
 * @param {Object} params - Parameters
 * @param {string[]} params.forumId - ID of forum
 * @param {boolean} [params.fullRemoval] - Should connected forum posts be removed?
 * @param {Function} params.callback - Callback
 */
function removeThreadsByForum({ forumId, fullRemoval, callback }) {
  const removeFunc = () => {
    dbConnector.removeObject({
      callback,
      object: ForumThread,
      query: { forumId },
    });
  };

  if (fullRemoval) {
    getThreads({
      query: { forumId },
      callback: (threadsData) => {
        if (threadsData.error) {
          callback({ error: threadsData.error });

          return;
        }

        dbForumPost.removePostsByThreadIds({
          threadIds: threadsData.data.threads.map(thread => thread.objectId),
          callback: ({ error }) => {
            if (error) {
              callback({ error });

              return;
            }

            removeFunc();
          },
        });
      },
    });

    return;
  }

  removeFunc();
}

/**
 * Add access to thread
 * @param {Object} params - Parameters
 * @param {string} params.objectId - ID of the team
 * @param {string[]} [params.userIds] - ID of the users
 * @param {string[]} [params.teamIds] - ID of the teams
 * @param {string[]} [params.blockedIds] - Blocked ids
 * @param {boolean} [params.isAdmin] - Should the users be added to admins?
 * @param {Function} params.callback - Callback
 */
function addAccess({
  objectId,
  userIds,
  teamIds,
  blockedIds,
  isAdmin,
  callback,
}) {
  if (!userIds && !teamIds && !blockedIds) {
    callback({ error: new errorCreator.InvalidData({ expected: 'teamIds || userIds || blockedIds' }) });

    return;
  }

  dbConnector.addObjectAccess({
    objectId,
    userIds,
    teamIds,
    blockedIds,
    isAdmin,
    callback,
    object: ForumThread,
  });
}

/**
 * Remove access to thread
 * @param {Object} params - Parameters
 * @param {string} params.objectId - ID of the team
 * @param {string[]} params.teamIds - ID of the teams
 * @param {string[]} [params.userIds] - ID of the user
 * @param {string[]} [params.blockedIds] - Blocked ids
 * @param {boolean} [params.isAdmin] - Should the teams and/or users be removed from admins?
 * @param {Function} params.callback - Callback
 */
function removeAccess({
  objectId,
  userIds,
  teamIds,
  blockedIds,
  isAdmin,
  callback,
}) {
  if (!userIds && !teamIds && !blockedIds) {
    callback({ error: new errorCreator.InvalidData({ expected: 'teamIds || userIds || blockedIds' }) });

    return;
  }

  dbConnector.removeObjectAccess({
    objectId,
    userIds,
    teamIds,
    blockedIds,
    callback,
    isAdmin,
    object: ForumThread,
  });
}

exports.createThread = createThread;
exports.getThreadById = getThreadById;
exports.getThreadsByForum = getThreadsByForum;
exports.getThreadsByForums = getThreadsByForums;
exports.removeThreads = removeThreads;
exports.updateThread = updateThread;
exports.removeThreadsByForum = removeThreadsByForum;
exports.addAccess = addAccess;
exports.removeAccess = removeAccess;
