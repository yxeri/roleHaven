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
const messageManager = require('../../managers/messages');
const restErrorChecker = require('../../helpers/restErrorChecker');
const errorCreator = require('../../objects/error/errorCreator');
const dbConfig = require('../../config/defaults/config').databasePopulation;

const router = new express.Router();

/**
 * @param {Object} io - Socket.io.
 * @returns {Object} Router
 */
function handle(io) {
  /**
   * @api {put} /messages/:messageId Update a message.
   * @apiVersion 8.0.0
   * @apiName UpdateMessage
   * @apiGroup Messages
   *
   * @apiHeader {String} Authorization - Your JSON Web Token.
   *
   * @apiDescription Update a message.
   *
   * @apiParam {String} messageId - Id of the message to update.
   *
   * @apiParam {String} data
   * @apiParam {String} data.message - Message parameters to update.
   * @apiParam {String} [data.options] - Update options.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.message - Updated message.
   */
  router.put('/:messageId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { messageId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '{ messageId }' }), sentData: request.params });

      return;
    } else if (!objectValidator.isValidData(request.body, { data: { message: true } })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '{ data: { message } }' }), sentData: request.body.data });

      return;
    }

    const {
      message,
      options,
    } = request.body.data;
    const { messageId } = request.params;
    const { authorization: token } = request.headers;

    messageManager.updateMsg({
      message,
      options,
      io,
      messageId,
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
   * @api {delete} /messages/:messageId Delete a message.
   * @apiVersion 8.0.0
   * @apiName DeleteMessage
   * @apiGroup Messages
   *
   * @apiHeader {String} Authorization - Your JSON Web Token.
   *
   * @apiDescription Delete a message.
   *
   * @apiParam {Object} messageId - Id of the message to delete.
   *
   * @apiParam {Object} [data]
   * @apiParam {Object} [data.userId] - Id of the user deleting the message.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.success - Was it successfully deleted?
   */
  router.delete('/:messageId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { messageId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '{ messageId }' }), sentData: request.params });

      return;
    }

    const { userId } = request.body.data;
    const { messageId } = request.params;
    const { authorization: token } = request.headers;

    messageManager.removeMsg({
      userId,
      io,
      messageId,
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
   * @api {post} /messages Send a message.
   * @apiVersion 8.0.0
   * @apiName SendMessage
   * @apiGroup Messages
   *
   * @apiHeader {String} Authorization Your JSON Web Token.
   *
   * @apiDescription Send a message. Available messages types are:
   * BROADCAST - This message will be transmitted to all users and ignores roomId.
   * WHISPER - A private message sent to another user. participantIds has to contain the Id of the receiver and sender user.
   * CHAT - Normal chat message sent to a room.
   *
   * @apiParam {Object} data
   * @apiParam {Object} data.message - Message.
   * @apiParam {Object} data.image - Image parameters to attach to the message.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.message - Message sent.
   */
  router.post('/', (request, response) => {
    if (!objectValidator.isValidData(request.body, { data: { message: { roomId: true, text: true } } })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '{ data: { message: { roomId, text } } }' }), sentData: request.body.data });

      return;
    }

    const {
      image,
      message,
    } = request.body.data;
    const { authorization: token } = request.headers;
    const messageType = message.messageType || dbConfig.MessageTypes.CHAT;
    const callback = ({ data, error }) => {
      if (error) {
        restErrorChecker.checkAndSendError({ response, error, sentData: request.body.data });

        return;
      }

      response.json({ data });
    };
    const messageData = {
      token,
      message,
      callback,
      io,
      image,
    };

    switch (messageType) {
      case dbConfig.MessageTypes.WHISPER: {
        messageManager.sendWhisperMsg(messageData);

        break;
      }
      case dbConfig.MessageTypes.BROADCAST: {
        messageManager.sendBroadcastMsg(messageData);

        break;
      }
      default: {
        messageManager.sendChatMsg(messageData);

        break;
      }
    }
  });

  return router;
}

module.exports = handle;
