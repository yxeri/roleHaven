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
const messenger = require('../../helpers/messenger');
const objectValidator = require('../../utils/objectValidator');
const errorCreator = require('../../objects/error/errorCreator');
const dbConfig = require('../../config/defaults/config').databasePopulation;
const authenticator = require('../../helpers/authenticator');

const router = new express.Router();


/**
 * @param {object} io - Socket.IO
 * @returns {Object} Router
 */
function handle(io) {
  /**
   * @api {post} /messages Send a message
   * @apiVersion 6.0.0
   * @apiName SendMessage
   * @apiGroup Messages
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Send a message to a room
   *
   * @apiParam {Object} data
   * @apiParam {Object} data.message Message
   * @apiParam {String} data.message.roomName Name of the room (or user name) to send the message to
   * @apiParam {String[]} data.message.text Content of the message
   * @apiParam {String} [data.message.userName] Name of the sender. Default is your user name. You can instead set it to one of your user's aliases
   * @apiParam {Boolean} [data.message.isWhisper] Is this a whisper (direct message) to another user?
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
   * @apiSuccess {Object[]} data.messages Message sent
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "messages": [{
   *        "roomName": "bb1",
   *        "text": [
   *          "Hello world!"
   *        ],
   *        "userName": "rez",
   *        "time": "2016-10-28T22:42:06.262Z"
   *      }]
   *    }
   *  }
   */
  router.post('/', (req, res) => {
    if (!objectValidator.isValidData(req.body, { data: { message: { roomName: true, text: true } } })) {
      res.status(400).json({
        error: {
          status: 400,
          title: 'Missing data',
          detail: 'Unable to parse data',
        },
      });

      return;
    }

    authenticator.isUserAllowed({
      commandName: dbConfig.apiCommands.SendMessage.name,
      token: req.headers.authorization,
      callback: ({ error, data }) => {
        if (error) {
          if (error.type === errorCreator.ErrorTypes.DOESNOTEXIST) {
            res.status(404).json({
              error: {
                status: 404,
                title: 'Command does not exist',
                detail: 'Command does not exist',
              },
            });

            return;
          } else if (error.type === errorCreator.ErrorTypes.NOTALLOWED) {
            res.status(401).json({
              error: {
                status: 401,
                title: 'Unauthorized',
                detail: 'Invalid token',
              },
            });

            return;
          }

          res.status(500).json({
            error: {
              status: 500,
              title: 'Internal Server Error',
              detail: 'Internal Server Error',
            },
          });

          return;
        }

        const { message, whisper } = req.body.data;
        const { user } = data;

        const callback = ({ error: messageError, data: messageData }) => {
          if (messageError) {
            if (messageError.type === errorCreator.ErrorTypes.INVALIDCHARACTERS) {
              res.status(400).json({
                error: {
                  status: 400,
                  title: 'Message too long',
                  detail: 'Message too long',
                },
              });

              return;
            } else if (messageError.type === errorCreator.ErrorTypes.NOTALLOWED) {
              res.status(401).json({
                error: {
                  status: 401,
                  title: 'Unauthorized',
                  detail: 'Not following room',
                },
              });

              return;
            }

            res.status(500).json({
              error: {
                status: 500,
                title: 'Internal Server Error',
                detail: 'Internal Server Error',
              },
            });

            return;
          }

          res.json({ data: messageData });
        };

        if (whisper) {
          message.userName = user.userName;

          messenger.sendWhisperMsg({
            io,
            message,
            callback,
            user,
          });
        } else {
          messenger.sendChatMsg({
            io,
            message,
            callback,
            user,
          });
        }
      },
    });
  });

  return router;
}

module.exports = handle;
