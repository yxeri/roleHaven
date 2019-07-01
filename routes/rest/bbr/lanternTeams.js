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
const objectValidator = require('../../../utils/objectValidator');
const restErrorChecker = require('../../../helpers/restErrorChecker');
const lanternTeamManager = require('../../../managers/bbr/lanternTeams');
const errorCreator = require('../../../error/errorCreator');

const router = new express.Router();

/**
 * @param {Object} io Socket io
 * @returns {Object} Router
 */
function handle(io) {
  /**
   * @api {delete} /lanternTeams/:teamId Delete existing lantern team
   * @apiVersion 6.0.0
   * @apiName DeleteLanternTeam
   * @apiGroup LanternTeams
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Delete existing lantern team
   *
   * @apiParam {number} teamId Team id
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.station Updated lantern team
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "success": true
   *    }
   *  }
   */
  router.delete('/:teamId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { teamId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '' }), sentData: request.body.data });

      return;
    }

    lanternTeamManager.deleteLanternTeam({
      token: request.headers.authorization,
      teamId: request.params.teamId,
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
   *        "teamId": 3,
   *        "shortName": "org",
   *        "teamName": "organica",
   *        "isActive": true,
   *        "points": 200
   *      }, {
   *        "teamId": 2,
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
          restErrorChecker.checkAndSendError({ response, error, sentData: request.body.data });

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
   *        "teamId": 1,
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
   *        "teamId": 1,
   *        "shortName": "org",
   *        "teamName": "organica",
   *        "isActive": true
   *      }
   *    }
   *  }
   */
  router.post('/', (request, response) => {
    if (!objectValidator.isValidData(request.body, { data: { team: { shortName: true, teamName: true } } })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '' }), sentData: request.body.data });

      return;
    }

    lanternTeamManager.createLanternTeam({
      io,
      team: request.body.data.team,
      token: request.headers.authorization,
      callback: ({ error, data }) => {
        if (error) {
          restErrorChecker.checkAndSendError({ response, error, sentData: request.body.data });

          return;
        }

        response.json({ data });
      },
    });
  });

  /**
   * @api {post} /lanternTeams/:teamId Update an existing lantern team
   * @apiVersion 6.0.0
   * @apiName UpdateLanternTeam
   * @apiGroup LanternTeams
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Update an existing lantern team
   *
   * @apiParam {number} teamId Team id
   *
   * @apiParam {Object} data
   * @apiParam {string} data.team Lantern team
   * @apiParam {string} [data.team.shortName] Team short name (acronym)
   * @apiParam {string} [data.team.teamName] Team name
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
   *        "teamId": 1,
   *        "shortName": "org",
   *        "teamName": "organica",
   *        "isActive": true,
   *        "points": 100
   *      }
   *    }
   *  }
   */
  router.post('/:teamId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { teamId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '' }), sentData: request.body.data });

      return;
    }

    if (!objectValidator.isValidData(request.body, { data: { team: true } })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '' }), sentData: request.body.data });

      return;
    }

    lanternTeamManager.updateLanternTeam({
      io,
      teamId: request.params.teamId,
      team: request.body.data.team,
      token: request.headers.authorization,
      callback: ({ error, data }) => {
        if (error) {
          restErrorChecker.checkAndSendError({ response, error, sentData: request.body.data });

          return;
        }

        response.json({ data });
      },
    });
  });

  return router;
}

module.exports = handle;
