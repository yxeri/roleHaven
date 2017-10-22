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
const errorCreator = require('../objects/error/errorCreator');
const authenticator = require('../helpers/authenticator');

/**
 * Create new forum thread
 * @param {Object} params - Parameters
 * @param {Object} params.thread - Forum thread to create
 * @param {Object} params.callback - Callback
 * @param {Object} params.token - jwt
 * @param {Object} params.io - Socket.io. Will be used if socket is not set
 * @param {Object} params.socket - Socket.io
 */
function createThread({ thread, callback, token, io, socket }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.CreateForum.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const authUser = data.user;
      const authId = authUser.userName;

      const forumThreadToCreate = thread;
      forumThreadToCreate.ownerId = authId;

      const saveCallback = () => {
        dbForum.createThread({
          thread: forumThreadToCreate,
          callback: (postData) => {
            if (postData.error) {
              callback({ error: postData.error });

              return;
            }

            const payload = { data: { thread: postData.data.thread } };

            callback(payload);

            if (socket) {
              socket.broadcast.emit('forumThread', payload);
            } else {
              io.emit('forumThread', payload);
            }
          },
        });
      };

      if (thread.ownerAliasId) {
        if (authUser.aliases.includes(thread.ownerAliasId)) {
          callback({ error: new errorCreator.NotAllowed({ name: `alias ${thread.ownerAliasId}` }) });

          return;
        }

        saveCallback();
      } else {
        saveCallback();
      }
    },
  });
}

/**
 * Create new forum post
 * @param {Object} params - Parameters
 * @param {Object} params.forumPost - Forum post to create
 * @param {Object} params.callback - Callback
 * @param {Object} params.token - jwt
 * @param {Object} params.io - Socket.io. Will be used if socket is not set
 * @param {Object} params.socket - Socket.io
 */
function createPost({ post, callback, token, io, socket }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.CreateForumPost.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const authUser = data.user;
      const authId = authUser.userName;

      const forumPostToCreate = post;
      forumPostToCreate.ownerId = authId;

      const saveCallback = () => {
        dbForum.createForumPost({
          post: forumPostToCreate,
          callback: (postData) => {
            if (postData.error) {
              callback({ error: postData.error });

              return;
            }

            const payload = { data: { post: postData.data.post } };

            callback(payload);

            if (socket) {
              socket.broadcast.emit('post', payload);
            } else {
              io.emit('post', payload);
            }
          },
        });
      };

      if (post.ownerAliasId) {
        if (authUser.aliases.includes(post.ownerAliasId)) {
          callback({ error: new errorCreator.NotAllowed({ name: `alias ${post.ownerAliasId}` }) });

          return;
        }

        saveCallback();
      } else {
        saveCallback();
      }
    },
  });
}

/**
 * Create new forum
 * @param {Object} params - Parameters
 * @param {Object} params.forum - Forum to create
 * @param {Object} params.callback - Callback
 * @param {Object} params.token - jwt
 * @param {Object} params.io - Socket.io. Will be used if socket is not set
 * @param {Object} params.socket - Socket.io
 */
function createForum({ forum, callback, token, io, socket }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.CreateForum.name,
    callback: ({ error, data }) => {
      if (error) {
        console.log(error);
        callback({ error });

        return;
      }

      const authUser = data.user;
      const authId = authUser.userName;

      const forumToCreate = forum;
      forumToCreate.ownerId = authId;

      const saveCallback = () => {
        dbForum.createForum({
          forum: forumToCreate,
          callback: (forumData) => {
            if (forumData.error) {
              callback({ error: forumData.error });

              return;
            }

            const payload = { data: { forum: forumData.data.forum } };

            callback(payload);

            if (socket) {
              socket.broadcast.emit('forum', payload);
            } else {
              io.emit('forum', payload);
            }
          },
        });
      };

      if (forum.ownerAliasId) {
        if (authUser.aliases.includes(forum.ownerAliasId)) {
          callback({ error: new errorCreator.NotAllowed({ name: `alias ${forum.ownerAliasId}` }) });

          return;
        }

        saveCallback();
      } else {
        saveCallback();
      }
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
 * @param {Object} params.socket - Socket.io
 */
function updatePost({ post, postId, callback, token, io, socket, userId }) {
  authenticator.isUserAllowed({
    token,
    matchNameTo: userId,
    commandName: dbConfig.apiCommands.CreateForumPost.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const authUser = data.user;
      const authId = authUser.userName;

      dbForum.getForumPost({
        postId,
        callback: (postData) => {
          if (postData.error) {
            callback({ error: postData.error });

            return;
          }

          const foundPost = postData.data.post;

          if (foundPost.ownerId !== authId && !foundPost.adminIds.includes(authId)) {
            callback({ error: new errorCreator.NotAllowed({ name: `forum post ${postId}` }) });

            return;
          }

          dbForum.updateForumPost({
            post,
            postId,
            callback: (updateData) => {
              if (updateData.error) {
                callback({ error: updateData.error });

                return;
              }

              const payload = { data: { post: updateData.data.post } };

              callback(payload);

              if (socket) {
                socket.broadcast.emit('forumPost', payload);
              } else {
                io.emit('forumPost', payload);
              }
            },
          });
        },
      });
    },
  });
}

/**
 * Get all forums
 * @param {Object} params - Parameters
 * @param {Function} params.callback - Callback
 * @param {string} params.token - jwt
 */
function getAllForums({ callback, token }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetForum.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const authUser = data.user;
      const authId = authUser.userName;

      dbForum.getAllForums({
        callback: (forumsData) => {
          if (forumsData.error) {
            callback({ error: forumsData.error });

            return;
          }

          const filteredForums = forumsData.data.forums.filter(forum => forum.isPublic || forum.userIds.concat([forum.ownerId]).includes(authId));

          callback({ data: { forums: filteredForums } });
        },
      });
    },
  });
}

/**
 * Get forum and threads for forum Id
 * @param {Object} params - Parameters
 * @param {string} params.forumId - ID of the forum
 * @param {Function} params.callback - Callback
 * @param {string} params.token - jwt
 */
function getForumBase({ forumId, callback, token }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetForum.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const authUser = data.user;
      const authId = authUser.userName;

      dbForum.getForumById({
        forumId,
        callback: (forumData) => {
          if (forumData.error) {
            callback({ error: forumData.error });

            return;
          }

          const forum = forumData.data.forum;

          if (!forum.isPublic && !forum.userIds.concat(forumData.teamIds).concat([forum.ownerId]).includes(authId)) {
            callback({ error: new errorCreator.NotAllowed({ name: `forum ${forumId}` }) });

            return;
          }

          dbForum.getThreadsByForum({
            forumId,
            callback: (threadsData) => {
              if (threadsData.error) {
                callback({ error: threadsData.error });

                return;
              }

              const threads = threadsData.data.threads.filter(thread => thread.isPublic || (thread.userIds.concat([thread.ownerId]).includes(authId)));

              callback({ data: { forum, threads } });
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
function getForumPostsByForum({ forumId, callback, token }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetForum.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const authUser = data.user;
      const authId = authUser.userName;

      dbForum.getForumById({
        forumId,
        callback: (forumData) => {
          if (forumData.error) {
            callback({ error: forumData.error });

            return;
          }

          const forum = forumData.data.forum;

          if (forum.isPublic || (forum.userIds.concat([forum.ownerId]).includes(authId))) {
            callback({ error: new errorCreator.NotAllowed({ name: `forum ${forumId}` }) });

            return;
          }

          dbForum.getThreadsByForum({
            forumId,
            callback: (threadsData) => {
              if (threadsData.error) {
                callback({ error: threadsData.error });

                return;
              }

              const threadIds = threadsData.data.threads.filter(thread => thread.isPublic || (thread.userIds.concat([thread.ownerId]).includes(authId))).map(thread => thread.threadId);

              dbForum.getForumPostsByThreads({
                threadIds,
                callback: (postsData) => {
                  if (postsData.error) {
                    callback({ error: postsData.error });

                    return;
                  }

                  callback({ data: { posts: postsData.data.posts } });
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
 * Get forum threads by forum
 * @param {Object} params - Parameters
 * @param {string[]} params.forumId - ID of the forum
 * @param {Function} params.callback - Callback
 * @param {string} params.token - jt
 */
function getForumThreadsByForum({ forumId, callback, token }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetForum.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const authUser = data.user;
      const authId = authUser.userName;

      dbForum.getForumById({
        forumId,
        callback: (forumData) => {
          if (forumData.error) {
            callback({ error: forumData.error });

            return;
          }

          const forum = forumData.data.forum;

          if (!forum.isPublic && !forum.userIds.concat([forum.ownerId]).includes(authId)) {
            callback({ error: new errorCreator.NotAllowed({ name: `forum ${forumId}` }) });

            return;
          }

          dbForum.getThreadsByForum({
            forumId,
            callback: (threadsData) => {
              if (threadsData.error) {
                callback({ error: threadsData.error });

                return;
              }

              const filteredThread = threadsData.data.threads.filter(thread => thread.isPublic || (thread.userIds.concat([thread.ownerId]).includes(authId)));

              callback({ data: { threads: filteredThread } });
            },
          });
        },
      });
    },
  });
}

/**
 * Get forum, threads and posts
 * @param {Object} params - Parameters
 * @param {Function} params.callback - Callback
 * @param {string} params.token - jwt
 */
function getCompleteForums({ callback, token }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetForum.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const authUser = data.user;
      const authId = authUser.userName;

      const dataToSend = { forums: {} };

      dbForum.getAllForums({
        callback: (forumData) => {
          if (forumData.error) {
            callback({ error: forumData.error });

            return;
          }

          const filteredForums = forumData.data.forums.filter(forum => forum.isPublic || (forum.userIds.concat([forum.ownerId]).includes(authId)));

          dbForum.getThreadsByForums({
            forumIds: filteredForums.map(forum => forum.forumId),
            callback: (threadsData) => {
              if (threadsData.error) {
                callback({ error: threadsData.error });

                return;
              }

              const filteredThreads = threadsData.data.threads.filter(thread => thread.isPublic || (thread.userIds.concat([thread.ownerId]).includes(authId)));

              dbForum.getForumPostsByThreads({
                threadIds: filteredThreads.map(thread => thread.threadId),
                callback: (postsData) => {
                  if (postsData.error) {
                    callback({ error: postsData.error });

                    return;
                  }

                  const filteredForumPosts = postsData.data.posts.filter(post => post.isPublic || post.userIds.concat([post.ownerId]).includes(authId));

                  const topPosts = [];
                  const subPosts = filteredForumPosts.filter((post) => {
                    if (!post.parentPostId) {
                      topPosts.push(post);

                      return false;
                    }

                    return true;
                  });

                  const forumIds = {};

                  filteredForums.forEach((forum) => {
                    dataToSend.forums[forum.forumId] = forum;
                    dataToSend.forums[forum.forumId].threads = {};
                  });

                  filteredThreads.forEach((thread) => {
                    forumIds[thread.threadId] = thread.forumId;
                    dataToSend.forums[thread.forumId].threads[thread.threadId] = thread;
                    dataToSend.forums[thread.forumId].threads[thread.threadId].posts = {};
                  });

                  topPosts.forEach((post) => {
                    const forumId = forumIds[post.threadId];

                    dataToSend.forums[forumId].threads[post.threadId].posts[post.postId] = post;
                    dataToSend.forums[forumId].threads[post.threadId].posts[post.postId].subPosts = {};
                  });

                  subPosts.forEach((post) => {
                    const forumId = forumIds[post.threadId];

                    dataToSend.forums[forumId].threads[post.threadId].posts[post.parentPostId].subPosts[post.postId] = post;
                  });

                  callback({ data: dataToSend });
                },
              });
            },
          });
        },
      });
    },
  });
}

exports.createThread = createThread;
exports.createPost = createPost;
exports.createForum = createForum;
exports.updatePost = updatePost;
exports.getForumBase = getForumBase;
exports.getForumPostsByForum = getForumPostsByForum;
exports.getForumThreadsByForum = getForumThreadsByForum;
exports.getAllForums = getAllForums;
exports.getCompleteForums = getCompleteForums;
