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
const objectValidator = require('../../utils/objectValidator');
const restErrorChecker = require('../../helpers/restErrorChecker');
const messenger = require('../../helpers/messenger');
const errorCreator = require('../../objects/error/errorCreator');

const router = new express.Router();

/**
 * @param {object} io - Socket.IO
 * @returns {Object} Router
 */
function handle(io) {
  /**
   * @api {get} /rooms Get rooms
   * @apiVersion 6.0.0
   * @apiName GetRooms
   * @apiGroup Rooms
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Retrieve all rooms available to your user
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.rooms Found rooms
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "rooms": [
   *        "public",
   *        "bb1"
   *      ]
   *    }
   *  }
   */
  router.get('/', (request, response) => {
    roomManager.getRooms({
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

  /**
   * @api {get} /rooms/:roomName Get specific room
   * @apiVersion 6.0.0
   * @apiName GetRoom
   * @apiGroup Rooms
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Retrieve a specific room, based on sent room name
   *
   * @apiParam {String} id Name of the room to retrieve
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.room Found room. Empty if no room was found
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "room": {
   *        "roomName": "bb1",
   *        "owner": "rez",
   *        "bannedUsers": [
   *          "a1",
   *        ],
   *        "admins": [
   *          "rez2"
   *        ],
   *        "commands": [],
   *        "visibility": 1,
   *        "accessLevel": 1
   *      }
   *    }
   *  }
   */
  router.get('/:roomName', (request, response) => {
    if (!objectValidator.isValidData(request.params, { roomName: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '' }), sentData: request.body.data });

      return;
    }

    roomManager.getRoom({
      token: request.headers.authorization,
      roomName: request.params.roomName,
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
   * @api {post} /rooms Create a room
   * @apiVersion 6.0.0
   * @apiName CreateRoom
   * @apiGroup Rooms
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Create a room
   *
   * @apiParam {Object} data
   * @apiParam {Object} data.room Room
   * @apiParam {String} data.room.roomName Name of the room to create
   * @apiParam {String} [data.room.password] Password for the room. Leave unset if you don't want to password-protect the room
   * @apiParam {Number} [data.room.visibility] Minimum access level required to see the room. 0 = ANONYMOUS. 1 = registered user. Default is 1.
   * @apiParam {Number} [data.room.accessLevel] Minimum access level required to follow the room. 0 = ANONYMOUS. 1 = registered user. Default is 1.
   * @apiParamExample {json} Request-Example:
   *   {
   *    "data": {
   *      "room": {
   *        "roomName": "bb1",
   *        "accessLevel": 0
   *      }
   *    }
   *  }
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.room Room created
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "room": {
   *        "roomName": "bb1",
   *        "owner": "rez",
   *        "bannedUsers": [],
   *        "admins": [],
   *        "commands": [],
   *        "visibility": 1,
   *        "accessLevel": 0,
   *        password: false
   *      }
   *    }
   *  }
   */
  router.post('/', (request, response) => {
    if (!objectValidator.isValidData(request.body, { data: { room: { roomName: true } } })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '' }), sentData: request.body.data });

      return;
    }

    roomManager.createRoom({
      token: request.headers.authorization,
      room: request.body.data.room,
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
   * @api {get} /rooms/:partialName/match Match rooms with sent partial room name
   * @apiVersion 6.0.0
   * @apiName MatchRoomName
   * @apiGroup Rooms
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Retrieve a collection of rooms, based on the sent partial name. The match is done from index 0
   *
   * @apiParam {String} roomName Partial room name
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.rooms Found rooms. Empty array if no rooms were found
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "rooms": [
   *        "bb1",
   *        "bb2",
   *        "roomSec",
   *      ]
   *    }
   *  }
   */
  router.get('/:partialName/match', (request, response) => {
    if (!objectValidator.isValidData(request.params, { partialName: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '' }), sentData: request.body.data });

      return;
    }

    roomManager.matchPartialRoomName({
      token: request.headers.authorization,
      partialName: request.params.partialName,
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
   * @api {get} /rooms/:roomName/match/followed Match followed rooms with sent partial room name
   * @apiVersion 6.0.0
   * @apiName MatchFollowedRoomName
   * @apiGroup Rooms
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Retrieve a collection of followed rooms, based on the sent partial name. The match is done from index 0
   *
   * @apiParam {String} roomName Partial room name
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.rooms Found rooms. Empty array if no rooms were found
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "rooms": [
   *        "bb1",
   *        "bb2",
   *        "roomSec",
   *      ]
   *    }
   *  }
   */
  router.get('/:roomName/match/followed', (request, response) => {
    if (!objectValidator.isValidData(request.params, { roomName: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '' }), sentData: request.body.data });

      return;
    }

    roomManager.matchMyPartialRoomName({
      token: request.headers.authorization,
      partialName: request.params.roomName,
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
   * @api {get} /rooms/:roomName/messages Get messages from specific room
   * @apiVersion 6.0.0
   * @apiName GetMessages
   * @apiGroup Rooms
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Retrieve messages from a specific room
   *
   * @apiParam {String} roomNameid Name of the room
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.messages Found messages from specific room
   * @apiSuccessExample {json} Success-Response:
   *  {
   *    "data": {
   *      "timeZoneOffset": 0,
   *      "messages": [
   *        {
   *          "time": "2016-10-14T11:13:03.555Z",
   *          "roomName": "bb1",
   *          "username": "rez",
   *          "text": [
   *            "..."
   *          ]
   *        }
   *      ]
   *    }
   *  }
   */
  router.get('/:roomName/messages', (request, response) => {
    if (!objectValidator.isValidData(request.params, { roomName: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '' }), sentData: request.body.data });

      return;
    }

    roomManager.getHistory({
      io,
      token: request.headers.authorization,
      roomName: request.params.roomName,
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
   * @api {post} /rooms/:roomName/messages Send a message to a room or user
   * @apiVersion 6.0.0
   * @apiName SendMessage
   * @apiGroup Rooms
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Send a message to a room or user
   *
   * @apiParam {string} roomName Room name to send message to. Can also be user name if the message is a whisper
   *
   * @apiParam {Object} data
   * @apiParam {Object} data.message Message
   * @apiParam {String[]} data.message.text Content of the message
   * @apiParam {String} [data.message.username] Name of the sender. Default is your user name. You can instead set it to one of your user's aliases
   * @apiParam {Boolean} [data.message.isWhisper] Is it a whisper (private) message?
   * @apiParamExample {json} Request-Example:
   *   {
   *    "data": {
   *      "message": {
   *        "username": "rez",
   *        "text": [
   *          "Hello world!"
   *        ]
   *      }
   *    }
   *  }
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.messages Message sent
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "messages": [{
   *        "roomName": "bb1",
   *        "text": [
   *          "Hello world!"
   *        ],
   *        "username": "rez",
   *        "time": "2016-10-28T22:42:06.262Z"
   *      }]
   *    }
   *  }
   */
  router.post('/:roomName/messages', (request, response) => {
    if (!objectValidator.isValidData(request.body, { data: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '' }), sentData: request.body.data });

      return;
    }

    const { message, isWhisper } = request.body.data;
    const token = request.headers.authorization;
    message.roomName = request.params.roomName;

    if (isWhisper) {
      messenger.sendWhisperMsg({
        io,
        message,
        token,
        callback: ({ data, error }) => {
          if (error) {
            restErrorChecker.checkAndSendError({ response, error, sentData: request.body.data });

            return;
          }

          response.json({ data });
        },
      });

      return;
    }

    messenger.sendChatMsg({
      io,
      message,
      token,
      callback: ({ data, error }) => {
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
