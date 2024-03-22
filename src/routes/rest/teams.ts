'use strict';

const express = require('express');
const teamManager = require('../../managers/teams');
const objectValidator = require('../../utils/objectValidator');
const restErrorChecker = require('../../helpers/restErrorChecker');
const errorCreator = require('../../error/errorCreator');

const router = new express.Router();

/**
 * @param {object} io Socket.IO
 * @returns {Object} Router
 */
function handle(io) {
  /**
   * @api {get} /teams Get teams
   * @apiVersion 8.0.0
   * @apiName GetTeams
   * @apiGroup Teams
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Get teams.
   *
   * @apiParam {boolean} [Query] [includeInactive] Should unverified teams be included in the results?
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Team[]} data.teams Found teams.
   */
  router.get('/', (request, response) => {
    const { authorization: token } = request.headers;
    const { includeInactive } = request.query;

    const callback = ({
      error,
      data,
    }) => {
      if (error) {
        restErrorChecker.checkAndSendError({
          response,
          error,
          sentData: request.body.data,
        });

        return;
      }

      response.json({ data });
    };

    teamManager.getTeamsByUser({
      token,
      includeInactive,
      callback,
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
      restErrorChecker.checkAndSendError({
        response,
        error: new errorCreator.InvalidData({ expected: 'params = { teamId }' }),
      });

      return;
    }

    const { teamId } = request.params;
    const { authorization: token } = request.headers;

    teamManager.getTeamById({
      teamId,
      token,
      callback: ({
        error,
        data,
      }) => {
        if (error) {
          restErrorChecker.checkAndSendError({
            response,
            error,
          });

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
    if (!objectValidator.isValidData(request.body, {
      data: {
        team: {
          teamName: true,
          shortName: true,
        },
      },
    })) {
      restErrorChecker.checkAndSendError({
        response,
        error: new errorCreator.InvalidData({ expected: 'data = { team: { teamName, shortName } }' }),
        sentData: request.body.data,
      });

      return;
    }

    const { authorization: token } = request.headers;
    const { team } = request.body.data;

    teamManager.createTeam({
      io,
      team,
      token,
      callback: ({
        error,
        data,
      }) => {
        if (error) {
          restErrorChecker.checkAndSendError({
            response,
            error,
            sentData: request.body.data,
          });

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
   * @apiParam {string} teamId [Url] Id of the team to delete.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {boolean} data.success Was it successfully deleted?
   */
  router.delete('/:teamId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { teamId: true })) {
      restErrorChecker.checkAndSendError({
        response,
        error: new errorCreator.InvalidData({ expected: 'params = { teamId }' }),
      });

      return;
    }

    const { teamId } = request.params;
    const { authorization: token } = request.headers;

    teamManager.removeTeam({
      io,
      teamId,
      token,
      callback: ({
        error,
        data,
      }) => {
        if (error) {
          restErrorChecker.checkAndSendError({
            response,
            error,
          });

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
   * @apiParam {string} teamId [Url] Id of the team to update.
   *
   * @apiParam {Object} data Body parameters.
   * @apiParam {Team} data.team Team parameters to update.
   * @apiParam {Object} [data.options] Update options.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Team} data.team Updated team.
   */
  router.put('/:teamId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { teamId: true })) {
      restErrorChecker.checkAndSendError({
        response,
        error: new errorCreator.InvalidData({ expected: 'params = { teamId }' }),
      });

      return;
    }

    if (!objectValidator.isValidData(request.body, { data: { team: true } })) {
      restErrorChecker.checkAndSendError({
        response,
        error: new errorCreator.InvalidData({ expected: 'data = { team }' }),
        sentData: request.body.data,
      });

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
      callback: ({
        error,
        data,
      }) => {
        if (error) {
          restErrorChecker.checkAndSendError({
            response,
            error,
            sentData: request.body.data,
          });

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
      restErrorChecker.checkAndSendError({
        response,
        error: new errorCreator.InvalidData({ expected: 'params = { teamId }' }),
      });

      return;
    }

    if (!objectValidator.isValidData(request.body, { data: { invitation: true } })) {
      restErrorChecker.checkAndSendError({
        response,
        error: new errorCreator.InvalidData({ expected: 'data = { invitation }' }),
        sentData: request.body.data,
      });

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
      callback: ({
        error,
        data,
      }) => {
        if (error) {
          restErrorChecker.checkAndSendError({
            response,
            error,
            sentData: request.body.data,
          });

          return;
        }

        response.json({ data });
      },
    });
  });

  return router;
}

export default handle;
