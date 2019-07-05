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
const objectValidator = require('../../../utils/objectValidator');
const restErrorChecker = require('../../../helpers/restErrorChecker');
const errorCreator = require('../../../error/errorCreator');
const gameItemManager = require('../../../managers/bbr/gameItems');

const router = new express.Router();


/**
 * @returns {Object} Router
 */
function handle() {
  /**
   * @api {post} /gameItems/gameUsers Create game users
   * @apiVersion 6.0.0
   * @apiName CreateGameUsers
   * @apiGroup GameItems
   *
   * @apiHeader {string} Authorization Your JSON Web Token
   *
   * @apiDescription Create game users
   *
   * @apiParam {Object} data
   * @apiParam {Object[]} data.gameUsers Game users to add
   * @apiParam {string} data.gameUsers[].userName Name of the user
   * @apiParam {string[]} data.gameUsers[].passwords Passwords that will be randomised on retrieval
   * @apiParam {number} data.gameUsers[].stationId ID of station that the user is connected to
   * @apiParamExample {json} Request-Example:
   *   {
   *     "data": {
   *      "gameUsers": [{
   *        userName: 'createdgameuser',
   *        passwords: ['banan', 'apple', 'honey'],
   *        stationId: 1,
   *      }, {
   *        userName: 'othergameuser',
   *        passwords: ['pizza', 'hamburger', 'meatball'],
   *        stationId: 1,
   *      }]
   *    }
   *  }
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.gameUsers Game users created
   * @apiSuccessExample {json} Success-Response:
   *   {
   *     "data": {
   *      "gameUsers": [{
   *        userName: 'createdgameuser',
   *        passwords: ['banan', 'apple', 'honey'],
   *        stationId: 1,
   *      }, {
   *        userName: 'othergameuser',
   *        passwords: ['pizza', 'hamburger', 'meatball'],
   *        stationId: 1,
   *      }]
   *    }
   *  }
   */
  router.post('/gameUsers', (request, response) => {
    if (!objectValidator.isValidData(request.body, { data: { gameUsers: true } })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '' }), sentData: request.body.data });

      return;
    }

    gameItemManager.createGameUsers({
      token: request.headers.authorization,
      gameUsers: request.body.data.gameUsers,
      callback: ({ error, data }) => {
        if (error) {
          restErrorChecker.checkAndSendError({ response, error });

          return;
        }

        response.json({ data });
      },
    });
  });

  router.get('/gameUsers', (request, response) => {
    gameItemManager.getGameUsers({
      stationId: 1,
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
   * @api {post} /gameItems/fakePasswords Create fake passwords
   * @apiVersion 6.0.0
   * @apiName CreateFakePasswords
   * @apiGroup GameItems
   *
   * @apiHeader {string} Authorization Your JSON Web Token
   *
   * @apiDescription Create fake passwords
   *
   * @apiParam {Object} data
   * @apiParam {string[]} data.passwords Fake passwords
   * @apiParamExample {json} Request-Example:
   *   {
   *     "data": {
   *      "passwords": [
   *        "computer",
   *        "banan",
   *        "apple",
   *        "razor"
   *      ]
   *    }
   *  }
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.passwords Fake passwords created
   * @apiSuccessExample {json} Success-Response:
   *   {
   *     "data": {
   *      "passwords": [
   *        "computer",
   *        "banan",
   *        "apple",
   *        "razor"
   *      ]
   *    }
   *  }
   */
  router.post('/fakePasswords', (request, response) => {
    if (!objectValidator.isValidData(request.body, { data: { passwords: true } })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '' }), sentData: request.body.data });

      return;
    }

    gameItemManager.createFakePasswords({
      token: request.headers.authorization,
      passwords: request.body.data.passwords,
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
   * @api {get} /gameItems/gameUsers/:stationId Get game users by station ID
   * @apiVersion 6.0.0
   * @apiName GetGameUsers
   * @apiGroup GameItems
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Get game users by station ID
   *
   * @apiParam {number} stationId Station ID that will be matched against users
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.gameUsers Game users retrieved
   * @apiSuccessExample {json} Success-Response:
   *   {
   *     "data": {
   *      "gameUsers": [{
   *        userName: 'createdgameuser',
   *        passwords: ['banan', 'apple', 'honey'],
   *        stationId: 1,
   *      }, {
   *        userName: 'othergameuser',
   *        passwords: ['pizza', 'hamburger', 'meatball'],
   *        stationId: 1,
   *      }]
   *    }
   *  }
   */
  router.get('/gameUsers/:stationId', (request, response) => {
    gameItemManager.getGameUsers({
      stationId: request.params.stationId,
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
   * @api {get} /gameItems/fakePasswords Get fake passwords
   * @apiVersion 6.0.0
   * @apiName GetFakePasswords
   * @apiGroup GameItems
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Get fake passwords
   *
   * @apiSuccess {Object} data
   * @apiSuccess {string[]} data.fakePasswords Fake passwords retrieved
   * @apiSuccessExample {json} Success-Response:
   *   {
   *     "data": {
   *      "fakePasswords": [
   *        "computer",
   *        "banan",
   *        "apple",
   *        "razor"
   *      ]
   *    }
   *  }
   */
  router.get('/fakePasswords', (request, response) => {
    gameItemManager.getFakePasswords({
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

  return router;
}

module.exports = handle;
