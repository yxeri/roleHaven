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

const express = require('express');
const objectValidator = require('../../utils/objectValidator');
const restErrorChecker = require('../../helpers/restErrorChecker');
const errorCreator = require('../../objects/error/errorCreator');
const forumPostManager = require('../../managers/forumPosts');
const forumThreadManager = require('../../managers/forumThreads');

const router = new express.Router();


/**
 * @param {object} io Socket.IO
 * @returns {Object} Router
 */
function handle(io) {
  /**
   * @api {put} /threads/:threadId Update a forum thread
   * @apiVersion 8.0.0
   * @apiName UpdateThread
   * @apiGroup Forums
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
   * @apiParam {Object} [data.userId] Id of the user updating the thread. It will default to the token's user Id.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.post Updated thread.
   */
  router.put('/:threadId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { threadId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '{ threadId }' }), sentData: request.params });

      return;
    } else if (!objectValidator.isValidData(request.body, { data: { thread: true } })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '{ data: { thread: true } }' }), sentData: request.body.data });

      return;
    }

    const {
      thread,
      options,
      userId,
    } = request.body.data;
    const { threadId } = request.params;
    const { authorization: token } = request.headers;

    forumThreadManager.updateThread({
      thread,
      userId,
      options,
      io,
      threadId,
      token,
      callback: ({ error, data }) => {
        if (error) {
          restErrorChecker.checkAndSendError({ response, error, sentData: request.body.data });

          return;
        }

        response.json({ data });
      },
    });
  });

  /**
   * @api {post} /:threadId/posts Create a forum thread post
   * @apiVersion 8.0.0
   * @apiName CreatePost
   * @apiGroup Forums
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
    if (!objectValidator.isValidData(request.params, { threadId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '{ threadId }' }), sentData: request.params });

      return;
    } else if (!objectValidator.isValidData(request.body, { data: { post: { text: true } } })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '{ data: { post } }' }), sentData: request.body.data });

      return;
    }

    const { authorization: token } = request.headers;
    const { threadId } = request.params;
    const { post } = request.body.data;

    forumPostManager.createPost({
      io,
      token,
      threadId,
      post,
      callback: ({ error, data }) => {
        if (error) {
          restErrorChecker.checkAndSendError({ response, error, sentData: request.body.data });

          return;
        }

        response.json({ data });
      },
    });
  });

  /**
   * @api {delete} /threads/:threadId Delete a forum thread
   * @apiVersion 8.0.0
   * @apiName RemoveThread
   * @apiGroup Forums
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Delete a forum thread.
   *
   * @apiParam {Object} threadId Id of the forum thread to remove.
   *
   * @apiParam {Object} [data]
   * @apiParam {Object} [data.userId] Id of the user trying to remove a forum thread. It will default to the token's user Id.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.success Was the thread successfully removed?
   */
  router.delete('/:threadId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { threadId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '{ threadId: true }' }), sentData: request.params });

      return;
    }

    const { userId } = request.body.data;
    const { threadId } = request.params;
    const { authorization: token } = request.headers;

    forumThreadManager.removeThread({
      userId,
      io,
      threadId,
      token,
      callback: ({ error, data }) => {
        if (error) {
          restErrorChecker.checkAndSendError({ response, error, sentData: request.body.data });

          return;
        }

        response.json({ data });
      },
    });
  });

  /**
   * @api {get} /threads/:threadId Get a forum thread
   * @apiVersion 8.0.0
   * @apiName GetThread
   * @apiGroup Forums
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Get a forum thread that the user has access to.
   *
   * @apiParam {Object} threadId Id of the thread to retrieve.
   *
   * @apiParam {Object} [data]
   * @apiParam {Object} [data.userId] Id of the user retrieving the forum thread.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.post Forum thread found.
   */
  router.get('/:threadId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { threadId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '{ threadId }' }), sentData: request.params });

      return;
    }

    const { userId } = request.body.data;
    const { threadId } = request.params;
    const { authorization: token } = request.headers;

    forumThreadManager.getThreadById({
      userId,
      threadId,
      token,
      callback: ({ error, data }) => {
        if (error) {
          restErrorChecker.checkAndSendError({ response, error, sentData: request.body.data });

          return;
        }

        response.json({ data });
      },
    });
  });

  /**
   * @api {get} /threads/:threadId/posts Get posts from thread
   * @apiVersion 8.0.0
   * @apiName GetThreadPosts
   * @apiGroup Forums
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Get forum thread posts.
   *
   * @apiParam {Object} threadId Id of the thread to retrieve posts from.
   *
   * @apiParam {Object} [data]
   * @apiParam {Object} [data.userId] Id of the user retrieving the forum posts.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.posts Forum posts found.
   */
  router.get('/:threadId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { threadId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '{ threadId }' }), sentData: request.params });

      return;
    }

    const { userId } = request.body.data;
    const { threadId } = request.params;
    const { authorization: token } = request.headers;

    forumPostManager.getPostsByThread({
      userId,
      threadId,
      token,
      callback: ({ error, data }) => {
        if (error) {
          restErrorChecker.checkAndSendError({ response, error, sentData: request.body.data });

          return;
        }

        response.json({ data });
      },
    });
  });

  return router;
}

module.exports = handle;
