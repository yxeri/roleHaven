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
const roomManager = require('../../managers/rooms');
const messageManager = require('../../managers/messages');
const objectValidator = require('../../utils/objectValidator');
const restErrorChecker = require('../../helpers/restErrorChecker');
const errorCreator = require('../../objects/error/errorCreator');
const dbConfig = require('../../config/defaults/config').databasePopulation;

const router = new express.Router();

/**
 * @param {object} io - Socket.IO
 * @returns {Object} Router
 */
function handle(io) {
  /**
   * @api {get} /rooms/:roomId/messages Get messages from a room.
   * @apiVersion 8.0.0
   * @apiName GetMessages
   * @apiGroup Rooms
   *
   * @apiHeader {String} Authorization Your JSON Web Token.
   *
   * @apiDescription Retrieve messages from a room.
   *
   * @apiParam {String} roomId - Id of the room.
   *
   * @apiParam {Object} data
   * @apiParam {Date} [data.startDate] - The cut off date for retrieving past/future messages.
   * @apiParam {Date} [data.shouldGetFuture] - Should messages from the future be retrieved? startDate is the date that is the start of the retrieval.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.messages - Found messages.
   */
  router.get('/:roomId/messages', (request, response) => {
    if (!objectValidator.isValidData(request.params, { roomId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '{ roomId }' }), sentData: request.params });

      return;
    }

    const { authorization: token } = request.headers;
    const { roomId } = request.params;
    const { startDate, shouldGetFuture } = request.body.data;

    messageManager.getMessagesByRoom({
      io,
      roomId,
      token,
      startDate,
      shouldGetFuture,
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
   * @api {get} /rooms Get rooms.
   * @apiVersion 8.0.0
   * @apiName GetRooms
   * @apiGroup Rooms
   *
   * @apiHeader {String} Authorization - Your JSON Web Token.
   *
   * @apiDescription Get rooms.
   *
   * @apiParam {Object} data
   * @apiParam {string} [data.userId] - Id of the user retrieving the rooms.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.rooms - Found rooms.
   */
  router.get('/', (request, response) => {
    const { authorization: token } = request.headers;
    const { userId } = request.body.data;

    roomManager.getRoomsByUser({
      userId,
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
   * @api {get} /rooms/:roomId Get a room.
   * @apiVersion 8.0.0
   * @apiName GetRoom
   * @apiGroup Rooms
   *
   * @apiHeader {string} Authorization - Your JSON Web Token.
   *
   * @apiDescription Retrieve a room.
   *
   * @apiParam {string} roomId - Id of the room to retrieve.
   *
   * @apiParam {Object} data - Id of the room to retrieve.
   * @apiParam {string} [data.userId] - Id of the user retrieving the room.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.room - Found room.
   */
  router.get('/:roomId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { roomId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '{ roomId }' }), sentData: request.params });

      return;
    }

    const { authorization: token } = request.headers;
    const { roomId } = request.params;
    const { userId } = request.body.data;

    roomManager.getRoom({
      token,
      roomId,
      userId,
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
   * @api {post} /rooms Create a room.
   * @apiVersion 8.0.0
   * @apiName CreateRoom
   * @apiGroup Rooms
   *
   * @apiHeader {String} Authorization - Your JSON Web Token.
   *
   * @apiDescription Create a room.
   *
   * @apiParam {Object} data
   * @apiParam {Object} data.room - The room to create.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.room - Room created.
   */
  router.post('/', (request, response) => {
    if (!objectValidator.isValidData(request.body, { data: { room: { roomId: true } } })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '{ data: { room: { roomId } } }' }), sentData: request.body.data });

      return;
    } else if ((!request.body.data.options || !request.body.data.options.shouldSetIdToName) && !request.body.data.roomName) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'set roomId or shouldSetIdToName' }), sentData: request.body.data });

      return;
    }

    const { room, userId, options } = request.body.data;
    const { authorization: token } = request.headers;

    roomManager.createRoom({
      token,
      room,
      io,
      userId,
      options,
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
