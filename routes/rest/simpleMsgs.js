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
const simpleMsgManager = require('../../managers/simpleMsgs');
const errorCreator = require('../../objects/error/errorCreator');

const router = new express.Router();


/**
 * @param {object} io - Socket.IO
 * @returns {Object} Router
 */
function handle(io) {
  /**
   * @api {post} /simpleMsgs Send a simple message
   * @apiVersion 6.0.0
   * @apiName SendSimpleMsgs
   * @apiGroup SimpleMsgs
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Send a simple message
   *
   * @apiParam {Object} data
   * @apiParam {Object} data.simpleMsg Simple message
   * @apiParam {String[]} data.message.text Content of the message
   * @apiParamExample {json} Request-Example:
   *   {
     *    "data": {
     *      "simpleMsg": {
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
    if (!objectValidator.isValidData(request.body, { data: { simpleMsg: true } })) {
      restErrorChecker({ response, error: new errorCreator.InvalidData({ expected: '{ data { simpleMsg } }' }) });

      return;
    }

    simpleMsgManager.sendSimpleMsg({
      io,
      token: request.headers.authorization,
      text: request.body.data.simpleMsg.text,
      callback: ({ error, data }) => {
        if (error) {
          restErrorChecker.checkAndSendError({ response, error });

          return;
        }

        response.json({ data });
      },
    });
  });

  /**
   * @api {post} /simpleMsgs Get simple messages
   * @apiVersion 6.0.0
   * @apiName GetSimpleMsgs
   * @apiGroup SimpleMsgs
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Get simple messages
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.simpleMsgs Messages retrievec
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "simpleMsgs": [{
   *        "text": [
   *          "Hello world!"
   *        ],
   *        "userName": "rez",
   *        "time": "2016-10-28T22:42:06.262Z"
   *      }, {
   *        "text": [
   *          "Hello back!"
   *        ],
   *        "userName": "bez",
   *        "time": "2016-11-28T22:42:06.262Z"
   *      }]
   *    }
   *  }
   */
  router.get('/', (request, response) => {
    simpleMsgManager.getSimpleMsgs({
      token: request.headers.authorization,
      callback: ({ error, data }) => {
        if (error) {
          restErrorChecker.checkAndSendError({ response, error });

          return;
        }

        response.json({ data });
      },
    });
  });

  return router;
}

module.exports = handle;
