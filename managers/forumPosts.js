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

const dbPost = require('../db/connectors/forumPost');
const { appConfig, dbConfig } = require('../config/defaults/config');
const errorCreator = require('../error/errorCreator');
const authenticator = require('../helpers/authenticator');
const forumManager = require('./forums');
const threadManager = require('./forumThreads');
const managerHelper = require('../helpers/manager');

/**
 * Get a forum post.
 * @param {Object} params Parameters.
 * @param {string} params.postId Id of the post.
 * @param {Function} params.callback Callback.
 * @param {string} params.token jwt.
 */
function getPostById({
  postId,
  callback,
  token,
  internalCallUser,
  needsAccess,
}) {
  managerHelper.getObjectById({
    token,
    internalCallUser,
    callback,
    needsAccess,
    objectId: postId,
    objectType: 'post',
    objectIdType: 'postId',
    dbCallFunc: dbPost.getPostById,
    commandName: dbConfig.apiCommands.GetForumPost.name,
  });
}

/**
 * Create new forum post.
 * @param {Object} params Parameters.
 * @param {Object} params.post Forum post to create.
 * @param {Object} params.callback Callback.
 * @param {Object} params.token jwt.
 * @param {Object} params.io Socket.io.
 */
function createPost({
  post,
  callback,
  token,
  io,
  socket,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.CreateForumPost.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user: authUser } = data;

      if (post.text && post.text.join('').length > appConfig.forumPostMaxLength) {
        callback({
          error: new errorCreator.InvalidLength({
            expected: `Text length: ${appConfig.forumPostMaxLength}.`,
            extraData: { paramName: 'text' },
          }),
        });

        return;
      }

      const postToCreate = post;
      postToCreate.ownerId = authUser.objectId;

      const aliasAccess = authenticator.checkAliasAccess({ object: postToCreate, user: authUser, text: dbConfig.apiCommands.CreateForumPost.name });

      if (aliasAccess.error) {
        callback({ error: aliasAccess.error });

        return;
      }

      threadManager.getThreadById({
        token,
        needsAccess: true,
        threadId: postToCreate.threadId,
        internalCallUser: authUser,
        callback: ({ error: threadError, data: threadData }) => {
          if (threadError) {
            callback({ error: threadError });

            return;
          }

          const { thread } = threadData;

          dbPost.createPost({
            post: postToCreate,
            callback: ({ error: postError, data: postData }) => {
              if (postError) {
                callback({ error: postError });

                return;
              }

              threadManager.updateThreadTime({
                forumId: thread.forumId,
                threadId: postToCreate.threadId,
                callback: ({ error: updateError }) => {
                  if (updateError) {
                    callback({ error: updateError });

                    return;
                  }

                  const { post: createdPost } = postData;
                  const dataToSend = {
                    data: {
                      post: managerHelper.stripObject({ object: { ...createdPost } }),
                      changeType: dbConfig.ChangeTypes.CREATE,
                    },
                  };

                  if (socket) {
                    socket.broadcast.emit(dbConfig.EmitTypes.FORUMPOST, dataToSend);
                  } else {
                    io.emit(dbConfig.EmitTypes.FORUMPOST, dataToSend);
                    io.to(createdPost.ownerAliasId || authUser.objectId).emit(dbConfig.EmitTypes.FORUMPOST, {
                      data: {
                        post: createdPost,
                        changeType: dbConfig.ChangeTypes.UPDATE,
                      },
                    });
                  }

                  callback({
                    data: {
                      post: createdPost,
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
 * Update an existing forum post.
 * @param {Object} params Parameters.
 * @param {Object} params.post Forum post to update.
 * @param {Object} params.callback Callback.
 * @param {Object} params.token jwt.
 * @param {Object} params.io Socket.io.
 */
function updatePost({
  post,
  postId,
  callback,
  token,
  io,
  options,
  internalCallUser,
  socket,
}) {
  if (post.text && post.text.join('').length > appConfig.forumPostMaxLength) {
    callback({
      error: new errorCreator.InvalidLength({
        expected: `Text length: ${appConfig.forumPostMaxLength}.`,
        extraData: { param: 'text' },
      }),
    });

    return;
  }

  managerHelper.updateObject({
    callback,
    options,
    token,
    io,
    internalCallUser,
    socket,
    objectId: postId,
    object: post,
    commandName: dbConfig.apiCommands.UpdateForumPost.name,
    objectType: 'post',
    dbCallFunc: dbPost.updatePost,
    emitType: dbConfig.EmitTypes.FORUMPOST,
    objectIdType: 'postId',
    getDbCallFunc: dbPost.getPostById,
    getCommandName: dbConfig.apiCommands.GetForumPost.name,
  });
}

/**
 * Get posts created by the user.
 * @param {Object} params Parameters.
 * @param {string} params.token jwt.
 * @param {Function} params.callback Callback.
 */
function getPostsByUser({
  token,
  callback,
}) {
  managerHelper.getObjects({
    callback,
    token,
    shouldSort: true,
    sortName: 'customLastUpdated',
    fallbackSortName: 'lastUpdated',
    commandName: dbConfig.apiCommands.GetForumPost.name,
    objectsType: 'posts',
    dbCallFunc: dbPost.getPostsByUser,
  });
}

/**
 * Get posts by thread.
 * @param {Object} params Parameters.
 * @param {Function} params.callback Callback.
 * @param {Object} params.token jwt.
 */
function getPostsByThreads({
  token,
  callback,
  internalCallUser,
  threadIds = [],
}) {
  managerHelper.getObjects({
    callback,
    token,
    internalCallUser,
    getParams: [threadIds],
    shouldSort: true,
    sortName: 'customLastUpdated',
    fallbackSortName: 'lastUpdated',
    commandName: dbConfig.apiCommands.GetForumPost.name,
    objectsType: 'posts',
    dbCallFunc: dbPost.getPostsByThreads,
  });
}

/**
 * Get forum posts
 * @param {Object} params Parameters
 * @param {string} params.forumId ID of the roum
 * @param {Function} params.callback Callback
 * @param {Object} params.token jwt
 */
function getPostsByForum({ forumId, callback, token }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetForumPost.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user: authUser } = data;

      forumManager.getForumById({
        forumId,
        needsAccess: true,
        user: authUser,
        callback: ({ error: forumError }) => {
          if (forumError) {
            callback({ error: forumError });

            return;
          }

          threadManager.getForumThreadsByForum({
            forumId,
            token,
            internalCallUser: authUser,
            callback: ({ error: threadsError, data: threadsData }) => {
              if (threadsError) {
                callback({ error: threadsError });

                return;
              }

              const { threads } = threadsData;
              const threadIds = threads.map((thread) => thread.objectId);

              getPostsByThreads({
                threadIds,
                callback,
                internalCallUser: authUser,
              });
            },
          });
        },
      });
    },
  });
}

/**
 * Remove forum post.
 * @param {Object} params Parameters,.
 * @param {string} params.token jwt.
 * @param {string} params.postId ID of the forum ppost.
 * @param {Object} params.io Socket io.
 * @param {Function} params.callback Callback.
 */
function removePost({
  token,
  postId,
  callback,
  io,
  socket,
}) {
  managerHelper.removeObject({
    callback,
    token,
    io,
    socket,
    getDbCallFunc: dbPost.getPostById,
    getCommandName: dbConfig.apiCommands.GetForumPost.name,
    objectId: postId,
    commandName: dbConfig.apiCommands.RemoveForumPost.name,
    objectType: 'post',
    dbCallFunc: dbPost.removePostById,
    emitType: dbConfig.EmitTypes.FORUMPOST,
    objectIdType: 'postId',
  });
}

exports.createPost = createPost;
exports.updatePost = updatePost;
exports.removePost = removePost;
exports.getPostsByForum = getPostsByForum;
exports.getPostsByThreads = getPostsByThreads;
exports.getPostById = getPostById;
exports.getPostsByUser = getPostsByUser;
