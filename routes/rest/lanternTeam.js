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
   * @api {get} /lanternTeams Get all lantern teams
   * @apiVersion 5.1.0
   * @apiName GetLanternTeams
   * @apiGroup LanternTeams
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Get all lantern teams
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.teams Lantern teams found
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "teams": [{
   *        "shortName": "org",
   *        "teamName": "organica",
   *        "isActive": true,
   *        "points": 200
   *      }, {
   *        "shortName": "raz",
   *        "teamName": "razor",
   *        "isActive": false,
   *        "points": 100
   *      }]
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

      dbLanternHack.getAllTeams({
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

          res.json({ data: { teams: data.teams } });
        },
      });
    });
  });

  /**
   * @api {post} /lanternTeams Create a lantern team
   * @apiVersion 5.1.0
   * @apiName CreateLanternTeam
   * @apiGroup LanternTeams
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Create a lantern station
   *
   * @apiParam {Object} data
   * @apiParam {string} data.team New lantern team
   * @apiParam {string} data.team.shortName Team short name (acronym)
   * @apiParam {string} data.team.teamName Team name
   * @apiParam {boolean} [data.team.isActive] Is the team active? Defaults to false
   * @apiParamExample {json} Request-Example:
   *   {
   *    "data": {
   *      "team": {
   *        "shortName": "org",
   *        "teamName": "organica",
   *        "isActive": true
   *      }
   *    }
   *  }
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.team Lantern team created
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "team": {
   *        "shortName": "org",
   *        "teamName": "organica",
   *        "isActive": true
   *      }
   *    }
   *  }
   */
  router.post('/', (req, res) => {
    if (!objectValidator.isValidData(req.body, { data: { team: { shortName: true, teamName: true } } })) {
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
      } else if (!decoded || decoded.data.accessLevel < dbConfig.apiCommands.CreateLanternTeam.accessLevel) {
        res.status(401).json({
          errors: [{
            status: 401,
            title: 'Unauthorized',
            detail: 'Invalid token',
          }],
        });

        return;
      }

      const { team } = req.body.data;

      dbLanternHack.createLanternTeam({
        team,
        callback: ({ error, data }) => {
          if (error) {
            if (error.type === errorCreator.ErrorTypes.ALREADYEXISTS) {
              res.status(400).json({
                errors: [{
                  status: 400,
                  title: 'Team already exists',
                  detail: `Team ${team.shortName} ${team.teamName} already exists`,
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

          io.emit('lanternTeams', { teams: [data.savedObject] });
          res.json({ data: { team: data.savedObject } });
        },
      });
    });
  });

  /**
   * @api {post} /lanternTeams/:id Update an existing lantern team
   * @apiVersion 5.1.0
   * @apiName UpdateLanternTeam
   * @apiGroup LanternTeams
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Update an existing lantern team
   *
   * @apiParam {Object} id Lantern team short name
   *
   * @apiParam {Object} data
   * @apiParam {string} data.team Lantern team
   * @apiParam {boolean} [data.team.isActive] Is the team active?
   * @apiParam {number} [data.team.points] Teams total points
   * @apiParam {boolean} [data.team.resetPoints] Should the teams total points be reset to 0? data.team.points will be ignored if set
   * @apiParamExample {json} Request-Example:
   *   {
   *    "data": {
   *      "team": {
   *        "isActive": true,
   *        "points": 100
   *      }
   *    }
   *  }
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.station Updated lantern team
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "team": {
   *        "shortName": "org",
   *        "teamName": "organica",
   *        "isActive": true,
   *        "points": 100
   *      }
   *    }
   *  }
   */
  router.post('/:id', (req, res) => {
    if (!objectValidator.isValidData(req.params, { id: true })) {
      res.status(400).json({
        errors: [{
          status: 400,
          title: 'Missing data',
          detail: 'Unable to parse data',
        }],
      });

      return;
    } else if (!objectValidator.isValidData(req.body, { data: { station: true } })) {
      res.status(400).json({
        errors: [{
          status: 400,
          title: 'Incorrect data',
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
      } else if (!decoded || decoded.data.accessLevel < dbConfig.apiCommands.UpdateLanternStation.accessLevel) {
        res.status(401).json({
          errors: [{
            status: 401,
            title: 'Unauthorized',
            detail: 'Invalid token',
          }],
        });

        return;
      }

      const { team } = req.body.data;
      const shortName = req.params.id;

      dbLanternHack.updateLanternTeam({
        shortName,
        isActive: team.isActive,
        points: team.points,
        resetPoints: team.resetPoints,
        callback: ({ error, data }) => {
          if (error) {
            if (error.type === errorCreator.ErrorTypes.DOESNOTEXIST) {
              res.status(404).json({
                errors: [{
                  status: 404,
                  title: 'Failed to update lantern team',
                  detail: 'Lantern team does not exist',
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

          io.emit('lanternTeams', { teams: [data.team] });
          res.json({ data: { team: data.team } });
        },
      });
    });
  });

  return router;
}

module.exports = handle;
