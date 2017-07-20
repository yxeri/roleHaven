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
const manager = require('../../helpers/manager');
const dbConfig = require('../../config/defaults/config').databasePopulation;
const objectValidator = require('../../utils/objectValidator');
const authenticator = require('../../helpers/authenticator');
const errorCreator = require('../../objects/error/errorCreator');

const router = new express.Router();

/**
 * @param {Object} io socket io
 * @returns {Object} Router
 */
function handle(io) {
  /**
   * @api {get} /histories Retrieve history from rooms
   * @apiVersion 6.0.0
   * @apiName GetHistories
   * @apiGroup Histories
   *
   * @apiHeader {String} [Authorization] JSON Web Token. Will retrieve chat history from public rooms if not set
   *
   * @apiDescription Retrieves history from the rooms that the user is following. The messages will be sorted by date of creation
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
    authenticator.isUserAllowed({
      commandName: dbConfig.apiCommands.GetHistory.name,
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

        manager.getHistory({
          io,
          user: data.user,
          rooms: data.user.rooms,
          callback: ({ error: historyError, data: messageData }) => {
            if (historyError) {
              res.status(500).json({
                error: {
                  status: 500,
                  title: 'Internal Server Error',
                  detail: 'Internal Server Error',
                },
              });

              return;
            }

            res.json({ data: messageData });
          },
        });
      },
    });
  });

  /**
   * @api {get} /histories/:id Retrieve history from specific room
   * @apiVersion 6.0.0
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
    if (!objectValidator.isValidData(req.params, { id: true })) {
      res.status(400).json({
        error: {
          status: 400,
          title: 'Missing data',
          detail: 'Unable to parse data',
        },
      });

      return;
    }

    const roomName = req.params.id;

    authenticator.isUserAllowed({
      commandName: dbConfig.apiCommands.GetHistory.name,
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
        } else if (data.user.rooms.indexOf(roomName) === -1) {
          res.status(401).json({
            error: {
              status: 401,
              title: 'User not following room',
              detail: 'User is not following room',
            },
          });

          return;
        }

        manager.getHistory({
          io,
          user: data.user,
          rooms: [roomName],
          callback: ({ error: historyError, data: historyData }) => {
            if (historyError) {
              res.status(500).json({
                error: {
                  status: 500,
                  title: 'Internal Server Error',
                  detail: 'Internal Server Error',
                },
              });

              return;
            }

            res.json({ data: historyData });
          },
        });
      },
    });
  });

  return router;
}

module.exports = handle;
