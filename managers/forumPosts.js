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

const dbPost = require('../db/connectors/forumPost');
const { dbConfig } = require('../config/defaults/config');
const errorCreator = require('../error/errorCreator');
const authenticator = require('../helpers/authenticator');
const forumManager = require('./forums');
const threadManager = require('./forumThreads');
const managerHelper = require('../helpers/manager');

/**
 * Get a forum post.
 * @param {Object} params - Parameters.
 * @param {string} params.postId - Id of the post.
 * @param {Function} params.callback - Callback.
 * @param {string} params.token - jwt.
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
 * @param {Object} params - Parameters.
 * @param {Object} params.post - Forum post to create.
 * @param {Object} params.callback - Callback.
 * @param {Object} params.token - jwt.
 * @param {Object} params.io - Socket.io.
 */
function createPost({
  post,
  callback,
  token,
  io,
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

      const postToCreate = post;
      postToCreate.ownerId = authUser.objectId;

      if (postToCreate.ownerAliasId && !authUser.aliases.includes(postToCreate.ownerAliasId)) {
        callback({ error: new errorCreator.NotAllowed({ name: `create forum post with alias ${postToCreate.ownerAliasId}` }) });

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
            callback: (postData) => {
              if (postData.error) {
                callback({ error: postData.error });

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

                  const dataToSend = {
                    data: {
                      post: postData.data.post,
                      changeType: dbConfig.ChangeTypes.CREATE,
                    },
                  };


                  io.emit(dbConfig.EmitTypes.FORUMPOST, dataToSend);

                  callback(dataToSend);
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
 * @param {Object} params - Parameters.
 * @param {Object} params.post - Forum post to update.
 * @param {Object} params.callback - Callback.
 * @param {Object} params.token - jwt.
 * @param {Object} params.io - Socket.io.
 */
function updatePost({
  post,
  postId,
  callback,
  token,
  io,
  options,
  internalCallUser,
}) {
  managerHelper.getObjectById({
    token,
    internalCallUser,
    needsAccess: true,
    objectId: postId,
    objectType: 'post',
    objectIdType: 'postId',
    dbCallFunc: dbPost.getPostById,
    commandName: dbConfig.apiCommands.UpdateForumPost.name,
    callback: ({ error: getError, data: getData }) => {
      if (getError) {
        callback({ error: getError });

        return;
      }

      const { authUser } = getData;

      threadManager.getThreadById({
        token,
        needsAccess: true,
        internalCallUser: authUser,
        threadId: post.threadId,
        callback: ({ error: threadError }) => {
          if (threadError) {
            callback({ error: threadError });

            return;
          }

          managerHelper.updateObject({
            callback,
            options,
            token,
            io,
            internalCallUser: authUser,
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
        },
      });
    },
  });
}

/**
 * Get posts created by the user.
 * @param {Object} params - Parameters.
 * @param {string} params.token - jwt.
 * @param {Function} params.callback - Callback.
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
    commandName: dbConfig.apiCommands.GetPositions.name,
    objectsType: 'posts',
    dbCallFunc: dbPost.getPostsByUser,
  });
}

/**
 * Get forum posts
 * @param {Object} params - Parameters
 * @param {string} params.forumId - ID of the roum
 * @param {Function} params.callback - Callback
 * @param {Object} params.token - jwt
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

      const { user } = data;

      forumManager.getAccessibleForum({
        forumId,
        user,
        callback: (forumData) => {
          if (forumData.error) {
            callback({ error: forumData.error });

            return;
          }

          threadManager.getAccessibleThreads({
            forumId,
            user,
            callback: (threadsData) => {
              if (threadsData.error) {
                callback({ error: threadsData.error });

                return;
              }

              const threadIds = threadsData.data.threads.map(thread => thread.objectId);

              getAccessibleThreadsPosts({
                threadIds,
                user,
                callback: (postsData) => {
                  if (postsData.error) {
                    callback({ error: postsData.error });

                    return;
                  }

                  callback({
                    data: {
                      posts: postsData.data.posts,
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
 * Remove forum post.
 * @param {Object} params - Parameters,.
 * @param {string} params.token - jwt.
 * @param {string} params.postId - ID of the forum ppost.
 * @param {Object} params.io - Socket io. Will be used if socket is not set.
 * @param {Function} params.callback - Callback.
 * @param {Object} [params.socket] - Socket io.
 */
function removePost({
  token,
  postId,
  callback,
  socket,
  io,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.RemoveForumPost.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user } = data;

      getAccessiblePost({
        postId,
        user,
        shouldBeAdmin: true,
        errorContentText: `remove forum post ${postId}`,
        callback: (forumData) => {
          if (forumData.error) {
            callback({ error: forumData.error });

            return;
          }

          dbPost.removePostById({
            postId,
            fullRemoval: true,
            callback: (removeData) => {
              if (removeData.error) {
                callback({ error: removeData.error });

                return;
              }

              const dataToSend = {
                data: {
                  post: { objectId: postId },
                  changeType: dbConfig.ChangeTypes.REMOVE,
                },
              };

              if (socket) {
                socket.broadcast.emit(dbConfig.EmitTypes.FORUMPOST, dataToSend);
              } else {
                io.emit(dbConfig.EmitTypes.FORUMPOST, dataToSend);
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
 * Get posts by thread
 * @param {Object} params - Parameters
 * @param {string} params.threadId - ID of the thread
 * @param {Function} params.callback - Callback
 * @param {Object} params.token - jwt
 */
function getPostsByThread({
  token,
  threadId,
  full,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: full ? dbConfig.apiCommands.GetFull.name : dbConfig.apiCommands.GetForumPost.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user } = data;

      threadManager.getAccessibleThread({
        threadId,
        user,
        callback: (threadData) => {
          if (threadData.error) {
            callback({ error: threadData.error });

            return;
          }

          getAccessibleThreadPosts({
            threadId,
            user,
            full,
            callback: (postsData) => {
              if (postsData.error) {
                callback({ error: postsData.error });

                return;
              }

              callback(postsData);
            },
          });
        },
      });
    },
  });
}

exports.createPost = createPost;
exports.updatePost = updatePost;
exports.removePost = removePost;
exports.getPostsByForum = getPostsByForum;
exports.getPostsByThread = getPostsByThread;
exports.getPostById = getPostById;
exports.getPostsByUser = getPostsByUser;
