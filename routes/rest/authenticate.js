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
const objectValidator = require('../../utils/objectValidator');
const errorCreator = require('../../objects/error/errorCreator');
const authenticator = require('../../helpers/authenticator');

const router = new express.Router();

/**
 * @returns {Object} Router
 */
function handle() {
  /**
   * @api {post} /authenticate Create a JSON Web Token
   * @apiVersion 6.0.0
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
   *      "token": ""
   *    }
   *  }
   */
  router.post('/', (req, res) => {
    if (!objectValidator.isValidData(req.body, { data: { user: { userName: true, password: true } } })) {
      res.status(400).json({
        error: {
          status: 400,
          title: 'Missing data',
          detail: 'Unable to parse data',
        },
      });

      return;
    }

    const { userName, password } = req.body.data.user;

    authenticator.createToken({
      userName,
      password,
      callback: ({ error, data }) => {
        if (error) {
          if (error.type === errorCreator.ErrorTypes.DOESNOTEXIST) {
            res.status(401).json({
              error: {
                status: 401,
                title: 'Unauthorized user',
                detail: 'Incorrect username and/or password or user does not exist, is banned or has not been verified',
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

        res.json({ data });
      },
    });
  });

  return router;
}

module.exports = handle;
