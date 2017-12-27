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
const dbConfig = require('../config/defaults/config').databasePopulation;
const errorCreator = require('../objects/error/errorCreator');
const authenticator = require('../helpers/authenticator');
const aliasManager = require('./aliases');
const forumManager = require('./forums');
const threadManager = require('./forumThreads');

/**
 * Get forum post by ID and check if the user has access to it.
 * @param {Object} params - Parameters.
 * @param {Object} params.user - User retrieving the forum post.
 * @param {string} params.postId - ID of the forum post to retrieve.
 * @param {Function} params.callback - Callback.
 * @param {string} [params.errorContentText] - Text to be printed on error.
 * @param {boolean} [params.shouldBeAdmin] - Does the user have to be an admin?
 */
function getAccessiblePost({
  user,
  postId,
  callback,
  shouldBeAdmin,
  errorContentText = `postId ${postId}`,
}) {
  dbPost.getPostById({
    postId,
    callback: (postData) => {
      if (postData.error) {
        callback({ error: postData.error });

        return;
      } else if (!authenticator.hasAccessTo({
        shouldBeAdmin,
        toAuth: user,
        objectToAccess: postData.data.post,
      })) {
        callback({ error: new errorCreator.NotAllowed({ name: errorContentText }) });

        return;
      }

      callback(postData);
    },
  });
}

/**
 * Get forum post by thread that the user has access to.
 * @param {Object} params - Parameters.
 * @param {Object} params.user - User retrieving the forum post.
 * @param {string} params.threadId - ID of the forum thread to get posts for.
 * @param {Function} params.callback - Callback.
 * @param {string} [params.errorContentText] - Text to be printed on error.
 * @param {boolean} [params.shouldBeAdmin] - Does the user have to be an admin?
 */
function getAccessibleThreadPosts({
  user,
  threadId,
  callback,
  shouldBeAdmin,
}) {
  dbPost.getPostsByThread({
    threadId,
    callback: (postsData) => {
      if (postsData.error) {
        callback({ error: postsData.error });

        return;
      }

      const posts = postsData.data.posts.map((post) => {
        return !authenticator.hasAccessTo({
          shouldBeAdmin,
          toAuth: user,
          objectToAccess: post,
        });
      });

      callback({
        data: {
          posts,
        },
      });
    },
  });
}

/**
 * Get forum post by threads that the user has access to.
 * @param {Object} params - Parameters.
 * @param {Object} params.user - User retrieving the forum post.
 * @param {string[]} params.threadIds - ID of the forum threads to get posts for.
 * @param {Function} params.callback - Callback.
 * @param {boolean} [params.shouldBeAdmin] - Does the user have to be an admin?
 */
function getAccessibleThreadsPosts({
  user,
  threadIds,
  callback,
  shouldBeAdmin,
}) {
  dbPost.getPostsByThreads({
    threadIds,
    callback: (forumData) => {
      if (forumData.error) {
        callback({ error: forumData.error });

        return;
      }

      const posts = forumData.data.posts.map((post) => {
        return !authenticator.hasAccessTo({
          shouldBeAdmin,
          toAuth: user,
          objectToAccess: post,
        });
      });

      callback({
        data: {
          posts,
        },
      });
    },
  });
}

/**
 * Create new forum post.
 * @param {Object} params - Parameters.
 * @param {Object} params.post - Forum post to create.
 * @param {Object} params.callback - Callback.
 * @param {Object} params.token - jwt.
 * @param {Object} params.io - Socket.io. Will be used if socket is not set.
 * @param {string} params.threadId - Id of the thread that will get a new post.
 * @param {Object} [params.socket] - Socket.io.
 */
function createPost({
  post,
  callback,
  token,
  io,
  socket,
  threadId,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.CreateForumPost.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const authUser = data.user;

      const postToCreate = post;
      postToCreate.ownerId = authUser.userId;
      postToCreate.threadId = threadId;

      const saveCallback = () => {
        threadManager.getAccessibleThread({
          user: authUser,
          threadId: postToCreate.threadId,
          callback: (threadData) => {
            if (threadData.error) {
              callback({ error: threadData.error });

              return;
            }

            dbPost.createPost({
              post: postToCreate,
              callback: (postData) => {
                if (postData.error) {
                  callback({ error: postData.error });

                  return;
                }

                const createdPost = postData.data.post;

                threadManager.updateThreadTime({
                  threadId: createdPost.threadId,
                  callback: (updateData) => {
                    if (updateData.error) {
                      callback({ error: updateData.error });

                      return;
                    }

                    const dataToSend = {
                      data: {
                        post: createdPost,
                        changeType: dbConfig.ChangeTypes.CREATE,
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
      };

      if (postToCreate.ownerAliasId) {
        aliasManager.getAccessibleAlias({
          user: authUser,
          aliasId: postToCreate.ownerAliasId,
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
 * Update an existing forum post
 * @param {Object} params - Parameters
 * @param {Object} params.post - Forum post to update
 * @param {Object} params.callback - Callback
 * @param {Object} params.token - jwt
 * @param {Object} params.io - Socket.io. Will be used if socket is not set
 * @param {Object} [params.socket] - Socket.io
 */
function updatePost({
  post,
  postId,
  callback,
  token,
  io,
  socket,
  userId,
}) {
  authenticator.isUserAllowed({
    token,
    matchNameTo: userId,
    commandName: dbConfig.apiCommands.UpdateForumPost.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      getAccessiblePost({
        postId,
        user: data.user,
        shouldBeAdmin: true,
        callback: (accessData) => {
          if (accessData.error) {
            callback({ error: accessData.error });

            return;
          }

          dbPost.updatePost({
            post,
            postId,
            callback: (updateData) => {
              if (updateData.error) {
                callback({ error: updateData.error });

                return;
              }

              const dataToSend = {
                data: {
                  post: updateData.data.post,
                  changeType: dbConfig.ChangeTypes.UPDATE,
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

      const authUser = data.user;

      forumManager.getAccessibleForum({
        forumId,
        user: authUser,
        callback: (forumData) => {
          if (forumData.error) {
            callback({ error: forumData.error });

            return;
          }

          threadManager.getAccessibleThreads({
            forumId,
            user: authUser,
            callback: (threadsData) => {
              if (threadsData.error) {
                callback({ error: threadsData.error });

                return;
              }

              const threadIds = threadsData.data.threads.map(thread => thread.threadId);

              getAccessibleThreadsPosts({
                threadIds,
                user: authUser,
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
 * @param {string} params.userId - ID of the user who is removing the forum post.
 * @param {Object} params.io - Socket io. Will be used if socket is not set.
 * @param {Function} params.callback - Callback.
 * @param {Object} [params.socket] - Socket io.
 */
function removePost({
  token,
  postId,
  userId,
  callback,
  socket,
  io,
}) {
  authenticator.isUserAllowed({
    token,
    matchToId: userId,
    commandName: dbConfig.apiCommands.RemoveForumPost,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      getAccessiblePost({
        postId,
        shouldBeAdmin: true,
        user: data.user,
        errorContentText: `remove forum post ${postId}`,
        callback: (forumData) => {
          if (forumData.error) {
            callback({ error: forumData });

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
                  post: { postId },
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
  userId,
  token,
  threadId,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    matchToId: userId,
    commandName: dbConfig.apiCommands.GetForumPost,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const authUser = data.user;

      threadManager.getAccessibleThread({
        threadId,
        user: authUser,
        callback: (threadData) => {
          if (threadData.error) {
            callback({ error: threadData.error });

            return;
          }

          getAccessibleThreadPosts({
            threadId,
            user: authUser,
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
}

/**
 * Get a forum post.
 * @param {Object} params - Parameters.
 * @param {string} params.postId - Id of the post.
 * @param {Function} params.callback - Callback.
 * @param {string} params.token - jwt.
 * @param {string} [params.userId] - Id of the user retrieving a forum post.
 */
function getPostById({
  userId,
  postId,
  callback,
  token,
}) {
  authenticator.isUserAllowed({
    token,
    matchToId: userId,
    commandName: dbConfig.apiCommands.GetForumPost,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user } = data;

      getAccessiblePost({
        user,
        postId,
        callback,
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
