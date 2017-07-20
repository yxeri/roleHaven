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
const dbConfig = require('../../config/defaults/config').databasePopulation;
const objectValidator = require('../../utils/objectValidator');
const errorCreator = require('../../objects/error/errorCreator');
const manager = require('../../helpers/manager');
const authenticator = require('../../helpers/authenticator');

const router = new express.Router();

/**
 * @param {Object} io Socket.io
 * @returns {Object} Router
 */
function handle(io) {
  /**
   * @api {get} /calibrationMissions Get user's active calibration mission
   * @apiVersion 6.0.0
   * @apiName GetCalibrationMission
   * @apiGroup CalibrationMissions
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Get all of user's active calibration missions
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
  router.get('/', (req, res) => {
    authenticator.isUserAllowed({
      commandName: dbConfig.apiCommands.GetCalibrationMission.name,
      token: req.headers.authorization,
      callback: ({ error, data }) => {
        if (error) {
          if (error.type === errorCreator.ErrorTypes.DOESNOTEXIST) {
            res.status(404).json({
              error: {
                status: 404,
                title: 'Command does not exist',
                detail: 'Command does not exist',
              },
            });

            return;
          } else if (error.type === errorCreator.ErrorTypes.NOTALLOWED) {
            res.status(401).json({
              error: {
                status: 401,
                title: 'Unauthorized',
                detail: 'Invalid token',
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

        manager.getActiveCalibrationMission({
          userName: data.user.userName,
          callback: ({ error: calibrationError, data: calibrationData }) => {
            if (calibrationError) {
              res.status(500).json({
                error: {
                  status: 500,
                  title: 'Internal Server Error',
                  detail: 'Internal Server Error',
                },
              });

              return;
            }

            res.json({ data: calibrationData });
          },
        });
      },
    });
  });

  /**
   * @api {post} /calibrationMissions/complete Complete a mission
   * @apiVersion 6.0.0
   * @apiName CompleteCalibrationMission
   * @apiGroup CalibrationMissions
   *
   * @apiHeader {string} Authorization Your JSON Web Token
   *
   * @apiDescription Set a mission to completed
   *
   * @apiParam {Object} data
   * @apiParam {Object} data.mission Mission
   * @apiParam {string} data.mission.code Mission code (8 numbers)
   * @apiParam {string} data.mission.stationId Number of the station
   * @apiParamExample {json} Request-Example:
   *   {
   *    "data": {
   *      "mission": {
   *        "stationId": 1,
   *        "code": 12345678
   *      }
   *    }
   *  }
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
  router.post('/complete', (req, res) => {
    if (!objectValidator.isValidData(req.body, { data: { mission: { stationId: true, code: true } } })) {
      res.status(400).json({
        error: {
          status: 400,
          title: 'Missing data',
          detail: 'Unable to parse data',
        },
      });

      return;
    }

    authenticator.isUserAllowed({
      commandName: dbConfig.apiCommands.CompleteCalibrationMission.name,
      token: req.headers.authorization,
      callback: ({ error }) => {
        if (error) {
          if (error.type === errorCreator.ErrorTypes.DOESNOTEXIST) {
            res.status(404).json({
              error: {
                status: 404,
                title: 'Command does not exist',
                detail: 'Command does not exist',
              },
            });

            return;
          } else if (error.type === errorCreator.ErrorTypes.NOTALLOWED) {
            res.status(401).json({
              error: {
                status: 401,
                title: 'Unauthorized',
                detail: 'Invalid token',
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

        manager.completeActiveCalibrationMission({
          io,
          mission: req.body.data.mission,
          callback: ({ error: calibrationError, data: calibrationData }) => {
            if (calibrationError) {
              res.status(500).json({
                error: {
                  status: 500,
                  title: 'Internal server error',
                  detail: 'Internal server error',
                },
              });
            }

            res.json({ data: calibrationData });
          },
        });
      },
    });
  });

  /**
   * @api {post} /calibrationMissions/cancel Cancel a mission
   * @apiVersion 6.0.0
   * @apiName CancelCalibrationMission
   * @apiGroup CalibrationMissions
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Cancel a calibration mission. Mission will still be set to completed, but user will receive no reward
   *
   * @apiParam {Object} data
   * @apiParam {Object} data.mission Mission
   * @apiParam {String} data.mission.code Mission code (8 numbers)
   * @apiParam {String} data.mission.stationId Number of the station
   * @apiParamExample {json} Request-Example:
   *   {
   *    "data": {
   *      "mission": {
   *        "stationId": 1,
   *        "code": 12345678
   *      }
   *    }
   *  }
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.mission Mission completed
   * @apiSuccess {Boolean} data.cancelled Mission was cancelled
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
  router.post('/cancel', (req, res) => {
    if (!objectValidator.isValidData(req.body, { data: { mission: { stationId: true, code: true } } })) {
      res.status(400).json({
        error: {
          status: 400,
          title: 'Missing data',
          detail: 'Unable to parse data',
        },
      });

      return;
    }

    authenticator.isUserAllowed({
      commandName: dbConfig.apiCommands.CancelCalibrationMission.name,
      token: req.headers.authorization,
      callback: ({ error }) => {
        if (error) {
          if (error.type === errorCreator.ErrorTypes.DOESNOTEXIST) {
            res.status(404).json({
              error: {
                status: 404,
                title: 'Command does not exist',
                detail: 'Command does not exist',
              },
            });

            return;
          } else if (error.type === errorCreator.ErrorTypes.NOTALLOWED) {
            res.status(401).json({
              error: {
                status: 401,
                title: 'Unauthorized',
                detail: 'Invalid token',
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

        const { mission } = req.body.data;

        manager.cancelActiveCalibrationMission({
          mission,
          io,
          callback: ({ error: missionError, data: missionData }) => {
            if (missionError) {
              if (missionError.type === errorCreator.ErrorTypes.DOESNOTEXIST) {
                res.status(404).json({
                  error: {
                    status: 404,
                    title: 'Not found',
                    detail: 'Mission not found',
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

            res.json({ data: missionData });
          },
        });
      },
    });
  });

  return router;
}

module.exports = handle;
