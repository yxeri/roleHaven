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
const databasePopulation = require('../../config/defaults/config').databasePopulation;
const dbUser = require('../../db/connectors/user');
const manager = require('../../socketHelpers/manager');

const router = new express.Router();

/**
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
   * @apiSuccess {Object} data.message Found archive with sent archive ID. Empty if no match was found
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

      dbUser.getAllUsers(decoded.data, (userErr, users) => {
        if (userErr || users === null) {
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
            users: users.map((user) => {
              const userObj = {
                userName: user.userName,
                team: user.team,
                online: user.online,
              };

              return userObj;
            }),
          },
        });
      });
    });
  });

  /**
   * @api {post} /users Create a user
   * @apiVersion 5.0.1
   * @apiName CreateUser
   * @apiGroup Users
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Create a user
   *
   * @apiParam {Object} data
   * @apiParam {Object} data.user User
   * @apiParam {String} data.user.userName - Name of the user
   * @apiParam {String} data.user.password - Password of the user
   * @apiParamExample {json} Request-Example:
   *   {
   *    "data": {
   *      "user": {
   *        "userName": "rez",
   *        "password": "password"
   *      }
   *    }
   *  }
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.users User created
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "users": [
   *        {
   *          "userName": "bb6",
   *          "registerDevice": "RESTAPI",
   *          "mode": "cmd",
   *          "_id": "5815d6df93a4fb3300e14a4f",
   *          "authGroups": [],
   *          "online": false,
   *          "banned": false,
   *          "verified": false,
   *          "rooms": [
   *            "public",
   *            "important",
   *            "broadcast",
   *            "morse"
   *          ],
   *          "visibility": "1",
   *          "accessLevel": "1"
   *        }
   *      ]
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

      // TODO Duplicate code with register
      const newUser = {
        userName: req.body.data.user.userName.toLowerCase(),
        password: req.body.data.user.password,
        registerDevice: 'RESTAPI',
        mode: appConfig.defaultMode,
        verified: false,
        rooms: [
          databasePopulation.rooms.public.roomName,
          databasePopulation.rooms.important.roomName,
          databasePopulation.rooms.bcast.roomName,
          databasePopulation.rooms.morse.roomName,
        ],
      };

      dbUser.createUser(newUser, (userErr, user) => {
        if (userErr) {
          res.status(500).json({
            errors: [{
              status: 500,
              title: 'Internal Server Error',
              detail: 'Internal Server Error',
            }],
          });

          return;
        } else if (user === null) {
          res.status(402).json({
            errors: [{
              status: 402,
              title: 'User already exists',
              detail: `User with user name ${newUser.userName} already exists`,
            }],
          });

          return;
        }

        const whisperRoom = {
          roomName: user.userName + appConfig.whisperAppend,
          visibility: 12,
          accessLevel: 12,
        };

        manager.createRoom(whisperRoom, user, () => {
        });

        res.json({
          data: { users: [user] },
        });
      });
    });
  });

  /**
   * @api {get} /users/:id Retrieve a specific user
   * @apiVersion 5.0.1
   * @apiName GetUser
   * @apiGroup Users
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Retrieve a specific user
   *
   * @apiParam {String} id
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.user Found user. Empty if no user was found
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "users": []
   *    }
   *  }
   */
  router.get('/:id', (req, res) => {
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
      } else if (!decoded) {
        res.status(401).json({
          errors: [{
            status: 401,
            title: 'Unauthorized',
            detail: 'Invalid token',
          }],
        });
      } else {
        dbUser.getUser(req.params.id, (userErr, user) => {
          if (userErr) {
            res.status(500).json({
              errors: [{
                status: 500,
                title: 'Internal Server Error',
                detail: 'Internal Server Error',
              }],
            });
          } else if (user === null || user.userName !== decoded.data.userName) {
            res.status(402).json({
              errors: [{
                status: 402,
                title: 'Failed to retrieve user',
                detail: 'Unable to retrieve user, due it it not existing or your user not having high enough access level',
              }],
            });
          } else {
            res.json({
              data: { users: [user] },
            });
          }
        });
      }
    });
  });

  return router;
}

module.exports = handle;
