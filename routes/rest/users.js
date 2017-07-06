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
const appConfig = require('../../config/defaults/config').app;
const jwt = require('jsonwebtoken');
const objectValidator = require('../../utils/objectValidator');
const dbConfig = require('../../config/defaults/config').databasePopulation;
const dbUser = require('../../db/connectors/user');
const manager = require('../../socketHelpers/manager');
const errorCreator = require('../../objects/error/errorCreator');
const mailer = require('../../socketHelpers/mailer');

const router = new express.Router();

/**
 * @param {Object} io Socket.io
 * @returns {Object} Router
 */
function handle() {
  /**
   * @api {get} /users Retrieve all users
   * @apiVersion 5.0.1
   * @apiName GetUsers
   * @apiGroup Users
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Retrieve all users
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.users Users found
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "users": [
   *        {
   *          "userName": "rez",
   *          "team": "n4",
   *          "online": true
   *        },
   *        {
   *          "userName": "raz",
   *          "online": false
   *        }
   *      ]
   *    }
   *  }
   */
  router.get('/', (req, res) => {
    // noinspection JSUnresolvedVariable
    const auth = req.headers.authorization || '';

    jwt.verify(auth, appConfig.jsonKey, (jwtErr, decoded) => {
      if (jwtErr || !decoded) {
        res.status(401).json({
          errors: [{
            status: 401,
            title: 'Unauthorized',
            detail: 'Invalid token',
          }],
        });

        return;
      }

      dbUser.getAllUsers({
        user: decoded.data,
        callback: ({ error, data }) => {
          if (error) {
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
            data: {
              users: data.users.map((user) => {
                const userObj = {
                  userName: user.userName,
                  team: user.team,
                  online: user.online,
                };

                return userObj;
              }),
            },
          });
        },
      });
    });
  });

  /**
   * @api {post} /users/:id/resetPassword Request user password reset
   * @apiVersion 5.1.0
   * @apiName ResetUserPassword
   * @apiGroup Users
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Request user password reset. A mail will be sent to the user's registered mail address
   *
   * @apiParam {String} id User's mail address
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.success Was the reset mail properly sent?
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "success": true
   *    }
   *  }
   */
  router.post('/:id/resetPassword', (req, res) => {
    if (!objectValidator.isValidData(req.params, { id: true })) {
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
    const auth = req.headers.authorization || '';

    jwt.verify(auth, appConfig.jsonKey, (jwtErr, decoded) => {
      if (jwtErr || !decoded) {
        res.status(401).json({
          errors: [{
            status: 401,
            title: 'Unauthorized',
            detail: 'Invalid token',
          }],
        });

        return;
      }

      const mail = req.params.id;

      dbUser.getUserByMail({
        mail,
        callback: ({ error, data }) => {
          if (error) {
            if (error.type === errorCreator.ErrorTypes.DOESNOTEXIST) {
              res.status(404).json({
                errors: [{
                  status: 404,
                  title: 'User with mail does not exist',
                  detail: 'User with mail not exist',
                }],
              });

              return;
            }

            res.status(500).json({
              errors: [{
                status: 500,
                title: 'Internal Server Error',
                detail: 'Failed to send reset mail',
              }],
            });

            return;
          }

          const { user } = data;

          mailer.sendPasswordReset({
            address: user.mail,
            userName: user.userName,
            callback: (resetData) => {
              if (resetData.error) {
                res.status(500).json({
                  errors: [{
                    status: 500,
                    title: 'Internal Server Error',
                    detail: 'Failed to send reset mail',
                  }],
                });

                return;
              }

              res.json({ data: { success: true } });
            },
          });
        },
      });
    });
  });

  /**
   * @api {post} /users Create a user
   * @apiVersion 5.1.0
   * @apiName CreateUser
   * @apiGroup Users
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Create a user
   *
   * @apiParam {Object} data
   * @apiParam {Object} data.user User
   * @apiParam {string} data.user.userName User name
   * @apiParam {string} data.user.password Password of the user
   * @apiParam {string} data.user.mail Mail address to the user
   * @apiParam {string} [data.user.fullName] Full name of the user. Defaults to userName
   * @apiParam {boolean} [data.user.lootable] Is the user's device lootable? Default is false
   * @apiParamExample {json} Request-Example:
   *   {
   *    "data": {
   *      "user": {
   *        "userName": "rez",
   *        "password": "password"
   *        "fullName": "Mr. X"
   *      }
   *    }
   *  }
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.users User created
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "success": true
   *    }
   *  }
   */
  router.post('/', (req, res) => {
    if (!objectValidator.isValidData(req.body, { data: { user: { userName: true, password: true, mail: true } } })) {
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
    const auth = req.headers.authorization || '';

    jwt.verify(auth, appConfig.jsonKey, (jwtErr, decoded) => {
      if (jwtErr || !decoded || decoded.data.accessLevel < dbConfig.apiCommands.CreateUser.accessLevel) {
        res.status(401).json({
          errors: [{
            status: 401,
            title: 'Unauthorized',
            detail: 'Invalid token',
          }],
        });

        return;
      }

      const { user } = req.body.data;
      user.userName = user.userName.toLowerCase();
      user.registerDevice = 'RESTAPI';

      manager.createUser({
        user,
        callback: ({ error, data }) => {
          if (error) {
            if (error.type === errorCreator.ErrorTypes.ALREADYEXISTS) {
              res.status(403).json({
                errors: [{
                  status: 403,
                  title: 'User already exists',
                  detail: `User with user name ${user.userName} already exists`,
                }],
              });

              return;
            } else if (error.type === errorCreator.ErrorTypes.INVALIDDATA) {
              res.status(400).json({
                errors: [{
                  status: 400,
                  title: 'Invalid data',
                  detail: 'Invalid data',
                }],
              });

              return;
            }

            res.status(500).json({
              errors: [{
                status: 500,
                title: 'Internal Server Error',
                detail: 'Internal Server Error',
              }],
            });

            return;
          }

          res.json({ data });
        },
      });
    });
  });

  /**
   * @api {get} /users/:id Retrieve a specific user
   * @apiVersion 5.1.1
   * @apiName GetUser
   * @apiGroup Users
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Retrieve a specific user
   *
   * @apiParam {String} id User name
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.user Found user. Empty if no user was found
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "user":
   *    }
   *  }
   */
  router.get('/:id', (req, res) => {
    if (!objectValidator.isValidData(req.params, { id: true })) {
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
    const auth = req.headers.authorization || '';

    jwt.verify(auth, appConfig.jsonKey, (jwtErr, decoded) => {
      if (jwtErr || !decoded) {
        res.status(401).json({
          errors: [{
            status: 401,
            title: 'Unauthorized',
            detail: 'Invalid token',
          }],
        });

        return;
      }

      const userName = req.params.id;

      dbUser.getUser({
        userName,
        callback: ({ error, data }) => {
          if (error) {
            if (error.type === errorCreator.ErrorTypes.DOESNOTEXIST) {
              res.status(404).json({
                errors: [{
                  status: 404,
                  title: 'Failed to retrieve user',
                  detail: 'Unable to retrieve user, due it it not existing or your user not having high enough access level',
                }],
              });

              return;
            }

            res.status(500).json({
              errors: [{
                status: 500,
                title: 'Internal Server Error',
                detail: 'Internal Server Error',
              }],
            });

            return;
          } else if (decoded.data.userName !== userName && (decoded.data.accessLevel < data.user.accessLevel || decoded.data.accessLevel < data.user.visibility)) {
            res.status(404).json({
              errors: [{
                status: 404,
                title: 'Failed to retrieve user',
                detail: 'Unable to retrieve user, due it it not existing or your user not having high enough access level',
              }],
            });

            return;
          }

          res.json({
            data: { user: data.user },
          });
        },
      });
    });
  });

  return router;
}

module.exports = handle;
