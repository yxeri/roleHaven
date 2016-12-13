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
const manager = require('../../socketHelpers/manager');
const appConfig = require('../../config/defaults/config').app;
const dbUser = require('../../db/connectors/user');
const jwt = require('jsonwebtoken');

const router = new express.Router();

/**
 * @returns {Object} Router
 */
function handle() {
  /**
   * @api {get} /histories Retrieve history from all rooms
   * @apiVersion 5.0.1
   * @apiName GetHistories
   * @apiGroup Histories
   *
   * @apiHeader {String} [Authorization] JSON Web Token. Will retrieve chat history from public rooms if not set
   *
   * @apiDescription Retrieves history from all the rooms that the user is following. The messages will be sorted by date of creation
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.messages Found messages from all rooms
   * @apiSuccessExample {json} Success-Response:
   *  {
   *    "data": {
   *      "timeZoneOffset": 0,
   *      "messages": [
   *        {
   *          "time": "2016-10-14T09:54:18.694Z",
   *          "roomName": "public",
   *          "userName": "rez",
   *          "text": [
   *            "Hello world!"
   *          ]
   *        },
   *        {
   *          "time": "2016-10-14T11:13:03.555Z",
   *          "roomName": "bb1",
   *          "userName": "rez",
   *          "text": [
   *            "..."
   *          ]
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

      dbUser.getUser(decoded.data.userName, (userErr, user) => {
        if (userErr) {
          res.status(500).json({
            errors: [{
              status: 500,
              title: 'Internal Server Error',
              detail: 'Internal Server Error',
            }],
          });

          return;
        }

        manager.getHistory({
          rooms: user.rooms,
          callback: (historyErr, messages) => {
            if (historyErr) {
              res.status(500).json({
                errors: [{
                  status: 500,
                  title: 'Internal Server Error',
                  detail: 'Internal Server Error',
                }],
              });

              return;
            }

            res.json({ data: { timeZoneOffset: new Date().getTimezoneOffset(), messages } });
          },
        });
      });
    });
  });

  /**
   * @api {get} /histories/:id Retrieve history from specific room
   * @apiVersion 5.0.1
   * @apiName GetHistory
   * @apiGroup Histories
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Retrieve history from a specific room, based on the sent room name
   *
   * @apiParam {String} id Name of the room
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.messages Found messages from specific room
   * @apiSuccessExample {json} Success-Response:
   *  {
   *    "data": {
   *      "timeZoneOffset": 0,
   *      "messages": [
   *        {
   *          "time": "2016-10-14T11:13:03.555Z",
   *          "roomName": "bb1",
   *          "userName": "rez",
   *          "text": [
   *            "..."
   *          ]
   *        }
   *      ]
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

      const roomName = req.params.id;

      dbUser.getUser(decoded.data.userName, (userErr, user) => {
        if (userErr) {
          res.status(500).json({
            errors: [{
              status: 500,
              title: 'Internal Server Error',
              detail: 'Internal Server Error',
            }],
          });

          return;
        } else if (user.rooms.indexOf(roomName) === -1) {
          res.status(400).json({
            errors: [{
              status: 400,
              title: 'User is not following room',
              detail: 'The user has to follow the room to be able to retrieve history from it',
            }],
          });

          return;
        }

        manager.getHistory({
          rooms: [roomName],
          lines: appConfig.historyLines,
          missedMsgs: false,
          lastOnline: new Date(),
          callback: (histErr, messages = []) => {
            if (histErr) {
              res.status(500).json({
                errors: [{
                  status: 500,
                  title: 'Internal Server Error',
                  detail: 'Internal Server Error',
                }],
              });

              return;
            }

            res.json({ data: { timeZoneOffset: new Date().getTimezoneOffset(), messages } });
          },
        });
      });
    });
  });

  return router;
}

module.exports = handle;
