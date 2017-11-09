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
const dbForumThread = require('./forumThread');

const ForumObjectTypes = {
  FORUM: 'forum',
  POST: 'post',
  THREAD: 'thread',
};

const forumSchema = new mongoose.Schema(dbConnector.createSchema({
  title: String,
  threadIds: { type: [String], default: [] },
  text: { type: [String], default: [] },
}), { collection: 'forums' });

const Forum = mongoose.model('Forum', forumSchema);

/**
 * Update forum object fields
 * @private
 * @param {Object} params - Parameters
 * @param {string} params.objectId - ID of forum to update
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
    object: Forum,
    query: { _id: objectId },
    errorNameContent: 'updateForum',
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ data: { forum: data.object } });
    },
  });
}

/**
 * Get forums
 * @private
 * @param {Object} params - Parameters
 * @param {Object} params.query - Query to get forums
 * @param {Function} params.callback - Callback
 */
function getForums({ query, callback }) {
  dbConnector.getObjects({
    query,
    object: Forum,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ forums: data.objects });
    },
  });
}

/**
 * Get forum object
 * @private
 * @param {Object} params - Parameters
 * @param {string} params.query - Query to get forum object
 * @param {Function} params.callback - Callback
 */
function getForum({ query, callback }) {
  dbConnector.getObject({
    query,
    object: Forum,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!data.object) {
        callback({ error: new errorCreator.DoesNotExist({ name: `forum ${query.toString()}` }) });

        return;
      }

      callback({ data: { forum: data.object } });
    },
  });
}

/**
 * Does forum exist?
 * @param {Object} params - Parameters
 * @param {string} params.title - Title of the forum
 * @param {Function} params.callback - Callback
 */
function doesForumExist({ title, callback }) {
  dbConnector.doesObjectExist({
    callback,
    query: { title },
    object: Forum,
  });
}

/**
 * Create forum.
 * @param {Object} params - Parameters
 * @param {Object} params.forum - Forum to save
 * @param {Function} params.callback - Callback
 */
function createForum({ forum, callback }) {
  doesForumExist({
    title: forum.title,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (data.exists) {
        callback({ error: new errorCreator.AlreadyExists({ name: `createForum ${forum.title}` }) });

        return;
      }

      dbConnector.saveObject({
        object: new Forum(forum),
        objectType: ForumObjectTypes.FORUM,
        callback: (forumData) => {
          if (forumData.error) {
            callback({ error: forumData.error });

            return;
          }

          callback({ data: { forum: forumData.data.savedObject } });
        },
      });
    },
  });
}

/**
 * Get forum by Id
 * @param {Object} params - Parameters
 * @param {string} params.objectId - ID of the forum
 * @param {Function} params.callback - Callback
 */
function getForumById({ objectId, callback }) {
  getForum({
    callback,
    query: { _id: objectId },
  });
}

/**
 * Get forums by Id
 * @param {Object} params - Parameters
 * @param {string[]} params.forumIds - ID of the forum
 * @param {Function} params.callback - Callback
 */
function getForumsByIds({ forumIds, callback }) {
  getForums({
    callback,
    query: { _id: { $in: forumIds } },
  });
}

/**
 * Get all forums
 * @param {Object} params - Parameters
 * @param {Function} params.callback - Callback
 */
function getAllForums({ callback }) {
  getForums({ callback });
}

/**
 * Update existing forum
 * @param {Object} params - Parameters
 * @param {string} params.objectId - ID of the forum
 * @param {Object} params.forum - Forum updates
 * @param {Function} params.callback - Callback
 */
function updateForum({ objectId, forum, callback }) {
  const update = { $set: {} };

  if (forum.title) {
    update.$set.title = forum.title;

    doesForumExist({
      title: forum.title,
      callback: ({ error, data }) => {
        if (error) {
          callback({ error });

          return;
        } else if (data.exists) {
          callback({ error: new errorCreator.AlreadyExists({ name: `forum title ${forum.title}` }) });

          return;
        }

        updateObject({
          update,
          objectId,
          callback,
        });
      },
    });

    return;
  }

  updateObject({
    update,
    objectId,
    callback,
  });
}

/**
 * Remove forum.
 * Setting fullRemoval will also remove all connected forum threads and posts.
 * @param {Object} params - Parameters
 * @param {string[]} params.objectId - ID of forum to remove
 * @param {boolean} params.fullRemoval - Should connected forum threads and posts be removed?
 * @param {Function} params.callback - Callback
 */
function removeForum({ objectId, fullRemoval, callback }) {
  dbConnector.removeObjects({
    object: Forum,
    query: { _id: objectId },
    callback: ({ error }) => {
      if (error) {
        callback({ error: new errorCreator.Database({ errorObject: error, name: 'removeForum' }) });

        return;
      }

      if (fullRemoval) {
        dbForumThread.getThreadsByForum({
          objectId,
          callback: (threadsData) => {
            if (threadsData.error) {
              callback({ error: threadsData.error });

              return;
            }

            dbForumThread.removeThreads({
              callback,
              threadIds: threadsData.data.threads.map(forumThread => forumThread.objectId),
              fullRemoval: true,
            });
          },
        });

        return;
      }

      callback({ data: { success: true } });
    },
  });
}

/**
 * Add access to forum
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
    object: Forum,
  });
}

/**
 * Remove access to forum
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
    object: Forum,
  });
}

exports.createForum = createForum;
exports.getForumById = getForumById;
exports.getForumById = getForumById;
exports.updateForum = updateForum;
exports.getAllForums = getAllForums;
exports.getForumsByIds = getForumsByIds;
exports.removeForum = removeForum;
exports.addAccess = addAccess;
exports.removeAccess = removeAccess;
