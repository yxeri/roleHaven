/*
 Copyright 2015 Aleksandar Jankovic

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
const manager = require('../../helpers/manager');
const restErrorChecker = require('../../helpers/restErrorChecker');

const router = new express.Router();

/**
 * @param {Object} io Socket.io
 * @returns {Object} Router
 */
function handle(io) {
  /**
   * @api {get} /users Retrieve users
   * @apiVersion 6.0.0
   * @apiName GetUsers
   * @apiGroup Users
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Retrieve users
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.users Users found
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "users": [
   *        {
   *          "userName": "rez",
   *          "team": "n4",
   *          "online": true
   *        },
   *        {
   *          "userName": "raz",
   *          "online": false
   *        }
   *      ]
   *    }
   *  }
   */
  router.get('/', (request, response) => {
    manager.getUsers({
      token: request.headers.authorization,
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
   * @api {post} /users/:userName/resetPassword Request user password reset
   * @apiVersion 6.0.0
   * @apiName RequestPasswordRecovery
   * @apiGroup Users
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Request user password reset. A mail will be sent to the user's registered mail address
   *
   * @apiParam {String} userName User name of the user that will receive a password recovery mail
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.success Was the reset mail properly sent?
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "success": true
   *    }
   *  }
   */
  router.post('/:userName/resetPassword', (request, response) => {
    if (!objectValidator.isValidData(request.params, { userName: true })) {
      response.status(400).json({
        error: {
          status: 400,
          title: 'Missing data',
          detail: 'Unable to parse data',
        },
      });

      return;
    }

    manager.sendPasswordReset({
      token: request.headers.authorization,
      userName: request.params.userName,
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
   * @api {post} /users Create a user
   * @apiVersion 6.0.0
   * @apiName CreateUser
   * @apiGroup Users
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Create a user
   *
   * @apiParam {Object} data
   * @apiParam {Object} data.user User
   * @apiParam {string} data.user.userName User name
   * @apiParam {string} data.user.password Password of the user
   * @apiParam {string} data.user.mail Mail address to the user
   * @apiParam {string} [data.user.fullName] Full name of the user. Defaults to userName
   * @apiParam {boolean} [data.user.lootable] Is the user's device lootable? Default is false
   * @apiParamExample {json} Request-Example:
   *   {
   *    "data": {
   *      "user": {
   *        "userName": "rez",
   *        "password": "password"
   *        "fullName": "Mr. X"
   *      }
   *    }
   *  }
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.users User created
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "user": {
   *        "userName": "rez",
   *        "fullName": "Mr. X"
   *      }
   *    }
   *  }
   */
  router.post('/', (request, response) => {
    if (!objectValidator.isValidData(request.body, { data: { user: true } })) {
      response.status(400).json({
        error: {
          status: 400,
          title: 'Missing data',
          detail: 'Unable to parse data',
        },
      });

      return;
    }

    const newUser = request.body.data.user;
    newUser.registerDevice = 'RESTAPI';

    manager.createUser({
      user: newUser,
      token: request.headers.authorization,
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
   * @api {get} /users/:userName Get a specific user
   * @apiVersion 6.0.0
   * @apiName GetUser
   * @apiGroup Users
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Retrieve a specific user
   *
   * @apiParam {String} userName User name
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.user Found user. Empty if no user was found
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "user": {
   *      }
   *    }
   *  }
   */
  router.get('/:userName', (request, response) => {
    if (!objectValidator.isValidData(request.params, { userName: true })) {
      response.status(400).json({
        error: {
          status: 400,
          title: 'Missing data',
          detail: 'Unable to parse data',
        },
      });

      return;
    }

    manager.getUser({
      token: request.headers.authorization,
      userName: request.params.userName,
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
   * @api {post} /users/:userName/rooms/:roomName/follow Follow a room
   * @apiVersion 6.0.0
   * @apiName FollowRoom
   * @apiGroup Users
   *
   * @apiHeader {string} Authorization Your JSON Web Token
   *
   * @apiDescription Follow a room
   *
   * @apiParam {Object} data
   * @apiParam {string} [data.room.password] Password for the room
   * @apiParamExample {json} Request-Example:
   *   {
   *    "data": {
   *      "room": {
   *        "password": "password"
   *      }
   *    }
   *  }
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.room Room
   * @apiSuccess {String} data.room.roomName Name of the room that is followed
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "room": {
   *        "roomName": "broom"
   *      }
   *    }
   *  }
   */
  router.post('/:userName/rooms/:roomName/follow', (request, response) => {
    const password = request.body.data && request.body.data.room ? request.body.data.room.password : undefined;

    manager.followRoom({
      io,
      token: request.headers.authorization,
      user: { userName: request.params.userName },
      room: { roomName: request.params.roomName, password },
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
   * @api {post} /users/:userName/rooms/:roomName/unfollow Unfollow a room
   * @apiVersion 6.0.0
   * @apiName UnfollowRoom
   * @apiGroup Users
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Unfollow a room
   *
   * @apiParam {Object} userName User name of the user that will unfollow the room
   * @apiParam {Object} roomName name of the room to unfollow
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.room Room
   * @apiSuccess {String} data.room.roomName Name of the room that was unfollowed
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "room": {
   *        "roomName": "bb1"
   *      }
   *    }
   *  }
   */
  router.post('/:userName/rooms/:roomName/unfollow', (request, response) => {
    manager.unfollowRoom({
      io,
      token: request.headers.authorization,
      user: { userName: request.params.userName },
      room: { roomName: request.params.roomName },
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
   * @api {get} /aliases/users/:userName/aliases Get aliases from user
   * @apiVersion 6.0.0
   * @apiName GetUserAliases
   * @apiGroup Users
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Get aliases from user
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.aliases Aliases found
   * @apiSuccess {Object} data.userName User name
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "aliases": ["baz", "h1"],
   *      "userName": "raz"
   *    }
   *  }
   */
  router.get('/:userName/aliases', (request, response) => {
    manager.getAliases({
      user: { userName: request.params.userName },
      token: request.headers.authorization,
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
   * @api {post} /:userName/aliases/ Create an alias for the user
   * @apiVersion 6.0.0
   * @apiName CreateAlias
   * @apiGroup Users
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Create an alias for the user
   *
   * @apiParam {string} userName Name of the user to receive new alias
   *
   * @apiParam {Object} data
   * @apiParam {string} data.alias Alias
   * @apiParamExample {json} Request-Example:
   *   {
   *    "data": {
   *      "userName": "bananaman",
   *      "alias": "raz"
   *    }
   *  }
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.alias Alias created
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "alias": "raz"
   *    }
   *  }
   */
  router.post('/:userName/aliases', (request, response) => {
    if (!objectValidator.isValidData(request.body, { data: { alias: true } })) {
      response.status(400).json({
        error: {
          status: 400,
          title: 'Missing data',
          detail: 'Unable to parse data',
        },
      });

      return;
    }

    manager.createAlias({
      token: request.headers.authorization,
      alias: request.body.data.alias,
      user: { userName: request.params.userName },
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
    manager.getActiveCalibrationMission({
      token: request.headers.authorization,
      userName: request.params.userName,
      callback: ({ error: calibrationError, data: calibrationData }) => {
        if (calibrationError) {
          restErrorChecker.checkAndSendError({ response, error: calibrationError });

          return;
        }

        response.json({ data: calibrationData });
      },
    });
  });

  /**
   * @api {post} /users/:userName/teamInvite Invite user to team
   * @apiVersion 6.0.0
   * @apiName InviteToTeam
   * @apiGroup Users
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription userName Invite user to team
   *
   * @apiParam {String} userName Name of the user to invite
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.room Invitation created
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "invitation": {
   *        "invitationType": "team",
   *        "itemName": "bravo team",
   *        "sender": "raz",
   *        "time": "2016-10-14T09:54:18.694Z"
   *      },
   *      "to": "yathzee"
   *    }
   *  }
   */
  router.post('/:userName/teamInvite', (request, response) => {
    if (!objectValidator.isValidData(request.params, { userName: true })) {
      response.status(400).json({
        error: {
          status: 400,
          title: 'Missing data',
          detail: 'Unable to parse data',
        },
      });

      return;
    }


    manager.inviteToTeam({
      io,
      token: request.headers.authorization,
      to: request.params.userName,
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
   * @api {post} /users/:userName/calibrationMission/complete Complete a mission
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
    manager.completeActiveCalibrationMission({
      io,
      token: request.headers.authorization,
      owner: request.params.userName,
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
   * @api {post} /users/:userName/calibrationMission/cancel Cancel a mission
   * @apiVersion 6.0.0
   * @apiName CancelCalibrationMission
   * @apiGroup Users
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Cancel a calibration mission. Mission will still be set to completed, but no transaction will be created
   *
   * @apiParam {String} userName Owner of the mission
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
  router.post('/:userName/calibrationMission/cancel', (request, response) => {
    manager.cancelActiveCalibrationMission({
      io,
      token: request.headers.authorization,
      owner: request.params.userName,
      callback: ({ error, data }) => {
        if (error) {
          restErrorChecker.checkAndSendError({ response, error });

          return;
        }

        response.json({ data });
      },
    });
  });

  return router;
}

module.exports = handle;
