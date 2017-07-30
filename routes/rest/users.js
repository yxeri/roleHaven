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
const positionManager = require('../../managers/positions');
const roomManager = require('../../managers/rooms');
const aliasManager = require('../../managers/aliases');
const calibrationMissionManager = require('../../managers/calibrationMissions');
const teamManager = require('../../managers/teams');
const restErrorChecker = require('../../helpers/restErrorChecker');
const errorCreator = require('../../objects/error/errorCreator');
const gameCodeManager = require('../../managers/gameCodes');

const router = new express.Router();

/**
 * @param {Object} io Socket.io
 * @returns {Object} Router
 */
function handle(io) {
  /**
   * @api {get} /users/positions Get all user positions
   * @apiVersion 6.0.0
   * @apiName GetUserPositions
   * @apiGroup Users
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Retrieve the positions from all users, that the user is allowed to see
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.positions Found user positions
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "positions": [
   *        {
   *          "positionName": "rez",
   *          "lastUpdated": "2016-10-25T16:55:34.309Z",
   *          "markerType": "user",
   *          "coordinates": {
   *            "latitude": 42.3625069,
   *            "longitude": 22.0114096,
   *            "speed": null,
   *            "accuracy": 1889,
   *            "heading": null
   *          }
   *        }
   *      ]
   *    }
   *  }
   */
  router.get('/positions', (request, response) => {
    positionManager.getAllUserPositions({
      token: request.headers.authorization,
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
   * @api {get} /users/:userName/gameCodes/profile Get user's one-time profile game code
   * @apiVersion 6.0.0
   * @apiName GetProfileGameCode
   * @apiGroup Users
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Get user's one-time profile game code
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.gameCode Found profile game code
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "gameCode": {
   *        "owner": "raz",
   *        "code": 123456,
   *        "codeType": "profile,
   *        renewable: true
   *      }
   *    }
   *  }
   */
  router.get('/:userName/gameCodes/profile', (request, response) => {
    if (!objectValidator.isValidData(request.params, { userName: true })) {
      restErrorChecker({ response, error: new errorCreator.InvalidData({ expected: 'params: { userName}' }) });

      return;
    }

    gameCodeManager.getProfileGameCode({
      owner: request.params.userName,
      token: request.headers.authorization,
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
   * @api {get} /users/:userName/gameCodes/ Get user's game codes
   * @apiVersion 6.0.0
   * @apiName GetGameCodes
   * @apiGroup Users
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Get user's game codes
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.gameCodes Found Found game codes
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "gameCodes": [{
   *        "owner": "raz",
   *        "code": 123456,
   *        "codeType": "profile",
   *        renewable: true
   *      }, {
   *        "owner": "raz",
   *        "code": 654321,
   *        "codeType": "custom",
   *        renewable: true
   *      }]
   *    }
   *  }
   */
  router.get('/:userName/gameCodes', (request, response) => {
    gameCodeManager.getGameCodes({
      token: request.headers.authorization,
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
   * @api {post} /users/:userName/gameCodes/:codeType Create new game code
   * @apiVersion 6.0.0
   * @apiName CreateGameCode
   * @apiGroup Users
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Create game code
   *
   * @apiParam {string} userName Name of the user
   * @apiParam {string}
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.gameCode New game code
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "gameCodes": [{
   *        "owner": "raz",
   *        "code": 123456,
   *        "codeType": "profile",
   *        renewable: false
   *      }, {
   *        "owner": "raz",
   *        "code": 654321,
   *        "codeType": "custom",
   *        renewable: false
   *      }]
   *    }
   *  }
   */
  router.post('/:userName/gameCodes/:codeType', (request, response) => {
    gameCodeManager.createGameCode({
      owner: request.params.userName,
      codeType: request.params.codeType,
      token: request.headers.authorization,
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
   * @api {get} /users/:partialName/match Match partial user name
   * @apiVersion 6.0.0
   * @apiName MatchUserName
   * @apiGroup Users
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Match partial user name
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.matches Matches found
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "matches": ["baz", "bah1"],
   *    }
   *  }
   */
  router.get('/:partialName/match', (request, response) => {
    if (!objectValidator.isValidData(request.params, { partialName: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '{ partialName }' }), sentData: request.body.data });

      return;
    }

    userManager.matchPartialUserName({
      partialName: request.params.partialName,
      token: request.headers.authorization,
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
   * @api {get} /users/:userName/position Retrieve specific user position
   * @apiVersion 6.0.0
   * @apiName GetUserPosition
   * @apiGroup Users
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Retrieve the position for a specific user
   *
   * @apiParam {String} id Name of the user
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.positions Found user position
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "positions": [
   *        {
   *          "positionName": "rez",
   *          "lastUpdated": "2016-10-25T16:55:34.309Z",
   *          "markerType": "user",
   *          "coordinates": {
   *            "latitude": 42.3625069,
   *            "longitude": 22.0114096,
   *            "speed": null,
   *            "accuracy": 1889,
   *            "heading": null
   *          }
   *        }
   *      ]
   *    }
   *  }
   */
  router.get('/:userName/position', (request, response) => {
    if (!objectValidator.isValidData(request.params, { userName: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '{ userName }' }), sentData: request.body.data });

      return;
    }

    positionManager.getUserPosition({
      userName: request.params.userName,
      token: request.headers.authorization,
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
   * @api {post} /users/:userName/position Set position for user
   * @apiVersion 6.0.0
   * @apiName SetUserPosition
   * @apiGroup Positions
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Set a new position for the user
   *
   * @apiParam {Object} data
   * @apiParam {Object} data.position
   * @apiParam {Object} data.position.coordinates
   * @apiParam {Number} data.position.coordinates.longitude Longitude
   * @apiParam {Number} data.position.coordinates.latitude Latitude
   * @apiParam {Number} [data.position.coordinates.accuracy] Accuracy (in meters) for the position. Will be defaulted if not set
   * @apiParam {Number} [data.position.coordinates.speed] Velocity (meters per second) of the unit being tracked
   * @apiParam {Number} [data.position.coordinates.heading] Heading of the unit being tracked. Extressed in degrees. 0 indicates true north, 90 east, 270 west)
   * @apiParamExample {json} Request-Example:
   *   {
   *    "data": {
   *      "position": {
   *        "coordinates": {
   *          "longitude": 55.401,
   *          "latitude": 12.0041
   *        }
   *      }
   *    }
   *  }
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.positions New position for the user
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "positions": [
   *        {
   *          "positionName": "rez",
   *          "lastUpdated": "2016-10-25T16:55:34.309Z",
   *          "markerType": "user",
   *          "coordinates": {
   *            "longitude": 55.401,
   *            "latitude": 12.0041,
   *            "accuracy": 50
   *            "speed": null,
   *            "heading": null
   *          }
   *        }
   *      ]
   *    }
   *  }
   */
  router.post('/:userName/position', (request, response) => {
    if (!objectValidator.isValidData(request.params, { userName: true }) || !objectValidator.isValidData(request.body, { data: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'params: { userName }, body: { data }' }), sentData: request.body.data });

      return;
    }

    positionManager.updateUserPosition({
      io,
      position: request.body.data.position,
      token: request.headers.authorization,
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
   * @api {get} /users/banned Retrieve banned users
   * @apiVersion 6.0.0
   * @apiName GetBannedUsers
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
  router.get('/banned', (request, response) => {
    userManager.getBannedUsers({
      token: request.headers.authorization,
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
    userManager.getUsers({
      token: request.headers.authorization,
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
   * @api {post} /users/:userName/password/reset Request user password reset
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
  router.post('/:userName/password/reset', (request, response) => {
    if (!objectValidator.isValidData(request.params, { userName: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'params: { userName }' }), sentData: request.body.data });

      return;
    }

    userManager.sendPasswordReset({
      token: request.headers.authorization,
      userName: request.params.userName,
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
   * @api {post} /users/:userName/password Update user password
   * @apiVersion 6.0.0
   * @apiName ChangePassword
   * @apiGroup Users
   *
   * @apiHeader {string} Authorization Your JSON Web Token
   *
   * @apiDescription
   *
   * @apiParam {string} userName User name of the user that will receive a new password
   *
   * @apiParam {Object} data
   * @apiParam {string} data.key Event key
   * @apiParam {string} data.password New password
   * @apiParamExample {json} Request-Example:
   *   {
   *    "data": {
   *      "key": "40gt843yhg9u",
   *      "password": "1234"
   *    }
   *  }
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.success Was the password properly changed?
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "success": true
   *    }
   *  }
   */
  router.post('/:userName/password', (request, response) => {
    if (!objectValidator.isValidData(request.body, { data: true }) || !objectValidator.isValidData(request.params, { userName: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'params: { userName }, body: { data }' }), sentData: request.body.data });

      return;
    }

    const { key, password } = request.body.data;

    userManager.changePassword({
      key,
      password,
      userName: request.params.userName,
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
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'body: { data: { user } }' }), sentData: request.body.data });

      return;
    }

    const newUser = request.body.data.user;
    newUser.registerDevice = 'RESTAPI';

    userManager.createUser({
      user: newUser,
      token: request.headers.authorization,
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
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'params: { userName }' }), sentData: request.body.data });

      return;
    }

    userManager.getUser({
      token: request.headers.authorization,
      userName: request.params.userName,
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
    if (!objectValidator.isValidData(request.params, { userName: true, roomName: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'params: { userName, roomName }' }), sentData: request.body.data });

      return;
    }

    const password = request.body.data && request.body.data.room ? request.body.data.room.password : undefined;

    roomManager.followRoom({
      io,
      token: request.headers.authorization,
      user: { userName: request.params.userName },
      room: { roomName: request.params.roomName, password },
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
    if (!objectValidator.isValidData(request.params, { userName: true, roomName: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'params: { userName, roomName }' }), sentData: request.body.data });

      return;
    }

    roomManager.unfollowRoom({
      io,
      token: request.headers.authorization,
      user: { userName: request.params.userName },
      room: { roomName: request.params.roomName },
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
   * @api {get} /users/:userName/aliases/:partialName/match Match partial alias name
   * @apiVersion 6.0.0
   * @apiName MatchAlias
   * @apiGroup Users
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Match partial alias name
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.matches Matches found
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "matches": ["baz", "bah1"],
   *    }
   *  }
   */
  router.get('/:userName/aliases/:partialName/match', (request, response) => {
    if (!objectValidator.isValidData(request.params, { userName: true, partialName: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'params: { userName, partialName }' }), sentData: request.body.data });

      return;
    }

    aliasManager.matchPartialAlias({
      partialName: request.params.partialName,
      token: request.headers.authorization,
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
   * @api {get} /users/:userName/aliases Get aliases from user
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
    aliasManager.getAliases({
      user: { userName: request.params.userName },
      token: request.headers.authorization,
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
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '' }), sentData: request.body.data });

      return;
    }

    aliasManager.createAlias({
      token: request.headers.authorization,
      alias: request.body.data.alias,
      user: { userName: request.params.userName },
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
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '' }), sentData: request.body.data });

      return;
    }


    teamManager.inviteToTeam({
      io,
      token: request.headers.authorization,
      to: request.params.userName,
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
   * @api {post} /users/:userName/calibrationMission/cancel Cancel user's mission
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
    calibrationMissionManager.cancelActiveCalibrationMission({
      io,
      token: request.headers.authorization,
      owner: request.params.userName,
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
