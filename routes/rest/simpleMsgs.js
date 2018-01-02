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
 * @param {object} io Socket.IO
 * @returns {Object} Router
 */
function handle(io) {
  /**
   * @api {post} /simpleMsgs Send a simple message
   * @apiVersion 6.0.0
   * @apiName SendSimpleMsgs
   * @apiGroup SimpleMsgs
   *
   * @apiHeader {string} Authorization Your JSON Web Token
   *
   * @apiDescription Send a simple message.
   *
   * @apiParam {Object} data
   * @apiParam {SimpleMsg} data.simpleMsg Simple message to send.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {SimpleMsg[]} data.message Sent simple message.
   */
  router.post('/', (request, response) => {
    if (!objectValidator.isValidData(request.body, { data: { simpleMsg: true } })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'data = { simpleMsg } }', sendDate: request.body.data }) });

      return;
    }

    const { simpleMsg } = request.body.data;
    const { authorization: token } = request.headers;

    simpleMsgManager.sendSimpleMsg({
      io,
      token,
      text: simpleMsg.text,
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
   * @api {post} /simpleMsgs Get simple messages
   * @apiVersion 6.0.0
   * @apiName GetSimpleMsgs
   * @apiGroup SimpleMsgs
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Get simple messages.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {SimpleMsg[]} data.simpleMsgs Messages found.
   */
  router.get('/', (request, response) => {
    const { authorization: token } = request.headers;

    simpleMsgManager.getSimpleMsgs({
      token,
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
   * @api {delete} /simpleMsgs/:simpleMsgId Delete a simple message
   * @apiVersion 8.0.0
   * @apiName DeleteSimpleMsg
   * @apiGroup SimpleMsgs
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Delte a simple message.
   *
   * @apiParam {string} simpleMsgId Id of the simple message to delete.
   *
   * @apiParam {Object} [data]
   * @apiParam {string} [data.userId] Id of the user deleting the message.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {boolean} data.success Was it successfully deleted?
   */
  router.delete('/:deviceId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { simpleMsgId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'params = { simpleMsgId }' }) });

      return;
    }

    const { userId } = request.body.data;
    const { simpleMsgId } = request.params;
    const { authorization: token } = request.headers;

    simpleMsgManager.removeSimpleMsg({
      userId,
      io,
      simpleMsgId,
      token,
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
   * @api {put} /simpleMsgs/:deviceId Update a simple message.
   * @apiVersion 8.0.0
   * @apiName UpdateSimpleMsg
   * @apiGroup SimpleMsgs
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Update a simple message.
   *
   * @apiParam {string} simpleMsgId Id of the simple message to update.
   *
   * @apiParam {Object} data
   * @apiParam {SimpleMsg} data.simpleMsg Simple message parameters to update.
   * @apiParam {Object} [data.options] Update options.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {SimpleMsg} data.simpleMsg Updated simple message.
   */
  router.put('/:deviceId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { simpleMsgId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'params = { simpleMsgId }' }) });

      return;
    } else if (!objectValidator.isValidData(request.body, { data: { simpleMsg: true } })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'data = { simpleMsg }' }), sentData: request.body.data });

      return;
    }

    const {
      simpleMsg,
      options,
    } = request.body.data;
    const { simpleMsgId } = request.params;
    const { authorization: token } = request.headers;

    simpleMsgManager.updateSimpleMsg({
      simpleMsg,
      options,
      io,
      simpleMsgId,
      token,
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
