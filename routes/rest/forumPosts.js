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

const router = new express.Router();


/**
 * @param {object} io - Socket.IO
 * @returns {Object} Router
 */
function handle(io) {
  /**
   * @api {put} /posts/:postId Update a forum post.
   * @apiVersion 8.0.0
   * @apiName UpdatePost
   * @apiGroup Forums
   *
   * @apiHeader {String} Authorization - Your JSON Web Token.
   *
   * @apiDescription Update a forum post.
   *
   * @apiParam {String} postId - Id of the forum post to update.
   *
   * @apiParam {String} data
   * @apiParam {String} data.post - Forum post parameters to update.
   * @apiParam {String} [data.options] - Update options.
   * @apiParam {Object} [data.userId] - Id of the user updating the post. Will default to the token's user Id.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.post - Updated Post.
   */
  router.put('/:postId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { postId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '{ postId }' }), sentData: request.params });

      return;
    } else if (!objectValidator.isValidData(request.body, { data: { post: true } })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '{ data: { post: true } }' }), sentData: request.body.data });

      return;
    }

    const {
      post,
      options,
      userId,
    } = request.body.data;
    const { postId } = request.params;
    const { authorization: token } = request.headers;

    forumPostManager.updatePost({
      post,
      userId,
      options,
      io,
      postId,
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
   * @api {delete} /posts/:postId Delete a thread post.
   * @apiVersion 8.0.0
   * @apiName RemovePost
   * @apiGroup Forums
   *
   * @apiHeader {String} Authorization - Your JSON Web Token.
   *
   * @apiDescription Get files that the user has access to.
   *
   * @apiParam {Object} docFileId - Id of the file to retrieve.
   *
   * @apiParam {Object} [data]
   * @apiParam {Object} [data.userId] - Id of the user removing the thread. Will default to the token's user Id.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.docFile - File found.
   */
  router.delete('/:postId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { postId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '{ postId: true }' }), sentData: request.params });

      return;
    }

    const { userId } = request.body.data;
    const { postId } = request.params;
    const { authorization: token } = request.headers;

    forumPostManager.removePost({
      userId,
      io,
      postId,
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
   * @api {get} /posts/:postId Get a forum post.
   * @apiVersion 8.0.0
   * @apiName GetPost
   * @apiGroup Forums
   *
   * @apiHeader {String} Authorization - Your JSON Web Token.
   *
   * @apiDescription Get a forum post that the user has access to.
   *
   * @apiParam {Object} postId - Id of the post to retrieve.
   *
   * @apiParam {Object} [data]
   * @apiParam {Object} [data.userId] - Id of the user retrieving the forum post.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.post - Forum post found.
   */
  router.get('/:postId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { postId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '{ postId }' }), sentData: request.params });

      return;
    }

    const { userId } = request.body.data;
    const { postId } = request.params;
    const { authorization: token } = request.headers;

    forumPostManager.getPostById({
      userId,
      postId,
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
