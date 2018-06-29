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
const errorCreator = require('../../error/errorCreator');
const helper = require('./helper');

const router = new express.Router();

/**
 * @param {Object} io Socket.io.
 * @returns {Object} Router
 */
function handle(io) {
  /**
   * @api {put} /messages/:messageId Update a message
   * @apiVersion 8.0.0
   * @apiName UpdateMessage
   * @apiGroup Messages
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Update a message.
   *
   * @apiParam {string} messageId Id of the message to update.
   *
   * @apiParam {Object} data
   * @apiParam {Message} data.message Message parameters to update.
   * @apiParam {Object} [data.options] Update options.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Message} data.message Updated message.
   */
  router.put('/:messageId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { messageId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'params = { messageId }' }) });

      return;
    } else if (!objectValidator.isValidData(request.body, { data: { message: true } })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'data = { message }' }), sentData: request.body.data });

      return;
    }

    const {
      message,
      options,
    } = request.body.data;
    const { messageId } = request.params;
    const { authorization: token } = request.headers;

    messageManager.updateMessage({
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
   * @api {put} /messages/:messageId Get a message
   * @apiVersion 8.0.0
   * @apiName GetMessage
   * @apiGroup Messages
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Get a message.
   *
   * @apiParam {string} messageId [Url] Id of the message to retrieve.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Message} data.message Found message.
   */
  router.get('/:messageId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { messageId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'params = { messageId }' }) });

      return;
    }

    const { messageId } = request.params;
    const { authorization: token } = request.headers;

    messageManager.getMessageById({
      messageId,
      token,
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
   * @api {get} /messages/ Get messages
   * @apiVersion 8.0.0
   * @apiName GetMessages
   * @apiGroup Messages
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Get messages. Setting roomId will retrieve messages from a specific room. Otherwise, the messages created by the user will be retrieved.
   *
   * @apiParam {string} [roomId] [Url] Id of the room to retrieve messages from.
   *
   * @apiParam {boolean} [full] [Query] Should the complete object be retrieved?
   * @apiParam {string} [startDate] [Query] Start date of when to retrieve messages from the past.
   * @apiParam {boolean} [fullHistory] [Query] Should all messages and rooms be returned?
   * @apiParam {boolean} [shouldGetFuture] [Query] Should messages be retrieved from the future instead of the past?
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Message[]} data.messages Found messages.
   */
  router.get('/', (request, response) => {
    helper.getMessages({ request, response });
  });

  /**
   * @api {delete} /messages/:messageId Delete a message
   * @apiVersion 8.0.0
   * @apiName DeleteMessage
   * @apiGroup Messages
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Delete a message.
   *
   * @apiParam {string} messageId Id of the message to delete.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {boolean} data.success Was the message successfully deleted?
   */
  router.delete('/:messageId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { messageId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'params = { messageId }' }) });

      return;
    }

    const { messageId } = request.params;
    const { authorization: token } = request.headers;

    messageManager.removeMesssage({
      io,
      messageId,
      token,
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
   * @api {post} /messages Send a message
   * @apiVersion 8.0.0
   * @apiName SendMessage
   * @apiGroup Messages
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Send a message. Available messages types are:
   * BROADCAST This message will be transmitted to all users and ignores roomId.
   * WHISPER A private message sent to another user. participantIds has to contain the Id of the receiver and sender user.
   * CHAT Normal chat message sent to a room.
   *
   * @apiParam {Object} data Body params.
   * @apiParam {Message} data.message Message.
   * @apiParam {string} data.messageType Type of message. Default is CHAT.
   * @apiParam {Object} [data.image] Image parameters to attach to the message.
   * @apiParam {string} data.roomId - Id of the room to send the message to.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Message} data.message Sent message.
   */
  router.post('/', (request, response) => {
    helper.sendMessage({
      request,
      response,
      io,
    });
  });

  return router;
}

module.exports = handle;
