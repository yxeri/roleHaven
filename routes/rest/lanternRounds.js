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
const lanternRoundManager = require('../../managers/lanternRounds');
const restErrorChecker = require('../../helpers/restErrorChecker');

const router = new express.Router();

/**
 * @param {Object} io Socket io
 * @returns {Object} Router
 */
function handle(io) {
  /**
   * @api {get} /lanternRounds Get all lantern rounds
   * @apiVersion 6.0.0
   * @apiName GetLanternRounds
   * @apiGroup LanternRounds
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Get all lantern rounds, excluding past ones
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.rounds Lantern rounds found
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "rounds": [{
   *        "roundId": 3,
   *        "startTime": "2016-10-14T09:54:18.694Z",
   *        "endTime": "2016-10-14T11:54:18.694Z",
   *      }, {
   *        "roundId": 4,
   *        "startTime": "2016-10-15T13:54:18.694Z",
   *        "endTime": "2016-10-15T15:54:18.694Z",
   *      }
   *    }
   *  }
   */
  router.get('/', (request, response) => {
    lanternRoundManager.getLanternRounds({
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
   * @api {get} /lanternRounds/:roundId Get lantern round
   * @apiVersion 6.0.0
   * @apiName GetLanternRound
   * @apiGroup LanternRounds
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Get lantern round
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.rounds Lantern rounds found
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "rounds": [{
   *        "roundId": 3,
   *        "startTime": "2016-10-14T09:54:18.694Z",
   *        "endTime": "2016-10-14T11:54:18.694Z",
   *      }, {
   *        "roundId": 4,
   *        "startTime": "2016-10-15T13:54:18.694Z",
   *        "endTime": "2016-10-15T15:54:18.694Z",
   *      }
   *    }
   *  }
   */
  router.get('/:roundId', (request, response) => {
    lanternRoundManager.getLanternRound({
      roundId: request.params.roundId,
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
   * @api {get} /lanternRounds Get active lantern round
   * @apiVersion 6.0.0
   * @apiName GetActiveLanternRound
   * @apiGroup LanternRounds
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Get active lantern round
   *
   * @apiSuccess {Object} data
   * @apiSuccess {boolean} data.noActiveRound Will be true if there is no active round
   * @apiSuccess {Object} data.round Lantern round found. Can be empty if there is no active round
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "round": {
   *        "roundId": 3,
   *        "startTime": "2016-10-14T09:54:18.694Z",
   *        "endTime": "2016-10-14T11:54:18.694Z",
   *      }
   *    }
   *  }
   */
  router.get('/active', (request, response) => {
    lanternRoundManager.getActiveLanternRound({
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
   * @api {post} /lanternRounds Create a lantern round
   * @apiVersion 6.0.0
   * @apiName CreateLanternRound
   * @apiGroup LanternRounds
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Create a lantern round
   *
   * @apiParam {Object} data
   * @apiParam {string} data.round New round
   * @apiParam {number} data.round.roundId Round id
   * @apiParam {Date} data.round.startTime When the round starts
   * @apiParam {Date} data.round.endTime When the round ends
   * @apiParamExample {json} Request-Example:
   *   {
   *    "data": {
   *      "round": {
   *        "roundId": 1,
   *        "startTime": "2016-10-14T09:54:18.694Z",
   *        "endTime": "2016-10-14T11:54:18.694Z",
   *      }
   *    }
   *  }
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.round Round created
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "round": {
   *        "roundId": 1,
   *        "startTime": "2016-10-14T09:54:18.694Z",
   *        "endTime": "2016-10-14T11:54:18.694Z",
   *      }
   *    }
   *  }
   */
  router.post('/', (request, response) => {
    if (!objectValidator.isValidData(request.body, { data: { round: { roundId: true, startTime: true, endTime: true } } })) {
      response.status(400).json({
        error: {
          status: 400,
          title: 'Missing data',
          detail: 'Unable to parse data',
        },
      });

      return;
    }

    lanternRoundManager.createLanternRound({
      round: request.body.data.round,
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
   * @api {post} /lanternRounds/:roundId/start Trigger start of a lantern round
   * @apiVersion 6.0.0
   * @apiName StartLanternRound
   * @apiGroup LanternRounds
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Start a lantern round
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.round Round started
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "round": {
   *        "roundId": 1,
   *        "startTime": "2016-10-14T09:54:18.694Z",
   *        "endTime": "2016-10-14T11:54:18.694Z",
   *      }
   *    }
   *  }
   */
  router.post('/:roundId/start', (request, response) => {
    lanternRoundManager.startLanternRound({
      roundId: request.params.roundId,
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
   * @api {post} /lanternRounds/end Trigger end of a lantern round
   * @apiVersion 6.0.0
   * @apiName EndLanternRound
   * @apiGroup LanternRounds
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription End active lantern round
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.success Did the round end properly?
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "success": true
   *    }
   *  }
   */
  router.post('/end', (request, response) => {
    lanternRoundManager.endLanternRound({
      io,
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
   * @api {post} /lanternRounds/:id Update an existing lantern round
   * @apiVersion 6.0.0
   * @apiName UpdateLanternRound
   * @apiGroup LanternRounds
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Update existing lantern round
   *
   * @apiParam {Object} roundId Lantern round id
   *
   * @apiParam {Object} data
   * @apiParam {Object} data.round Lantern round
   * @apiParam {Date} [data.round.startTime] When the round starts
   * @apiParam {Date} [data.round.endTime] When the round ends
   * @apiParamExample {json} Request-Example:
   *   {
   *    "data": {
   *      "round": {
   *        "startTime": "2016-10-14T09:54:18.694Z",
   *        "endTime": "2016-10-14T11:54:18.694Z",
   *      }
   *    }
   *  }
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.round New lantern round
   * @apiSuccess {Date} data.round.startTime When the round starts
   * @apiSuccess {Date} data.round.endTime When the round ends
   * @apiSuccess {number} data.round.roundId Id of the round
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "round": {
   *        "startTime": "2016-10-14T09:54:18.694Z",
   *        "endTime": "2016-10-14T11:54:18.694Z",
   *        "roundId": 1
   *      }
   *    }
   *  }
   */
  router.post('/:roundId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { roundId: true })) {
      response.status(400).json({
        error: {
          status: 400,
          title: 'Missing data',
          detail: 'Unable to parse data',
        },
      });

      return;
    } else if (!objectValidator.isValidData(request.body, { data: { round: true } })) {
      response.status(400).json({
        error: {
          status: 400,
          title: 'Incorrect data',
          detail: 'Unable to parse data',
        },
      });

      return;
    }


    const { startTime, endTime } = request.body.data.round;
    const roundId = request.params.roundId;

    lanternRoundManager.updateLanternRound({
      roundId,
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

  return router;
}

module.exports = handle;
