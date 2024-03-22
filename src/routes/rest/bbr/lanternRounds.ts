'use strict';

import express from 'express';
import restErrorChecker from '../../../helpers/restErrorChecker';
import lanternRoundManager from '../../../managers/bbr/lanternRounds';

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

  return router;
}

export default handle;
