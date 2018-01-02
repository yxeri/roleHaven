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
const forumsManager = require('../../managers/forums');
const errorCreator = require('../../objects/error/errorCreator');
const forumThreadManager = require('../../managers/forumThreads');

const router = new express.Router();

/**
 * @param {object} io Socket.IO
 * @returns {Object} Router
 */
function handle(io) {
  /**
   * @api {put} /forums/:forumId Update a forum
   * @apiVersion 8.0.0
   * @apiName UpdateForum
   * @apiGroup Forums
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Update a forum.
   *
   * @apiParam {string} forumId Id of the forum to update.
   *
   * @apiParam {Object} data
   * @apiParam {Forum} data.forum Forum parameters to update.
   * @apiParam {Object} [data.options] Update options.
   * @apiParam {string} [data.userId] Id of the user updating the forum. It will default to the token's user Id.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.post Updated Post.
   */
  router.put('/:forumId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { forumId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'params = { forumId }' }) });

      return;
    } else if (!objectValidator.isValidData(request.body, { data: { forum: true } })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'data = { forum: true }' }), sentData: request.body.data });

      return;
    }

    const {
      forum,
      options,
      userId,
    } = request.body.data;
    const { forumId } = request.params;
    const { authorization: token } = request.headers;

    forumsManager.updateForum({
      forum,
      userId,
      options,
      io,
      forumId,
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
   * @api {post} /forums Create a forum
   * @apiVersion 8.0.0
   * @apiName CreateForum
   * @apiGroup Forums
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Create a forum.
   *
   * @apiParam {Object} data
   * @apiParam {Forum} data.forum Forum to create.
   * @apiParam {string} [data.userId] Id of the user creating the forum. It will default to the token's user Id.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.forum Created forum.
   */
  router.post('/', (request, response) => {
    if (!objectValidator.isValidData(request.body, { data: { forum: { title: true } } })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'data = { forum: { title } }' }), sentData: request.body.data });

      return;
    }

    const { authorization: token } = request.headers;
    const {
      forum,
      userId,
    } = request.body.data;

    forumsManager.createForum({
      io,
      token,
      forum,
      userId,
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
   * @api {delete} /forums/:forumId Delete a forum
   * @apiVersion 8.0.0
   * @apiName RemoveForum
   * @apiGroup Forums
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Remove a forum.
   *
   * @apiParam {string} forumId Id of the forum to delete.
   *
   * @apiParam {Object} [data]
   * @apiParam {string} [data.userId] Id of the user deleting the forum. It will default to the token's user Id.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {boolean} data.success Was the deletion successful?
   */
  router.delete('/:forumId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { forumId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'params = { forumId }' }), sentData: request.params });

      return;
    }

    const { userId } = request.body.data;
    const { forumId } = request.params;
    const { authorization: token } = request.headers;

    forumsManager.removeForum({
      userId,
      io,
      forumId,
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
   * @api {post} /forums/:forumId/threads Create a thread
   * @apiVersion 8.0.0
   * @apiName CreateThread
   * @apiGroup Forums
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Create a forum thread.
   *
   * @apiParam {string} forumId Id of the forum to create a thread for.
   *
   * @apiParam {Object} data
   * @apiParam {ForumThread} data.thread Forum thread to create.
   * @apiParam {string} [data.userId] Id of the user creating the forum thread. It will default to the token's user Id.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {ForumThread} data.thread Created forum thread.
   */
  router.post('/:forumId/threads', (request, response) => {
    if (!objectValidator.isValidData(request.params, { forumId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'params = { forumId }' }) });

      return;
    } else if (!objectValidator.isValidData(request.body, { data: { thread: { title: true, text: true } } })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'data = { thread: { title, text } }' }), sentData: request.body.data });

      return;
    }

    const { authorization: token } = request.headers;
    const { forumId } = request.params;
    const {
      thread,
      userId,
    } = request.body.data.thread;
    const threadToSave = thread;
    threadToSave.forumId = forumId;

    forumThreadManager.createThread({
      io,
      token,
      userId,
      thread: threadToSave,
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
   * @api {get} /forums/:forumId Get a forum
   * @apiVersion 8.0.0
   * @apiName GetForum
   * @apiGroup Forums
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Get a forum.
   *
   * @apiParam {string} forumId Id of the forum to retrieve.
   *
   * @apiParam {Object} [data]
   * @apiParam {string} [data.userId] Id of the user retrieving the forum.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Forum} data.forum Found forum.
   */
  router.get('/:forumId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { forumId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'params = { forumId }' }) });

      return;
    }

    const { userId } = request.body.data;
    const { forumId } = request.params;
    const { authorization: token } = request.headers;

    forumsManager.getForumById({
      userId,
      forumId,
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
   * @api {get} /forums/:forumId/threads Get forum threads
   * @apiVersion 8.0.0
   * @apiName GetThreads
   * @apiGroup Forums
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Get forum threads.
   *
   * @apiParam {string} forumId Id of the forum to retrieve threads from.
   *
   * @apiParam {Object} [data]
   * @apiParam {string} [data.userId] Id of the user retrieving the forum threads.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {ForumThread[]} data.threads Found forum threads.
   */
  router.get('/:forumId/threads', (request, response) => {
    if (!objectValidator.isValidData(request.params, { forumId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'params = { forumId }' }) });

      return;
    }

    const { userId } = request.body.data;
    const { forumId } = request.params;
    const { authorization: token } = request.headers;

    forumThreadManager.getForumThreadsByForum({
      userId,
      forumId,
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
