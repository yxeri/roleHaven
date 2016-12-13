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
const jwt = require('jsonwebtoken');
const dbUser = require('../../db/connectors/user');
const appConfig = require('../../config/defaults/config').app;
const objectValidator = require('../../utils/objectValidator');

const router = new express.Router();

/**
 * @returns {Object} Router
 */
function handle() {
  /**
   * @api {post} /authenticate Create a JSON Web Token
   * @apiVersion 5.0.1
   * @apiName Authenticate
   * @apiGroup Authenticate
   *
   * @apiDescription Create a JSON Web Token based on the sent user. This token is needed to access most of the API. The token should be set in the Authorization header
   *
   * @apiParam {Object} data
   * @apiParam {Object} data.user User
   * @apiParam {String} data.user.userName User name
   * @apiParam {String} data.user.password Password
   * @apiParamExample {json} Request-Example:
   *  {
   *    "data": {
   *      "user": {
   *        "userName": "rez",
   *        "password": "1234"
   *      }
   *    }
   *  }
   *
   * @apiSuccess {Object} data
   * @apiSuccess {String} data.token JSON Web Token. To be used in the Authorization header
   * @apiSuccessExample {json} Success-Response:
   *  {
   *    "data": {
   *      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWV9.TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ"
   *    }
   *  }
   */
  router.post('/', (req, res) => {
    if (!objectValidator.isValidData(req.body, { data: { user: { userName: true, password: true } } })) {
      res.status(400).json({
        errors: [{
          status: 400,
          title: 'Missing data',
          detail: 'Unable to parse data',
        }],
      });

      return;
    }

    const { userName, password } = req.body.data.user;

    dbUser.authUser(userName, password, (err, authUser) => {
      if (err) {
        res.status(500).json({
          errors: [{
            status: 500,
            title: 'Internal Server Error',
            detail: 'Internal Server Error',
          }],
        });

        return;
      } else if (authUser === null) {
        res.status(401).json({
          errors: [{
            status: 401,
            title: 'Unauthorized user',
            detail: 'Incorrect user name and/or password',
          }],
        });

        return;
      }

      const jwtUser = {
        _id: authUser._id, // eslint-disable-line no-underscore-dangle
        userName: authUser.userName,
        accessLevel: authUser.accessLevel,
        visibility: authUser.visibility,
        verified: authUser.verified,
        banned: authUser.banned,
      };

      res.json({
        data: { token: jwt.sign({ data: jwtUser }, appConfig.jsonKey, { expiresIn: '7d' }) },
      });
    });
  });

  return router;
}

module.exports = handle;
