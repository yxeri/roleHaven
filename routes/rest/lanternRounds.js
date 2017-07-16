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
const dbConfig = require('../../config/defaults/config').databasePopulation;
const dbLanternHack = require('../../db/connectors/lanternhack');
const errorCreator = require('../../objects/error/errorCreator');
const authenticator = require('../../socketHelpers/authenticator');

const router = new express.Router();

/**
 * @returns {Object} Router
 */
function handle() {
  /**
   * @api {get} /lanternRounds Get all lantern rounds
   * @apiVersion 6.0.0
   * @apiName GetLanternRounds
   * @apiGroup LanternItems
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
  router.get('/', (req, res) => {
    authenticator.isUserAllowed({
      commandName: dbConfig.apiCommands.GetLanternRound.name,
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

        dbLanternHack.getLanternRounds({
          callback: ({ error: roundError, data: roundData }) => {
            if (roundError) {
              res.status(500).json({
                error: {
                  status: 500,
                  title: 'Internal Server Error',
                  detail: 'Internal Server Error',
                },
              });

              return;
            }

            const currentTime = new Date();
            const rounds = roundData.rounds.filter(round => currentTime >= new Date(round.endTime));

            res.json({ data: { rounds } });
          },
        });
      },
    });
  });

  /**
   * @api {get} /lanternRounds Get active lantern round
   * @apiVersion 6.0.0
   * @apiName GetActiveLanternRound
   * @apiGroup LanternItems
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
  router.get('/', (req, res) => {
    authenticator.isUserAllowed({
      commandName: db.apiCommands.GetActiveLanternRound.name,
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

        dbLanternHack.getActiveLanternRound({
          callback: ({ error: roundError, data: roundData }) => {
            if (roundError) {
              res.status(500).json({
                error: {
                  status: 500,
                  title: 'Internal Server Error',
                  detail: 'Internal Server Error',
                },
              });

              return;
            }

            const round = roundData;
            const dataToSend = {
              round,
              noActiveRound: typeof round === 'undefined',
            };

            res.json({ data: dataToSend });
          },
        });
      },
    });
  });

  /**
   * @api {post} /lanternRounds Create a lantern round
   * @apiVersion 6.0.0
   * @apiName CreateLanternRound
   * @apiGroup LanternItems
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
  router.post('/', (req, res) => {
    if (!objectValidator.isValidData(req.body, { data: { round: { roundId: true, startTime: true, endTime: true } } })) {
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
      commandName: dbConfig.apiCommands.CreateLanternRound.name,
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

        dbLanternHack.createLanternRound({
          round: req.body.data.round,
          callback: ({ error: lanternError, data: lanternData }) => {
            if (lanternError) {
              if (lanternError.type === errorCreator.ErrorTypes.ALREADYEXISTS) {
                res.status(403).json({
                  error: {
                    status: 403,
                    title: 'Lantern round already exists',
                    detail: 'Lantern round already exists',
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

            res.json({ data: lanternData });
          },
        });
      },
    });
  });

  /**
   * @api {post} /lanternRounds/start Trigger start of a lantern round
   * @apiVersion 6.0.0
   * @apiName StartLanternRound
   * @apiGroup LanternItems
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Start a lantern round
   *
   * @apiParam {Object} data
   * @apiParam {string} data.round Lantern round
   * @apiParam {number} data.round.roundId Round id of the round to start
   * @apiParamExample {json} Request-Example:
   *   {
   *    "data": {
   *      "round": {
   *        "roundId": 1
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
  router.post('/start', (req, res) => {
    if (!objectValidator.isValidData(req.body, { data: { round: { roundId: true } } })) {
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
      commandName: dbConfig.apiCommands.StartLanternRound.name,
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

        const round = req.body.data.round;

        dbLanternHack.getActiveLanternRound({
          callback: ({ error: activeLanternError }) => {
            if (activeLanternError) {
              if (activeLanternError.type === errorCreator.ErrorTypes.ALREADYEXISTS) {
                res.status(404).json({
                  error: {
                    status: 404,
                    title: 'Active round already exists',
                    detail: 'Active round already exists',
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

            dbLanternHack.startLanternRound({
              roundId: round.roundId,
              callback: ({ error: startLanternError, data: startLanternData }) => {
                if (startLanternError) {
                  if (startLanternError.type === errorCreator.ErrorTypes.DOESNOTEXIST) {
                    res.status(404).json({
                      error: {
                        status: 404,
                        title: 'Active round does not exists',
                        detail: 'Active round does not exists',
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

                res.json({ data: startLanternData });
              },
            });
          },
        });
      },
    });
  });

  /**
   * @api {post} /lanternRounds/end Trigger end of a lantern round
   * @apiVersion 6.0.0
   * @apiName EndLanternRound
   * @apiGroup LanternItems
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
  router.post('/end', (req, res) => {
    authenticator.isUserAllowed({
      commandName: dbConfig.apiCommands.EndLanternRound.name,
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

        dbLanternHack.endLanternRound({
          callback: ({ error: roundError }) => {
            if (roundError) {
              if (roundError.type === errorCreator.ErrorTypes.DOESNOTEXIST) {
                res.status(404).json({
                  error: {
                    status: 404,
                    title: 'Active round does not exist',
                    detail: 'Active round does not exist',
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

            // TODO Emit to clients

            res.json({ data: { success: true } });
          },
        });
      },
    });
  });


  /**
   * @api {post} /lanternRounds/:id Update an existing lantern round
   * @apiVersion 6.0.0
   * @apiName UpdateLanternRound
   * @apiGroup LanternItems
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Update existing lantern round
   *
   * @apiParam {Object} id Lantern round id
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
    } else if (!objectValidator.isValidData(req.body, { data: { round: true } })) {
      res.status(400).json({
        error: {
          status: 400,
          title: 'Incorrect data',
          detail: 'Unable to parse data',
        },
      });

      return;
    }

    authenticator.isUserAllowed({
      commandName: dbConfig.apiCommands.UpdateLanternRound.name,
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

        const { startTime, endTime } = req.body.data.round;
        const roundId = req.params.id;

        dbLanternHack.updateLanternRound({
          roundId,
          startTime,
          endTime,
          callback: ({ error: lanternError, data: lanternData }) => {
            if (lanternError) {
              if (lanternError.type === errorCreator.ErrorTypes.DOESNOTEXIST) {
                res.status(404).json({
                  error: {
                    status: 404,
                    title: 'Lantern round does not exist',
                    detail: 'Lantern round does not exist',
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

            // TODO Push to clients, if next round
            res.json({ data: lanternData });
          },
        });
      },
    });
  });

  return router;
}

module.exports = handle;
