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
const calibrationMissionManager = require('../../managers/calibrationMissions');
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
   * @api {get} /users/banned Get banned users.
   * @apiVersion 6.0.0
   * @apiName GetBannedUsers
   * @apiGroup Users
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Get banned users.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.users Found users.
   */
  router.get('/banned', (request, response) => {
    const { authorization: token } = request.headers;

    userManager.getBannedUsers({
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
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.users Found users.
   */
  router.get('/', (request, response) => {
    const { authorization: token } = request.headers;

    userManager.listUsers({
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
    if (!objectValidator.isValidData(request.params, { userId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '{ userId }' }), sentData: request.body.data });

      return;
    } else if (!objectValidator.isValidData(request.body.data, { password: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '{ password }' }), sentData: request.body.data });

      return;
    }

    const { password } = request.body.data;
    const { userId } = request.params;

    userManager.changePassword({
      password,
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
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.user Created user.
   */
  router.post('/', (request, response) => {
    if (!objectValidator.isValidData(request.body, { data: { user: { username: true } } })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '{ data: { user: { username } } }' }), sentData: request.body.data });

      return;
    }

    const { authorization: token } = request.headers;
    const { user } = request.body.data;
    user.registerDevice = dbConfig.DeviceTypes.RESTAPI;

    userManager.createUser({
      user,
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
   * @api {put} /users/:userIdToUpdate Update a user.
   * @apiVersion 8.0.0
   * @apiName UpdateUser
   * @apiGroup Users
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Update a user.
   *
   * @apiParam {string} userIdToUpdate Id of the user to update.
   *
   * @apiParam {string} data
   * @apiParam {string} data.user User parameters to update.
   * @apiParam {string} [data.options] Update options.
   * @apiParam {string} [data.userId] Id of the user updating a user.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.user Updated user.
   */
  router.put('/:userIdToUpdate', (request, response) => {
    if (!objectValidator.isValidData(request.params, { userIdToUpdate: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '{ userIdToUpdate }' }), sentData: request.params });

      return;
    } else if (!objectValidator.isValidData(request.body, { data: { user: true } })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '{ data: { user } }' }), sentData: request.body.data });

      return;
    }

    const {
      user,
      options,
      userId,
    } = request.body.data;
    const { userIdToUpdate } = request.params;
    const { authorization: token } = request.headers;

    userManager.updateUser({
      user,
      options,
      io,
      userId,
      userIdToUpdate,
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
   * @api {delete} /users/:userIdToRemove Delete a user.
   * @apiVersion 8.0.0
   * @apiName DeleteUser
   * @apiGroup Users
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Delete a user.
   *
   * @apiParam {string} userIdToRemove Id of the user to delete.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.success Was it successfully deleted?
   */
  router.delete('/:userIdToRemove', (request, response) => {
    if (!objectValidator.isValidData(request.params, { userIdToRemove: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '{ userIdToRemove }' }), sentData: request.params });

      return;
    }

    const { userIdToRemove } = request.params;
    const { authorization: token } = request.headers;

    userManager.removeUser({
      userIdToRemove,
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
   * @api {get} /users/:userIdToGet Get a user.
   * @apiVersion 8.0.0
   * @apiName GetUser
   * @apiGroup Users
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Get a user.
   *
   * @apiParam {string} userIdToGet Id of the user to get.
   *
   * @apiParam {Object} data
   * @apiParam {string} [data.userId] Id of the user trying to get a user.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.user Found user.
   */
  router.get('/:userIdToGet', (request, response) => {
    if (!objectValidator.isValidData(request.params, { userIdToGet: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '{ userId }' }), sentData: request.body.data });

      return;
    }

    const { authorization: token } = request.headers;
    const { userIdToGet } = request.params;
    const { userId } = request.body.data;

    userManager.getUserById({
      token,
      userId,
      userIdToGet,
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
   * @api {post} /users/:userId/rooms/:roomId/follow Follow a room.
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
  router.post('/:userId/rooms/:roomId/follow', (request, response) => {
    if (!objectValidator.isValidData(request.params, { userId: true, roomId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '{ userId, roomId }' }), sentData: request.body.data });

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
          restErrorChecker.checkAndSendError({ response, error, sentData: request.body.data });

          return;
        }

        response.json({ data });
      },
    });
  });

  /**
   * @api {post} /users/:userId/rooms/:roomId/unfollow Unfollow a room.
   * @apiVersion 8.0.0
   * @apiName UnfollowRoom
   * @apiGroup Users
   *
   * @apiHeader {string} Authorization Your JSON Web Token
   *
   * @apiDescription Unfollow a room.
   *
   * @apiParam {Object} userId Id of the user that will unfollow the room.
   * @apiParam {Object} roomId Id of the room to unfollow.
   *
   * @apiParam {Object} data.
   * @apiParam {Object} [data.aliasId] Id of the alias that will unfollow a room. It overrides userId.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.room Room that was unfollowed.
   */
  router.post('/:userId/rooms/:roomId/unfollow', (request, response) => {
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

    aliasManager.getAliases({
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
   * @api {post} /users/:userId/aliases/ Create an alias for the user.
   * @apiVersion 8.0.0
   * @apiName CreateAlias
   * @apiGroup Users
   *
   * @apiHeader {string} Authorization Your JSON Web Token
   *
   * @apiDescription Create an alias for the user.
   *
   * @apiParam {string} userId Id of the user that will get a new alias.
   *
   * @apiParam {Object} data
   * @apiParam {string} data.alias Alias to create.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.alias Created alias.
   */
  router.post('/:userId/aliases', (request, response) => {
    if (!objectValidator.isValidData(request.params, { userId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '{ userId }' }), sentData: request.body.data });

      return;
    } else if (!objectValidator.isValidData(request.body, { data: { alias: true } })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '{ data: { alias } }' }), sentData: request.body.data });

      return;
    }

    const { userId } = request.params;
    const { authorization: token } = request.headers;
    const { alias } = request.body.data;

    aliasManager.createAlias({
      io,
      token,
      alias,
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
   * @api {post} /users/:userIdToVerify/verify Verify a user.
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
  router.post('/:userIdToVerify/verify', (request, response) => {
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

  /**
   * @api {get} /users/:username/calibrationMission Get user's calibration mission
   * @apiVersion 6.0.0
   * @apiName GetCalibrationMission
   * @apiGroup Users
   *
   * @apiHeader {string} Authorization Your JSON Web Token
   *
   * @apiDescription Get user's calibration mission
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.mission Mission found
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "mission": {
   *        owner: 'raz',
   *        stationId: 1,
   *        code: 81855211,
   *        completed: false,
   *      }
   *    }
   *  }
   */
  router.get('/:username/calibrationMission', (request, response) => {
    calibrationMissionManager.getActiveCalibrationMission({
      token: request.headers.authorization,
      username: request.params.username,
      callback: ({ error: calibrationError, data: calibrationData }) => {
        if (calibrationError) {
          restErrorChecker.checkAndSendError({ response, error: calibrationError, sentData: request.body.data });

          return;
        }

        response.json({ data: calibrationData });
      },
    });
  });

  /**
   * @api {post} /users/:username/calibrationMission/complete Complete user's calibration mission
   * @apiVersion 6.0.0
   * @apiName CompleteCalibrationMission
   * @apiGroup Users
   *
   * @apiHeader {string} Authorization Your JSON Web Token
   *
   * @apiDescription Complete the mission. A transaction will be created
   *
   * @apiParam {string} username Owner of the mission
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.mission Mission completed
   * @apiSuccess {Object[]} data.transaction Transaction for completed mission
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "mission": {
   *        "code": 12345678,
   *        "stationId": 1,
   *        "completed": true,
   *        "timeCompleted": "2016-10-14T11:13:03.555Z"
   *      },
   *      "transaction": {
   *        "to": "raz",
   *        "from": "SYSTEM",
   *        "amount": 50
   *        "time": "2016-10-14T11:13:03.555Z"
   *      }
   *    }
   *  }
   */
  router.post('/:username/calibrationMission/complete', (request, response) => {
    calibrationMissionManager.completeActiveCalibrationMission({
      io,
      token: request.headers.authorization,
      owner: request.params.username,
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
   * @api {post} /users/:username/calibrationMission/cancel Cancel user's mission
   * @apiVersion 6.0.0
   * @apiName CancelCalibrationMission
   * @apiGroup Users
   *
   * @apiHeader {string} Authorization Your JSON Web Token
   *
   * @apiDescription Cancel a calibration mission. Mission will still be set to completed, but no transaction will be created
   *
   * @apiParam {string} username Owner of the mission
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.mission Mission completed
   * @apiSuccess {Boolean} data.cancelled Was mission cancelled?
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "mission": {
   *        "code": 12345678,
   *        "stationId": 1,
   *        "completed": true,
   *        "timeCompleted": "2016-10-14T11:13:03.555Z"
   *      },
   *      "cancelled": true
   *    }
   *  }
   */
  router.post('/:username/calibrationMission/cancel', (request, response) => {
    calibrationMissionManager.cancelActiveCalibrationMission({
      io,
      token: request.headers.authorization,
      owner: request.params.username,
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
