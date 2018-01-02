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
const calibrationMissionsManager = require('../../managers/calibrationMissions');
const restErrorChecker = require('../../helpers/restErrorChecker');
const objectValidator = require('../../utils/objectValidator');
const errorCreator = require('../../objects/error/errorCreator');

const router = new express.Router();

/**
 * @param {Object} io Socket.io
 * @returns {Object} Router
 */
function handle(io) {
  /**
   * @api {get} /calibrationMissions/ Get all calibration missions
   * @apiVersion 6.0.0
   * @apiName GetCalibrationMissions
   * @apiGroup CalibrationMissions
   *
   * @apiHeader {string} Authorization Your JSON Web Token
   *
   * @apiDescription Get all calibration missions
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.mission Missions found
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "missions": [{
   *        owner: 'raz',
   *        stationId: 1,
   *        code: 81855211,
   *        completed: false,
   *      }, {
   *        owner: 'mina',
   *        stationId: 2,
   *        code: 81844411,
   *        completed: false,
   *      }]
   *    }
   *  }
   */
  router.get('/', (request, response) => {
    calibrationMissionsManager.getCalibrationMissions({
      token: request.headers.authorization,
      getInactive: true,
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
   * @api {delete} /calibrationMissions/ Delete all calibration missions for a specific station
   * @apiVersion 6.0.0
   * @apiName RemoveCalibrationMissionsByStationId
   * @apiGroup CalibrationMissions
   *
   * @apiHeader {string} Authorization Your JSON Web Token
   *
   * @apiDescription Delete all calibration missions for a specific station
   *
   * @apiParam {Object} data
   * @apiParam {string} data.alias Alias
   * @apiParamExample {json} Request-Example:
   *   {
   *    "data": {
   *      "stationId": 1
   *    }
   *  }
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.mission Missions found
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "success": true
   *    }
   *  }
   */
  router.delete('/', (request, response) => {
    if (!objectValidator.isValidData(request.body, { data: { stationId: true } })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '' }), sentData: request.body.data });

      return;
    }

    calibrationMissionsManager.removeCalibrationMissionsById({
      io,
      stationId: request.body.data.stationId,
      token: request.headers.authorization,
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
   * @api {get} /calibrationMissions/active Get all active calibration missions
   * @apiVersion 6.0.0
   * @apiName GetActiveCalibrationMissions
   * @apiGroup CalibrationMissions
   *
   * @apiHeader {string} Authorization Your JSON Web Token
   *
   * @apiDescription Get all active calibration missions
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.mission Missions found
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "missions": [{
   *        owner: 'raz',
   *        stationId: 1,
   *        code: 81855211,
   *        completed: false,
   *      }, {
   *        owner: 'mina',
   *        stationId: 2,
   *        code: 81844411,
   *        completed: true,
   *        timeCompleted: "2016-10-28T22:42:06.262Z"
   *      }]
   *    }
   *  }
   */
  router.get('/active', (request, response) => {
    calibrationMissionsManager.getCalibrationMissions({
      token: request.headers.authorization,
      callback: ({ error: calibrationError, data: calibrationData }) => {
        if (calibrationError) {
          restErrorChecker.checkAndSendError({ response, error: calibrationError, sentData: request.body.data });

          return;
        }

        response.json({ data: calibrationData });
      },
    });
  });

  return router;
}

module.exports = handle;
