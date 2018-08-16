/*
 Copyright 2017 Carmilla Mina Jankovic

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
const authenticator = require('../../helpers/authenticator');
const restErrorChecker = require('../../helpers/restErrorChecker');
const errorCreator = require('../../error/errorCreator');

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
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'data = { user: { password } }' }), sentData });

      return;
    } else if (!request.body.data.user.username && !request.body.data.user.userId) {
      sentData.user.password = typeof sentData.user.password !== 'undefined';

      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'userId or username has to be set' }), sentData });

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
      callback: ({ error, data }) => {
        if (error) {
          sentData.user.password = typeof sentData.user.password !== 'undefined';

          restErrorChecker.checkAndSendError({ response, error, sentData });

          return;
        }

        response.json({ data });
      },
    });
  });

  return router;
}

module.exports = handle;
