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
const dbConfig = require('../../config/defaults/config').databasePopulation;
const objectValidator = require('../../utils/objectValidator');
const manager = require('../../helpers/manager');
const errorCreator = require('../../objects/error/errorCreator');
const authenticator = require('../../helpers/authenticator');
const appConfig = require('../../config/defaults/config').app;

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
    authenticator.isUserAllowed({
      commandName: dbConfig.apiCommands.GetAliases.name,
      token: req.headers.authorization,
      callback: ({ error, data }) => {
        if (error) {
          if (error.type === errorCreator.ErrorTypes.DOESNOTEXIST) {
            res.status(404).json({
              error: {
                status: 404,
                title: 'Command does not exist',
                detail: 'Command does not exist',
              },
            });

            return;
          } else if (error.type === errorCreator.ErrorTypes.NOTALLOWED) {
            res.status(401).json({
              error: {
                status: 401,
                title: 'Unauthorized',
                detail: 'Invalid token',
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

        const { aliases, userName } = data.user;

        res.json({ data: { aliases, user: { userName } } });
      },
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

    authenticator.isUserAllowed({
      commandName: dbConfig.apiCommands.CreateAlias.name,
      token: req.headers.authorization,
      callback: ({ error, data }) => {
        if (error) {
          if (error.type === errorCreator.ErrorTypes.DOESNOTEXIST) {
            res.status(404).json({
              error: {
                status: 404,
                title: 'Command does not exist',
                detail: 'Command does not exist',
              },
            });

            return;
          } else if (error.type === errorCreator.ErrorTypes.NOTALLOWED) {
            res.status(401).json({
              error: {
                status: 401,
                title: 'Unauthorized',
                detail: 'Invalid token',
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

        const { alias } = req.body.data;

        manager.addAlias({
          alias,
          user: data.user,
          callback: ({ error: aliasError, data: aliasData }) => {
            if (aliasError) {
              if (aliasError.type === errorCreator.ErrorTypes.INVALIDCHARACTERS) {
                res.status(400).json({
                  error: {
                    status: 400,
                    title: 'Alias contains invalid characters',
                    detail: `Max length: ${appConfig.userNameMaxLength}. a-z 0-9`,
                  },
                });


                return;
              } else if (aliasError.type === errorCreator.ErrorTypes.ALREADYEXISTS) {
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

            res.json({ data: aliasData });
          },
        });
      },
    });
  });

  return router;
}

module.exports = handle;
