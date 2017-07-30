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
const teamManager = require('../../managers/teams');
const objectValidator = require('../../utils/objectValidator');
const restErrorChecker = require('../../helpers/restErrorChecker');

const router = new express.Router();

/**
 * @param {object} io - Socket.IO
 * @returns {Object} Router
 */
function handle(io) {
  /**
   * @api {get} /teams Get teams
   * @apiVersion 6.0.0
   * @apiName GetTeams
   * @apiGroup Teams
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Get teams
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.teams Found teams
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "teams": [
   *        { shortName: "pc", teamName: "private company" },
   *        { shortName: "comp", teamName: "human computers" },
   *      ]
   *    }
   *  }
   */
  router.get('/', (request, response) => {
    teamManager.getTeams({
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
   * @api {get} /teams/:teamName Get specific team
   * @apiVersion 6.0.0
   * @apiName GetTeam
   * @apiGroup Teams
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Get a specific team by short or full name
   *
   * @apiParam {String} teamName Short or full name of the team to retrieve
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.room Found team
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "team": {
   *        "teamName": "bb1",
   *        "shortName": "rez",
   *        "admins": [
   *          "a1",
   *        ],
   *        "owner": "jazz",
   *        "isProtected": false
   *      }
   *    }
   *  }
   */
  router.get('/:teamName', (request, response) => {
    if (!objectValidator.isValidData(request.params, { teamName: true })) {
      response.status(400).json({
        error: {
          status: 400,
          title: 'Missing data',
          detail: 'Unable to parse data',
        },
      });

      return;
    }

    teamManager.getTeam({
      teamName: request.params.teamName,
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
   * @api {post} /teams Create a team
   * @apiVersion 6.0.0
   * @apiName CreateTeam
   * @apiGroup Teams
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Create a team
   *
   * @apiParam {Object} data
   * @apiParam {Object} data.team Team
   * @apiParam {string} data.team.teamName Team name
   * @apiParam {string} data.team.shortName Short/acronym team name
   * @apiParamExample {json} Request-Example:
   *   {
   *    "data": {
   *      "team": {
   *        "teamName": "team bravo",
   *        "shortName": "tb"
   *      }
   *    }
   *  }
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.room Team created
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "team": {
   *        "teamName": "team bravo",
   *        "shortName": "tb",
   *        "owner": "rez",
   *        "admins": [],
   *        "verified": false
   *      },
   *      "wallet": {
   *        "amount": 0,
   *        "owner": "team bravo-team",
   *        "accessLevel": 1,
   *        "isProtected": false,
   *        "team": "team bravo"
   *      }
   *    }
   *  }
   */
  router.post('/', (request, response) => {
    if (!objectValidator.isValidData(request.body, { data: { team: { teamName: true, shortName: true } } })) {
      response.status(400).json({
        error: {
          status: 400,
          title: 'Missing data',
          detail: 'Unable to parse data',
        },
      });

      return;
    }

    teamManager.createTeam({
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

  return router;
}

module.exports = handle;
