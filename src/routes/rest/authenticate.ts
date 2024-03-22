'use strict';

import express from 'express';

import authenticator from '../../helpers/authenticator';

import errorCreator from '../../error/errorCreator';
import restErrorChecker from '../../helpers/restErrorChecker';
import objectValidator from '../../utils/objectValidator';

const router = new express.Router();

/**
 * @returns {Object} Router
 */
function handle() {
  /**
   * @api {post} /authenticate Create a JSON Web Token.
   * @apiVersion 8.0.0
   * @apiName Authenticate
   * @apiGroup Authenticate
   *
   * @apiDescription Create a JSON Web Token based on the sent user. This token is needed to access most of the API. The token should be set in the Authorization header to access the rest of the API.
   *
   * @apiParam {Object} data
   * @apiParam {Object} data.user User.
   * @apiParam {string} data.user.password Password.
   * @apiParam {string} [data.user.userId] Id of the user. Either userId or username has to be set.
   * @apiParam {string} [data.user.username] Name of the user. Will be used if userId is not set.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {string} data.token JSON Web Token. To be used in the Authorization header.
   */
  router.post('/', (request, response) => {
    const sentData = request.body.data;

    if (!objectValidator.isValidData(request.body, { data: { user: { password: true } } })) {
      restErrorChecker.checkAndSendError({
        response,
        error: new errorCreator.InvalidData({ expected: 'data = { user: { password } }' }),
        sentData,
      });

      return;
    }

    if (!request.body.data.user.username && !request.body.data.user.userId) {
      sentData.user.password = typeof sentData.user.password !== 'undefined';

      restErrorChecker.checkAndSendError({
        response,
        error: new errorCreator.InvalidData({ expected: 'userId or username has to be set' }),
        sentData,
      });

      return;
    }

    const {
      username,
      userId,
      password,
    } = request.body.data.user;

    authenticator.createToken({
      userId,
      username,
      password,
      callback: ({
        error,
        data,
      }) => {
        if (error) {
          restErrorChecker.checkAndSendError({
            response,
            error,
            sentData,
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
