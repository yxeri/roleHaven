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
const appConfig = require('../../config/defaults/config').app;
const jwt = require('jsonwebtoken');
const objectValidator = require('../../utils/objectValidator');
const dbConfig = require('../../config/defaults/config').databasePopulation;
const dbLanternHack = require('../../db/connectors/lanternhack');
const errorCreator = require('../../objects/error/errorCreator');

const router = new express.Router();

/**
 * @param {Object} io Socket io
 * @returns {Object} Router
 */
function handle(io) {
  /**
   * @api {get} /lanternStations Get all lantern stations
   * @apiVersion 6.0.0
   * @apiName GetLanternStations
   * @apiGroup LanternStations
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Get all lantern stations
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
  router.get('/', (req, res) => {
    // noinspection JSUnresolvedVariable
    const auth = req.headers.authorization || '';

    jwt.verify(auth, appConfig.jsonKey, (jwtErr, decoded) => {
      if (jwtErr || !decoded) {
        res.status(401).json({
          error: {
            status: 401,
            title: 'Unauthorized',
            detail: 'Invalid token',
          },
        });

        return;
      }

      dbLanternHack.getAllStations({
        callback: ({ error, data }) => {
          if (error) {
            res.status(500).json({
              error: {
                status: 500,
                title: 'Internal Server Error',
                detail: 'Internal Server Error',
              },
            });

            return;
          }

          const { stations } = data;

          res.json({ data: { stations } });
        },
      });
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
  router.post('/', (req, res) => {
    if (!objectValidator.isValidData(req.body, { data: { station: { stationId: true, stationName: true } } })) {
      res.status(400).json({
        error: {
          status: 400,
          title: 'Missing data',
          detail: 'Unable to parse data',
        },
      });

      return;
    }

    // noinspection JSUnresolvedVariable
    const auth = req.headers.authorization || '';

    jwt.verify(auth, appConfig.jsonKey, (jwtErr, decoded) => {
      if (jwtErr || !decoded || decoded.data.accessLevel < dbConfig.apiCommands.CreateLanternStation.accessLevel) {
        res.status(401).json({
          error: {
            status: 401,
            title: 'Unauthorized',
            detail: 'Invalid token',
          },
        });

        return;
      }

      const station = req.body.data.station;

      dbLanternHack.createStation({
        station,
        callback: ({ error, data }) => {
          if (error) {
            if (error.type === errorCreator.ErrorTypes.ALREADYEXISTS) {
              res.status(403).json({
                error: {
                  status: 403,
                  title: 'Station already exists',
                  detail: `Station with id ${station.stationId} already exists`,
                },
              });

              return;
            }

            res.status(500).json({
              error: {
                status: 500,
                title: 'Internal Server Error',
                detail: 'Internal Server Error',
              },
            });

            return;
          }

          io.emit('lanternStations', { stations: [data.station] });
          res.json({ data: { station: data.station } });
        },
      });
    });
  });

  /**
   * @api {post} /lanternStations/:id Update an existing lantern station
   * @apiVersion 6.0.0
   * @apiName UpdateLanternStation
   * @apiGroup LanternStations
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Update an existing lantern station
   *
   * @apiParam {Object} id Lantern station id
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
  router.post('/:id', (req, res) => {
    if (!objectValidator.isValidData(req.params, { id: true })) {
      res.status(400).json({
        error: {
          status: 400,
          title: 'Missing data',
          detail: 'Unable to parse data',
        },
      });

      return;
    } else if (!objectValidator.isValidData(req.body, { data: { station: true } })) {
      res.status(400).json({
        error: {
          status: 400,
          title: 'Incorrect data',
          detail: 'Unable to parse data',
        },
      });

      return;
    }

    // noinspection JSUnresolvedVariable
    const auth = req.headers.authorization || '';

    jwt.verify(auth, appConfig.jsonKey, (jwtErr, decoded) => {
      if (jwtErr || !decoded || decoded.data.accessLevel < dbConfig.apiCommands.UpdateLanternStation.accessLevel) {
        res.status(401).json({
          error: {
            status: 401,
            title: 'Unauthorized',
            detail: 'Invalid token',
          },
        });

        return;
      }

      const { attacker, isActive, stationName, owner } = req.body.data.station;
      const stationId = req.params.id;

      dbLanternHack.updateLanternStation({
        attacker,
        stationId,
        isActive,
        stationName,
        owner,
        callback: ({ error: updateError, data: updateData }) => {
          if (updateError) {
            if (updateError.type === errorCreator.ErrorTypes.DOESNOTEXIST) {
              res.status(404).json({
                error: {
                  status: 404,
                  title: 'Lantern station does not exist',
                  detail: 'Lantern station does not exist',
                },
              });

              return;
            }

            res.status(500).json({
              error: {
                status: 500,
                title: 'Internal Server Error',
                detail: 'Internal Server Error',
              },
            });

            return;
          }

          io.emit('lanternStations', { stations: [updateData.station] });
          res.json({ data: { station: updateData.station } });
        },
      });
    });
  });

  return router;
}

module.exports = handle;
