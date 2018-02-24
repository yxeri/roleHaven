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
const userManager = require('../../managers/users');
const roomManager = require('../../managers/rooms');
const aliasManager = require('../../managers/aliases');
const restErrorChecker = require('../../helpers/restErrorChecker');
const errorCreator = require('../../objects/error/errorCreator');
const gameCodeManager = require('../../managers/gameCodes');
const dbConfig = require('../../config/defaults/config').databasePopulation;

const router = new express.Router();

/**
 * @param {Object} io Socket.io
 * @returns {Object} Router
 */
function handle(io) {
  /**
   * @api {get} /users/:userId/gameCodes Get user's game codes.
   * @apiVersion 8.0.0
   * @apiName GetUserGameCodes
   * @apiGroup Users
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Get user's game codes.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.gameCodes Found game codes.
   */
  router.get('/:userId/gameCodes', (request, response) => {
    if (!objectValidator.isValidData(request.params, { userId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '{ userId }' }) });

      return;
    }

    const { userId } = request.params;
    const { authorization: token } = request.headers;

    gameCodeManager.getGameCodesByOwner({
      userId,
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
   * @api {get} /users Get users.
   * @apiVersion 8.0.0
   * @apiName GetUsers
   * @apiGroup Users
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Get users.
   *
   * @apiParam {boolean} [Query] [full] Should the returned user contain all user information? Default is that only some information is returned.
   * @apiParam {boolean} [Query] [includeInactive] Should banned and unverified users be in the result?
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.users Found users.
   */
  router.get('/', (request, response) => {
    const { authorization: token } = request.headers;
    const { full, includeInactive } = request.query;

    userManager.getUsersByUser({
      token,
      full,
      includeInactive,
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
   * @api {post} /users/:userId/password Update a user's password.
   * @apiVersion 8.0.0
   * @apiName ChangePassword
   * @apiGroup Users
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Update a user's password.
   *
   * @apiParam {string} userId Id of the user that will get a new password.
   *
   * @apiParam {Object} data
   * @apiParam {string} data.password New password.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.success Was the password properly changed?
   */
  router.post('/:username/password', (request, response) => {
    const sentData = request.body.data;

    if (!objectValidator.isValidData(request.params, { userId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '{ userId }' }) });

      return;
    } else if (!objectValidator.isValidData(request.body.data, { password: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '{ password }' }), sentData });

      return;
    }

    const { password } = request.body.data;
    const { userId } = request.params;

    userManager.changePassword({
      password,
      userId,
      callback: ({ error, data }) => {
        if (error) {
          sentData.password = typeof sentData.password !== 'undefined';

          restErrorChecker.checkAndSendError({ response, error, sentData });

          return;
        }

        response.json({ data });
      },
    });
  });

  /**
   * @api {post} /users Create a user.
   * @apiVersion 8.0.0
   * @apiName CreateUser
   * @apiGroup Users
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Create a user.
   *
   * @apiParam {Object} data
   * @apiParam {Object} data.user User to create.
   * @apiParam {string} [data.options] Update options.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.user Created user.
   */
  router.post('/', (request, response) => {
    const sentData = request.body.data;

    if (!objectValidator.isValidData(request.body, { data: { user: { username: true, password: true } } })) {
      sentData.user.password = typeof sentData.user.password !== 'undefined';

      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '{ data: { user: { username, password } } }' }), sentData });

      return;
    }

    const { authorization: token } = request.headers;
    const { user, options } = request.body.data;
    user.registerDevice = dbConfig.DeviceTypes.RESTAPI;

    userManager.createUser({
      user,
      token,
      io,
      options,
      callback: ({ error, data }) => {
        if (error) {
          sentData.user.password = typeof sentData.user.password !== 'undefined';

          restErrorChecker.checkAndSendError({ response, error, sentData });

          return;
        }

        response.json({ data });
      },
    });
  });

  /**
   * @api {put} /users/:userId Update a user.
   * @apiVersion 8.0.0
   * @apiName UpdateUser
   * @apiGroup Users
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Update a user.
   *
   * @apiParam {string} userIdToUpdate [Url] Id of the user to update.
   *
   * @apiParam {string} data Body parameters.
   * @apiParam {string} data.user User parameters to update.
   * @apiParam {string} [data.options] Update options.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {User} data.user Updated user.
   */
  router.put('/:userId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { userId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '{ userId }' }) });

      return;
    } else if (!objectValidator.isValidData(request.body, { data: { user: true } })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '{ data: { user } }' }), sentData: request.body.data });

      return;
    }

    const {
      user,
      options,
    } = request.body.data;
    const { userId } = request.params;
    const { authorization: token } = request.headers;

    userManager.updateUser({
      user,
      options,
      io,
      userId,
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
   * @api {delete} /users/:userId Delete a user.
   * @apiVersion 8.0.0
   * @apiName DeleteUser
   * @apiGroup Users
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Delete a user.
   *
   * @apiParam {string} userId [Url] Id of the user to delete.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.success Was it successfully deleted?
   */
  router.delete('/:userId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { userId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '{ userId }' }) });

      return;
    }

    const { userId } = request.params;
    const { authorization: token } = request.headers;

    userManager.removeUser({
      userId,
      io,
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
   * @api {get} /users/:userId Get a user.
   * @apiVersion 8.0.0
   * @apiName GetUser
   * @apiGroup Users
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Get a user.
   *
   * @apiParam {string} userId [Url] Id of the user to get.
   *
   * @apiParam {boolean} [full] [Query] Should the returned user contain all information? Default is that only some content is returned.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.user Found user.
   */
  router.get('/:userId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { userId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '{ userId }' }) });

      return;
    }

    const { authorization: token } = request.headers;
    const { userId } = request.params;
    const { full } = request.query;

    userManager.getUserById({
      token,
      userId,
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
   * @api {put} /users/:userId/rooms/:roomId/follow Follow a room.
   * @apiVersion 8.0.0
   * @apiName FollowRoom
   * @apiGroup Users
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Follow a room.
   *
   * @apiParam {Object} data
   * @apiParam {string} [data.password] Password for the room.
   * @apiParam {string} [data.aliasId] Id of the alias used to follow the room.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.room Followed room.
   */
  router.put('/:userId/rooms/:roomId/follow', (request, response) => {
    const sentData = request.body.data;

    if (!objectValidator.isValidData(request.params, { userId: true, roomId: true })) {
      sentData.password = typeof sentData.password !== 'undefined';

      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '{ userId, roomId }' }), sentData });

      return;
    }

    const { password, aliasId } = request.body.data;
    const { roomId, userId } = request.params;
    const { authorization: token } = request.headers;

    roomManager.followRoom({
      io,
      token,
      userId,
      roomId,
      password,
      aliasId,
      callback: ({ error, data }) => {
        if (error) {
          sentData.password = typeof sentData.password !== 'undefined';

          restErrorChecker.checkAndSendError({ response, error, sentData });

          return;
        }

        response.json({ data });
      },
    });
  });

  /**
   * @api {put} /users/:userId/rooms/:roomId/unfollow Unfollow a room.
   * @apiVersion 8.0.0
   * @apiName UnfollowRoom
   * @apiGroup Users
   *
   * @apiHeader {string} Authorization Your JSON Web Token
   *
   * @apiDescription Unfollow a room.
   *
   * @apiParam {Object} userId [Url] Id of the user that will unfollow the room.
   * @apiParam {Object} roomId [Url] Id of the room to unfollow.
   *
   * @apiParam {Object} data.
   * @apiParam {Object} [data.aliasId] Id of the alias that will unfollow a room. It overrides userId.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.room Room that was unfollowed.
   */
  router.put('/:userId/rooms/:roomId/unfollow', (request, response) => {
    if (!objectValidator.isValidData(request.params, { userId: true, roomId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'params: { userId, roomId }' }), sentData: request.body.data });

      return;
    }

    const { roomId, userId } = request.params;
    const { authorization: token } = request.headers;
    const { aliasId } = request.body.data;

    roomManager.unfollowRoom({
      io,
      token,
      userId,
      roomId,
      aliasId,
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
   * @api {get} /users/:userId/aliases Get aliases from a user.
   * @apiVersion 8.0.0
   * @apiName GetUserAliases
   * @apiGroup Users
   *
   * @apiHeader {string} Authorization Your JSON Web Token
   *
   * @apiDescription Get aliases from a user.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.aliases Found aliases.
   */
  router.get('/:userId/aliases', (request, response) => {
    if (!objectValidator.isValidData(request.params, { userId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '{ userId }' }), sentData: request.body.data });

      return;
    }

    const { userId } = request.params;
    const { authorization: token } = request.headers;

    aliasManager.getAliasesByUser({
      userId,
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
   * @api {put} /users/:userIdToVerify/verify Verify a user.
   * @apiVersion 8.0.0
   * @apiName VerifyUser
   * @apiGroup Users
   *
   * @apiHeader {string} Authorization Your JSON Web Token
   *
   * @apiDescription Verify a user and allow it to log in.
   *
   * @apiParam {string} userId Id of the user to verify.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.user Verified user.
   */
  router.put('/:userIdToVerify/verify', (request, response) => {
    if (!objectValidator.isValidData(request.params, { userIdToVerify: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '{ userId }' }), sentData: request.body.data });

      return;
    }

    const { userIdToVerify } = request.params;
    const { authorization: token } = request.headers;

    userManager.verifyUser({
      userIdToVerify,
      token,
      io,
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
