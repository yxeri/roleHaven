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
const restErrorCheck = require('../../helpers/restErrorChecker');
const lanternTeamManager = require('../../managers/lanternTeams');

const router = new express.Router();

/**
 * @param {Object} io Socket io
 * @returns {Object} Router
 */
function handle(io) {
  /**
   * @api {get} /lanternTeams Get all lantern teams
   * @apiVersion 6.0.0
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
   *      }
   *    }
   *  }
   */
  router.get('/', (request, response) => {
    lanternTeamManager.getLanternTeams({
      token: request.headers.authorization,
      callback: ({ error, data }) => {
        if (error) {
          restErrorCheck.checkAndSendError({ response, error });

          return;
        }

        response.json({ data });
      },
    });
  });

  /**
   * @api {post} /lanternTeams Create a lantern team
   * @apiVersion 6.0.0
   * @apiName CreateLanternTeam
   * @apiGroup LanternTeams
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Create a lantern team
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
  router.post('/', (request, response) => {
    if (!objectValidator.isValidData(request.body, { data: { team: { shortName: true, teamName: true } } })) {
      response.status(400).json({
        error: {
          status: 400,
          title: 'Missing data',
          detail: 'Unable to parse data',
        },
      });

      return;
    }

    lanternTeamManager.createLanternTeam({
      io,
      team: request.body.data.team,
      token: request.headers.authorization,
      callback: ({ error, data }) => {
        if (error) {
          restErrorCheck.checkAndSendError({ response, error });

          return;
        }

        response.json({ data });
      },
    });
  });

  /**
   * @api {post} /lanternTeams/:teamName Update an existing lantern team
   * @apiVersion 6.0.0
   * @apiName UpdateLanternTeam
   * @apiGroup LanternTeams
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Update an existing lantern team
   *
   * @apiParam {Object} teamName Lantern team short or full name
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
  router.post('/:teamName', (request, response) => {
    if (!objectValidator.isValidData(request.params, { teamName: true })) {
      response.status(400).json({
        error: {
          status: 400,
          title: 'Incorrect data',
          detail: 'Incorrect parameters',
        },
      });

      return;
    } else if (!objectValidator.isValidData(request.body, { data: { team: true } })) {
      response.status(400).json({
        error: {
          status: 400,
          title: 'Incorrect data',
          detail: 'Missing body parameters',
        },
      });

      return;
    }

    lanternTeamManager.updateLanternTeam({
      io,
      team: request.body.data.team,
      teamName: request.params.teamName,
      token: request.headers.authorization,
      callback: ({ error, data }) => {
        if (error) {
          restErrorCheck.checkAndSendError({ response, error });

          return;
        }

        response.json({ data });
      },
    });
  });

  return router;
}

module.exports = handle;
