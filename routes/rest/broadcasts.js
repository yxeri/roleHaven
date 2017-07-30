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
const messenger = require('../../helpers/messenger');
const objectValidator = require('../../utils/objectValidator');
const restErrorChecker = require('../../helpers/restErrorChecker');
const broadcastManager = require('../../managers/broadcasts');
const errorCreator = require('../../objects/error/errorCreator');

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
     *      "message": {
     *        "text": [
     *          "Hello world!"
     *        ],
     *        "userName": "rez",
     *        "time": "2016-10-28T22:42:06.262Z"
     *      }
     *    }
     *  }
   */
  router.post('/', (request, response) => {
    if (!objectValidator.isValidData(request.body, { data: { message: { text: true } } })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '' }), sentData: request.body.data });

      return;
    }

    messenger.sendBroadcastMsg({
      io,
      token: request.headers.authorization,
      message: request.body.data.message,
      callback: ({ error, data }) => {
        if (error) {
          restErrorChecker.checkAndSendError({ response, error, sentData: request.body.data });

          return;
        }

        response.json({ data });
      },
    });
  });

  /**
   * @api {post} /broadcasts Get broadcasts
   * @apiVersion 6.0.0
   * @apiName GetBroadcasts
   * @apiGroup Broadcasts
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Get broadcasts
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.message Message sent
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "messages": [{
   *        "text": [
   *          "Hello world!"
   *        ],
   *        "userName": "rez",
   *        "time": "2016-10-28T22:42:06.262Z"
   *      }
   *    }
   *  }
   */
  router.get('/', (request, response) => {
    broadcastManager.getBroadcasts({
      token: request.headers.authorization,
      callback: ({ error, data }) => {
        if (error) {
          restErrorChecker.checkAndSendError({ response, error, sentData: request.body.data });

          return;
        }

        response.json({ data });
      },
    });
  });

  return router;
}

module.exports = handle;
