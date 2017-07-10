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
const dbConfig = require('../../config/defaults/config').databasePopulation;
const jwt = require('jsonwebtoken');
const objectValidator = require('../../utils/objectValidator');
const manager = require('../../socketHelpers/manager');
const dbUser = require('../../db/connectors/user');
const errorCreator = require('../../objects/error/errorCreator');

const router = new express.Router();

/**
 * @returns {Object} Router
 */
function handle() {
  /**
   * @api {get} /aliases Get all aliases on self
   * @apiVersion 6.0.0
   * @apiName GetAliases
   * @apiGroup Aliases
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Get all aliases on self, including user name
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
    const auth = req.headers.authorization || '';

    jwt.verify(auth, appConfig.jsonKey, (jwtErr, decoded) => {
      if (jwtErr || !decoded || decoded.data.accessLevel < dbConfig.apiCommands.GetAliases.accessLevel) {
        res.status(401).json({
          error: {
            status: 401,
            title: 'Unauthorized',
            detail: 'Invalid token',
          },
        });

        return;
      }

      const userName = decoded.data.userName;

      dbUser.getUser({
        userName,
        callback: ({ error, data }) => {
          if (error) {
            if (error.type === errorCreator.ErrorTypes.DOESNOTEXIST) {
              res.status(404).json({
                error: {
                  status: 404,
                  title: 'User does not exist',
                  detail: 'User does not exist',
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

          const aliases = data.user.aliases || [];

          res.json({ data: { aliases, user: { userName } } });
        },
      });
    });
  });

  /**
   * @api {post} /aliases Create an alias
   * @apiVersion 6.0.0
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
        error: {
          status: 400,
          title: 'Missing data',
          detail: 'Unable to parse data',
        },
      });

      return;
    }

    // noinspection JSUnresolvedVariable
    const auth = req.headers.authorization || '';

    jwt.verify(auth, appConfig.jsonKey, (jwtErr, decoded) => {
      if (jwtErr || !decoded || decoded.data.accessLevel < dbConfig.apiCommands.CreateAlias.accessLevel) {
        res.status(401).json({
          error: {
            status: 401,
            title: 'Unauthorized',
            detail: 'Invalid token',
          },
        });

        return;
      }

      manager.addAlias({
        user: decoded.data,
        alias: req.body.data.alias,
        callback: ({ error, data }) => {
          if (error) {
            if (error.type === errorCreator.ErrorTypes.ALREADYEXISTS) {
              res.status(403).json({
                error: {
                  status: 403,
                  title: 'Alias already exists',
                  detail: 'Alias already exists',
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
