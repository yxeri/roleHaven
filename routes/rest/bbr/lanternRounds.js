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
const lanternRoundManager = require('../../../managers/bbr/lanternRounds');
const restErrorChecker = require('../../../helpers/restErrorChecker');

const router = new express.Router();

/**
 * @param {Object} io Socket io
 * @returns {Object} Router
 */
function handle(io) {
  /**
   * @api {post} /lanternRounds/time Change start or end time of round
   * @apiVersion 6.0.0
   * @apiName ChangeRoundTime
   * @apiGroup LanternRounds
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Change start or end time of round
   *
   * @apiParam {boolean} [data.endTime] End time of the round
   * @apiParam {boolean} [data.startTime] Start time of the next round
   * @apiParam {boolean} [data.isActive] Is the round active?
   * @apiParamExample {json} Request-Example:
   *   {
   *    "data": {
   *      "startTime": "2016-10-14T11:54:18.694Z",
   *      "endTime": "2016-10-14T11:54:18.694Z"
   *    }
   *  }
   *
   * @apiSuccess {Object} data
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "round": {
   *        "startTime": "2016-10-14T11:54:18.694Z",
   *        "endTime": "2016-10-14T11:54:18.694Z"
   *      }
   *    }
   *  }
   */
  router.post('/time', (request, response) => {
    const {
      isActive,
      startTime,
      endTime,
    } = request.body.data;

    lanternRoundManager.updateLanternRound({
      io,
      isActive,
      startTime,
      endTime,
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
   * @api {get} /lanternRounds Get lantern round
   * @apiVersion 6.0.0
   * @apiName GetLanternRound
   * @apiGroup LanternRounds
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Get lantern round
   *
   * @apiSuccess {Object} data
   * @apiSuccess {string[]} data.lanternRound Lantern round
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "round": {
   *        "isActive": true,
   *        "startTime": "2016-10-14T11:54:18.694Z",
   *        "endTime": "2016-10-14T11:54:18.694Z"
   *      }
   *    }
   *  }
   */
  router.get('/', (request, response) => {
    lanternRoundManager.getLanternRound({
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
