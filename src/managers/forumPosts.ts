'use strict';

import dbPost from '../db/connectors/forumPost';
import { dbConfig } from '../config/defaults/config';

import errorCreator from '../error/errorCreator';
import authenticator from '../helpers/authenticator';
import forumManager from './forums';
import threadManager from './forumThreads';
import managerHelper from '../helpers/manager';

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
    dbCallFunc: getPostById,
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
    callback: ({
      error,
      data,
    }) => {
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
        callback: ({
          error: threadError,
          data: threadData,
        }) => {
          if (threadError) {
            callback({ error: threadError });

            return;
          }

          const { thread } = threadData;

          createPost({
            post: postToCreate,
            callback: ({
              error: postError,
              data: postData,
            }) => {
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
                    io.to(createdPost.ownerAliasId || authUser.objectId)
                      .emit(dbConfig.EmitTypes.FORUMPOST, {
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
    dbCallFunc: updatePost,
    emitType: dbConfig.EmitTypes.FORUMPOST,
    objectIdType: 'postId',
    getDbCallFunc: getPostById,
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
    dbCallFunc: getPostsByUser,
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
    dbCallFunc: getPostsByThreads,
  });
}

/**
 * Get forum posts
 * @param {Object} params Parameters
 * @param {string} params.forumId ID of the roum
 * @param {Function} params.callback Callback
 * @param {Object} params.token jwt
 */
function getPostsByForum({
  forumId,
  callback,
  token,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetForumPost.name,
    callback: ({
      error,
      data,
    }) => {
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
            callback: ({
              error: threadsError,
              data: threadsData,
            }) => {
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
    getDbCallFunc: getPostById,
    getCommandName: dbConfig.apiCommands.GetForumPost.name,
    objectId: postId,
    commandName: dbConfig.apiCommands.RemoveForumPost.name,
    objectType: 'post',
    dbCallFunc: dbPost.removePostById,
    emitType: dbConfig.EmitTypes.FORUMPOST,
    objectIdType: 'postId',
  });
}

export { createPost };
export { updatePost };
export { removePost };
export { getPostsByForum };
export { getPostsByThreads };
export { getPostById };
export { getPostsByUser };
