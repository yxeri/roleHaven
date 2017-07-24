/*
 Copyright 2015 Aleksandar Jankovic

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
const appConfig = require('../../config/defaults/config').app;
const dbUser = require('../../db/connectors/user');
const dbPosition = require('../../db/connectors/position');
const errorCreator = require('../../objects/error/errorCreator');
const dbConfig = require('../../config/defaults/config').databasePopulation;
const authenticator = require('../../helpers/authenticator');

const router = new express.Router();

/**
 * @param {object} io - Socket.IO
 * @returns {Object} Router
 */
function handle(io) {
  /**
   * @api {get} /positions/users Get all user positions
   * @apiVersion 6.0.0
   * @apiName GetUserPositions
   * @apiGroup Positions
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Retrieve the positions from all users, that the user is allowed to see
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.positions Found user positions
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "positions": [
   *        {
   *          "positionName": "rez",
   *          "lastUpdated": "2016-10-25T16:55:34.309Z",
   *          "markerType": "user",
   *          "coordinates": {
   *            "latitude": 42.3625069,
   *            "longitude": 22.0114096,
   *            "speed": null,
   *            "accuracy": 1889,
   *            "heading": null
   *          }
   *        }
   *      ]
   *    }
   *  }
   */
  router.get('/users', (req, res) => {
    authenticator.isUserAllowed({
      commandName: dbConfig.apiCommands.GetUserPosition.name,
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

        dbUser.getAllUserPositions({
          user: data.user,
          callback: ({ error: positionError, data: positionData }) => {
            if (positionError) {
              res.status(500).json({
                error: {
                  status: 500,
                  title: 'Internal Server Error',
                  detail: 'Internal Server Error',
                },
              });

              return;
            }

            res.json({ data: positionData });
          },
        });
      },
    });
  });

  /**
   * @api {get} /positions/users/:id Retrieve specific user position
   * @apiVersion 6.0.0
   * @apiName GetUserPosition
   * @apiGroup Positions
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Retrieve the position for a specific user
   *
   * @apiParam {String} id Name of the user
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.positions Found user position
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "positions": [
   *        {
   *          "positionName": "rez",
   *          "lastUpdated": "2016-10-25T16:55:34.309Z",
   *          "markerType": "user",
   *          "coordinates": {
   *            "latitude": 42.3625069,
   *            "longitude": 22.0114096,
   *            "speed": null,
   *            "accuracy": 1889,
   *            "heading": null
   *          }
   *        }
   *      ]
   *    }
   *  }
   */
  router.get('/users/:id', (req, res) => {
    if (!objectValidator.isValidData(req.params, { id: true })) {
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
      commandName: dbConfig.apiCommands.GetUserPosition.name,
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

        dbUser.getUserPosition({
          user: data.user,
          userName: req.params.id,
          callback: ({ error: positionError, data: positionData }) => {
            if (positionError) {
              if (positionError.type === errorCreator.ErrorTypes.DOESNOTEXIST) {
                res.status(404).json({
                  error: {
                    status: 404,
                    title: 'User position not found',
                    detail: 'User position not found',
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

            res.json({ data: positionData });
          },
        });
      },
    });
  });

  /**
   * @api {post} /positions/users Set position for user
   * @apiVersion 6.0.0
   * @apiName SetUserPosition
   * @apiGroup Positions
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Set a new position for the user
   *
   * @apiParam {Object} data
   * @apiParam {Object} data.position
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
   * @apiSuccess {Object} data.positions New position for the user
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
  router.post('/users', (req, res) => {
    if (!objectValidator.isValidData(req.body, { data: { position: { coordinates: { longitude: true, latitude: true } } } })) {
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
      commandName: dbConfig.apiCommands.UpdateUserPosition.name,
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

        const user = data.user;
        const position = req.body.data.position;
        position.lastUpdated = new Date();
        position.positionName = user.userName;
        position.owner = user.userName;
        position.markerType = 'user';
        position.coordinates.accuracy = position.coordinates.accuracy || appConfig.minimumPositionAccuracy / 2;

        dbPosition.updatePosition({
          position,
          callback: ({ error: positionError, data: positionData }) => {
            if (positionError) {
              if (positionError.type === errorCreator.ErrorTypes.DOESNOTEXIST) {
                res.status(404).json({
                  error: {
                    status: 404,
                    title: 'User does not exist',
                    detail: 'User does not exist',
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

            io.emit('mapPositions', {
              position: positionData.position,
              currentTime: (new Date()),
            });

            res.json({ data: positionData });
          },
        });
      },
    });
  });

  return router;
}

module.exports = handle;
