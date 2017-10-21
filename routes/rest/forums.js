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

const router = new express.Router();


/**
 * @param {object} io - Socket.IO
 * @returns {Object} Router
 */
function handle(io) {
  /**
   * @api {post} /forums Create forum
   * @apiVersion 7.0.0
   * @apiName Create forum
   * @apiGroup Forums
   *
   * @apiHeader {String} Authorization Your JSON Web Token.
   *
   * @apiDescription Create forum.
   *
   * @apiParam {Object} data
   * @apiParam {Object} data.forum Forum to create.
   * @apiParam {string} data.forum.title Title of the forum.
   * @apiParam {string[]} [data.forum.text] text of the forum.
   * @apiParam {string} [data.forum.ownerId] ID of the creator of the forum. It will default to the current user.
   * @apiParam {string[]} [data.forum.ownerAliasId] Alias ID of the creator. It will be shown to other users.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.forum Created forum.
   */
  router.post('/', (request, response) => {
    if (!objectValidator.isValidData(request.body, { data: { forum: { title: true } } })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '{ data: { forum: { title } } }' }), sentData: request.body.data });

      return;
    }

    forumsManager.createForum({
      io,
      token: request.headers.authorization,
      forum: request.body.data.forum,
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
   * @api {post} /forums/:forumId/threads Create forum thread
   * @apiVersion 7.0.0
   * @apiName Create forum thread
   * @apiGroup Forums
   *
   * @apiHeader {String} Authorization Your JSON Web Token.
   *
   * @apiDescription Create forum thread.
   *
   * @apiParam {Object} data
   * @apiParam {Object} data.thread Forum thread to create.
   * @apiParam {string} data.thread.title Title of the forum.
   * @apiParam {string[]} data.thread.text Text in the forum thread.
   * @apiParam {boolean} [data.thread.isPublic] Should the post be accessible by all users?
   * @apiParam {string} [data.thread.ownerId] ID of the creator of the forum. It will default to the current user.
   * @apiParam {string} [data.thread.ownerAliasId] Alias ID of the creator. It will be shown to other users.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.thread Created forum thread.
   */
  router.post('/:forumId/threads', (request, response) => {
    if (!objectValidator.isValidData(request.params, { forumId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '{ forumId }' }), sentData: request.body.data });

      return;
    } else if (!objectValidator.isValidData(request.body, { data: { thread: { title: true, text: true } } })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '{ data: { title, text } }' }), sentData: request.body.data });

      return;
    }

    const threadToSave = request.body.data.thread;
    threadToSave.forumId = request.params.forumId;

    forumsManager.createThread({
      io,
      token: request.headers.authorization,
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
   * @api {post} /forums/:forumId/threads/:threadId/posts Create forum post
   * @apiVersion 7.0.0
   * @apiName Create forum post
   * @apiGroup Forums
   *
   * @apiHeader {String} Authorization Your JSON Web Token.
   *
   * @apiDescription Create forum post.
   *
   * @apiParam {Object} data
   * @apiParam {Object} data.post Forum post to create.
   * @apiParam {string[]} data.post.text Text in the forum post.
   * @apiParam {string} data.post.threadId ID of the thread that the post will be added to.
   * @apiParam {string} [data.post.parentPostId] Should the post be accessible by all users?
   * @apiParam {boolean} [data.post.isPublic] Should the post be accessible by all users?
   * @apiParam {string} [data.post.ownerId] ID of the creator of the forum. It will default to the current user.
   * @apiParam {string} [data.post.ownerAliasId] Alias ID of the creator. It will be shown to other users.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.post Created forum post.
   */
  router.post('/:forumId/threads/:threadId/posts', (request, response) => {
    if (!objectValidator.isValidData(request.params, { forumId: true, threadId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '{ forumId, threadId }' }), sentData: request.body.data });

      return;
    } else if (!objectValidator.isValidData(request.body, { data: { post: { text: true } } })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '{ data: { post } }' }), sentData: request.body.data });

      return;
    }

    const postToSend = request.body.data.post;
    postToSend.threadId = request.params.threadId;

    forumsManager.createPost({
      io,
      token: request.headers.authorization,
      post: postToSend,
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
