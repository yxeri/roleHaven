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
const messenger = require('../../socketHelpers/messenger');
const objectValidator = require('../../utils/objectValidator');

const router = new express.Router();


/**
 * @param {object} io - Socket.IO
 * @returns {Object} Router
 */
function handle(io) {
  /**
   * @api {post} /messages Create and send a message
   * @apiVersion 5.0.2
   * @apiName CreateMessage
   * @apiGroup Messages
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Create and send a message to a room
   *
   * @apiParam {Object} data
   * @apiParam {Object} data.message Message
   * @apiParam {String} data.message.roomName Name of the room to send the message to
   * @apiParam {String} [data.message.userName] Name of the sender. Default is your user name. You can instead set it to one of your user's aliases
   * @apiParam {String[]} data.message.text Content of the message
   * @apiParamExample {json} Request-Example:
   *   {
   *    "data": {
   *      "message": {
   *        "roomName": "bb1",
   *        "userName": "rez",
   *        "text": [
   *          "Hello world!"
   *        ]
   *      }
   *    }
   *  }
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.message Found archive with sent archive ID. Empty if no match was found
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "message": {
   *        "roomName": "bb1",
   *        "text": [
   *          "Hello world!"
   *        ],
   *        "userName": "rez",
   *        "time": "2016-10-28T22:42:06.262Z"
   *      }
   *    }
   *  }
   */
  /**
   * @api {post} /messages Create and send a message
   * @apiVersion 5.0.1
   * @apiName CreateMessage
   * @apiGroup Messages
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Create and send a message to a room
   *
   * @apiParam {Object} data
   * @apiParam {Object} data.message Message
   * @apiParam {String} data.message.roomName Name of the room to send the message to
   * @apiParam {String[]} data.message.text Content of the message
   * @apiParamExample {json} Request-Example:
   *   {
   *    "data": {
   *      "message": {
   *        "roomName": "bb1",
   *        "text": [
   *          "Hello world!"
   *        ]
   *      }
   *    }
   *  }
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.message Found archive with sent archive ID. Empty if no match was found
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "message": {
   *        "roomName": "bb1",
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
    if (!objectValidator.isValidData(req.body, { data: { message: { roomName: true, text: true } } })) {
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

      const message = req.body.data.message;

      messenger.sendChatMsg({
        io,
        message,
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

          res.json({ data: { message: data.message } });
        },
      });
    });
  });


  return router;
}

module.exports = handle;
