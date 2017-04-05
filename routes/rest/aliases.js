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
const appConfig = require('../../config/defaults/config').app;
const jwt = require('jsonwebtoken');
const objectValidator = require('../../utils/objectValidator');
const manager = require('../../socketHelpers/manager');
const dbUser = require('../../db/connectors/user');

const router = new express.Router();

/**
 * @returns {Object} Router
 */
function handle() {
  /**
   * @api {get} /aliases Get all user's aliases
   * @apiVersion 5.0.3
   * @apiName GetAliases
   * @apiGroup Aliases
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Get all user's aliases, including user name
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.aliases Aliases found
   * @apiSuccess {Object} data.user
   * @apiSuccess {Object} data.user.userName User name
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "aliases": ["baz", "h1"],
   *      "user": { "userName": "raz" }
   *    }
   *  }
   */
  router.get('/', (req, res) => {
    // noinspection JSUnresolvedVariable
    jwt.verify(req.headers.authorization || '', appConfig.jsonKey, (jwtErr, decoded) => {
      if (jwtErr) {
        res.status(500).json({
          errors: [{
            status: 500,
            title: 'Internal Server Error',
            detail: 'Internal Server Error',
          }],
        });

        return;
      } else if (!decoded) {
        res.status(401).json({
          errors: [{
            status: 401,
            title: 'Unauthorized',
            detail: 'Invalid token',
          }],
        });

        return;
      }

      dbUser.getUser(decoded.data.userName, (err, user) => {
        if (err) {
          res.status(500).json({
            errors: [{
              status: 500,
              title: 'Internal Server Error',
              detail: 'Internal Server Error',
            }],
          });

          return;
        }

        const aliases = user.aliases || [];

        res.json({ data: { aliases, user: { userName: decoded.data.userName } } });
      });
    });
  });

  /**
   * @api {post} /aliases Create an alias
   * @apiVersion 5.0.3
   * @apiName CreateAlias
   * @apiGroup Aliases
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Create an alias
   *
   * @apiParam {Object} data
   * @apiParam {string} data.alias Alias
   * @apiParamExample {json} Request-Example:
   *   {
   *    "data": {
   *      "alias": "raz"
   *    }
   *  }
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.alias Alias created
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "alias": "raz"
   *    }
   *  }
   */
  router.post('/', (req, res) => {
    if (!objectValidator.isValidData(req.body, { data: { alias: true } })) {
      res.status(400).json({
        errors: [{
          status: 400,
          title: 'Missing data',
          detail: 'Unable to parse data',
        }],
      });

      return;
    }

    // noinspection JSUnresolvedVariable
    const auth = req.headers.authorization;

    jwt.verify(auth || '', appConfig.jsonKey, (jwtErr, decoded) => {
      if (jwtErr) {
        res.status(500).json({
          errors: [{
            status: 500,
            title: 'Internal Server Error',
            detail: 'Internal Server Error',
          }],
        });

        return;
      } else if (!decoded && auth) {
        res.status(401).json({
          errors: [{
            status: 401,
            title: 'Unauthorized',
            detail: 'Invalid token',
          }],
        });

        return;
      }

      manager.addAlias({
        user: decoded.data,
        alias: req.body.data.alias,
        callback: ({ error, data }) => {
          if (error || !data.alias) {
            res.status(500).json({
              errors: [{
                status: 500,
                title: 'Internal Server Error',
                detail: 'Internal Server Error',
              }],
            });

            return;
          }

          res.json({
            data: { alias: data.alias },
          });
        },
      });
    });
  });

  return router;
}

module.exports = handle;
