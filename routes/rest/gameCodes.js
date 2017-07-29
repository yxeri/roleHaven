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
const restErrorChecker = require('../../helpers/restErrorChecker');
const gameCodeManager = require('../../managers/gameCodes');
const errorCreator = require('../../objects/error/errorCreator');
const objectValidator = require('../../utils/objectValidator');

const router = new express.Router();

/**
 * @param {Object} io Socket.io
 * @returns {Object} Router
 */
function handle(io) {
  /**
   * @api {post} /gameCodes/:code/use Use game code
   * @apiVersion 6.0.0
   * @apiName UseGameCode
   * @apiGroup GameCodes
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Use game code
   *
   * @apiParam {string} code Code for game code
   *
   * @apiParam {Object} data
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
   * @apiSuccess {Object[]} data.gameCode New game code
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "reward": {
   *        "amount": 2
   *      }
   *    }
   *  }
   */
  router.post('/:code/use', (request, response) => {
    if (!objectValidator.isValidData(request.params, { code: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'params: { code }' }) });

      return;
    }

    gameCodeManager.useGameCode({
      io,
      code: request.params.code,
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
