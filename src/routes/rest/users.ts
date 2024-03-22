'use strict';

import express from 'express';
import objectValidator from '../../utils/objectValidator';
import userManager from '../../managers/users';
import roomManager from '../../managers/rooms';
import aliasManager from '../../managers/aliases';
import restErrorChecker from '../../helpers/restErrorChecker';
import errorCreator from '../../error/errorCreator';
import { dbConfig } from '../../config/defaults/config';

import calibrationMissionManager from '../../managers/bbr/calibrationMissions';

const router = new express.Router();

/**
 * @param {Object} io Socket.io
 * @returns {Object} Router
 */
function handle(io) {
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
   * @apiParam {boolean} [Query] [includeInactive] Should banned and unverified users be in the result?
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.users Found users.
   */
  router.get('/', (request, response) => {
    const { authorization: token } = request.headers;
    const { includeInactive } = request.query;

    userManager.getUsersByUser({
      token,
      includeInactive,
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
  router.post('/:userId/password', (request, response) => {
    const sentData = request.body.data;

    if (!objectValidator.isValidData(request.params, { userId: true })) {
      restErrorChecker.checkAndSendError({
        response,
        error: new errorCreator.InvalidData({ expected: '{ userId }' }),
      });

      return;
    }

    const { authorization: token } = request.headers;
    const { password } = request.body.data;
    const { userId } = request.params;

    userManager.changePassword({
      password,
      userId,
      token,
      callback: ({
        error,
        data,
      }) => {
        if (error) {
          sentData.password = typeof sentData.password !== 'undefined';

          restErrorChecker.checkAndSendError({
            response,
            error,
            sentData,
          });

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

    if (!objectValidator.isValidData(request.body, {
      data: {
        user: {
          username: true,
          password: true,
        },
      },
    })) {
      sentData.user.password = typeof sentData.user.password !== 'undefined';

      restErrorChecker.checkAndSendError({
        response,
        error: new errorCreator.InvalidData({ expected: '{ data: { user: { username, password } } }' }),
        sentData,
      });

      return;
    }

    const { authorization: token } = request.headers;
    const {
      user,
      options,
    } = request.body.data;
    user.registerDevice = dbConfig.DeviceTypes.RESTAPI;

    userManager.createUser({
      user,
      token,
      io,
      options,
      callback: ({
        error,
        data,
      }) => {
        if (error) {
          sentData.user.password = typeof sentData.user.password !== 'undefined';

          restErrorChecker.checkAndSendError({
            response,
            error,
            sentData,
          });

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
      restErrorChecker.checkAndSendError({
        response,
        error: new errorCreator.InvalidData({ expected: '{ userId }' }),
      });

      return;
    }

    if (!objectValidator.isValidData(request.body, { data: { user: true } })) {
      restErrorChecker.checkAndSendError({
        response,
        error: new errorCreator.InvalidData({ expected: '{ data: { user } }' }),
        sentData: request.body.data,
      });

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
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.user Found user.
   */
  router.get('/:userId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { userId: true })) {
      restErrorChecker.checkAndSendError({
        response,
        error: new errorCreator.InvalidData({ expected: '{ userId }' }),
      });

      return;
    }

    const { authorization: token } = request.headers;
    const { userId } = request.params;

    userManager.getUserById({
      token,
      userId,
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

    if (!objectValidator.isValidData(request.params, {
      userId: true,
      roomId: true,
    })) {
      sentData.password = typeof sentData.password !== 'undefined';

      restErrorChecker.checkAndSendError({
        response,
        error: new errorCreator.InvalidData({ expected: '{ userId, roomId }' }),
        sentData,
      });

      return;
    }

    const {
      password,
      aliasId,
    } = request.body.data;
    const { roomId } = request.params;
    const { authorization: token } = request.headers;

    roomManager.followRoom({
      io,
      token,
      roomId,
      password,
      aliasId,
      callback: ({
        error,
        data,
      }) => {
        if (error) {
          sentData.password = typeof sentData.password !== 'undefined';

          restErrorChecker.checkAndSendError({
            response,
            error,
            sentData,
          });

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
    if (!objectValidator.isValidData(request.params, {
      userId: true,
      roomId: true,
    })) {
      restErrorChecker.checkAndSendError({
        response,
        error: new errorCreator.InvalidData({ expected: 'params: { userId, roomId }' }),
        sentData: request.body.data,
      });

      return;
    }

    const {
      roomId,
      userId,
    } = request.params;
    const { authorization: token } = request.headers;
    const { aliasId } = request.body.data;

    roomManager.unfollowRoom({
      io,
      token,
      userId,
      roomId,
      aliasId,
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
      restErrorChecker.checkAndSendError({
        response,
        error: new errorCreator.InvalidData({ expected: '{ userId }' }),
        sentData: request.body.data,
      });

      return;
    }

    const { userId } = request.params;
    const { authorization: token } = request.headers;

    aliasManager.getAliasesByUser({
      userId,
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
      restErrorChecker.checkAndSendError({
        response,
        error: new errorCreator.InvalidData({ expected: '{ userId }' }),
        sentData: request.body.data,
      });

      return;
    }

    const { userIdToVerify } = request.params;
    const { authorization: token } = request.headers;

    userManager.verifyUser({
      userIdToVerify,
      token,
      io,
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
   * @api {post} /users/:userName/calibrationMission/complete Complete user's calibration mission
   * @apiVersion 6.0.0
   * @apiName CompleteCalibrationMission
   * @apiGroup Users
   *
   * @apiHeader {string} Authorization Your JSON Web Token
   *
   * @apiDescription Complete the mission. A transaction will be created
   *
   * @apiParam {String} userName Owner of the mission
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
  router.post('/:userName/calibrationMission/complete', (request, response) => {
    calibrationMissionManager.completeActiveCalibrationMission({
      io,
      token: request.headers.authorization,
      owner: request.params.userName,
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
   * @api {get} /users/:userName/calibrationMission Get user's calibration mission
   * @apiVersion 6.0.0
   * @apiName GetCalibrationMission
   * @apiGroup Users
   *
   * @apiHeader {String} Authorization Your JSON Web Token
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
  router.get('/:userName/calibrationMission', (request, response) => {
    calibrationMissionManager.getActiveCalibrationMission({
      token: request.headers.authorization,
      userName: request.params.userName,
      callback: ({
        error: calibrationError,
        data: calibrationData,
      }) => {
        if (calibrationError) {
          restErrorChecker.checkAndSendError({
            response,
            error: calibrationError,
            sentData: request.body.data,
          });

          return;
        }

        response.json({ data: calibrationData });
      },
    });
  });

  return router;
}

export default handle;
