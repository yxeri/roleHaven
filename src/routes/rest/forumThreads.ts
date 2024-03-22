'use strict';

const express = require('express');
const objectValidator = require('../../utils/objectValidator');
const restErrorChecker = require('../../helpers/restErrorChecker');
const errorCreator = require('../../error/errorCreator');
const forumThreadManager = require('../../managers/forumThreads');
const helper = require('./helper');

const router = new express.Router();

/**
 * @param {object} io Socket.IO
 * @returns {Object} Router
 */
function handle(io) {
  /**
   * @api {put} /forumThreads/:threadId Update a forum thread
   * @apiVersion 8.0.0
   * @apiName UpdateThread
   * @apiGroup ForumThreads
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Update a forum thread.
   *
   * @apiParam {string} threadId Id of the forum thread to update.
   *
   * @apiParam {string} data
   * @apiParam {string} data.thread Forum thread parameters to update.
   * @apiParam {string} [data.options] Update options.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.post Updated thread.
   */
  router.put('/:threadId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { threadId: true })) {
      restErrorChecker.checkAndSendError({
        response,
        error: new errorCreator.InvalidData({ expected: '{ threadId }' }),
        sentData: request.params,
      });

      return;
    }

    if (!objectValidator.isValidData(request.body, { data: { thread: true } })) {
      restErrorChecker.checkAndSendError({
        response,
        error: new errorCreator.InvalidData({ expected: '{ data: { thread: true } }' }),
        sentData: request.body.data,
      });

      return;
    }

    const {
      thread,
      options,
    } = request.body.data;
    const { threadId } = request.params;
    const { authorization: token } = request.headers;

    forumThreadManager.updateThread({
      thread,
      options,
      io,
      threadId,
      token,
      callback: ({
        error,
        data,
      }) => {
        if (error) {
          restErrorChecker.checkAndSendError({
            response,
            error,
            sentData: request.body.data,
          });

          return;
        }

        response.json({ data });
      },
    });
  });

  /**
   * @api {post} /forumThreads/:threadId/posts Create a thread post
   * @apiVersion 8.0.0
   * @apiName CreatePost
   * @apiGroup ForumThreads
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Create a forum post.
   *
   * @apiParam {string} threadId Id of the forum thread to create a post for.
   *
   * @apiParam {Object} data
   * @apiParam {Object} data.post Forum post to create.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.post Created forum post.
   */
  router.post('/:threadId/posts', (request, response) => {
    helper.createForumPost({
      request,
      response,
      io,
    });
  });

  /**
   * @api {delete} /forumThreads/:threadId Delete a forum thread
   * @apiVersion 8.0.0
   * @apiName RemoveThread
   * @apiGroup ForumThreads
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Delete a forum thread.
   *
   * @apiParam {Object} threadId Id of the forum thread to remove.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.success Was the thread successfully removed?
   */
  router.delete('/:threadId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { threadId: true })) {
      restErrorChecker.checkAndSendError({
        response,
        error: new errorCreator.InvalidData({ expected: '{ threadId: true }' }),
        sentData: request.params,
      });

      return;
    }

    const { threadId } = request.params;
    const { authorization: token } = request.headers;

    forumThreadManager.removeThread({
      io,
      threadId,
      token,
      callback: ({
        error,
        data,
      }) => {
        if (error) {
          restErrorChecker.checkAndSendError({
            response,
            error,
            sentData: request.body.data,
          });

          return;
        }

        response.json({ data });
      },
    });
  });

  /**
   * @api {get} /forumThreads/:threadId Get a forum thread
   * @apiVersion 8.0.0
   * @apiName GetThread
   * @apiGroup ForumThreads
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Get a forum thread that the user has access to.
   *
   * @apiParam {Object} threadId [Url] Id of the thread to retrieve.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {ForumThread} data.thread Found thread.
   */
  router.get('/:threadId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { threadId: true })) {
      restErrorChecker.checkAndSendError({
        response,
        error: new errorCreator.InvalidData({ expected: '{ threadId }' }),
      });

      return;
    }

    const { threadId } = request.params;
    const { authorization: token } = request.headers;

    forumThreadManager.getThreadById({
      threadId,
      token,
      callback: ({
        error,
        data,
      }) => {
        if (error) {
          restErrorChecker.checkAndSendError({
            response,
            error,
          });

          return;
        }

        response.json({ data });
      },
    });
  });

  /**
   * @api {get} /forumThreads/ Get threads
   * @apiVersion 8.0.0
   * @apiName GetThreads
   * @apiGroup ForumThreads
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Get threads. The default is to return all threads made by the user. Setting forumId will instead retrieve all threads connected to the forum.
   *
   * @apiParam {string} [forumId] [Query] Id of the forum to retrieve posts from.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {ForumPost[]} data.posts Found posts.
   */
  router.get('/', (request, response) => {
    helper.getForumThreads({
      request,
      response,
    });
  });

  /**
   * @api {get} /forumThreads/:threadId/posts Get posts from thread
   * @apiVersion 8.0.0
   * @apiName GetThreadPosts
   * @apiGroup ForumThreads
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Get forum thread posts.
   *
   * @apiParam {Object} threadId [Url] Id of the thread to retrieve posts from.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {ForumPost[]} data.posts Found posts.
   */
  router.get('/:threadId/posts', (request, response) => {
    helper.getForumPosts({
      request,
      response,
    });
  });

  /**
   * @api {put} /forumThreads/:threadId/permissions Update permissions on a forum thread
   * @apiVersion 8.0.0
   * @apiName UpdateForumThreadPermissions
   * @apiGroup ForumsThreads
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Update permissions on a forum thread.
   *
   * @apiParam {string} forumId Id of the forum to update.
   *
   * @apiParam {Object} data
   * @apiParam {boolean} [data.shouldRemove] Should the permissions be removed from the sent Ids? Default is false.
   * @apiParam {string[]} data.userIds Users to give access to.
   * @apiParam {string[]} data.teamIds Teams to give access to.
   * @apiParam {string[]} data.teamAdminIds Teams to give admin access to.
   * @apiParam {string[]} data.userAdminIds Users to give admin access to.
   * @apiParam {string[]} data.bannedIds Ids to ban.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {ForumThread} data.thread Updated forum thread.
   */
  router.put('/:threadId/permissions', (request, response) => {
    if (!objectValidator.isValidData(request.params, { threadId: true })) {
      restErrorChecker.checkAndSendError({
        response,
        error: new errorCreator.InvalidData({ expected: 'params = { threadId }' }),
      });

      return;
    }

    const {
      userIds,
      teamIds,
      teamAdminIds,
      userAdminIds,
      bannedIds,
      shouldRemove,
    } = request.body.data;
    const { threadId } = request.params;
    const { authorization: token } = request.headers;

    forumThreadManager.updateAccess({
      token,
      threadId,
      teamAdminIds,
      userAdminIds,
      userIds,
      teamIds,
      bannedIds,
      shouldRemove,
      callback: ({
        error,
        data,
      }) => {
        if (error) {
          restErrorChecker.checkAndSendError({
            response,
            error,
            sentData: request.body.data,
          });

          return;
        }

        response.json({ data });
      },
    });
  });

  return router;
}

export default handle;
