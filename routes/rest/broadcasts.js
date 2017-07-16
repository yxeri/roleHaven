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
const messenger = require('../../socketHelpers/messenger');
const objectValidator = require('../../utils/objectValidator');
const dbConfig = require('../../config/defaults/config').databasePopulation;
const errorCreator = require('../../objects/error/errorCreator');
const authenticator = require('../../socketHelpers/authenticator');

const router = new express.Router();


/**
 * @param {object} io - Socket.IO
 * @returns {Object} Router
 */
function handle(io) {
  /**
   * @api {post} /broadcasts Send a broadcast
   * @apiVersion 6.0.0
   * @apiName SendBroadcast
   * @apiGroup Broadcasts
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Send a broadcast
   *
   * @apiParam {Object} data
   * @apiParam {Object} data.message Message
   * @apiParam {String[]} data.message.text Content of the message
   * @apiParam {String} [data.message.userName] Name of the sender. Default will be set to a generic term, such as "SYSTEM"
   * @apiParamExample {json} Request-Example:
   *   {
     *    "data": {
     *      "message": {
     *        "text": [
     *          "Hello world!"
     *        ]
     *      }
     *    }
     *  }
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.message Message sent
   * @apiSuccessExample {json} Success-Response:
   *   {
     *    "data": {
     *      "message": [{
     *        "text": [
     *          "Hello world!"
     *        ],
     *        "userName": "rez",
     *        "time": "2016-10-28T22:42:06.262Z"
     *      }
     *    }
     *  }
   */
  router.post('/', (req, res) => {
    if (!objectValidator.isValidData(req.body, { data: { message: { text: true } } })) {
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
      commandName: dbConfig.apiCommands.SendBroadcast.name,
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

        messenger.sendBroadcastMsg({
          io,
          message: req.body.data.message,
          user: data.user,
          callback: ({ error: broadcastError, data: broadcastData }) => {
            if (broadcastError) {
              if (broadcastError.type === errorCreator.ErrorTypes.INVALIDCHARACTERS) {
                res.status(400).json({
                  error: {
                    status: 400,
                    title: 'Missing data',
                    detail: 'Unable to parse data',
                  },
                });

                return;
              } else if (broadcastError.type === errorCreator.ErrorTypes.NOTALLOWED) {
                res.status(401).json({
                  error: {
                    status: 401,
                    title: 'Unauthorized user',
                    detail: 'User not allowed to use feature',
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
            }

            res.json({ data: broadcastData });
          },
        });
      },
    });
  });

  return router;
}

module.exports = handle;
