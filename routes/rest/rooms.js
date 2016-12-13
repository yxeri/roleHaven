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
const jwt = require('jsonwebtoken');
const manager = require('../../socketHelpers/manager');
const objectValidator = require('../../utils/objectValidator');
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

      const user = auth ? decoded.data : { accessLevel: 0 };

      dbRoom.getAllRooms(user, (roomErr, rooms) => {
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

        res.json({ rooms: rooms.map(room => room.roomName) });
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
   * @apiSuccess {Object} data.rooms Found room. Empty if no room was found
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "rooms": [
   *        {
   *          "_id": "5800ab3023e8ae3300b1548a",
   *          "roomName": "bb1",
   *          "owner": "rez",
   *          "bannedUsers": [
   *            "a1",
   *          ],
   *          "admins": [
   *            "rez2"
   *          ],
   *          "commands": [],
   *          "visibility": 1,
   *          "accessLevel": 1
   *        }
   *      ]
   *    }
   *  }
   */
  router.get('/:id', (req, res) => {
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

      const user = auth ? decoded.data : { accessLevel: 0 };

      dbRoom.getRoom(req.params.id, user, (roomErr, room) => {
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

        res.json({ data: { rooms: [room] } });
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
   * @apiSuccess {Object} data.message Found archive with sent archive ID. Empty if no match was found
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

      const newRoom = req.body.data.room;
      newRoom.roomName = newRoom.roomName.toLowerCase();
      newRoom.owner = decoded.data.userName.toLowerCase();

      manager.createRoom(newRoom, decoded.data, (errRoom, room) => {
        if (errRoom || room === null) {
          res.status(500).json({
            errors: [{
              status: 500,
              title: 'Internal Server Error',
              detail: 'Internal Server Error',
            }],
          });

          return;
        }

        res.json({ data: { room } });
      });
    });
  });

  /**
   * @api {post} /rooms/follow Follow a room
   * @apiVersion 5.0.1
   * @apiName FollowRoom
   * @apiGroup Rooms
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Create and send a message to a room
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

      const { roomName, password = '' } = req.body.data.room;

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

        dbUser.addRoomToUser(decoded.data.userName, room.roomName, (roomErr, user = {}) => {
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

  return router;
}

module.exports = handle;
