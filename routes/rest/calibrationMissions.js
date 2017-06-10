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
const databasePopulation = require('../../config/defaults/config').databasePopulation;
const jwt = require('jsonwebtoken');
const objectValidator = require('../../utils/objectValidator');
const dbCalibrationMission = require('../../db/connectors/calibrationMission');
const dbWallet = require('../../db/connectors/wallet');
const dbUser = require('../../db/connectors/user');
const dbTransaction = require('../../db/connectors/transaction');
const errorCreator = require('../../objects/error/errorCreator');

const router = new express.Router();

/**
 * @param {Object} io Socket.io
 * @returns {Object} Router
 */
function handle(io) {
  /**
   * @api {get} /calibrationMissions Get all of user's active calibration missions
   * @apiVersion 5.1.0
   * @apiName GetCalibrationMissions
   * @apiGroup CalibrationMissions
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Get all of user's active calibration missions
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.missions Missions found. Can be empty
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "missions": [{
   *        owner: 'raz',
   *        stationId: 1,
   *        code: 81855211
   *        completed: false,
   *      }],
   *    }
   *  }
   */
  router.get('/', (req, res) => {
    // noinspection JSUnresolvedVariable
    const auth = req.headers.authorization || '';

    jwt.verify(auth, appConfig.jsonKey, (jwtErr, decoded) => {
      if (jwtErr) {
        res.status(500).json({
          errors: [{
            status: 500,
            title: 'Internal Server Error',
            detail: 'Internal Server Error',
          }],
        });

        return;
      } else if (!decoded) {
        res.status(401).json({
          errors: [{
            status: 401,
            title: 'Unauthorized',
            detail: 'Invalid token',
          }],
        });

        return;
      }

      dbCalibrationMission.getActiveMission({
        owner: decoded.data.userName,
        callback: ({ error, data }) => {
          if (error) {
            res.status(500).json({
              errors: [{
                status: 500,
                title: 'Internal Server Error',
                detail: 'Internal Server Error',
              }],
            });

            return;
          }

          const { mission } = data;
          const missions = [];

          if (mission) {
            missions.push(mission);
          }

          res.json({ data: { missions } });
        },
      });
    });
  });

  /**
   * @api {post} /calibrationMissions/complete Complete a mission
   * @apiVersion 5.1.0
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
    if (!objectValidator.isValidData(req.body, { data: { mission: { stationId: true } } })) {
      res.status(400).json({
        errors: [{
          status: 400,
          title: 'Missing data',
          detail: 'Unable to parse data',
        }],
      });

      return;
    }

    // noinspection JSUnresolvedVariable
    const auth = req.headers.authorization || '';

    jwt.verify(auth, appConfig.jsonKey, (jwtErr, decoded) => {
      if (jwtErr) {
        res.status(500).json({
          errors: [{
            status: 500,
            title: 'Internal Server Error',
            detail: 'Internal Server Error',
          }],
        });

        return;
      } else if (!decoded || decoded.data.accessLevel < databasePopulation.apiCommands.CompleteCalibrationMission.accessLevel) {
        res.status(401).json({
          errors: [{
            status: 401,
            title: 'Unauthorized',
            detail: 'Invalid token',
          }],
        });

        return;
      }

      const mission = req.body.data.mission;

      dbCalibrationMission.setMissionCompleted({
        code: mission.code,
        stationId: mission.stationId,
        callback: ({ error, data }) => {
          if (error) {
            if (error.type === errorCreator.ErrorTypes.DOESNOTEXIST) {
              res.status(404).json({
                errors: [{
                  status: 404,
                  title: 'Not found',
                  detail: 'Mission not found',
                }],
              });

              return;
            }

            res.status(500).json({
              errors: [{
                status: 500,
                title: 'Internal Server Error',
                detail: 'Internal Server Error',
              }],
            });

            return;
          }

          const transaction = {
            to: data.mission.owner,
            from: 'SYSTEM',
            amount: 50,
            time: new Date(),
            note: `CALIBRATION OF STATION ${data.mission.stationId}`,
          };

          dbTransaction.createTransaction({
            transaction,
            callback: ({ error: createError }) => {
              if (createError) {
                res.status(500).json({
                  errors: [{
                    status: 500,
                    title: 'Internal Server Error',
                    detail: 'Internal Server Error',
                  }],
                });

                return;
              }

              dbWallet.increaseAmount({
                owner: mission.owner,
                amount: transaction.amount,
                callback: ({ error: walletError, data: walletData }) => {
                  if (walletError) {
                    res.status(500).json({
                      errors: [{
                        status: 500,
                        title: 'Internal Server Error',
                        detail: 'Internal Server Error',
                      }],
                    });

                    return;
                  }

                  dbUser.getUserByAlias({
                    alias: transaction.to,
                    callback: ({ error: aliasError, data: aliasData }) => {
                      if (aliasError) {
                        res.status(500).json({
                          errors: [{
                            status: 500,
                            title: 'Internal Server Error',
                            detail: 'Internal Server Error',
                          }],
                        });

                        return;
                      }

                      const { receiver } = aliasData;

                      if (receiver.socketId !== '') {
                        io.to(receiver.socketId).emit('transaction', { transaction, wallet: walletData.wallet });
                        io.to(receiver.socketId).emit('terminal', { mission: { missionType: 'calibrationMission', completed: true } });
                      }

                      res.json({
                        data: { mission, transaction },
                      });
                    },
                  });
                },
              });
            },
          });
        },
      });
    });
  });

  /**
   * @api {post} /calibrationMissions/cancel Cancel a mission
   * @apiVersion 5.1.0
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
    if (!objectValidator.isValidData(req.body, { data: { mission: { stationId: true } } })) {
      res.status(400).json({
        errors: [{
          status: 400,
          title: 'Missing data',
          detail: 'Unable to parse data',
        }],
      });

      return;
    }

    // noinspection JSUnresolvedVariable
    const auth = req.headers.authorization || '';

    jwt.verify(auth, appConfig.jsonKey, (jwtErr, decoded) => {
      if (jwtErr) {
        res.status(500).json({
          errors: [{
            status: 500,
            title: 'Internal Server Error',
            detail: 'Internal Server Error',
          }],
        });

        return;
      } else if (!decoded || decoded.data.accessLevel < databasePopulation.apiCommands.CancelCalibrationMission.accessLevel) {
        res.status(401).json({
          errors: [{
            status: 401,
            title: 'Unauthorized',
            detail: 'Invalid token',
          }],
        });

        return;
      }

      const mission = req.body.data.mission;

      dbCalibrationMission.setMissionCompleted({
        code: mission.code,
        stationId: mission.stationId,
        callback: ({ error, data }) => {
          if (error) {
            if (error.type === errorCreator.ErrorTypes.DOESNOTEXIST) {
              res.status(404).json({
                errors: [{
                  status: 404,
                  title: 'Not found',
                  detail: 'Mission not found',
                }],
              });

              return;
            }

            res.status(500).json({
              errors: [{
                status: 500,
                title: 'Internal Server Error',
                detail: 'Internal Server Error',
              }],
            });

            return;
          }

          const { mission: updatedMission } = data;

          dbUser.getUserByAlias({
            alias: updatedMission.owner,
            callback: ({ error: aliasError, data: aliasData }) => {
              if (aliasError) {
                res.status(500).json({
                  errors: [{
                    status: 500,
                    title: 'Internal Server Error',
                    detail: 'Internal Server Error',
                  }],
                });

                return;
              }

              const { user } = aliasData;

              if (user.socketId !== '') {
                io.to(user.socketId).emit('terminal', { mission: { missionType: 'calibrationMission', cancelled: true } });
              }

              res.json({ data: { mission: updatedMission, cancelled: true } });
            },
          });
        },
      });
    });
  });

  return router;
}

module.exports = handle;
