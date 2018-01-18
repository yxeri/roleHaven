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

const forumPostSchema = new mongoose.Schema(dbConnector.createSchema({
  threadId: String,
  parentPostId: String,
  text: { type: [String], default: [] },
  depth: { type: Number, default: 0 },
}), { collection: 'forumPosts' });

const ForumPost = mongoose.model('ForumPost', forumPostSchema);

const postFilter = {
  ownerId: 1,
  ownerAliasId: 1,
  threadId: 1,
  parentPostId: 1,
  text: 1,
  depth: 1,
  lastUpdated: 1,
  timeCreated: 1,
  customLastUpdated: 1,
  customTimeCreated: 1,
};

/**
 * Get forum posts
 * @private
 * @param {Object} params - Parameters
 * @param {Object} params.query - Query to get doc files
 * @param {Function} params.callback - Callback
 */
function getPosts({
  query,
  callback,
  filter = {},
}) {
  dbConnector.getObjects({
    query,
    filter,
    object: ForumPost,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({
        data: {
          posts: data.objects,
        },
      });
    },
  });
}

/**
 * Get forum post
 * @private
 * @param {Object} params - Parameters
 * @param {string} params.query - Query to get forum object
 * @param {Function} params.callback - Callback
 */
function getPost({
  query,
  callback,
  filter,
}) {
  dbConnector.getObject({
    query,
    filter,
    object: ForumPost,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!data.object) {
        callback({ error: new errorCreator.DoesNotExist({ name: `forumPost ${query.toString()}` }) });

        return;
      }

      callback({ data: { post: data.object } });
    },
  });
}

/**
 * Update forum post
 * @private
 * @param {Object} params - Parameters
 * @param {string} params.postId - ID of forum post to update
 * @param {Object} params.update - Update
 * @param {Function} params.callback Callback
 */
function updateObject({
  postId,
  update,
  callback,
}) {
  dbConnector.updateObject({
    update,
    object: ForumPost,
    query: { _id: postId },
    errorNameContent: 'updateForumPost',
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ data: { post: data.object } });
    },
  });
}

/**
 * Create forum post.
 * @param {Object} params - Parameters
 * @param {Object} params.post - Forum post to save
 * @param {Function} params.callback - Callback
 */
function createPost({ post, callback }) {
  const forumPostToSave = post;
  const parentPostIsSet = typeof forumPostToSave.parentPostId !== 'undefined';

  if (parentPostIsSet) {
    forumPostToSave.depth = 1;
  }

  const savePost = (saveForumPostCallback) => {
    dbForumThread.getThreadById({
      threadId: forumPostToSave.threadId,
      callback: (threadData) => {
        if (threadData.error) {
          callback({ error: threadData.error });

          return;
        }

        const foundThread = threadData.data.thread;

        forumPostToSave.adminIds = post.adminIds ? post.adminIds : foundThread.adminIds;
        forumPostToSave.userIds = post.userIds ? post.userIds : foundThread.userIds;
        forumPostToSave.teamIds = post.teamIds ? post.teamIds : foundThread.teamIds;

        dbConnector.saveObject({
          object: new ForumPost(forumPostToSave),
          objectType: ForumPost,
          callback: ({ error: saveError, data: saveData }) => {
            if (saveError) {
              saveForumPostCallback({ error: new errorCreator.Database({ errorObject: saveError, name: 'createPost' }) });

              return;
            }

            callback({ data: { post: saveData.savedObject } });
          },
        });
      },
    });
  };

  if (parentPostIsSet) {
    getPost({
      query: { _id: forumPostToSave.parentPostId },
      callback: (forumData) => {
        const foundPost = forumData.data.post;

        if (forumData.error) {
          callback({ error: forumData.error });

          return;
        } else if (foundPost.depth > 0) {
          callback({ error: new errorCreator.Incorrect({ name: `forumPost ${foundPost.objectId} depth ${foundPost.depth}` }) });

          return;
        }

        forumPostToSave.adminIds = post.adminIds ? post.adminIds : foundPost.adminIds;
        forumPostToSave.userIds = post.userIds ? post.userIds : foundPost.userIds;
        forumPostToSave.teamIds = post.teamIds ? post.teamIds : foundPost.teamIds;

        savePost(callback);
      },
    });

    return;
  }

  savePost(callback);
}

/**
 * Get forum post
 * @param {Object} params - Parameters
 * @param {string} params.postId - ID of the forum post
 * @param {Function} params.callback - Callback
 */
function getPostById({ postId, callback }) {
  getPost({
    callback,
    query: { _id: postId },
  });
}

/**
 * Get forum posts by their IDs
 * @param {Object} params - Parameters
 * @param {string} params.postIds - ID of the forum posts
 * @param {Function} params.callback - Callback
 */
function getPostsById({ postIds, callback }) {
  getPosts({
    callback,
    query: { _id: { $in: postIds } },
  });
}

/**
 * Get forum posts by thread ids
 * @param {Object} params - Parameters
 * @param {string} params.threadIds - ID of the threads
 * @param {Function} params.callback - Callback
 */
function getPostsByThreads({
  threadIds,
  full,
  callback,
}) {
  const filter = !full ? postFilter : {};

  getPosts({
    callback,
    filter,
    query: { threadId: { $in: threadIds } },
  });
}

/**
 * Get forum posts by thread Id.
 * @param {Object} params - Parameters.
 * @param {string} params.threadId - Id of the thread.
 * @param {Function} params.callback - Callback.
 */
function getPostsByThread({
  full,
  threadId,
  callback,
}) {
  const filter = !full ? postFilter : {};

  getPosts({
    callback,
    filter,
    query: { threadId },
  });
}

/**
 * Get posts created by the user.
 * @param {Object} params - Parameters.
 * @param {string} params.userId - Id of the user.
 * @param {Function} params.callback - Callback.
 * @param {boolean} [params.full] - Should the complete objects be returned?
 */
function getPostsCreatedByUser({
  userId,
  callback,
  full,
}) {
  const filter = !full ? postFilter : {};

  getPosts({
    filter,
    callback,
    query: { ownerId: userId },
  });
}

/**
 * Update existing forum post
 * @param {Object} params - Parameters
 * @param {string} params.postId - ID of the thread
 * @param {Object} params.post - Forum post updates
 * @param {Object} [params.options] - Options
 * @param {Object} params.options.resetOwnerAliasId - Should ownerAliasId be removed?
 * @param {Function} params.callback - Callback
 */
function updatePost({
  postId,
  post,
  callback,
  options = {},
}) {
  const update = { $set: {} };

  if (options.resetOwnerAliasId) {
    update.$unset = { ownerAliasId: '' };
  } else if (post.ownerAliasId) {
    update.$set.ownerAliasId = post.ownerAliasId;
  }

  if (post.text) { update.$set.text = post.text; }

  updateObject({
    update,
    postId,
    callback,
  });
}

/**
 * Remove forum posts.
 * @param {Object} params - Parameters
 * @param {string[]} params.postIds - IDs of forums posts to remove
 * @param {Function} params.callback - Callback
 */
function removePostsByIds({ postIds, callback }) {
  dbConnector.removeObjects({
    callback,
    object: ForumPost,
    query: { _id: { $in: postIds } },
  });
}

/**
 * Remove forum post.
 * @param {Object} params - Parameters
 * @param {string[]} params.postId - ID of forum post to remove
 * @param {Function} params.callback - Callback
 */
function removePostById({ postId, callback }) {
  dbConnector.removeObject({
    callback,
    object: ForumPost,
    query: { _id: postId },
  });
}

/**
 * Remove forum posts by thread ids.
 * @param {Object} params - Parameters
 * @param {string[]} params.threadIds - IDs of forums threads
 * @param {Function} params.callback - Callback
 */
function removePostsByThreadIds({ threadIds, callback }) {
  dbConnector.removeObjects({
    callback,
    object: ForumPost,
    query: { threadId: { $in: threadIds } },
  });
}

/**
 * Remove forum posts by thread id.
 * @param {Object} params - Parameters
 * @param {string} params.threadId - ID of forum thread
 * @param {Function} params.callback - Callback
 */
function removePostsByThreadId({ threadId, callback }) {
  dbConnector.removeObjects({
    callback,
    object: ForumPost,
    query: { threadId },
  });
}

/**
 * Add access to post
 * @param {Object} params - Parameters
 * @param {string} params.postId - ID of the team
 * @param {string[]} [params.userIds] - ID of the users
 * @param {string[]} [params.teamIds] - ID of the teams
 * @param {string[]} [params.bannedIds] - Blocked ids
 * @param {string[]} [params.teamAdminIds] - Id of the teams to give admin access to. They will also be added to teamIds.
 * @param {string[]} [params.userAdminIds] - Id of the users to give admin access to. They will also be added to userIds.
 * @param {Function} params.callback - Callback
 */
function addAccess({
  postId,
  userIds,
  teamIds,
  bannedIds,
  teamAdminIds,
  userAdminIds,
  callback,
}) {
  dbConnector.addObjectAccess({
    userIds,
    teamIds,
    bannedIds,
    teamAdminIds,
    userAdminIds,
    objectId: postId,
    object: ForumPost,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ data: { post: data.object } });
    },
  });
}

/**
 * Remove access to post.
 * @param {Object} params - Parameters.
 * @param {string} params.postId - Id of the post.
 * @param {string[]} params.teamIds - Id of the teams.
 * @param {string[]} [params.userIds] - Id of the user.
 * @param {string[]} [params.bannedIds] - Blocked Ids.
 * @param {string[]} [params.teamAdminIds] - Id of the teams to remove admin access from. They will not be removed from teamIds.
 * @param {string[]} [params.userAdminIds] - Id of the users to remove admin access from. They will not be removed from userIds.
 * @param {Function} params.callback - Callback
 */
function removeAccess({
  postId,
  userIds,
  teamIds,
  bannedIds,
  teamAdminIds,
  userAdminIds,
  callback,
}) {
  dbConnector.removeObjectAccess({
    userIds,
    teamIds,
    bannedIds,
    teamAdminIds,
    userAdminIds,
    objectId: postId,
    object: ForumPost,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ data: { post: data.object } });
    },
  });
}

exports.getPostsByThreads = getPostsByThreads;
exports.createPost = createPost;
exports.getPostById = getPostById;
exports.removePostsByIds = removePostsByIds;
exports.getPostsById = getPostsById;
exports.updatePost = updatePost;
exports.removePostsByThreadIds = removePostsByThreadIds;
exports.addAccess = addAccess;
exports.removeAccess = removeAccess;
exports.removePostById = removePostById;
exports.getPostsByThread = getPostsByThread;
exports.removePostsByThreadId = removePostsByThreadId;
exports.getPostsCreatedByUser = getPostsCreatedByUser;
