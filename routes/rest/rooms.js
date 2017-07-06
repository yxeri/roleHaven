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
const dbRoom = require('../../db/connectors/room');
const appConfig = require('../../config/defaults/config').app;
const dbConfig = require('../../config/defaults/config').databasePopulation;
const jwt = require('jsonwebtoken');
const manager = require('../../socketHelpers/manager');
const objectValidator = require('../../utils/objectValidator');
const errorCreator = require('../../objects/error/errorCreator');
const dbUser = require('../../db/connectors/user');

const router = new express.Router();

/**
 * @param {object} io - Socket.IO
 * @returns {Object} Router
 */
function handle(io) {
  /**
   * @api {get} /rooms Retrieve all rooms
   * @apiVersion 5.0.1
   * @apiName GetRooms
   * @apiGroup Rooms
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Retrieve all rooms available to your user
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.rooms Found rooms
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "rooms": [
   *        "public",
   *        "bb1"
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

      const user = auth ? decoded.data : { accessLevel: 0 };

      dbRoom.getAllRooms({
        user,
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

          res.json({ data: { rooms: data.rooms.map(room => room.roomName) } });
        },
      });
    });
  });

  /**
   * @api {get} /rooms/:id Retrieve specific room
   * @apiVersion 5.0.1
   * @apiName GetRoom
   * @apiGroup Rooms
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Retrieve a specific room, based on sent room name
   *
   * @apiParam {String} id Name of the room to retrieve
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.room Found room. Empty if no room was found
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "room": {
   *        "roomName": "bb1",
   *        "owner": "rez",
   *        "bannedUsers": [
   *          "a1",
   *        ],
   *        "admins": [
   *          "rez2"
   *        ],
   *        "commands": [],
   *        "visibility": 1,
   *        "accessLevel": 1
   *      }
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

      const user = auth ? decoded.data : { accessLevel: 0 };

      dbRoom.getRoom({
        roomName: req.params.id,
        callback: ({ error, data }) => {
          if (error) {
            if (error.type === errorCreator.ErrorTypes.DOESNOTEXIST) {
              res.status(404).json({
                errors: [{
                  status: 404,
                  title: 'Room does not exist',
                  detail: 'Room does not exist',
                }],
              });

              return;
            } else if (user.accessLevel < data.room.accessLevel) {
              res.status(401).json({
                errors: [{
                  status: 401,
                  title: 'Unauthorized',
                  detail: '',
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

          res.json({ data: { room: data.room } });
        },
      });
    });
  });

  /**
   * @api {post} /rooms Create a room
   * @apiVersion 5.0.1
   * @apiName CreateRoom
   * @apiGroup Rooms
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Create a room
   *
   * @apiParam {Object} data
   * @apiParam {Object} data.room Room
   * @apiParam {String} data.room.roomName Name of the room to create
   * @apiParam {String} [data.room.password] Password for the room. Leave unset if you don't want to password-protect the room
   * @apiParam {Number} [data.room.visibility] Minimum access level required to see the room. 0 = anonymous. 1 = registered user. Default is 1.
   * @apiParam {Number} [data.room.accessLevel] Minimum access level required to follow the room. 0 = anonymous. 1 = registered user. Default is 1.
   * @apiParamExample {json} Request-Example:
   *   {
   *    "data": {
   *      "room": {
   *        "roomName": "bb1",
   *        "accessLevel": 0
   *      }
   *    }
   *  }
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.room Room created
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "room": {
   *        "roomName": "bb1",
   *        "owner": "rez",
   *        "bannedUsers": [],
   *        "admins": [],
   *        "commands": [],
   *        "visibility": 1,
   *        "accessLevel": 0,
   *        password: false
   *      }
   *    }
   *  }
   */
  router.post('/', (req, res) => {
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

      const newRoom = req.body.data.room;
      newRoom.roomName = newRoom.roomName.toLowerCase();
      newRoom.owner = decoded.data.userName.toLowerCase();

      manager.createRoom({
        room: newRoom,
        user: decoded.data,
        callback: ({ error, data }) => {
          if (error) {
            if (error.type === errorCreator.ErrorTypes.ALREADYEXISTS) {
              res.status(403).json({
                errors: [{
                  status: 403,
                  title: 'Room already exists',
                  detail: 'Room already exists',
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
   * @api {post} /rooms/follow Follow a room
   * @apiVersion 5.1.1
   * @apiName FollowRoom
   * @apiGroup Rooms
   *
   * @apiHeader {string} Authorization Your JSON Web Token
   *
   * @apiDescription Follow a room
   *
   * @apiParam {Object} data
   * @apiParam {Object} data.room Room
   * @apiParam {string} data.room.roomName Name of the room
   * @apiParam {string} [data.room.password] Password for the room
   * @apiParamExample {json} Request-Example:
   *   {
   *    "data": {
   *      "room": {
   *        "room": "broom",
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
   *        "roomName": "broom"
   *      }
   *    }
   *  }
   */
  router.post('/follow', (req, res) => {
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
      } else if (!decoded || decoded.data.accessLevel < dbConfig.apiCommands.FollowRoom.accessLevel) {
        res.status(401).json({
          errors: [{
            status: 401,
            title: 'Unauthorized',
            detail: 'Invalid token',
          }],
        });

        return;
      }

      const { roomName, password } = req.body.data.room;

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
            userName: decoded.data.userName,
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
   * @api {post} /rooms/unfollow Unfollow a room
   * @apiVersion 5.1.1
   * @apiName UnfollowRoom
   * @apiGroup Rooms
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Unfollow a room
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
  router.post('/unfollow', (req, res) => {
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
      } else if (!decoded || decoded.data.accessLevel < dbConfig.apiCommands.UnfollowRoom.accessLevel) {
        res.status(401).json({
          errors: [{
            status: 401,
            title: 'Unauthorized',
            detail: 'Invalid token',
          }],
        });

        return;
      }

      const { roomName } = req.body.data.room;

      dbUser.removeRoomFromUser({
        roomName,
        userName: decoded.data.userName,
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
