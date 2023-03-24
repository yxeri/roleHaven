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
const userManager = require('../../managers/users');

const router = new express.Router();

/**
 * @returns {Object} Router
 */
function handle() {
  /**
   * @api {get} /tools/userBases Get a list of user data that can be used during the creation of users
   * @apiVersion 8.0.0
   * @apiName GetBaseUsers
   * @apiGroup Tools
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Get a list of user data that can be used during the creation of users.
   *
   * @apiParam {Object} data Body parameters
   * @apiParam {number} data.amount Amount of user bases to create.
   * @apiParam {boolean} [data.csv] Should the data returned be CSV?
   * @apiParam {number} [data.codeLength] How many characters should the generated code be? Note! The amount returned will be doubled (converted to hex). Default is 4.
   * @apiParam {number} [data.passwordLength] How many characters should the generated password be? Default is 4.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.userBases Generated user data.
   */
  router.get('/userBases', (request, response) => {
    const { csv } = request.body.data;

    if (csv) {
      response.set('Content-Type', 'text/plain');
      response.send(userManager.generateUserBases(request.body.data));
    } else {
      response.json(userManager.generateUserBases(request.body.data));
    }
  });

  return router;
}

module.exports = handle;
