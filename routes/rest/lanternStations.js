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
const manager = require('../../helpers/manager');
const restErrorChecker = require('../../helpers/restErrorChecker');

const router = new express.Router();

/**
 * @param {Object} io Socket io
 * @returns {Object} Router
 */
function handle(io) {
  /**
   * @api {get} /lanternStations Get lantern stations
   * @apiVersion 6.0.0
   * @apiName GetLanternStations
   * @apiGroup LanternStations
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Get lantern stations
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.stations Lantern stations found
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "stations": [{
   *        "stationId": 1,
   *        "owner": "alpha"
   *        "isActive": true,
   *        "stationName:" "North forest",
   *        "signalValue": 137
   *      }, {
   *        "stationId": 2,
   *        "owner": "beta"
   *        "isActive": fale,
   *        "stationName:" "West bunker",
   *        "signalValue": 66
   *      }
   *    }
   *  }
   */
  router.get('/', (request, response) => {
    manager.getLanternStations({
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
   * @api {get} /lanternStations Get lantern station
   * @apiVersion 6.0.0
   * @apiName GetLanternStation
   * @apiGroup LanternStations
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Get lantern station
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.stations Lantern stations found
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "stations": [{
   *        "stationId": 1,
   *        "owner": "alpha"
   *        "isActive": true,
   *        "stationName:" "North forest",
   *        "signalValue": 137
   *      }, {
   *        "stationId": 2,
   *        "owner": "beta"
   *        "isActive": fale,
   *        "stationName:" "West bunker",
   *        "signalValue": 66
   *      }
   *    }
   *  }
   */
  router.get('/:stationId', (request, response) => {
    manager.getLanternStation({
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
   * @api {post} /lanternStations Create a lantern station
   * @apiVersion 6.0.0
   * @apiName CreateLanternStation
   * @apiGroup LanternStations
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Create a lantern station
   *
   * @apiParam {Object} data
   * @apiParam {string} data.station New station
   * @apiParam {number} data.station.stationId Station id
   * @apiParam {string} data.station.stationName Location name of the station
   * @apiParam {boolean} [data.station.isActive] Is the station active? Defaults to false
   * @apiParamExample {json} Request-Example:
   *   {
   *    "data": {
   *      "station": {
   *        "stationId": 1,
   *        "stationName": "North forest",
   *        "isActive": true,
   *      }
   *    }
   *  }
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.station Lantern station created
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "station": {
   *        "stationId": 1,
   *        "stationName": "North forest,
   *        "isActive": true,
   *        "signalValue": 0
   *      }
   *    }
   *  }
   */
  router.post('/', (request, response) => {
    if (!objectValidator.isValidData(request.body, { data: { station: { stationId: true, stationName: true } } })) {
      response.status(400).json({
        error: {
          status: 400,
          title: 'Missing data',
          detail: 'Unable to parse data',
        },
      });

      return;
    }

    manager.createLanternStation({
      io,
      station: request.body.data.station,
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
   * @api {post} /lanternStations/:stationId Update an existing lantern station
   * @apiVersion 6.0.0
   * @apiName UpdateLanternStation
   * @apiGroup LanternStations
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Update an existing lantern station
   *
   * @apiParam {Object} stationId Lantern station id
   *
   * @apiParam {Object} data
   * @apiParam {string} data.station Station
   * @apiParam {string} [data.station.stationName] Location name of the station
   * @apiParam {boolean} [data.station.isActive] Is the station active?
   * @apiParam {boolean} [data.station.owner] Owner name of the station
   * @apiParam {Object} [data.station.attacker] Attacker object. data.station.owner will be ignored if data.attacker is set
   * @apiParam {string} data.station.attacker.name Name of the attacker that is trying to take over the station
   * @apiParam {string} data.station.attacker.time Amount of time till the attack succeeds.
   * @apiParamExample {json} Request-Example:
   *   {
   *    "data": {
   *      "station": {
   *        "stationName": "North forest",
   *        "isActive": true,
   *        "attacker": {
   *          "name": "Bad peoples",
   *          "time": "2016-10-14T09:54:18.694Z"
   *        }
   *      }
   *    }
   *  }
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.station Updated lantern station
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "station": {
   *        "stationId": 1,
   *        "stationName": "North forest",
   *        "isActive": true,
   *        "signalValue": 0,
   *        "attacker": {
   *          "name": "Bad peoples",
   *          "time": "time": "2016-10-14T09:54:18.694Z"
   *        }
   *      }
   *    }
   *  }
   */
  router.post('/:stationId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { stationId: true })) {
      response.status(400).json({
        error: {
          status: 400,
          title: 'Missing data',
          detail: 'Unable to parse data',
        },
      });

      return;
    } else if (!objectValidator.isValidData(request.body, { data: { station: true } })) {
      response.status(400).json({
        error: {
          status: 400,
          title: 'Incorrect data',
          detail: 'Unable to parse data',
        },
      });

      return;
    }

    manager.updateLanternStation({
      io,
      stationId: request.params.stationId,
      station: request.body.data.station,
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
