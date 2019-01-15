/*
 Copyright 2017 Carmilla Mina Jankovic

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
const objectValidator = require('../../utils/objectValidator');
const restErrorChecker = require('../../helpers/restErrorChecker');
const errorCreator = require('../../error/errorCreator');
const helper = require('./helper');

const router = new express.Router();

/**
 * @param {object} io Socket.IO
 * @returns {Object} Router
 */
function handle(io) {
  /**
   * @api {get} /rooms/:roomId/messages Get messages from a room
   * @apiVersion 8.0.0
   * @apiName GetMessages
   * @apiGroup Messages
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Retrieve messages from a room.
   *
   * @apiParam {string} roomId [Url] Id of the room.
   *
   * @apiParam {string} [startDate] [Query] Start date of when to retrieve messages from the past.
   * @apiParam {boolean} [shouldGetFuture] [Query] Should messages be retrieved from the future instead of the past?
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Message[]} data.messages Found messages.
   */
  router.get('/:roomId/messages', (request, response) => {
    helper.getMessages({ request, response });
  });

  /**
   * @api {get} /rooms Get rooms
   * @apiVersion 8.0.0
   * @apiName GetRooms
   * @apiGroup Rooms
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Get rooms.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Room[]} data.rooms Rooms found.
   */
  router.get('/', (request, response) => {
    const { authorization: token } = request.headers;

    roomManager.getRoomsByUser({
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
   * @api {get} /rooms/:roomId Get a room
   * @apiVersion 8.0.0
   * @apiName GetRoom
   * @apiGroup Rooms
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Retrieve a room.
   *
   * @apiParam {string} roomId [Url] Id of the room to retrieve.
   *
   * @apiParam {Object} data Body parameters.
   * @apiParam {string} data.password Password of the room, if required.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Room} data.room Found room.
   */
  router.get('/:roomId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { roomId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'params = { roomId }' }) });

      return;
    }

    const { authorization: token } = request.headers;
    const { roomId } = request.params;

    roomManager.getRoomById({
      token,
      roomId,
      password: request.body.data
        ? request.body.data.password
        : undefined,
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
   * @api {post} /rooms Create a room
   * @apiVersion 8.0.0
   * @apiName CreateRoom
   * @apiGroup Rooms
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Create a room.
   *
   * @apiParam {Object} data Body parameters.
   * @apiParam {Room} data.room The room to create.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Room} data.room Created room.
   */
  router.post('/', (request, response) => {
    const sentData = request.body.data;

    if (!objectValidator.isValidData(request.body, { data: { room: true } })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'data = { room }' }), sentData });

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
          sentData.room.password = typeof sentData.password !== 'undefined';

          restErrorChecker.checkAndSendError({ response, error, sentData });

          return;
        }

        response.json({ data });
      },
    });
  });

  /**
   * @api {put} /rooms/:roomId Update a room
   * @apiVersion 8.0.0
   * @apiName UpdateRoom
   * @apiGroup Rooms
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Update a room.
   *
   * @apiParam {string} roomId Id of the room to update.
   *
   * @apiParam {Object} data
   * @apiParam {Room} data.room Room parameters to update.
   * @apiParam {Object} [data.options] Update options.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Room} data.room Updated room.
   */
  router.put('/:roomId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { roomId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'params = { roomId }' }) });

      return;
    }

    if (!objectValidator.isValidData(request.body, { data: { room: true } })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'data = { room }' }), sentData: request.body.data });

      return;
    }

    const {
      room,
      options,
    } = request.body.data;
    const { roomId } = request.params;
    const { authorization: token } = request.headers;

    roomManager.updateRoom({
      room,
      options,
      io,
      roomId,
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
   * token,
   roomId,
   teamAdminIds,
   userAdminIds,
   userIds,
   teamIds,
   bannedIds,
   shouldRemove,
   internalCallUser,
   callback,
   */

  /**
   * @api {put} /rooms/:roomId/permissions Update permissions on a room
   * @apiVersion 8.0.0
   * @apiName UpdateRoomPermissions
   * @apiGroup Rooms
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Update permissions on a room.
   *
   * @apiParam {string} roomId Id of the room to update.
   *
   * @apiParam {Object} data
   * @apiParam {boolean} [data.shouldRemove] Should the permissions be removed from the sent Ids? Default is false.
   * @apiParam {string[]} data.userIds Users to give access to.
   * @apiParam {string[]} data.teamIds Teams to give access to.
   * @apiParam {string[]} data.teamAdminIds Teams to give admin access to.
   * @apiParam {string[]} data.userAdminIds Users to give admin access to.
   * @apiParam {string[]} data.bannedIds Ids to ban.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Room} data.room Updated room.
   */
  router.put('/:roomId/permissions', (request, response) => {
    if (!objectValidator.isValidData(request.params, { roomId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'params = { roomId }' }) });

      return;
    }

    const {
      userIds,
      teamIds,
      teamAdminIds,
      userAdminIds,
      bannedIds,
      shouldRemove,
    } = request.body.data;
    const { roomId } = request.params;
    const { authorization: token } = request.headers;

    roomManager.updateAccess({
      token,
      roomId,
      teamAdminIds,
      userAdminIds,
      userIds,
      teamIds,
      bannedIds,
      shouldRemove,
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
   * @api {delete} /rooms/:roomId Delete a room
   * @apiVersion 8.0.0
   * @apiName DeleteRoom
   * @apiGroup Rooms
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Delete a room.
   *
   * @apiParam {Object} roomId [Url] Id of the room to delete.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.success Was the room successfully deleted?
   */
  router.delete('/:roomId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { roomId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'params = { roomId }' }) });

      return;
    }

    const { roomId } = request.params;
    const { authorization: token } = request.headers;

    roomManager.removeRoom({
      io,
      roomId,
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
   * @api {post} /rooms/:roomId/messages Send a message to a room
   * @apiVersion 8.0.0
   * @apiName SendMessage
   * @apiGroup Rooms
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Send a message. Available messages types are:
   * WHISPER A private message sent to another user. participantIds has to contain the Id of the receiver and sender user.
   * CHAT Normal chat message sent to a room.
   *
   * @apiParam {Object} data Body params.
   * @apiParam {Message} data.message Message.
   * @apiParam {string} data.messageType Type of message. Default is CHAT.
   * @apiParam {Object} [data.image] Image parameters to attach to the message.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Message} data.message Sent message.
   */
  router.post('/:roomId/messages', (request, response) => {
    helper.sendMessage({
      request,
      response,
      io,
    });
  });

  return router;
}

module.exports = handle;
