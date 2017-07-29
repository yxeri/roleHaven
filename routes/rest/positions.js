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
const positionManager = require('../../managers/positions');
const restErrorChecker = require('../../helpers/restErrorChecker');

const router = new express.Router();

/**
 * @param {object} io - Socket.IO
 * @returns {Object} Router
 */
function handle(io) {
  /**
   * @api {post} /positions/ Create or update position
   * @apiVersion 6.0.0
   * @apiName UpdatePosition
   * @apiGroup Positions
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Update position. It will create a new position if it doesn't exist
   *
   * @apiParam {Object} data
   * @apiParam {Object} data.position
   * @apiParam {string} data.markerType Type of position
   * @apiParam {string[]} data.description Text shown to client
   * @apiParam {string} data.positionName Name of the position
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
   * @apiSuccess {Object} data.positions New or updated position
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "position": {
   *        "positionName": "rez",
   *        "lastUpdated": "2016-10-25T16:55:34.309Z",
   *        "markerType": "user",
   *        "coordinates": {
   *          "longitude": 55.401,
   *          "latitude": 12.0041,
   *          "accuracy": 50
   *          "speed": null,
   *          "heading": null
   *        }
   *      }
   *    }
   *  }
   */
  router.post('/', (request, response) => {
    if (!objectValidator.isValidData(request.body, { data: true })) {
      response.status(400).json({
        error: {
          status: 400,
          title: 'Missing data',
          detail: 'Unable to parse data',
        },
      });
    }

    positionManager.updatePosition({
      io,
      position: request.body.data.position,
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
   * @api {post} /positions Get positions
   * @apiVersion 6.0.0
   * @apiName GetPositions
   * @apiGroup Positions
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Gets positions
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.positions Positions found
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
  router.get('/', (request, response) => {
    positionManager.getAllPositions({
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
