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
const dbRoom = require('../../db/connectors/room');
const manager = require('../../socketHelpers/manager');

const router = new express.Router();

/**
 * @param {Object} io Socket.io
 * @returns {Object} Router
 */
function handle(io) {
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
   * @apiParam {string} [data.user.fullName] Full name of the user. Defaults to userName
   * @apiParam {boolean} [data.user.lootable] Is the user's device lootable? Default is false
   * @apiParam {string} [data.registerCode]
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
   *      "users": [
   *        {
   *          "fullName": "Mr. X",
   *          "userName": "rez",
   *          "registerDevice": "RESTAPI",
   *          "authGroups": [],
   *          "online": false,
   *          "banned": false,
   *          "verified": false,
   *          "rooms": [
   *            "public",
   *            "broadcast"
   *          ],
   *          "visibility": "1",
   *          "accessLevel": "1"
   *        }
   *      ]
   *    }
   *  }
   */
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
    const auth = req.headers.authorization || '';

    jwt.verify(auth, appConfig.jsonKey, (jwtErr, decoded) => {
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

      const { user } = req.body.data;
      user.userName = user.userName.toLowerCase();

      // TODO Duplicate code with register
      const newUser = {
        fullName: user.fullName || user.userName.toLowerCase(),
        userName: user.userName.toLowerCase(),
        password: user.password,
        registerDevice: 'RESTAPI',
        verified: false,
        rooms: [
          databasePopulation.rooms.public.roomName,
          databasePopulation.rooms.bcast.roomName,
        ],
      };
      const wallet = {
        owner: newUser.userName,
      };

      dbUser.createUser(newUser, (userErr, createdUser) => {
        if (userErr) {
          res.status(500).json({
            errors: [{
              status: 500,
              title: 'Internal Server Error',
              detail: 'Internal Server Error',
            }],
          });

          return;
        } else if (createdUser === null) {
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
          roomName: newUser.userName + appConfig.whisperAppend,
          visibility: databasePopulation.accessLevels.superUser,
          accessLevel: databasePopulation.accessLevels.superUser,
        };

        manager.createRoom(whisperRoom, user, () => {});
        manager.createWallet(wallet, () => {});

        res.json({ data: { users: [user] } });
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
   * @apiParam {String} id User name
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
    const auth = req.headers.authorization || '';

    jwt.verify(auth, appConfig.jsonKey, (jwtErr, decoded) => {
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

  /**
   * @api {put} /:id/follow Follow a room
   * @apiVersion 5.1.0
   * @apiName FollowRoom
   * @apiGroup Users
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Follow a room
   *
   * @apiParam {Object} id User name
   *
   * @apiParam {Object} data
   * @apiParam {Object} data.room Room
   * @apiParam {String} data.room.roomName Name of the room to follow
   * @apiParam {String} [data.room.password] Password of the room to follow
   * @apiParamExample {json} Request-Example:
   *   {
   *    "data": {
   *      "room": {
   *        "roomName": "bb1",
   *        "password": "password"
   *      }
   *    }
   *  }
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.room Room
   * @apiSuccess {String} data.room.roomName Name of the room that is followed
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "room": {
   *        "roomName": "bb1"
   *      }
   *    }
   *  }
   */
  router.put('/:id/follow', (req, res) => {
    if (!objectValidator.isValidData(req.body, { data: { room: { roomName: true } } })) {
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
      if (jwtErr) {
        res.status(500).json({
          errors: [{
            status: 500,
            title: 'Internal Server Error',
            detail: 'Internal Server Error',
          }],
        });

        return;
      } else if (!decoded || (req.params.id !== decoded.data.userName && decoded.data.accessLevel < databasePopulation.apiCommands.FollowRoom.accessLevel)) {
        res.status(401).json({
          errors: [{
            status: 401,
            title: 'Unauthorized',
            detail: 'Invalid token',
          }],
        });

        return;
      }

      const { roomName, password = '' } = req.body.data.room;
      const userName = req.params.id;

      // Checks that the user trying to add a user to a room has access to it
      dbRoom.authUserToRoom(decoded.data, roomName, password, (errRoom, room) => {
        if (errRoom) {
          res.status(500).json({
            errors: [{
              status: 500,
              title: 'Internal Server Error',
              detail: 'Internal Server Error',
            }],
          });

          return;
        } else if (room === null) {
          res.status(401).json({
            errors: [{
              status: 401,
              title: 'Not authorized to follow room',
              detail: 'Your user is not allowed to follow the room',
            }],
          });

          return;
        }

        dbUser.addRoomToUser(userName, room.roomName, (roomErr, user = {}) => {
          if (roomErr) {
            res.status(500).json({
              errors: [{
                status: 500,
                title: 'Internal Server Error',
                detail: 'Internal Server Error',
              }],
            });

            return;
          }

          if (user.socketId) {
            io.to(user.socketId).emit('follow', { room });
          }

          res.json({ data: { room: { roomName } } });
        });
      });
    });
  });

  /**
   * @api {put} /:id/unfollow Unfollow a room
   * @apiVersion 5.1.0
   * @apiName UnfollowRoom
   * @apiGroup Users
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Unfollow a room
   *
   * @apiParam {Object} id User name
   *
   * @apiParam {Object} data
   * @apiParam {Object} data.room Room
   * @apiParam {String} data.room.roomName Name of the room to unfollow
   * @apiParamExample {json} Request-Example:
   *   {
   *    "data": {
   *      "room": {
   *        "roomName": "bb1"
   *      }
   *    }
   *  }
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.room Room
   * @apiSuccess {String} data.room.roomName Name of the room that was unfollowed
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "room": {
   *        "roomName": "bb1"
   *      }
   *    }
   *  }
   */
  router.put('/:id/unfollow', (req, res) => {
    if (!objectValidator.isValidData(req.body, { data: { room: { roomName: true } } })) {
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
      if (jwtErr) {
        res.status(500).json({
          errors: [{
            status: 500,
            title: 'Internal Server Error',
            detail: 'Internal Server Error',
          }],
        });

        return;
      } else if (!decoded || (req.params.id !== decoded.data.userName && decoded.data.accessLevel < databasePopulation.apiCommands.UnfollowRoom.accessLevel)) {
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
      const { roomName } = req.body.data.room;

      dbUser.removeRoomFromUser(userName, roomName, (roomErr, user = {}) => {
        if (roomErr) {
          res.status(500).json({
            errors: [{
              status: 500,
              title: 'Internal Server Error',
              detail: 'Internal Server Error',
            }],
          });

          return;
        }

        if (user.socketId) {
          io.to(user.socketId).emit('unfollow', { room: { roomName } });
        }

        res.json({ data: { room: { roomName } } });
      });
    });
  });

  return router;
}

module.exports = handle;
