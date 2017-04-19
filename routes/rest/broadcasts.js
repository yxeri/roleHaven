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
const appConfig = require('../../config/defaults/config').app;
const jwt = require('jsonwebtoken');
const messenger = require('../../socketHelpers/messenger');
const objectValidator = require('../../utils/objectValidator');
const dbConfig = require('../../config/defaults/config').databasePopulation;

const router = new express.Router();


/**
 * @param {object} io - Socket.IO
 * @returns {Object} Router
 */
function handle(io) {
  /**
   * @api {post} /broadcasts Send a broadcast
   * @apiVersion 5.0.3
   * @apiName SendBroadcast
   * @apiGroup Broadcasts
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Send a broadcast
   *
   * @apiParam {Object} data
   * @apiParam {Object} data.message Message
   * @apiParam {String} [data.message.userName] Name of the sender. Default will be set to a generic term, such as "SYSTEM"
   * @apiParam {String[]} data.message.text Content of the message
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
     *      }]
     *    }
     *  }
   */
  router.post('/broadcast', (req, res) => {
    if (!objectValidator.isValidData(req.body, { data: { message: { text: true } } })) {
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
      } else if (!decoded || decoded.data.accessLevel < dbConfig.apiCommands.SendBroadcast.accessLevel) {
        res.status(401).json({
          errors: [{
            status: 401,
            title: 'Unauthorized',
            detail: 'Invalid token',
          }],
        });

        return;
      }

      const message = req.body.data.message;
      const callback = ({ error, data }) => {
        if (error) {
          if (error.type && error.type === 'Not allowed') {
            res.status(401).json({
              errors: [{
                status: 401,
                title: 'Unauthorized',
                detail: 'Not allowed to send broadcast',
              }],
            });
          } else {
            res.status(500).json({
              errors: [{
                status: 500,
                title: 'Internal Server Error',
                detail: 'Internal Server Error',
              }],
            });
          }

          return;
        }

        res.json({ data: { message: data.message } });
      };

      messenger.sendBroadcastMsg({ message, io, callback, user: decoded.data });
    });
  });

  return router;
}

module.exports = handle;
