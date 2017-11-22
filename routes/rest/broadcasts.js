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
const objectValidator = require('../../utils/objectValidator');
const restErrorChecker = require('../../helpers/restErrorChecker');
const broadcastManager = require('../../managers/messages');
const errorCreator = require('../../objects/error/errorCreator');

const router = new express.Router();


/**
 * @param {object} io - Socket.IO
 * @returns {Object} Router
 */
function handle(io) {
  /**
   * @api {post} /broadcasts Send a broadcast
   * @apiVersion 7.0.0
   * @apiName SendBroadcast
   * @apiGroup Broadcasts
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Send a broadcast message
   *
   * @apiParam {Object} data
   * @apiParam {Object} data.message - Message
   * @apiParam {string[]} data.message.text - Text content. Each index is intepreted as a new line
   * @apiParam {string[]} [data.message.intro] - Intro text. Will be printed before message.text
   * @apiParam {string[]} [data.message.extro] - Extro text. Will be printed after message.text
   * @apiParam {string} [data.message.aliasId] - ID of the alias that will be shown as sender
   * @apiParam {Object} [data.coordinates] - GPS coordinates to the location where the broadcast was sent from
   * @apiParam {Object} data.coordinates.longitude - Longitude
   * @apiParam {Object} data.coordinates.latitude - Latitude
   * @apiParam {Object} data.coordinates.speed - Speed
   * @apiParam {Object} data.coordinates.accuracy - Accuracy in meters
   * @apiParam {Object} data.coordinates.heading - Heading (0 - 359)
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.message - Message sent
   */
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
   * @apiParam {String[]} data.message.text Content of the message
   * @apiParam {String} [data.message.username] Name of the sender. Default will be set to a generic term, such as "SYSTEM"
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
     *        "username": "rez",
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

    broadcastManager.sendBroadcastMsg({
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
   * @apiVersion 7.0.0
   * @apiName GetBroadcasts
   * @apiGroup Broadcasts
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Get broadcasts
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.message - Message sent
   */
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
   *        "username": "rez",
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
