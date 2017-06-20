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
const dbRoom = require('../../db/connectors/room');
const manager = require('../../socketHelpers/manager');
const errorCreator = require('../../objects/error/errorCreator');

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
      } else if (!decoded || decoded.data.accessLevel < dbConfig.apiCommands.CreateUser.accessLevel) {
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
          dbConfig.rooms.public.roomName,
          dbConfig.rooms.bcast.roomName,
          dbConfig.rooms.important.roomName,
          dbConfig.rooms.user.roomName,
          dbConfig.rooms.news.roomName,
          dbConfig.rooms.schedule.roomName,
        ],
      };
      const wallet = {
        owner: newUser.userName,
      };

      dbUser.createUser({
        user: newUser,
        callback: ({ error }) => {
          if (error) {
            if (error.type === errorCreator.ErrorTypes.ALREADYEXISTS) {
              res.status(403).json({
                errors: [{
                  status: 403,
                  title: 'User already exists',
                  detail: `User with user name ${newUser.userName} already exists`,
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

          const whisperRoom = {
            roomName: newUser.userName + appConfig.whisperAppend,
            visibility: dbConfig.accessLevels.superUser,
            accessLevel: dbConfig.accessLevels.superUser,
          };

          manager.createRoom({ room: whisperRoom, user: newUser, callback: () => {} });
          manager.createWallet({ wallet, callback: () => {} });

          res.json({ data: { users: [newUser] } });
        },
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

      dbUser.getUser({
        userName: req.params.id,
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
          } else if (decoded.data.accessLevel <= data.user.accessLevel || decoded.data.accessLevel <= data.user.visibility) {
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
            data: { users: [data.user] },
          });
        },
      });
    });
  });

  /**
   * @api {post} /:id/follow Follow a room
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
  router.post('/:id/follow', (req, res) => {
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
      } else if (!decoded || (req.params.id !== decoded.data.userName && decoded.data.accessLevel < dbConfig.apiCommands.FollowRoom.accessLevel)) {
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
      dbRoom.authUserToRoom({
        roomName,
        password,
        user: decoded.data,
        callback: ({ error, data }) => {
          if (error) {
            if (error.type === errorCreator.ErrorTypes.NOTALLOWED) {
              res.status(401).json({
                errors: [{
                  status: 401,
                  title: 'Not authorized to follow room',
                  detail: 'Your user is not allowed to follow the room',
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

          const { room } = data;

          dbUser.addRoomToUser({
            userName,
            roomName: room.roomName,
            callback: ({ error: addError, data: userData }) => {
              if (addError) {
                res.status(500).json({
                  errors: [{
                    status: 500,
                    title: 'Internal Server Error',
                    detail: 'Internal Server Error',
                  }],
                });

                return;
              }

              const { user } = userData;

              if (user.socketId) {
                io.to(user.socketId).emit('follow', { room });
              }

              res.json({ data: { room: { roomName } } });
            },
          });
        },
      });
    });
  });

  /**
   * @api {post} /:id/unfollow Unfollow a room
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
  router.post('/:id/unfollow', (req, res) => {
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
      } else if (!decoded || (req.params.id !== decoded.data.userName && decoded.data.accessLevel < dbConfig.apiCommands.UnfollowRoom.accessLevel)) {
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

      dbUser.removeRoomFromUser({
        userName,
        roomName,
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

          const { user } = data;

          if (user.socketId) {
            io.to(user.socketId).emit('unfollow', { room: { roomName } });
          }

          res.json({ data: { room: { roomName } } });
        },
      });
    });
  });

  return router;
}

module.exports = handle;
