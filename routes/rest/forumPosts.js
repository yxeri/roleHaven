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
const helper = require('./helper');

const router = new express.Router();

/**
 * @param {object} io Socket.IO
 * @returns {Object} Router
 */
function handle(io) {
  /**
   * @api {put} /forumPosts/:postId Update a post
   * @apiVersion 8.0.0
   * @apiName UpdatePost
   * @apiGroup ForumPosts
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Update a forum post.
   *
   * @apiParam {string} postId [Url] Id of the post to update.
   *
   * @apiParam {Object} data
   * @apiParam {ForumPost} data.post Post parameters to update.
   * @apiParam {Object} [data.options] Update options.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {ForumPost} data.post Updated Post.
   */
  router.put('/:postId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { postId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'params = { postId }' }) });

      return;
    } else if (!objectValidator.isValidData(request.body, { data: { post: true } })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'data = { post: true }' }), sentData: request.body.data });

      return;
    }

    const {
      post,
      options,
    } = request.body.data;
    const { postId } = request.params;
    const { authorization: token } = request.headers;

    forumPostManager.updatePost({
      post,
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
   * @api {delete} /forumPosts/:postId Delete a post
   * @apiVersion 8.0.0
   * @apiName RemovePost
   * @apiGroup ForumPosts
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Delete a forum post.
   *
   * @apiParam {string} postId [Url] Id of the post to delete.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {boolean} data.success Was the post successfully deleted?
   */
  router.delete('/:postId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { postId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'params = { postId }' }) });

      return;
    }

    const { postId } = request.params;
    const { authorization: token } = request.headers;

    forumPostManager.removePost({
      io,
      postId,
      token,
      callback: ({ error, data }) => {
        if (error) {
          restErrorChecker.checkAndSendError({ response, error });

          return;
        }

        response.json({ data });
      },
    });
  });

  /**
   * @api {get} /forumPosts/:postId Get a post
   * @apiVersion 8.0.0
   * @apiName GetPost
   * @apiGroup ForumPosts
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Get a forum post.
   *
   * @apiParam {string} postId [Url] Id of the post to retrieve.
   *
   * @apiParam {boolean} [full] [Query] Should the complete object be retrieved?
   *
   * @apiSuccess {Object} data
   * @apiSuccess {ForumPost} data.post Found forum post.
   */
  router.get('/:postId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { postId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'params = { postId }' }) });

      return;
    }

    const { postId } = request.params;
    const { authorization: token } = request.headers;
    const { full } = request.query;

    forumPostManager.getPostById({
      postId,
      token,
      full,
      callback: ({ error, data }) => {
        if (error) {
          restErrorChecker.checkAndSendError({ response, error });

          return;
        }

        response.json({ data });
      },
    });
  });

  /**
   * @api {get} /forumPosts/ Get posts
   * @apiVersion 8.0.0
   * @apiName GetPosts
   * @apiGroup ForumPosts
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Get posts. The default is to return all posts made by the user. Setting threadId or forumId will instead retrieve all posts connected to the thread/forum.
   *
   * @apiParam {boolean} [full] [Query] Should the complete object be retrieved?
   * @apiParam {string} [threadId] [Query] Id of the thread to retrieve posts from.
   * @apiParam {string} [forumId] [Query] Id of the forum to retrieve posts from.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {ForumPost[]} data.posts Found posts.
   */
  router.get('/', (request, response) => {
    helper.getForumPosts({ request, response });
  });

  return router;
}

module.exports = handle;
