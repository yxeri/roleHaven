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
const errorCreator = require('../../objects/error/errorCreator');

const router = new express.Router();

/**
 * @param {object} io Socket.IO
 * @returns {Object} Router
 */
function handle(io) {
  /**
   * @api {get} /teams/list Get teams
   * @apiVersion 8.0.0
   * @apiName GetTeams
   * @apiGroup Teams
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Get teams.
   *
   * @apiParam {Object} data
   * @apiParam {string} [data.userId] Id of the user retrieving the teams.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Team[]} data.teams Found teams.
   */
  router.get('/', (request, response) => {
    const { userId } = request.body.data;
    const { authorization: token } = request.headers;

    teamManager.getTeamsList({
      userId,
      token,
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
   * @api {get} /teams/:teamId Get a team
   * @apiVersion 8.0.0
   * @apiName GetTeam
   * @apiGroup Teams
   *
   * @apiHeader {string} Authorization Your JSON Web Token
   *
   * @apiDescription Get a team.
   *
   * @apiParam {string} teamId Id of the team to retrieve.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Team} data.team Found team.
   */
  router.get('/:teamId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { teamId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'params = { teamId }' }) });

      return;
    }

    const { teamId } = request.params;
    const { authorization: token } = request.headers;

    teamManager.getTeam({
      teamId,
      token,
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
   * @apiVersion 8.0.0
   * @apiName CreateTeam
   * @apiGroup Teams
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Create a team.
   *
   * @apiParam {Object} data
   * @apiParam {Team} data.team Team to create.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Team} data.team Created team.
   */
  router.post('/', (request, response) => {
    if (!objectValidator.isValidData(request.body, { data: { team: { teamName: true, shortName: true } } })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'data = { team: { teamName, shortName } }' }), sentData: request.body.data });

      return;
    }

    const { authorization: token } = request.headers;
    const { team } = request.body.data;

    teamManager.createTeam({
      io,
      team,
      token,
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
   * @api {delete} /teams/:teamId Delete a team
   * @apiVersion 8.0.0
   * @apiName DeleteTeam
   * @apiGroup Teams
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Delete a team.
   *
   * @apiParam {string} teamId Id of the team to delete.
   *
   * @apiParam {Object} [data]
   * @apiParam {string} [data.userId] Id of the user deleting the team.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {boolean} data.success Was it successfully deleted?
   */
  router.delete('/:teamId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { teamId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'params = { teamId }' }) });

      return;
    }

    const { userId } = request.body.data;
    const { teamId } = request.params;
    const { authorization: token } = request.headers;

    teamManager.removeTeam({
      userId,
      io,
      teamId,
      token,
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
   * @api {put} /teams/:teamId Update a team
   * @apiVersion 8.0.0
   * @apiName UpdateTeam
   * @apiGroup Teams
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Update a team.
   *
   * @apiParam {string} teamId Id of the team to update.
   *
   * @apiParam {Object} data
   * @apiParam {Team} data.team Team parameters to update.
   * @apiParam {Object} [data.options] Update options.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Team} data.team Updated team.
   */
  router.put('/:teamId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { teamId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'params = { teamId }' }) });

      return;
    } else if (!objectValidator.isValidData(request.body, { data: { team: true } })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'data = { team }' }), sentData: request.body.data });

      return;
    }

    const {
      team,
      options,
    } = request.body.data;
    const { teamId } = request.params;
    const { authorization: token } = request.headers;

    teamManager.updateTeam({
      team,
      options,
      io,
      teamId,
      token,
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
   * @api {post} /teams/:teamId/invitations Invite a user to the team
   * @apiVersion 8.0.0
   * @apiName InviteUser
   * @apiGroup Teams
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Invite a user to the team.
   *
   * @apiParam {string} teamId Id of the team to invite to.
   *
   * @apiParam {Object} data
   * @apiParam {Invitation} data.invitation Invitation to create.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Invitation} data.invitation Created invitation.
   */
  router.post('/:teamId/invitations', (request, response) => {
    if (!objectValidator.isValidData(request.params, { teamId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'params = { teamId }' }) });

      return;
    } else if (!objectValidator.isValidData(request.body, { data: { invitation: true } })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'data = { invitation }' }), sentData: request.body.data });

      return;
    }

    const {
      invitation,
      options,
    } = request.body.data;
    const { authorization: token } = request.headers;

    teamManager.inviteToTeam({
      invitation,
      options,
      io,
      token,
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
